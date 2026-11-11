# भू-दृष्टि | Bhoo-Drishti

**National Land Records Modernization Portal (DILRMP — SIH 26018)**

Bhoo-Drishti is a Next.js web application for AI-assisted digitization, deterministic validation, officer verification, and GIS visualization of Indian land records (such as Record of Rights / RoR, Khasra, Jamabandi, Khatauni, Mutation Registers, and Sale Deeds).

---

## Features

- **Multimodal Document Extraction (`/upload`):** Converts uploaded PDFs and scanned images into page images (`utils/pdfToImage.ts`) and extracts structured `CanonicalLandRecord` JSON (`lib/ai/landExtractor.ts`) with field-level confidence scores, page region metadata, text-type classification, and bilingual/romanized owner names.
- **Pluggable Vision LLM Providers (`lib/ai/provider.ts`):**
  - **Google AI Studio** (`gemini-3.6-flash`, default)
  - **Groq** (`qwen/qwen3.6-27b`)
- **Deterministic Validation Engine (`lib/validation/engine.ts`):** Rule-based checks for required identifiers (`village`, `district`, `survey_number`, `area`, `owners`), format validation, and record health score calculation.
- **Role-Based Verification & Audit Trail (`/verify`, `/records/[id]`, `/audit`):** Supports switching between **District Admin (DRO)** and **Revenue Officer / Auditor (RO)** roles (`lib/context/roleContext.tsx`) with server-side enforcement on `PATCH /api/records/[id]` for record approval, rejection, and field updates.
- **Interactive GIS Land Twin Map (`/gis`):** Built with Leaflet & React-Leaflet (`components/gis/LandTwinMap.tsx`) featuring parcel polygon overlays, search, status filtering (verified, needs review, conflict, low confidence, incomplete), and parcel inspection.
- **Analytics Dashboard & Document Repository (`/`, `/records`, `/documents`):** Visualizes document types, languages, confidence metrics, and verification status using Recharts.
- **Zero-Database Demo Mode (`lib/db/mockStore.ts`, `lib/db/seedData.ts`):** Uses an in-memory store auto-seeded with sample land records on startup so the portal runs immediately without external database setup. *(Note: runtime uploads and edits reset when the server restarts.)*

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **UI & Styling:** UX4G (`ux4g-web-components`), Tailwind CSS v4, Lucide React, Recharts
- **GIS / Mapping:** Leaflet, React-Leaflet
- **PDF & Image Handling:** `pdfjs-dist`, `pdftoimg-js`
- **AI SDKs:** `@google/genai`, `groq-sdk`

---

## Getting Started

### 1. Prerequisites
- **Node.js** 20+ (tested on Node.js 22)
- **npm**
- An API key from **Google AI Studio** or **Groq** (required for live document extraction on `/upload`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your API key(s):

```env
# Choose "google" (default) or "groq"
LLM_PROVIDER=groq

GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key
GROQ_API_KEY=your_groq_api_key

# Optional password value if AuthWrapper is enabled
NEXT_PUBLIC_AUTH_PASSWORD=your_password
```

| Variable | Description |
| :--- | :--- |
| `LLM_PROVIDER` | `"groq"` uses `qwen/qwen3.6-27b`; any other value or unset defaults to Google (`gemini-3.6-flash`). |
| `GOOGLE_AI_STUDIO_API_KEY` | Required when `LLM_PROVIDER` is `"google"` (or unset). |
| `GROQ_API_KEY` | Required when `LLM_PROVIDER` is `"groq"`. |
| `NEXT_PUBLIC_AUTH_PASSWORD` | Used by `components/AuthWrapper.tsx` if mounted. |

### 4. Run Locally
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Available Scripts

- `npm run dev` — Start the Next.js development server
- `npm run build` — Build the production bundle
- `npm run start` — Run the production build
- `npm run lint` — Run ESLint

---

## Routes & API Endpoints

### Pages
- `/` — Analytics Dashboard
- `/upload` — Upload & AI Extraction Pipeline
- `/records` — Searchable Land Records Registry
- `/records/[id]` — Detailed Record View, Provenance & Field Editing
- `/verify` — Officer Verification Queue / Log
- `/documents` — Uploaded Document Repository
- `/gis` — Interactive Digital Land Twin Map
- `/audit` — System Audit Trail

### API Routes
- `GET /api/dashboard` — Aggregate dashboard statistics (auto-seeds demo data)
- `POST /api/extract` — Extract, validate, score, and store a land record from page images
- `GET /api/documents` — List uploaded/seeded source documents
- `GET /api/records` — List and filter land records (`status`, `district`, `village`, `q`)
- `GET /api/records/[id]` — Fetch a single canonical land record and health score
- `PATCH /api/records/[id]` — Verify, reject, or update record fields

---

## Project Structure

```text
├── app/                  # Next.js App Router pages, layout, global CSS, and API routes
├── components/           # UI shell (GovHeader, Sidebar, GovFooter), GIS map, extraction views
├── lib/
│   ├── ai/               # Pluggable AI provider & land record extraction prompt/mapper
│   ├── context/          # Role switcher context (Admin / Officer)
│   ├── db/               # In-memory store & demo seed data
│   ├── gis/              # Sample geo-parcel polygons and GIS data
│   └── validation/       # Deterministic rule-based validation & health scoring
├── public/               # Static assets & PDF.js worker scripts
└── utils/                # PDF-to-image conversion, LLM client helper, Zod/TS schemas
```

---

## License

Licensed under the [MIT License](LICENSE).
