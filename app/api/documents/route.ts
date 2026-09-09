// ============================================================
// SIH 26018 — Documents List API
// GET /api/documents — list all uploaded documents
// ============================================================

import { NextResponse } from "next/server";
import { listDocuments } from "../../../lib/db/mockStore";
import { seedDemoData } from "../../../lib/db/seedData";

export async function GET() {
  seedDemoData();
  const docs = listDocuments();

  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      original_filename: d.original_filename,
      document_type: d.document_type,
      language: d.language,
      quality_score: d.quality_score,
      status: d.status,
      uploaded_at: d.uploaded_at,
      processed_at: d.processed_at,
      record_id: d.record_id,
      page_count: d.page_count,
    })),
    total: docs.length,
  });
}
