// ============================================================
// SIH 26018 — In-Memory Mock Database Store (Persistent Global Singleton)
// ============================================================

import type { AuditEntry, CanonicalLandRecord, QualityReport } from "../../utils/schemas/landRecord";

export interface StoredDocument {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  page_count: number;
  document_type: string;
  language: string;
  quality_score: number;
  quality_report: QualityReport | null;
  status: string;
  uploaded_at: string;
  processed_at: string | null;
  page_images: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_extraction: any;
  record_id: string | null;
  error_message: string | null;
}

// ---- PERSISTENT GLOBAL STORES ACROSS NEXT.JS HMR & MODULE RELOADS ----

/* eslint-disable no-var */
declare global {
  var __mockDocuments: Map<string, StoredDocument> | undefined;
  var __mockRecords: Map<string, CanonicalLandRecord> | undefined;
}

const documents: Map<string, StoredDocument> =
  globalThis.__mockDocuments || (globalThis.__mockDocuments = new Map());
const records: Map<string, CanonicalLandRecord> =
  globalThis.__mockRecords || (globalThis.__mockRecords = new Map());

// ---- DOCUMENTS ----

export function storeDocument(doc: StoredDocument): void {
  documents.set(doc.id, doc);
}

export function getDocument(id: string): StoredDocument | undefined {
  return documents.get(id);
}

export function listDocuments(): StoredDocument[] {
  return Array.from(documents.values()).sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}

export function updateDocument(
  id: string,
  updates: Partial<StoredDocument>
): StoredDocument | undefined {
  const doc = documents.get(id);
  if (!doc) return undefined;
  const updated = { ...doc, ...updates };
  documents.set(id, updated);
  return updated;
}

export function deleteDocument(id: string): boolean {
  return documents.delete(id);
}

// ---- LAND RECORDS ----

export function storeRecord(record: CanonicalLandRecord): void {
  records.set(record.metadata.record_id, record);
}

export function getRecord(id: string): CanonicalLandRecord | undefined {
  return records.get(id);
}

export function listRecords(filters?: {
  status?: string;
  district?: string;
  village?: string;
  search?: string;
}): CanonicalLandRecord[] {
  let results = Array.from(records.values());

  if (filters?.status) {
    results = results.filter((r) => r.metadata.status === filters.status);
  }
  if (filters?.district) {
    results = results.filter(
      (r) =>
        r.location.district.value
          ?.toLowerCase()
          .includes(filters.district!.toLowerCase())
    );
  }
  if (filters?.village) {
    results = results.filter(
      (r) =>
        r.location.village.value
          ?.toLowerCase()
          .includes(filters.village!.toLowerCase())
    );
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.parcel.survey_number.value?.toLowerCase().includes(q) ||
        r.parcel.khasra_number.value?.toLowerCase().includes(q) ||
        r.location.village.value?.toLowerCase().includes(q) ||
        r.location.district.value?.toLowerCase().includes(q) ||
        r.owners.some((o) => {
          const name = o.name.value;
          if (!name) return false;
          return (
            name.original.toLowerCase().includes(q) ||
            name.romanized?.toLowerCase().includes(q)
          );
        })
    );
  }

  return results.sort(
    (a, b) =>
      new Date(b.metadata.processing_timestamp).getTime() -
      new Date(a.metadata.processing_timestamp).getTime()
  );
}

export function updateRecord(
  id: string,
  updater: (record: CanonicalLandRecord) => CanonicalLandRecord
): CanonicalLandRecord | undefined {
  const record = records.get(id);
  if (!record) return undefined;
  const updated = updater(record);
  records.set(id, updated);
  return updated;
}

// ---- STATS ----

export function getRecentAuditEntries(limit: number = 10) {
  const allRecords = Array.from(records.values());
  const entries: {
    record_id: string;
    khasra_number?: string;
    village?: string;
    district?: string;
    audit: AuditEntry;
  }[] = [];

  for (const record of allRecords) {
    if (record.audit && record.audit.length > 0) {
      for (const entry of record.audit) {
        entries.push({
          record_id: record.metadata.record_id,
          khasra_number: record.parcel.khasra_number.value || undefined,
          village: record.location.village.value || undefined,
          district: record.location.district.value || undefined,
          audit: entry,
        });
      }
    }
  }

  return entries
    .sort((a, b) => new Date(b.audit.timestamp).getTime() - new Date(a.audit.timestamp).getTime())
    .slice(0, limit);
}

export function getDashboardStats() {
  const allDocs = Array.from(documents.values());
  const allRecords = Array.from(records.values());

  const totalDocuments = allDocs.length;
  const processed = allDocs.filter(
    (d) => d.status !== "uploaded" && d.status !== "processing" && d.status !== "error"
  ).length;
  const errors = allDocs.filter((d) => d.status === "error").length;
  const verified = allRecords.filter((r) => r.metadata.status === "verified").length;
  const rejected = allRecords.filter((r) => r.metadata.status === "rejected").length;
  const pendingVerification = allRecords.filter(
    (r) => r.metadata.status === "pending_verification" || r.confidence.requires_human_review
  ).length;

  const avgConfidence =
    allRecords.length > 0
      ? Math.round(
          allRecords.reduce((sum, r) => sum + r.confidence.document_confidence, 0) /
            allRecords.length
        )
      : 0;

  const docTypes: Record<string, number> = {};
  for (const doc of allDocs) {
    const t = doc.document_type || "unknown";
    docTypes[t] = (docTypes[t] || 0) + 1;
  }

  const languages: Record<string, number> = {};
  for (const doc of allDocs) {
    const l = doc.language || "unknown";
    languages[l] = (languages[l] || 0) + 1;
  }

  const recentActions = getRecentAuditEntries(6);

  return {
    totalDocuments,
    processed,
    errors,
    verified,
    rejected,
    pendingVerification,
    avgConfidence,
    docTypes,
    languages,
    recentActions,
  };
}

