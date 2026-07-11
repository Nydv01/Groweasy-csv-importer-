# GrowEasy AI-Powered CSV Importer

A high-performance, production-grade AI-powered CSV Importer that intelligently extracts, structures, and maps CRM lead information from any arbitrary CSV format into the standardized GrowEasy CRM layout. 

Designed with modern typography, smooth animations, and robust system engineering, the application supports large uploads, displays real-time progress, and runs reliable processing pipelines with fail-safes.

---

## 🚀 Live Demo & Repository
- **GitHub Repository**: [GitHub Repository URL]
- **Hosted Application**: [Hosted Application URL]

---

## ✨ Features

### Frontend (Premium UI/UX)
- **Drag & Drop & File Picker**: Instantly drop files up to 50MB. Local parsing happens on-the-fly.
- **60 FPS Virtualized Tables**: Uses `@tanstack/react-virtual` to display and scroll up to 10,000+ rows smoothly with sticky headers.
- **Fail-Safe Confirmation**: Clear preview of parsing data and field tokens before any backend call. No data is sent to AI without user consent.
- **Interactive AI progress**: Watch AI reason through columns, map field properties, and parse batches in real-time.
- **Results Inspection & Filter**: Filter processed rows by CRM status or source. Direct copy-to-clipboard on any table cell.
- **Light & Dark Mode**: Seamless theme switching that syncs with system preferences and persists in local storage.

### Backend (Reliable Processing Architecture)
- **Intelligent Field Mapping**: First inspects CSV headers and sample data using Gemini 2.5 Flash to construct a semantic mapping schema.
- **Fail-Safe Processing Pipeline**: Processes rows in batches of 50. Uses Server-Sent Events (SSE) to push status updates down to the UI.
- **Exponential Backoff & Jitter**: Automatic retry mechanism (up to 3 attempts) with exponential backoff and randomized jitter to handle rate limits or API hiccups gracefully.
- **Sanitization & Skip Heuristics**: Automatically cleans phone numbers (removes spaces, parses country codes), sanitizes emails, maps status values to enums, and skips invalid leads containing neither email nor mobile.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 16 (App Router), TailwindCSS, Framer Motion, Papaparse, `@tanstack/react-virtual`
- **Backend**: Next.js Route Handlers (stateless in-memory job store, Supabase-ready)
- **AI Integration**: Google Gemini 2.5 Flash via official `@google/genai` SDK
- **Testing**: Jest, `ts-jest`
- **Deployment**: Vercel / Docker

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js v18.x or v20.x
- Google Gemini API Key (Get one from Google AI Studio)

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) Supabase integration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Local Installation
```bash
# Clone the repository
git clone <repo-url>
cd csv-importer

# Install dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Production Build
```bash
npm run build
npm start
```

### 5. Running Containerized with Docker
Run the complete application locally inside Docker:
```bash
# Set environment variable and run
export GEMINI_API_KEY=your_gemini_api_key_here
docker compose up --build
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 6. Running Tests
```bash
npm test
```

---

## 🧠 AI Prompt Engineering & Decisions

### Phase 1: Structural Schema Inference
Before processing records, the importer sends the CSV headers and the first few rows to Gemini. The model returns a structured JSON map that links source columns to target CRM fields. This avoids sending mapping instructions with every row, drastically reducing token consumption and latency.

### Phase 2: Batch Lead Extraction
Leads are parsed in parallel batches of 50. The extraction prompt utilizes the mapping plan generated in Phase 1. The prompt instructs the model to return a structured JSON array matching this format:
```json
[
  {
    "source_row_index": 0,
    "status": "success",
    "record": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "country_code": "91",
      "mobile_without_country_code": "9876543210",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Alt email: john.work@example.com"
    },
    "skip_reason": null,
    "mapping_notes": "Mapped full name and primary phone."
  }
]
```

### Data Normalization Heuristics
AI can sometimes output slightly irregular phone numbers or email strings. Our backend runs secondary deterministic regex cleaners and validators (e.g., standardizing mobile numbers to 10 digits and mapping statuses like "Interested" -> `GOOD_LEAD_FOLLOW_UP`). It strictly filters out any rows that lack both an email and a phone number.
