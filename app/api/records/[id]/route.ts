// ============================================================
// SIH 26018 — Single Record API
// GET /api/records/[id] — full record with provenance
// PATCH /api/records/[id] — officer verification (approve/reject/update)
// ============================================================

import { NextResponse } from "next/server";
import { getRecord, updateRecord, updateDocument } from "../../../../lib/db/mockStore";
import { computeHealthScore } from "../../../../lib/validation/engine";
import { seedDemoData } from "../../../../lib/db/seedData";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  seedDemoData();
  const rawId = (await params).id;
  const id = decodeURIComponent(rawId);
  const record = getRecord(id);

  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const healthScore = computeHealthScore(record);

  return NextResponse.json({
    record,
    health_score: healthScore,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  seedDemoData();
  const rawId = (await params).id;
  const id = decodeURIComponent(rawId);
  const body = await request.json();
  const { action, notes, officer_name, fieldKey, fieldValue, fieldStatus, role } = body;

  // Strict role checking (optional server enforcement)
  if (role === "admin" && (action === "verify" || action === "reject")) {
    return NextResponse.json(
      { error: "Admin role cannot verify/reject records directly. Please switch to Officer mode to perform audit actions." },
      { status: 403 }
    );
  }

  const rolePrefix = role === "admin" ? "[ADMIN] DRO" : "[OFFICER] RO";
  const userTag = officer_name ? `${rolePrefix} ${officer_name}` : `${rolePrefix} Tehsildar R.K. Sharma`;

  const updatedRecord = updateRecord(id, (rec) => {
    const copy = JSON.parse(JSON.stringify(rec));

    if (action === "verify") {
      copy.metadata.status = "verified";
      copy.confidence.requires_human_review = false;
      copy.audit.push({
        id: uuidv4(),
        action: "OFFICER_VERIFIED",
        timestamp: new Date().toISOString(),
        notes: notes || "Record verified and approved",
        user_email: userTag,
      });
    } else if (action === "reject") {
      copy.metadata.status = "rejected";
      copy.confidence.requires_human_review = true;
      copy.audit.push({
        id: uuidv4(),
        action: "OFFICER_REJECTED",
        timestamp: new Date().toISOString(),
        notes: notes || "Record rejected. Requesting document re-scan / correction.",
        user_email: userTag,
      });
    } else if (action === "update_field") {
      if (fieldKey && fieldValue !== undefined) {
        const parts = fieldKey.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let obj: any = copy;
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]]) obj = obj[parts[i]];
        }
        const last = parts[parts.length - 1];
        if (obj && obj[last] !== undefined) {
          if (typeof obj[last] === "object" && obj[last] !== null && "value" in obj[last]) {
            obj[last].value = fieldValue;
            if (fieldStatus) obj[last].requires_verification = fieldStatus === "rejected";
          } else {
            obj[last] = fieldValue;
          }
        }
      }
      copy.audit.push({
        id: uuidv4(),
        action: "FIELD_UPDATED",
        timestamp: new Date().toISOString(),
        notes: `Field '${fieldKey}' set to '${fieldValue}' (${fieldStatus || "modified"})`,
        user_email: userTag,
      });
    }

    return copy;
  });

  if (updatedRecord && (action === "verify" || action === "reject")) {
    updateDocument(updatedRecord.metadata.document_id, {
      status: updatedRecord.metadata.status,
    });
  }

  const healthScore = updatedRecord ? computeHealthScore(updatedRecord) : null;

  return NextResponse.json({
    record: updatedRecord,
    health_score: healthScore,
    message:
      action === "verify"
        ? "Record verified successfully"
        : action === "reject"
        ? "Record rejected"
        : "Field updated",
  });
}
