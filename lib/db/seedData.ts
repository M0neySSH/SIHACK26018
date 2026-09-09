// ============================================================
// SIH 26018 — Demo Seed Data
// Pre-populated records with STABLE IDs for reliable lookup & state persistence
// ============================================================

import { v4 as uuidv4 } from "uuid";
import type { CanonicalLandRecord } from "../../utils/schemas/landRecord";
import { DocumentType, RecordStatus } from "../../utils/schemas/documentTypes";
import { storeRecord, storeDocument, getRecord, getDocument, type StoredDocument } from "./mockStore";
import { runValidation } from "../validation/engine";

function createDemoRecord(opts: {
  id: string;
  docType: DocumentType;
  lang: string;
  state: string;
  district: string;
  tehsil: string;
  village: string;
  khasra: string;
  survey: string;
  area: string;
  areaUnit: string;
  classification: string;
  ownerName: string;
  ownerHindi?: string;
  guardianName?: string;
  relationship?: string;
  share?: string;
  confidence: number;
  textType?: "printed" | "handwritten" | "mixed";
  status: RecordStatus;
  mutationType?: string;
  mutationFrom?: string;
  mutationTo?: string;
  boundaryN?: string;
  boundaryS?: string;
  boundaryE?: string;
  boundaryW?: string;
}): CanonicalLandRecord {
  const recordId = opts.id;
  const documentId = `doc_${opts.id.replace("rec_", "")}`;
  const conf = opts.confidence / 100;
  const tt = opts.textType || "printed";

  const record: CanonicalLandRecord = {
    metadata: {
      record_id: recordId,
      document_id: documentId,
      document_type: opts.docType,
      language: opts.lang,
      source_file: `demo_${opts.khasra.replace(/\//g, "_")}_${opts.village.toLowerCase()}.pdf`,
      page_count: 2,
      processing_timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      extraction_version: "1.0.0",
      status: opts.status,
    },
    location: {
      state: { value: opts.state, confidence: conf + 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      district: { value: opts.district, confidence: conf + 0.03, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      tehsil: { value: opts.tehsil, confidence: conf, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: conf < 0.8 },
      village: { value: opts.village, confidence: conf + 0.02, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
    },
    parcel: {
      survey_number: { value: opts.survey, confidence: conf + 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      khasra_number: { value: opts.khasra, confidence: conf + 0.04, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      khata_number: { value: "108", confidence: conf, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: conf < 0.8 },
      area: { value: opts.area, confidence: conf + 0.02, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      area_unit: { value: opts.areaUnit, confidence: 0.95, source_page: 1, extraction_method: "vision_llm", text_type: "printed", requires_verification: false },
    },
    owners: [
      {
        name: {
          value: { original: opts.ownerHindi || opts.ownerName, romanized: opts.ownerName },
          confidence: conf,
          source_page: 1,
          extraction_method: "vision_llm",
          text_type: tt,
          requires_verification: tt === "handwritten",
        },
        guardian_name: opts.guardianName
          ? { value: { original: opts.guardianName }, confidence: conf - 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: true }
          : undefined,
        relationship: opts.relationship
          ? { value: opts.relationship, confidence: 0.9, source_page: 1, extraction_method: "vision_llm", requires_verification: false }
          : undefined,
        ownership_share: opts.share
          ? { value: opts.share, confidence: 0.85, source_page: 1, extraction_method: "vision_llm", requires_verification: false }
          : undefined,
      },
    ],
    land: {
      classification: { value: opts.classification, confidence: conf + 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: false },
      land_use: { value: opts.classification === "Agricultural" ? "Crop cultivation" : opts.classification === "Residential" ? "Dwelling" : "General", confidence: conf, source_page: 1, extraction_method: "vision_llm", requires_verification: false },
    },
    boundaries: opts.boundaryN ? {
      north: { value: opts.boundaryN, confidence: conf - 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: true },
      south: { value: opts.boundaryS || "Road", confidence: conf - 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: true },
      east: { value: opts.boundaryE || "Nala", confidence: conf - 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: true },
      west: { value: opts.boundaryW || "Khasra 125", confidence: conf - 0.05, source_page: 1, extraction_method: "vision_llm", text_type: tt, requires_verification: true },
    } : undefined,
    mutations: opts.mutationType ? [{
      mutation_number: { value: "MUT/2023/8841", confidence: conf, source_page: 2, extraction_method: "vision_llm", requires_verification: false },
      mutation_date: { value: "2023-06-15", confidence: conf, source_page: 2, extraction_method: "vision_llm", requires_verification: false },
      mutation_type: { value: opts.mutationType, confidence: conf, source_page: 2, extraction_method: "vision_llm", requires_verification: false },
      previous_owner: { value: opts.mutationFrom || "Unknown", confidence: conf - 0.1, source_page: 2, extraction_method: "vision_llm", requires_verification: true },
      new_owner: { value: opts.mutationTo || opts.ownerName, confidence: conf, source_page: 2, extraction_method: "vision_llm", requires_verification: false },
    }] : [],
    validation: [],
    confidence: {
      document_confidence: opts.confidence,
      pages: [
        { page_number: 1, confidence: conf, quality_score: opts.confidence - 5, has_handwriting: tt === "handwritten" },
        { page_number: 2, confidence: conf - 0.05, quality_score: opts.confidence - 8, has_handwriting: tt === "handwritten" },
      ],
      field_confidences: {},
      low_confidence_fields: [],
      requires_human_review: opts.confidence < 85,
      review_reason: opts.confidence < 85 ? `Confidence ${opts.confidence}% below threshold` : undefined,
      thresholds: { auto_accept: 0.9, review_recommended: 0.7, mandatory_review: 0.7 },
    },
    audit: [
      { id: uuidv4(), action: "document.uploaded", timestamp: new Date(Date.now() - 7200000).toISOString(), notes: "Demo document uploaded" },
      { id: uuidv4(), action: "document.processed", timestamp: new Date(Date.now() - 3600000).toISOString(), notes: `AI extraction completed. Confidence: ${opts.confidence}%` },
    ],
  };

  record.validation = runValidation(record);
  return record;
}

// ---- SEED FUNCTION ----

export function seedDemoData() {
  const demoRecords = [
    createDemoRecord({
      id: "rec_demo_124_2_rampur",
      docType: DocumentType.KHASRA, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Sadar", village: "Rampur",
      khasra: "124/2", survey: "124", area: "0.84", areaUnit: "hectare", classification: "Agricultural",
      ownerName: "Ram Singh", ownerHindi: "राम सिंह", guardianName: "श्याम सिंह", relationship: "s/o", share: "1/1",
      confidence: 94, textType: "printed", status: RecordStatus.VERIFIED,
      mutationType: "Inheritance", mutationFrom: "Shyam Singh", mutationTo: "Ram Singh",
      boundaryN: "Khasra 123", boundaryS: "Village Road", boundaryE: "Nala", boundaryW: "Khasra 125",
    }),
    createDemoRecord({
      id: "rec_demo_125_rampur",
      docType: DocumentType.KHATAUNI, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Sadar", village: "Rampur",
      khasra: "125", survey: "125", area: "1.20", areaUnit: "hectare", classification: "Agricultural",
      ownerName: "Sita Devi", ownerHindi: "सीता देवी", guardianName: "रामेश्वर", relationship: "w/o",
      confidence: 72, textType: "handwritten", status: RecordStatus.PENDING_VERIFICATION,
      boundaryN: "Khasra 124", boundaryS: "River bed",
    }),
    createDemoRecord({
      id: "rec_demo_126_1_rampur",
      docType: DocumentType.RECORD_OF_RIGHTS, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Sadar", village: "Rampur",
      khasra: "126/1", survey: "126", area: "0.72", areaUnit: "hectare", classification: "Residential",
      ownerName: "Mohan Lal", ownerHindi: "मोहन लाल", guardianName: "गंगा राम", relationship: "s/o",
      confidence: 88, textType: "mixed", status: RecordStatus.PENDING_VERIFICATION,
    }),
    createDemoRecord({
      id: "rec_demo_127_kalsi",
      docType: DocumentType.JAMABANDI, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Kalsi", village: "Kalsi",
      khasra: "127", survey: "127", area: "2.50", areaUnit: "hectare", classification: "Agricultural",
      ownerName: "Geeta Rawat", ownerHindi: "गीता रावत", relationship: "d/o", guardianName: "बलदेव रावत",
      confidence: 96, textType: "printed", status: RecordStatus.VERIFIED,
      mutationType: "Sale", mutationFrom: "Prakash Rawat", mutationTo: "Geeta Rawat",
    }),
    createDemoRecord({
      id: "rec_demo_200_rishikesh",
      docType: DocumentType.SALE_DEED, lang: "en", state: "Uttarakhand", district: "Dehradun", tehsil: "Rishikesh", village: "Rishikesh",
      khasra: "200", survey: "200", area: "3.10", areaUnit: "hectare", classification: "Forest",
      ownerName: "Government of Uttarakhand",
      confidence: 98, textType: "printed", status: RecordStatus.VERIFIED,
    }),
    createDemoRecord({
      id: "rec_demo_201_a_rishikesh",
      docType: DocumentType.MUTATION_REGISTER, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Rishikesh", village: "Rishikesh",
      khasra: "201/A", survey: "201", area: "0.33", areaUnit: "hectare", classification: "Residential",
      ownerName: "Priya Sharma", ownerHindi: "प्रिया शर्मा",
      confidence: 78, textType: "handwritten", status: RecordStatus.PENDING_VERIFICATION,
      mutationType: "Gift", mutationFrom: "Ramesh Sharma",
    }),
    createDemoRecord({
      id: "rec_demo_450_b_doiwala",
      docType: DocumentType.KHASRA, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Doiwala", village: "Doiwala",
      khasra: "450/B", survey: "450", area: "5.00", areaUnit: "hectare", classification: "Agricultural",
      ownerName: "Bhagwan Das", ownerHindi: "भगवान दास", guardianName: "हरि दास", relationship: "s/o",
      confidence: 91, textType: "printed", status: RecordStatus.VALIDATED,
    }),
    createDemoRecord({
      id: "rec_demo_500_herbertpur",
      docType: DocumentType.KHATAUNI, lang: "hi", state: "Uttarakhand", district: "Dehradun", tehsil: "Vikasnagar", village: "Herbertpur",
      khasra: "500", survey: "500", area: "1.75", areaUnit: "hectare", classification: "Agricultural",
      ownerName: "Kamla Devi", ownerHindi: "कमला देवी",
      confidence: 55, textType: "handwritten", status: RecordStatus.PENDING_VERIFICATION,
    }),
  ];

  for (const record of demoRecords) {
    // ONLY store if not already present in the map
    if (!getRecord(record.metadata.record_id)) {
      storeRecord(record);
    }

    if (!getDocument(record.metadata.document_id)) {
      const doc: StoredDocument = {
        id: record.metadata.document_id,
        original_filename: record.metadata.source_file,
        file_size_bytes: 1450000,
        mime_type: "application/pdf",
        page_count: record.metadata.page_count,
        document_type: record.metadata.document_type,
        language: record.metadata.language,
        quality_score: record.confidence.pages[0]?.quality_score ?? 70,
        quality_report: null,
        status: record.metadata.status,
        uploaded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        processed_at: record.metadata.processing_timestamp,
        page_images: [],
        raw_extraction: null,
        record_id: record.metadata.record_id,
        error_message: null,
      };
      storeDocument(doc);
    }
  }
}
