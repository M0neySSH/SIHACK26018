// ============================================================
// SIH 26018 — Land Record Extraction (Vision LLM)
// Builds the extraction prompt and maps raw AI output to CanonicalLandRecord
// ============================================================

import { callAI } from "./provider";
import {
  LAND_RECORD_EXTRACTION_SCHEMA,
  type CanonicalLandRecord,
  type ExtractedField,
  type BilingualText,
  type LandOwner,
  type MutationRecord,
  type QualityReport,
  emptyField,
} from "../../utils/schemas/landRecord";
import { DocumentType, RecordStatus } from "../../utils/schemas/documentTypes";
import { v4 as uuidv4 } from "uuid";

// --------------- EXTRACTION PROMPT ---------------

function buildExtractionPrompt(
  documentType?: string,
  language?: string
): string {
  const docTypeHint = documentType
    ? `The document has been pre-classified as: ${documentType}.`
    : "First determine the document type.";

  const langHint = language
    ? `The document is in: ${language}. Extract values in their ORIGINAL script. For names, provide both original and romanized.`
    : "Detect the language. Extract values in original script with romanized transliteration for names.";

  return `You are an expert Indian land record digitization AI. Your task is to extract structured information from scanned land record documents.

## ABSOLUTE RULES — NO EXCEPTIONS

1. **NO HALLUCINATION / NO FABRICATION**: Extract ONLY what is VISIBLE in the document. If a field does not exist, its value MUST be null. Do NOT invent or assume any data.
2. **PRESERVE ORIGINAL VALUES**: For every field, capture the exact text as written. Do NOT correct spellings unless obvious OCR errors.
3. **CONFIDENCE SCORING**: For each field, assess confidence:
   - 0.95–1.0: Crystal clear printed text
   - 0.80–0.94: Clear but slightly ambiguous
   - 0.60–0.79: Partially readable, faded or unclear
   - 0.30–0.59: Barely readable, mostly guessing
   - 0.0–0.29: Cannot read, do not extract (set null)
4. **SOURCE REGION**: For each field, note its approximate location on the page:
   top-left, top-center, top-right, middle-left, middle-center, middle-right, bottom-left, bottom-center, bottom-right
5. **TEXT TYPE**: For each field, classify as: printed, handwritten, stamp, or mixed
6. **RETURN ONLY VALID JSON**: No markdown, no code fences, no explanatory text.

## DOCUMENT CONTEXT
${docTypeHint}
${langHint}

## WHAT TO EXTRACT

### Quality Assessment
- Overall quality score (0–100)
- List any issues: blur, faded_text, skew, rotation, noise, stains, shadows, torn, low_contrast, handwriting_heavy

### Land Record Fields
- Location: state, district, tehsil, village
- Parcel: survey_number, khasra_number, khata_number, plot_number, area, area_unit
- Owners: array of { name_original (in source script), name_romanized (latin), guardian_name, relationship, ownership_share }
- Land: classification (agricultural/residential/commercial/barren/forest/govt), land_use, irrigation_source
- Boundaries: north, south, east, west
- Mutations: array of { mutation_number, date, type, previous_owner, new_owner, authority }
- Registration: number, date, deed_type, registrar_office
- Any remarks or reference numbers

## EXPECTED OUTPUT JSON STRUCTURE

${JSON.stringify(LAND_RECORD_EXTRACTION_SCHEMA, null, 2)}

Remember: For EACH field object, return { value, confidence, region, text_type }. Return null for value if field is not present in document. Do NOT fabricate data.`;
}

// --------------- MAP RAW AI OUTPUT → CANONICAL RECORD ---------------

interface RawFieldObj {
  value?: string | null;
  confidence?: number;
  region?: string;
  text_type?: string;
}

function mapField(raw: RawFieldObj | string | null | undefined): ExtractedField {
  if (!raw) return emptyField();
  if (typeof raw === "string") {
    return {
      value: raw || null,
      confidence: 0.7,
      source_page: 1,
      extraction_method: "vision_llm",
      requires_verification: true,
    };
  }
  return {
    value: raw.value ?? null,
    original_value: typeof raw.value === "string" ? raw.value : undefined,
    confidence: raw.confidence ?? 0.5,
    source_page: 1,
    region: raw.region as ExtractedField["region"],
    extraction_method: "vision_llm",
    text_type: raw.text_type as ExtractedField["text_type"],
    requires_verification: (raw.confidence ?? 0.5) < 0.85 || raw.text_type === "handwritten",
  };
}

function mapOwners(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawOwners: any[] | undefined
): LandOwner[] {
  if (!rawOwners || !Array.isArray(rawOwners)) return [];
  return rawOwners.map((o) => ({
    name: {
      value: o.name_original
        ? { original: o.name_original, romanized: o.name_romanized || undefined }
        : null,
      confidence: o.confidence ?? 0.5,
      source_page: 1,
      region: o.region as ExtractedField["region"],
      extraction_method: "vision_llm" as const,
      text_type: o.text_type as ExtractedField["text_type"],
      requires_verification:
        (o.confidence ?? 0.5) < 0.85 || o.text_type === "handwritten",
    } as ExtractedField<BilingualText>,
    guardian_name: o.guardian_name
      ? ({
          value: { original: o.guardian_name, romanized: undefined },
          confidence: o.confidence ?? 0.5,
          source_page: 1,
          extraction_method: "vision_llm" as const,
          requires_verification: true,
        } as ExtractedField<BilingualText>)
      : undefined,
    relationship: o.relationship
      ? mapField({ value: o.relationship, confidence: o.confidence, region: o.region })
      : undefined,
    ownership_share: o.ownership_share
      ? mapField({
          value: o.ownership_share,
          confidence: o.confidence,
          region: o.region,
        })
      : undefined,
  }));
}

function mapMutations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawMutations: any[] | undefined
): MutationRecord[] {
  if (!rawMutations || !Array.isArray(rawMutations)) return [];
  return rawMutations.map((m) => ({
    mutation_number: mapField({
      value: m.mutation_number,
      confidence: m.confidence,
    }),
    mutation_date: mapField({
      value: m.mutation_date,
      confidence: m.confidence,
    }),
    mutation_type: mapField({
      value: m.mutation_type,
      confidence: m.confidence,
    }),
    previous_owner: mapField({
      value: m.previous_owner,
      confidence: m.confidence,
    }),
    new_owner: mapField({ value: m.new_owner, confidence: m.confidence }),
    authority: m.authority
      ? mapField({ value: m.authority, confidence: m.confidence })
      : undefined,
    remarks: m.remarks
      ? mapField({ value: m.remarks, confidence: m.confidence })
      : undefined,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToCanonical(raw: any, sourceFile: string, pageCount: number): CanonicalLandRecord {
  const recordId = uuidv4();
  const documentId = uuidv4();

  // Build confidence report
  const fieldConfidences: Record<string, number> = {};
  const lowConfidenceFields: string[] = [];

  const checkField = (name: string, field: RawFieldObj | string | null | undefined) => {
    if (!field) return;
    const conf = typeof field === "object" && field !== null ? (field.confidence ?? 0) : 0.7;
    fieldConfidences[name] = conf;
    if (conf < 0.7) lowConfidenceFields.push(name);
  };

  checkField("state", raw.state);
  checkField("district", raw.district);
  checkField("tehsil", raw.tehsil);
  checkField("village", raw.village);
  checkField("survey_number", raw.survey_number);
  checkField("khasra_number", raw.khasra_number);
  checkField("area", raw.area);

  if (raw.owners?.length) {
    raw.owners.forEach((o: { confidence?: number }, i: number) => {
      checkField(`owner_${i}`, { value: "set", confidence: o.confidence });
    });
  }

  const allConfs = Object.values(fieldConfidences);
  const avgConf = allConfs.length > 0 ? allConfs.reduce((a, b) => a + b, 0) / allConfs.length : 0;
  const docConfidence = Math.round(avgConf * 100);

  return {
    metadata: {
      record_id: recordId,
      document_id: documentId,
      document_type: (raw.document_type as DocumentType) || DocumentType.UNKNOWN,
      language: raw.language || "en",
      source_file: sourceFile,
      page_count: pageCount,
      processing_timestamp: new Date().toISOString(),
      extraction_version: "1.0.0",
      status: RecordStatus.EXTRACTED,
    },

    location: {
      state: mapField(raw.state),
      district: mapField(raw.district),
      tehsil: mapField(raw.tehsil),
      village: mapField(raw.village),
    },

    parcel: {
      survey_number: mapField(raw.survey_number),
      khasra_number: mapField(raw.khasra_number),
      khata_number: mapField(raw.khata_number),
      plot_number: mapField(raw.plot_number),
      area: mapField(raw.area),
      area_unit: mapField(raw.area_unit),
    },

    owners: mapOwners(raw.owners),

    land: {
      classification: mapField(raw.land_classification),
      land_use: mapField(raw.land_use),
      irrigation_source: mapField(raw.irrigation_source),
    },

    boundaries: raw.boundary_north
      ? {
          north: mapField(raw.boundary_north),
          south: mapField(raw.boundary_south),
          east: mapField(raw.boundary_east),
          west: mapField(raw.boundary_west),
        }
      : undefined,

    mutations: mapMutations(raw.mutations),

    registration:
      raw.registration_number?.value
        ? {
            registration_number: mapField(raw.registration_number),
            registration_date: mapField(raw.registration_date),
            deed_type: mapField(raw.deed_type),
            registrar_office: mapField(raw.registrar_office),
          }
        : undefined,

    validation: [], // Populated by validation engine

    confidence: {
      document_confidence: docConfidence,
      pages: [
        {
          page_number: 1,
          confidence: avgConf,
          quality_score: raw.quality_score ?? 70,
          has_handwriting: (raw.quality_issues || []).includes("handwriting_heavy"),
        },
      ],
      field_confidences: fieldConfidences,
      low_confidence_fields: lowConfidenceFields,
      requires_human_review: docConfidence < 85 || lowConfidenceFields.length > 0,
      review_reason:
        docConfidence < 85
          ? `Document confidence ${docConfidence}% is below threshold`
          : lowConfidenceFields.length > 0
          ? `${lowConfidenceFields.length} fields have low confidence`
          : undefined,
      thresholds: {
        auto_accept: 0.9,
        review_recommended: 0.7,
        mandatory_review: 0.7,
      },
    },

    audit: [
      {
        id: uuidv4(),
        action: "document.processed",
        timestamp: new Date().toISOString(),
        notes: `AI extraction completed. Document confidence: ${docConfidence}%`,
      },
    ],
  };
}

// --------------- QUALITY REPORT ---------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractQualityReport(raw: any): QualityReport {
  const issues: QualityReport["issues"] = [];
  const rawIssues: string[] = raw.quality_issues || [];

  for (const issue of rawIssues) {
    issues.push({
      type: issue as QualityReport["issues"][0]["type"],
      severity: issue === "torn" || issue === "blur" ? "HIGH" : "MEDIUM",
      description: `Detected: ${issue.replace(/_/g, " ")}`,
    });
  }

  return {
    overall_score: raw.quality_score ?? 70,
    issues,
    recommendations: issues.length > 0
      ? issues.map((i) => `Address ${i.type}: ${i.description}`)
      : ["Document quality is acceptable"],
  };
}

// --------------- PUBLIC API ---------------

export interface ExtractionResult {
  record: CanonicalLandRecord;
  quality: QualityReport;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_extraction: any; // preserved for audit
  provider: string;
  model: string;
  latency_ms: number;
}

export async function extractLandRecord(
  base64Images: string[],
  sourceFile: string,
  preClassifiedType?: string,
  preDetectedLanguage?: string
): Promise<ExtractionResult> {
  const prompt = buildExtractionPrompt(preClassifiedType, preDetectedLanguage);

  const aiResponse = await callAI(prompt, base64Images);

  let parsed;
  try {
    parsed = JSON.parse(aiResponse.text);
  } catch {
    // Try to extract JSON from potential wrapper
    const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("AI returned invalid JSON");
    }
  }

  const record = mapToCanonical(parsed, sourceFile, base64Images.length);
  const quality = extractQualityReport(parsed);

  return {
    record,
    quality,
    raw_extraction: parsed,
    provider: aiResponse.provider,
    model: aiResponse.model,
    latency_ms: aiResponse.latency_ms,
  };
}
