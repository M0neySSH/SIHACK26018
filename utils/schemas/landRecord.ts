// ============================================================
// SIH 26018 — Canonical Land Record Schema
// Every extracted field preserves provenance (source, confidence, region)
// ============================================================

import { DocumentType, RecordStatus, ValidationStatus } from "./documentTypes";

// --------------- CORE PROVENANCE TYPE ---------------

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  page: number;
}

export interface ExtractedField<T = string> {
  value: T | null;
  original_value?: string; // Raw extracted — NEVER modified
  normalized_value?: T; // After normalization
  confidence: number; // 0–1
  source_page: number;
  region?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  bounding_box?: BoundingBox;
  extraction_method: "vision_llm" | "rule" | "manual" | "computed";
  text_type?: "printed" | "handwritten" | "stamp" | "mixed";
  requires_verification: boolean;
  verified?: boolean;
  verified_by?: string;
  verified_at?: string;
}

export interface BilingualText {
  original: string; // Source language script
  romanized?: string; // Latin transliteration
}

// --------------- LAND OWNER ---------------

export interface LandOwner {
  name: ExtractedField<BilingualText>;
  guardian_name?: ExtractedField<BilingualText>;
  relationship?: ExtractedField<string>;
  ownership_share?: ExtractedField<string>;
  owner_type?: ExtractedField<string>; // individual, joint, government
  address?: ExtractedField<string>;
  id_number?: ExtractedField<string>;
}

// --------------- MUTATION ---------------

export interface MutationRecord {
  mutation_number: ExtractedField<string>;
  mutation_date: ExtractedField<string>;
  mutation_type: ExtractedField<string>;
  previous_owner: ExtractedField<string>;
  new_owner: ExtractedField<string>;
  order_reference?: ExtractedField<string>;
  authority?: ExtractedField<string>;
  remarks?: ExtractedField<string>;
}

// --------------- VALIDATION ---------------

export interface ValidationResult {
  rule_id: string;
  field: string;
  status: ValidationStatus;
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  explanation: string; // "Why was this flagged?"
  source_evidence?: string;
  suggestion?: string;
}

// --------------- CONFIDENCE ---------------

export interface PageConfidence {
  page_number: number;
  confidence: number;
  quality_score: number;
  has_handwriting: boolean;
}

export interface ConfidenceReport {
  document_confidence: number; // 0–100
  pages: PageConfidence[];
  field_confidences: Record<string, number>;
  low_confidence_fields: string[];
  requires_human_review: boolean;
  review_reason?: string;
  thresholds: {
    auto_accept: number; // default 0.90
    review_recommended: number; // default 0.70
    mandatory_review: number; // anything below
  };
}

// --------------- AUDIT ---------------

export interface AuditEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  field?: string;
  notes?: string;
}

// --------------- QUALITY REPORT ---------------

export interface QualityReport {
  overall_score: number; // 0–100
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type:
    | "blur"
    | "low_resolution"
    | "skew"
    | "rotation"
    | "faded_text"
    | "noise"
    | "stains"
    | "shadows"
    | "torn"
    | "low_contrast"
    | "handwriting_heavy";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  affected_region?: string;
}

// --------------- CANONICAL LAND RECORD ---------------

export interface CanonicalLandRecord {
  // === METADATA ===
  metadata: {
    record_id: string;
    document_id: string;
    document_type: DocumentType;
    language: string; // ISO 639-1
    source_file: string;
    page_count: number;
    processing_timestamp: string; // ISO 8601
    processing_duration_ms?: number;
    extraction_version: string;
    status: RecordStatus;
  };

  // === LOCATION ===
  location: {
    state: ExtractedField;
    district: ExtractedField;
    tehsil: ExtractedField;
    sub_district?: ExtractedField;
    village: ExtractedField;
    ward?: ExtractedField;
    revenue_circle?: ExtractedField;
    panchayat?: ExtractedField;
  };

  // === PARCEL ===
  parcel: {
    survey_number: ExtractedField;
    khasra_number: ExtractedField;
    khata_number: ExtractedField;
    khatauni_number?: ExtractedField;
    plot_number?: ExtractedField;
    old_survey_number?: ExtractedField;
    area: ExtractedField;
    area_unit: ExtractedField;
    area_normalized_sqm?: number;
    total_area?: ExtractedField;
    irrigated_area?: ExtractedField;
    unirrigated_area?: ExtractedField;
  };

  // === OWNERS ===
  owners: LandOwner[];

  // === LAND CLASSIFICATION ===
  land: {
    classification: ExtractedField;
    land_use: ExtractedField;
    category?: ExtractedField;
    irrigation_source?: ExtractedField;
    soil_type?: ExtractedField;
    encumbrance?: ExtractedField;
    nature_of_land?: ExtractedField;
  };

  // === BOUNDARIES ===
  boundaries?: {
    north: ExtractedField;
    south: ExtractedField;
    east: ExtractedField;
    west: ExtractedField;
  };

  // === MUTATIONS ===
  mutations: MutationRecord[];

  // === REGISTRATION ===
  registration?: {
    registration_number: ExtractedField;
    registration_date: ExtractedField;
    deed_type: ExtractedField;
    registrar_office: ExtractedField;
    book_number?: ExtractedField;
    volume_number?: ExtractedField;
  };

  // === VALIDATION ===
  validation: ValidationResult[];

  // === CONFIDENCE ===
  confidence: ConfidenceReport;

  // === AUDIT ===
  audit: AuditEntry[];
}

// --------------- HEALTH SCORE ---------------

export interface RecordHealthScore {
  overall: number; // 0–100
  data_completeness: number;
  extraction_confidence: number;
  validation_consistency: number;
  duplicate_risk: number;
  source_quality: number;
}

// --------------- HELPER: Create empty ExtractedField ---------------

export function emptyField<T = string>(
  defaults?: Partial<ExtractedField<T>>
): ExtractedField<T> {
  return {
    value: null,
    confidence: 0,
    source_page: 1,
    extraction_method: "vision_llm",
    requires_verification: true,
    ...defaults,
  };
}

// --------------- AI EXTRACTION SCHEMA (for prompt) ---------------
// This is the JSON schema the AI model should output.
// Kept flat to reduce prompt token cost. Mapped to CanonicalLandRecord in post-processing.

export const LAND_RECORD_EXTRACTION_SCHEMA = {
  document_type: "string — one of: record_of_rights, khasra, jamabandi, khatauni, mutation_register, sale_deed, registration_record, ownership_cert, tax_record, cadastral_map, survey_map, partition_deed, lease_deed, gift_deed, mortgage_deed, unknown",
  language: "string — ISO 639-1 code: hi, en, bn, mr, gu, pa, ta, te, kn, ml, or, as",

  // Quality
  quality_score: "number 0-100",
  quality_issues: "string[] — e.g. ['faded_text', 'skew', 'handwriting_heavy']",

  // Location
  state: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  district: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  tehsil: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  village: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",

  // Parcel
  survey_number: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  khasra_number: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  khata_number: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  plot_number: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  area: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  area_unit: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",

  // Owners (array)
  owners: [
    {
      name_original: "string|null — in original script",
      name_romanized: "string|null — Latin transliteration",
      guardian_name: "string|null",
      relationship: "string|null — s/o, d/o, w/o",
      ownership_share: "string|null — e.g. 1/2, 1/1",
      confidence: "number 0-1",
      region: "string",
      text_type: "string — printed|handwritten|stamp|mixed",
    },
  ],

  // Classification
  land_classification: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  land_use: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  irrigation_source: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",

  // Boundaries
  boundary_north: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  boundary_south: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  boundary_east: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  boundary_west: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",

  // Mutations (array)
  mutations: [
    {
      mutation_number: "string|null",
      mutation_date: "string|null",
      mutation_type: "string|null — sale, inheritance, court_order, gift, partition",
      previous_owner: "string|null",
      new_owner: "string|null",
      authority: "string|null",
      confidence: "number 0-1",
    },
  ],

  // Registration
  registration_number: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  registration_date: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  deed_type: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",
  registrar_office: "{ value: string|null, confidence: number 0-1, region: string, text_type: string }",

  // Additional
  remarks: "string|null — any additional notes or annotations visible",
  reference_numbers: "string[] — any document/reference numbers found",
};
