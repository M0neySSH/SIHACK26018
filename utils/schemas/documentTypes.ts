// ============================================================
// SIH 26018 — Document Types & Enumerations
// ============================================================

export enum DocumentType {
  RECORD_OF_RIGHTS = "record_of_rights",
  KHASRA = "khasra",
  JAMABANDI = "jamabandi",
  KHATAUNI = "khatauni",
  MUTATION_REGISTER = "mutation_register",
  SALE_DEED = "sale_deed",
  REGISTRATION_RECORD = "registration_record",
  OWNERSHIP_CERTIFICATE = "ownership_cert",
  TAX_RECORD = "tax_record",
  CADASTRAL_MAP = "cadastral_map",
  SURVEY_MAP = "survey_map",
  PARTITION_DEED = "partition_deed",
  LEASE_DEED = "lease_deed",
  GIFT_DEED = "gift_deed",
  MORTGAGE_DEED = "mortgage_deed",
  UNKNOWN = "unknown",
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.RECORD_OF_RIGHTS]: "Record of Rights (RoR)",
  [DocumentType.KHASRA]: "Khasra Record",
  [DocumentType.JAMABANDI]: "Jamabandi",
  [DocumentType.KHATAUNI]: "Khatauni",
  [DocumentType.MUTATION_REGISTER]: "Mutation Register (Dakhil Kharij)",
  [DocumentType.SALE_DEED]: "Sale Deed",
  [DocumentType.REGISTRATION_RECORD]: "Registration Record",
  [DocumentType.OWNERSHIP_CERTIFICATE]: "Ownership Certificate",
  [DocumentType.TAX_RECORD]: "Tax / Revenue Record",
  [DocumentType.CADASTRAL_MAP]: "Cadastral Map",
  [DocumentType.SURVEY_MAP]: "Survey Map",
  [DocumentType.PARTITION_DEED]: "Partition Deed",
  [DocumentType.LEASE_DEED]: "Lease Deed",
  [DocumentType.GIFT_DEED]: "Gift Deed",
  [DocumentType.MORTGAGE_DEED]: "Mortgage Deed",
  [DocumentType.UNKNOWN]: "Unknown Document",
};

export const DOCUMENT_TYPE_HINDI: Record<DocumentType, string> = {
  [DocumentType.RECORD_OF_RIGHTS]: "अधिकार अभिलेख",
  [DocumentType.KHASRA]: "खसरा",
  [DocumentType.JAMABANDI]: "जमाबंदी",
  [DocumentType.KHATAUNI]: "खतौनी",
  [DocumentType.MUTATION_REGISTER]: "दाखिल खारिज",
  [DocumentType.SALE_DEED]: "बिक्री पत्र",
  [DocumentType.REGISTRATION_RECORD]: "पंजीकरण रिकॉर्ड",
  [DocumentType.OWNERSHIP_CERTIFICATE]: "स्वामित्व प्रमाणपत्र",
  [DocumentType.TAX_RECORD]: "कर अभिलेख",
  [DocumentType.CADASTRAL_MAP]: "भूकर मानचित्र",
  [DocumentType.SURVEY_MAP]: "सर्वेक्षण मानचित्र",
  [DocumentType.PARTITION_DEED]: "बंटवारा पत्र",
  [DocumentType.LEASE_DEED]: "पट्टा",
  [DocumentType.GIFT_DEED]: "दान पत्र",
  [DocumentType.MORTGAGE_DEED]: "बंधक पत्र",
  [DocumentType.UNKNOWN]: "अज्ञात दस्तावेज़",
};

export enum RecordStatus {
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  CLASSIFIED = "classified",
  QUALITY_ANALYZED = "quality_analyzed",
  EXTRACTED = "extracted",
  NORMALIZED = "normalized",
  VALIDATED = "validated",
  CONFIDENCE_SCORED = "confidence_scored",
  PENDING_VERIFICATION = "pending_verification",
  VERIFIED = "verified",
  REJECTED = "rejected",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  ERROR = "error",
}

export enum ValidationStatus {
  VALID = "VALID",
  WARNING = "WARNING",
  ERROR = "ERROR",
  INFO = "INFO",
  NEEDS_REVIEW = "NEEDS_REVIEW",
}

export enum ConfidenceLevel {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  or: "Odia",
  as: "Assamese",
};

export const AREA_UNITS: Record<string, number> = {
  // conversion factor to square meters
  sqm: 1,
  sq_meter: 1,
  hectare: 10000,
  acre: 4046.86,
  bigha: 2529.29, // Rajasthan bigha; varies by state
  biswa: 126.46,
  kanal: 505.857,
  marla: 25.293,
  guntha: 101.17,
  cent: 40.47,
  ground: 222.97,
  sq_feet: 0.0929,
  sq_yard: 0.8361,
};
