// ============================================================
// SIH 26018 — Validation Engine
// Deterministic rule-based validation (NO AI)
// ============================================================

import type { CanonicalLandRecord, ValidationResult } from "../../utils/schemas/landRecord";
import { ValidationStatus } from "../../utils/schemas/documentTypes";

// ---- REQUIRED FIELD RULES ----

function runRequiredFieldRules(record: CanonicalLandRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  const requiredChecks: { field: string; path: () => string | null | undefined }[] = [
    { field: "village", path: () => record.location.village.value },
    { field: "district", path: () => record.location.district.value },
    { field: "survey_number", path: () => record.parcel.survey_number.value },
    { field: "area", path: () => record.parcel.area.value },
  ];

  for (const check of requiredChecks) {
    const val = check.path();
    if (!val || val.trim() === "") {
      results.push({
        rule_id: `REQ_${check.field.toUpperCase()}`,
        field: check.field,
        status: ValidationStatus.ERROR,
        severity: "HIGH",
        message: `Required field "${check.field.replace(/_/g, " ")}" is missing`,
        explanation: `The ${check.field.replace(/_/g, " ")} field is a mandatory land record identifier. It was not found in the extracted document or the AI could not read it with sufficient confidence.`,
        suggestion: `Manually verify the document and enter the ${check.field.replace(/_/g, " ")} value.`,
      });
    }
  }

  // At least one owner
  if (!record.owners || record.owners.length === 0) {
    results.push({
      rule_id: "REQ_OWNER",
      field: "owners",
      status: ValidationStatus.ERROR,
      severity: "HIGH",
      message: "No landowner identified",
      explanation:
        "Every land record must have at least one owner. The AI could not identify any owner name in the document. This may be due to poor document quality or the name being in a format the AI did not recognize.",
      suggestion:
        "Check the document manually for owner names, especially handwritten sections.",
    });
  }

  return results;
}

// ---- FORMAT RULES ----

function runFormatRules(record: CanonicalLandRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Area must be positive
  const areaStr = record.parcel.area.value;
  if (areaStr) {
    const areaNum = parseFloat(areaStr);
    if (isNaN(areaNum)) {
      results.push({
        rule_id: "FMT_AREA_NUMERIC",
        field: "area",
        status: ValidationStatus.WARNING,
        severity: "MEDIUM",
        message: `Area value "${areaStr}" is not a valid number`,
        explanation: `The extracted area "${areaStr}" could not be parsed as a number. This may be due to OCR errors, mixed text/numbers, or unit information embedded in the value.`,
        suggestion: "Review the area value and correct it to a numeric format.",
      });
    } else if (areaNum <= 0) {
      results.push({
        rule_id: "FMT_AREA_POSITIVE",
        field: "area",
        status: ValidationStatus.ERROR,
        severity: "HIGH",
        message: `Area value "${areaStr}" must be positive`,
        explanation: "Land parcel area cannot be zero or negative.",
        suggestion: "Correct the area to the actual value from the document.",
      });
    }
  }

  // Area unit recognition
  const areaUnit = record.parcel.area_unit.value;
  const knownUnits = [
    "hectare", "acre", "bigha", "biswa", "kanal", "marla",
    "guntha", "cent", "ground", "sq_meter", "sqm", "sq_feet",
    "sq_yard", "ha", "sq.m", "sq.ft",
  ];
  if (areaUnit && !knownUnits.includes(areaUnit.toLowerCase().replace(/\s/g, "_"))) {
    results.push({
      rule_id: "FMT_AREA_UNIT",
      field: "area_unit",
      status: ValidationStatus.WARNING,
      severity: "LOW",
      message: `Area unit "${areaUnit}" is not a recognized standard unit`,
      explanation: `The extracted unit "${areaUnit}" is not in our list of known Indian land measurement units. It may be a regional variant or OCR error.`,
      suggestion: `Verify and select from: hectare, acre, bigha, biswa, kanal, marla, guntha, cent.`,
    });
  }

  // Khasra number format
  const khasra = record.parcel.khasra_number.value;
  if (khasra && !/^[0-9]+[\/\-]?[0-9]*[a-zA-Z]?$/.test(khasra.trim())) {
    results.push({
      rule_id: "FMT_KHASRA",
      field: "khasra_number",
      status: ValidationStatus.INFO,
      severity: "LOW",
      message: `Khasra number "${khasra}" has an unusual format`,
      explanation: `Khasra numbers are typically numeric, optionally with a sub-division like "124/2". The extracted value "${khasra}" doesn't match this pattern.`,
      suggestion: "Verify the khasra number against the document.",
    });
  }

  return results;
}

// ---- OWNERSHIP RULES ----

function runOwnershipRules(record: CanonicalLandRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check if shares add up (when shares are present)
  const ownersWithShares = record.owners.filter(
    (o) => o.ownership_share?.value
  );

  if (ownersWithShares.length > 1) {
    // Try to parse simple fractions
    let totalNumerator = 0;
    let commonDenominator = 1;
    let parseable = true;

    for (const owner of ownersWithShares) {
      const share = owner.ownership_share!.value!;
      const fractionMatch = share.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (fractionMatch) {
        const num = parseInt(fractionMatch[1]);
        const den = parseInt(fractionMatch[2]);
        if (den > 0) {
          totalNumerator += num * (commonDenominator / den);
          commonDenominator = Math.max(commonDenominator, den);
        }
      } else {
        parseable = false;
        break;
      }
    }

    if (parseable && Math.abs(totalNumerator / commonDenominator - 1) > 0.01) {
      results.push({
        rule_id: "BUS_SHARE_TOTAL",
        field: "ownership_share",
        status: ValidationStatus.WARNING,
        severity: "MEDIUM",
        message: "Ownership shares do not total 100%",
        explanation: `The sum of all ownership shares equals ${totalNumerator}/${commonDenominator}, which is not equal to 1 (100%). This may indicate missing co-owners or incorrect share extraction.`,
        suggestion: "Review all owner entries and verify their shares.",
      });
    }
  }

  return results;
}

// ---- CONFIDENCE RULES ----

function runConfidenceRules(record: CanonicalLandRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Flag any field with handwritten text
  const fieldChecks = [
    { name: "state", field: record.location.state },
    { name: "district", field: record.location.district },
    { name: "village", field: record.location.village },
    { name: "survey_number", field: record.parcel.survey_number },
    { name: "khasra_number", field: record.parcel.khasra_number },
    { name: "area", field: record.parcel.area },
  ];

  for (const { name, field } of fieldChecks) {
    if (field.text_type === "handwritten" && field.confidence < 0.8) {
      results.push({
        rule_id: `CONF_HANDWRITING_${name.toUpperCase()}`,
        field: name,
        status: ValidationStatus.NEEDS_REVIEW,
        severity: "MEDIUM",
        message: `Handwritten ${name.replace(/_/g, " ")} — verification recommended`,
        explanation: `The ${name.replace(/_/g, " ")} value "${field.value}" was extracted from handwritten text with confidence ${Math.round((field.confidence || 0) * 100)}%. Handwritten fields are more prone to OCR errors.`,
        suggestion: `Visually compare the extracted value against the original document image.`,
      });
    }
  }

  return results;
}

// ---- PUBLIC API ----

export function runValidation(
  record: CanonicalLandRecord,
  _existingRecords?: CanonicalLandRecord[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(...runRequiredFieldRules(record));
  results.push(...runFormatRules(record));
  results.push(...runOwnershipRules(record));
  results.push(...runConfidenceRules(record));

  return results;
}

// ---- HEALTH SCORE ----

export function computeHealthScore(record: CanonicalLandRecord): {
  overall: number;
  data_completeness: number;
  extraction_confidence: number;
  validation_consistency: number;
  duplicate_risk: number;
  source_quality: number;
} {
  // Data completeness: how many required fields have values
  const requiredFields = [
    record.location.state.value,
    record.location.district.value,
    record.location.village.value,
    record.parcel.survey_number.value || record.parcel.khasra_number.value,
    record.parcel.area.value,
    record.owners.length > 0 ? "has_owners" : null,
  ];
  const filled = requiredFields.filter(Boolean).length;
  const data_completeness = Math.round((filled / requiredFields.length) * 100);

  // Extraction confidence
  const extraction_confidence = record.confidence.document_confidence;

  // Validation consistency
  const errors = record.validation.filter((v) => v.status === ValidationStatus.ERROR).length;
  const warnings = record.validation.filter((v) => v.status === ValidationStatus.WARNING).length;
  const validation_consistency = Math.max(0, 100 - errors * 15 - warnings * 5);

  // Duplicate risk (100 = no risk; lower = higher risk)
  const duplicate_risk = 95; // Default; will be lowered by duplicate detection

  // Source quality
  const source_quality = record.confidence.pages[0]?.quality_score ?? 70;

  const overall = Math.round(
    data_completeness * 0.25 +
    extraction_confidence * 0.25 +
    validation_consistency * 0.25 +
    duplicate_risk * 0.15 +
    source_quality * 0.1
  );

  return {
    overall,
    data_completeness,
    extraction_confidence,
    validation_consistency,
    duplicate_risk,
    source_quality,
  };
}
