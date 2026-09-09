// ============================================================
// SIH 26018 — Records API
// GET /api/records — list/search records
// ============================================================

import { NextResponse } from "next/server";
import { listRecords } from "../../../lib/db/mockStore";
import { seedDemoData } from "../../../lib/db/seedData";

export async function GET(request: Request) {
  seedDemoData();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const district = searchParams.get("district") || undefined;
  const village = searchParams.get("village") || undefined;
  const search = searchParams.get("q") || undefined;

  const records = listRecords({ status, district, village, search });

  return NextResponse.json({
    records: records.map((r) => ({
      record_id: r.metadata.record_id,
      document_id: r.metadata.document_id,
      document_type: r.metadata.document_type,
      status: r.metadata.status,
      language: r.metadata.language,
      state: r.location.state.value,
      district: r.location.district.value,
      tehsil: r.location.tehsil.value,
      village: r.location.village.value,
      survey_number: r.parcel.survey_number.value,
      khasra_number: r.parcel.khasra_number.value,
      area: r.parcel.area.value,
      area_unit: r.parcel.area_unit.value,
      owner_count: r.owners.length,
      primary_owner: r.owners[0]?.name.value?.romanized || r.owners[0]?.name.value?.original || "Unknown",
      confidence: r.confidence.document_confidence,
      validation_errors: r.validation.filter((v: { status: string }) => v.status === "ERROR").length,
      validation_warnings: r.validation.filter((v: { status: string }) => v.status === "WARNING").length,
      requires_verification: r.confidence.requires_human_review,
      processed_at: r.metadata.processing_timestamp,
    })),
    total: records.length,
  });
}
