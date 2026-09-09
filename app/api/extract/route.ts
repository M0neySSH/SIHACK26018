// ============================================================
// SIH 26018 — Land Record Extraction API
// POST /api/extract
// Replaces XTract invoice/challan extraction with land records
// ============================================================

import { NextResponse } from "next/server";
import { extractLandRecord } from "../../../lib/ai/landExtractor";
import { runValidation, computeHealthScore } from "../../../lib/validation/engine";
import {
  storeDocument,
  storeRecord,
  updateDocument,
} from "../../../lib/db/mockStore";
import { RecordStatus } from "../../../utils/schemas/documentTypes";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      base64Images,
      filename = "document",
      fileSize = 0,
      mimeType = "application/pdf",
    } = body;

    if (
      !base64Images ||
      !Array.isArray(base64Images) ||
      base64Images.length === 0
    ) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Create document entry in mock store
    const documentId = uuidv4();
    storeDocument({
      id: documentId,
      original_filename: filename,
      file_size_bytes: fileSize,
      mime_type: mimeType,
      page_count: base64Images.length,
      document_type: "unknown",
      language: "unknown",
      quality_score: 0,
      quality_report: null,
      status: "processing",
      uploaded_at: new Date().toISOString(),
      processed_at: null,
      page_images: base64Images,
      raw_extraction: null,
      record_id: null,
      error_message: null,
    });

    // ---- RUN AI EXTRACTION ----
    const extraction = await extractLandRecord(
      base64Images,
      filename
    );

    // ---- RUN VALIDATION ----
    const validationResults = runValidation(extraction.record);
    extraction.record.validation = validationResults;

    // ---- COMPUTE HEALTH SCORE ----
    const healthScore = computeHealthScore(extraction.record);

    // ---- UPDATE STATUS ----
    const hasErrors = validationResults.some((v) => v.status === "ERROR");
    const needsReview =
      extraction.record.confidence.requires_human_review || hasErrors;
    extraction.record.metadata.status = needsReview
      ? RecordStatus.PENDING_VERIFICATION
      : RecordStatus.VALIDATED;

    // ---- STORE ----
    storeRecord(extraction.record);

    updateDocument(documentId, {
      document_type: extraction.record.metadata.document_type,
      language: extraction.record.metadata.language,
      quality_score: extraction.quality.overall_score,
      quality_report: extraction.quality,
      status: extraction.record.metadata.status,
      processed_at: new Date().toISOString(),
      raw_extraction: extraction.raw_extraction,
      record_id: extraction.record.metadata.record_id,
    });

    // ---- RESPONSE ----
    return NextResponse.json({
      success: true,
      document_id: documentId,
      record_id: extraction.record.metadata.record_id,
      record: extraction.record,
      quality: extraction.quality,
      health_score: healthScore,
      validation: validationResults,
      stats: {
        provider: extraction.provider,
        model: extraction.model,
        latency_ms: extraction.latency_ms,
        total_time_ms: Date.now() - startTime,
        page_count: base64Images.length,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Land Record Extraction Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
