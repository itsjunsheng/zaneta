# Digital Learning Twin

## 1. Project Overview
Digital Learning Twin is a full-stack learning analytics app where students log in and immediately see their personalized learning dashboard.

Instead of relying on ad-hoc Excel uploads in the UI, student stats are stored in Supabase and loaded per authenticated account. Students can then generate an AI-powered study report on demand.

### Main Objectives
- Convert assessment history into meaningful learning analytics.
- Track student progress using core metrics:
  - Accuracy Over Time
  - Time to Mastery
  - Retention Ability
- Let students set target goals (score, timeline, weekly study hours).
- Generate personalized study recommendations using OpenAI, with deterministic fallback logic when AI is unavailable.

## 2. Technical Details

### Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS + Chart.js (`react-chartjs-2`)
- Backend: Node.js + Express + TypeScript
- Auth + Database: Supabase Auth + Supabase Postgres
- AI Integration: OpenAI Node SDK
- Spreadsheet parsing (optional bootstrap import path): `xlsx`

### Architecture
- `frontend`:
  - Handles Supabase login/signup.
  - Loads current student dashboard via authenticated API calls.
  - Triggers report generation only when user clicks **Generate Report**.
- `backend`:
  - Verifies Supabase access tokens.
  - Reads/writes student profiles from `student_profiles` table.
  - Computes analytics and generates recommendations (AI + fallback).

### Key Backend Components
- `middleware/auth.ts`
  - Validates `Authorization: Bearer <token>` via Supabase Auth.
- `storage/studentStore.ts`
  - Persists student profiles to Supabase (`student_profiles`).
- `services/learningAnalyzer.ts`
  - Computes the three core metrics and cognitive profile.
- `services/openaiCoach.ts`
  - Calls OpenAI for tailored recommendation cards.
  - Falls back to rule-based recommendations if needed.
- `services/studyPlanner.ts`
  - Rule-based recommendation engine.
- `routes/api.ts`
  - `GET /student/profile` (auth required)
  - `GET /recommendations` (auth required)
  - `POST /upload` (auth required, optional bootstrap import)

## 3. Setup and Installation

### Prerequisites
- Node.js 20+ (20.19+ recommended for Vite 7)
- npm
- Supabase project

### 3.1 Create Supabase Schema
Run this SQL in your Supabase SQL editor:

`backend/supabase/schema.sql`

### 3.2 Backend Setup
```bash
cd backend
npm install
copy .env.example .env
```

Set `backend/.env`:
```env
PORT=4000
OPENAI_API_KEY=your_openai_key_here
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Run backend:
```bash
npm run dev
```

### 3.3 Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
```

Set `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run frontend:
```bash
npm run dev
```

## 4. Usage Flow
1. Student opens the app and logs in (or signs up).
2. Dashboard loads stored stats from Supabase automatically.
3. Student reviews KPIs + charts:
   - Accuracy Over Time
   - Time to Mastery
   - Retention Ability
4. Student sets goals:
   - Target Score
   - Time Horizon (months)
   - Weekly Study Hours
5. Student clicks **Generate Report**.
6. Backend returns recommendations with source:
   - `ai` (OpenAI generated)
   - `fallback` (rule-based fallback)

## 5. Notes
- `POST /upload` still exists as an authenticated bootstrap path for importing an Excel workbook into a user account profile.
- The student-facing UI no longer depends on manual file upload.

## 6. Build Commands
```bash
# backend
cd backend
npm run build

# frontend
cd frontend
npm run build
```
