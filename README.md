# XTract

An edge-friendly next.js webapp to extract structured data from scanned invoices/challans & export them into spreadsheets using lightweight vLLMs.

<img width="1867" height="918" alt="image" src="https://github.com/user-attachments/assets/13d1bfc0-8c6e-494f-a152-1fe4f6a4ac6d" />

## Description

XTract lets users upload a PDF or image of an invoice or challan, converts the document into images, sends them to an AI extraction endpoint, and returns structured JSON data with the option to download the result as Excel.

## Features

- Industry-grade invoice and challan extraction
- PDF / image upload support
- Implicit conversion of documents into images for AI processing (prevents context loss)
- Uses lightweight vLLMs to parse document fields into structured JSON
- Displays extracted data in the browser
- Download results as an Excel file (spreadsheet)
- Supports Google AI Studio and GROQ as backend providers
- Simple client-side password gate to prevent unauthorized access to webapp (not much reliable but better than nothing, unless you want your api keys to be milked)
- Deployable on the edge (no filesystem/database dependency), even on free tiers (hosting + llms)

## vLLMs Used

All you need is an LM that is multimodal & is sane enough for simple reasoning (instruction fine-tuned). Why waste compute over simple OCR job? Currently, the code employs these two models based on your inference provider choice.

| Provider           | Model                                       | Multimodal   | Parameter Count   |
|:------------------:|:-------------------------------------------:|:------------:|:-----------------:|
| Google AI Studio   | gemma-4-31b-it                              | Yes          | 31B               |
| GROQ               | qwen/qwen3.6-27b                            | Yes          | 27B               |


## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file at the project root.
3. Add required environment variables (see below).
4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000` in your browser.

## Environment Variables

Create `.env.local` with the keys below (an `.env.example` is present at the project root):

- `GOOGLE_AI_STUDIO_API_KEY` - required for the default Google AI backend
- `GROQ_API_KEY` - required only if using GROQ as the AI provider
- `LLM_PROVIDER` - optional; set to `groq` to use GROQ, otherwise the app defaults to Google
- `NEXT_PUBLIC_AUTH_PASSWORD` - required; a simple plaintext password to prevent unauthorized access to webapp

Example:

```env
GOOGLE_AI_STUDIO_API_KEY=your_google_api_key_here
LLM_PROVIDER=google
NEXT_PUBLIC_AUTH_PASSWORD=1010
```

or

```env
GROQ_API_KEY=your_groq_api_key_here
LLM_PROVIDER=groq
NEXT_PUBLIC_AUTH_PASSWORD=1010
```

## How it Works

- The home page links to `/invoice` and `/challan` extractors.
- `DocumentExtractor` accepts a user-uploaded file.
- `utils/pdfToImage.ts` converts PDFs and images into base64 images.
- `utils/llmParser.ts` sends the image data to `/api/extract`.
- The API route builds a schema-aware prompt and calls the configured LLM provider.
- The returned JSON is rendered by `ResultDisplay` and can be downloaded as Excel.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - build production app
- `npm run start` - start the built app
- `npm run lint` - run ESLint

## Notes

- Make sure your AI API keys are valid and have access to the selected provider.
- While the app ensures most challans/invoices are able to be processed due to a robust output schema, some might still require schema tuning for custom formats.
