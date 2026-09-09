// ============================================================
// SIH 26018 — Demo GIS Parcel Data
// ALL parcels are clearly labelled as DEMO DATA
// Geometries are fictional — NOT actual cadastral boundaries
// ============================================================

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  document?: string;
}

export interface ConflictInfo {
  type: string;
  historical_value: string;
  current_value: string;
  rule_id: string;
}

export interface DemoParcel {
  id: string;
  khasra_number: string;
  survey_number: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  area: string;
  area_unit: string;
  classification: string;
  owner: string;
  owner_hindi?: string;
  status: "verified" | "needs_review" | "conflict" | "low_confidence" | "incomplete" | "pending";
  confidence: number;
  health_score: number;
  document_count: number;
  geometry_type: "demo";
  geometry_source: "DEMO seed data";
  availability_class: "A";
  geometry: GeoJSON.Polygon | null;
  conflict?: ConflictInfo;
  timeline?: TimelineEvent[];
}

// Demo parcels around Dehradun, Uttarakhand (fictional shapes on OSM)
export const demoParcels: DemoParcel[] = [
  {
    id: "demo-parcel-001",
    khasra_number: "124/2",
    survey_number: "124",
    village: "Rampur",
    tehsil: "Sadar",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "0.84",
    area_unit: "hectare",
    classification: "Agricultural",
    owner: "Ram Singh",
    owner_hindi: "राम सिंह",
    status: "verified",
    confidence: 94,
    health_score: 92,
    document_count: 3,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.025, 30.325],
        [78.028, 30.325],
        [78.029, 30.322],
        [78.027, 30.320],
        [78.024, 30.321],
        [78.023, 30.323],
        [78.025, 30.325],
      ]],
    },
    timeline: [
      { year: "2018", title: "📄 Original Khasra Entry", description: "Owner: Ram Singh, Area: 0.84 ha", document: "Khasra Register 2018" },
      { year: "2021", title: "📝 Mutation Recorded", description: "Previous Owner: Ram Singh → New Owner: Mohan Singh, Mutation #48392", document: "Mutation Register 2021" },
      { year: "2022", title: "📋 Updated Record", description: "Owner: Mohan Singh, Area confirmed: 0.84 ha", document: "Khatauni 2022" },
      { year: "2026", title: "✓ Digital Record", description: "Digitized and verified. Status: VERIFIED", document: "BhumiDrishti Record" },
    ],
  },
  {
    id: "demo-parcel-002",
    khasra_number: "125",
    survey_number: "125",
    village: "Rampur",
    tehsil: "Sadar",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "1.20",
    area_unit: "hectare",
    classification: "Agricultural",
    owner: "Sita Devi",
    owner_hindi: "सीता देवी",
    status: "needs_review",
    confidence: 72,
    health_score: 68,
    document_count: 1,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.030, 30.326],
        [78.034, 30.327],
        [78.035, 30.324],
        [78.033, 30.322],
        [78.030, 30.323],
        [78.030, 30.326],
      ]],
    },
    timeline: [
      { year: "2019", title: "📄 Khasra Entry", description: "Owner: Sita Devi, Area: 1.20 ha", document: "Khasra Register 2019" },
      { year: "2026", title: "⏳ Pending Review", description: "Handwritten name — verification required", document: "BhumiDrishti Record" },
    ],
  },
  {
    id: "demo-parcel-003",
    khasra_number: "126/1",
    survey_number: "126",
    village: "Rampur",
    tehsil: "Sadar",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "0.72",
    area_unit: "hectare",
    classification: "Residential",
    owner: "Mohan Lal",
    owner_hindi: "मोहन लाल",
    status: "conflict",
    confidence: 88,
    health_score: 55,
    document_count: 2,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.020, 30.318],
        [78.023, 30.319],
        [78.024, 30.316],
        [78.022, 30.314],
        [78.019, 30.315],
        [78.020, 30.318],
      ]],
    },
    conflict: {
      type: "Area Mismatch",
      historical_value: "0.84 hectare (Khasra 2018)",
      current_value: "0.72 hectare (Current Record)",
      rule_id: "BUS_003",
    },
    timeline: [
      { year: "2018", title: "📄 Original Entry", description: "Owner: Mohan Lal, Area: 0.84 ha", document: "Khasra Register 2018" },
      { year: "2023", title: "📝 Updated Record", description: "Area changed to 0.72 ha — MISMATCH", document: "Revenue Record 2023" },
      { year: "2026", title: "⚠ Conflict Detected", description: "Area inconsistency across records", document: "BhumiDrishti Record" },
    ],
  },
  {
    id: "demo-parcel-004",
    khasra_number: "127",
    survey_number: "127",
    village: "Kalsi",
    tehsil: "Kalsi",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "2.50",
    area_unit: "hectare",
    classification: "Agricultural",
    owner: "Geeta Rawat",
    owner_hindi: "गीता रावत",
    status: "verified",
    confidence: 96,
    health_score: 95,
    document_count: 4,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.035, 30.330],
        [78.040, 30.332],
        [78.042, 30.328],
        [78.039, 30.326],
        [78.036, 30.327],
        [78.035, 30.330],
      ]],
    },
  },
  {
    id: "demo-parcel-005",
    khasra_number: "128/3",
    survey_number: "128",
    village: "Kalsi",
    tehsil: "Kalsi",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "0.45",
    area_unit: "hectare",
    classification: "Commercial",
    owner: "Vikram Negi",
    owner_hindi: "विक्रम नेगी",
    status: "low_confidence",
    confidence: 62,
    health_score: 48,
    document_count: 1,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.043, 30.331],
        [78.046, 30.332],
        [78.047, 30.329],
        [78.045, 30.328],
        [78.043, 30.329],
        [78.043, 30.331],
      ]],
    },
    timeline: [
      { year: "2020", title: "📄 Faded Document", description: "Owner: Vikram Negi (?), Area: 0.45 ha — low confidence", document: "Scanned Record 2020" },
      { year: "2026", title: "? Low Confidence", description: "Handwritten name barely readable — confidence 62%", document: "BhumiDrishti Record" },
    ],
  },
  {
    id: "demo-parcel-006",
    khasra_number: "200",
    survey_number: "200",
    village: "Rishikesh",
    tehsil: "Rishikesh",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "3.10",
    area_unit: "hectare",
    classification: "Forest",
    owner: "Government of Uttarakhand",
    status: "verified",
    confidence: 98,
    health_score: 97,
    document_count: 5,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.050, 30.340],
        [78.055, 30.342],
        [78.058, 30.338],
        [78.056, 30.335],
        [78.052, 30.334],
        [78.049, 30.337],
        [78.050, 30.340],
      ]],
    },
  },
  {
    id: "demo-parcel-007",
    khasra_number: "201/A",
    survey_number: "201",
    village: "Rishikesh",
    tehsil: "Rishikesh",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "0.33",
    area_unit: "hectare",
    classification: "Residential",
    owner: "Priya Sharma",
    owner_hindi: "प्रिया शर्मा",
    status: "pending",
    confidence: 78,
    health_score: 74,
    document_count: 2,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.060, 30.339],
        [78.062, 30.340],
        [78.063, 30.338],
        [78.061, 30.337],
        [78.060, 30.339],
      ]],
    },
  },
  {
    id: "demo-parcel-008",
    khasra_number: "303",
    survey_number: "303",
    village: "Mussoorie",
    tehsil: "Mussoorie",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "0.15",
    area_unit: "hectare",
    classification: "Commercial",
    owner: "Rajesh Kumar",
    owner_hindi: "राजेश कुमार",
    status: "conflict",
    confidence: 85,
    health_score: 52,
    document_count: 3,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.066, 30.345],
        [78.068, 30.346],
        [78.069, 30.344],
        [78.067, 30.343],
        [78.066, 30.345],
      ]],
    },
    conflict: {
      type: "Ownership Mismatch",
      historical_value: "Rajesh Kumar (Sale Deed 2019)",
      current_value: "Suresh Kumar (Mutation 2023)",
      rule_id: "CRX_002",
    },
    timeline: [
      { year: "2015", title: "📄 Original Record", description: "Owner: Rajesh Kumar", document: "RoR 2015" },
      { year: "2019", title: "📝 Sale Deed", description: "Sold to Suresh Kumar", document: "Sale Deed 2019" },
      { year: "2023", title: "📝 Mutation", description: "Mutation to Suresh Kumar, but record still shows Rajesh", document: "Mutation 2023" },
      { year: "2026", title: "⚠ Ownership Conflict", description: "Current record owner doesn't match latest mutation", document: "BhumiDrishti Record" },
    ],
  },
  {
    id: "demo-parcel-009",
    khasra_number: "450/B",
    survey_number: "450",
    village: "Doiwala",
    tehsil: "Doiwala",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "5.00",
    area_unit: "hectare",
    classification: "Agricultural",
    owner: "Bhagwan Das",
    owner_hindi: "भगवान दास",
    status: "verified",
    confidence: 91,
    health_score: 89,
    document_count: 2,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.015, 30.310],
        [78.022, 30.312],
        [78.025, 30.308],
        [78.023, 30.304],
        [78.018, 30.303],
        [78.014, 30.306],
        [78.015, 30.310],
      ]],
    },
  },
  {
    id: "demo-parcel-010",
    khasra_number: "500",
    survey_number: "500",
    village: "Herbertpur",
    tehsil: "Vikasnagar",
    district: "Dehradun",
    state: "Uttarakhand",
    area: "1.75",
    area_unit: "hectare",
    classification: "Agricultural",
    owner: "Kamla Devi",
    owner_hindi: "कमला देवी",
    status: "incomplete",
    confidence: 55,
    health_score: 35,
    document_count: 1,
    geometry_type: "demo",
    geometry_source: "DEMO seed data",
    availability_class: "A",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [77.990, 30.360],
        [77.995, 30.362],
        [77.998, 30.358],
        [77.994, 30.356],
        [77.990, 30.360],
      ]],
    },
    timeline: [
      { year: "2017", title: "📄 Damaged Document", description: "Water-damaged Khasra — many fields unreadable", document: "Khasra Register 2017" },
      { year: "2026", title: "░ Incomplete", description: "Too many missing fields to validate", document: "BhumiDrishti Record" },
    ],
  },
];
