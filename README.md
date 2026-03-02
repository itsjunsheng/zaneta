# Digital Learning Twin

## 1. Project Overview
Digital Learning Twin is a full-stack web app that analyzes student performance data from an uploaded Excel file and turns it into actionable learning insights.

It solves a common problem in education: raw test scores are hard to interpret for planning. The system converts assessment history into three core learning metrics and then generates goal-based study recommendations.

### Main Objectives
- Convert spreadsheet assessment data into meaningful learning analytics.
- Track student progress using clear metrics:
  - Accuracy Over Time
  - Time to Mastery
  - Retention Ability
- Let users set a target goal (score, timeline, weekly study hours).
- Generate personalized study habits using OpenAI (with fallback logic if AI is unavailable).

## 2. Technical Details
### Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS + Chart.js (`react-chartjs-2`)
- Backend: Node.js + Express + TypeScript
- File parsing: `xlsx`
- Upload handling: `multer`
- AI integration: OpenAI Node SDK
- Storage: In-memory profile store (no database)

### Architecture
- `frontend` handles file upload UI, visualization, goal setting, and recommendation rendering.
- `backend` handles parsing, analytics computation, AI generation, and API responses.

### Key Backend Components
- `services/excelParser.ts`
  - Parses `.xlsx/.xls` rows with flexible column aliases.
  - Supports columns like `Grade`, `Difficulty`, `Topic`, `Timestamp`.
- `services/learningAnalyzer.ts`
  - Computes all analytics and topic insights.
- `services/openaiCoach.ts`
  - Calls OpenAI to produce recommendation cards.
  - Returns `source: ai | fallback` so frontend knows if AI was actually used.
- `services/studyPlanner.ts`
  - Deterministic fallback recommendation engine.
- `routes/api.ts`
  - Exposes upload/profile/recommendation endpoints.

### Metric Logic (Current Implementation)
- Accuracy Over Time:
  - Monthly average performance trend from assessment history.
  - Topic score reflects sustained performance (mean with volatility penalty).
- Time to Mastery:
  - Days from first attempt in a topic until mastery threshold is reached.
  - Mastery threshold currently uses hard-topic performance rule in analyzer logic.
- Retention Ability:
  - Evaluated using same-topic attempts separated by 30+ days.
  - If score is maintained/improved after long gaps -> higher retention.
  - If score drops after long gaps -> lower retention.

### Workflow
1. User uploads Excel file.
2. Backend parses rows and computes analytics.
3. Frontend shows charts + topic table.
4. User sets goal and clicks generate.
5. Backend calls OpenAI for recommendations.
6. If OpenAI fails/unavailable, fallback recommendations are returned.

## 3. Setup and Installation Instructions
### Prerequisites
- Node.js 20+ (22.12+ recommended for latest Vite compatibility)
- npm

### Backend Setup
```bash
cd backend
npm install
copy .env.example .env
```

Set env values in `backend/.env`:
```env
PORT=4000
OPENAI_API_KEY=your_openai_key_here
```

Run backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
```

Set frontend env in `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000
```

Run frontend:
```bash
npm run dev
```

### Build Commands
```bash
# backend
cd backend
npm run build

# frontend
cd frontend
npm run build
```

## 4. Usage Instructions
1. Open the frontend app.
2. Upload an Excel file containing assessment records.
3. Review dashboard outputs:
   - KPI cards
   - Accuracy Over Time chart
   - Time to Mastery chart
   - Topic Insights table
   - Retention Ability radar chart
4. Set goal inputs:
   - Target Score
   - Time Horizon (months)
   - Weekly Study Hours
5. Click **Generate Recommendations**.
6. Read generated recommendation cards and check source badge:
   - `Source: OpenAI model` means AI-generated.
   - `Source: Fallback rules` means fallback logic was used.

### Excel Input Notes
The parser accepts flexible header names. Typical columns:
- Topic / Subject / Paper
- Grade / Score
- Difficulty (`Easy`, `Medium`, `Hard`)
- Timestamp / Date

## 5. Challenges Faced
- **Messy spreadsheet formats:**
  - Different users name columns differently.
  - Solved with alias-based column parsing and safe defaults.
- **Interpretable metric definitions:**
  - Needed formulas that match education meaning, not just raw trend math.
  - Solved with explicit topic/time-gap-based metric logic.
- **AI reliability in hackathon environments:**
  - API quota or key issues can break generation.
  - Solved with fallback engine + source visibility in UI.
- **Recommendation flow clarity:**
  - Users need goal-first generation behavior.
  - Solved by separating upload analysis from recommendation generation.

## 6. Future Improvements or Features
- Add user authentication and profile persistence (database-backed).
- Add per-student history snapshots and versioned uploads.
- Add richer explainability panel for each metric formula.
- Add confidence scores and uncertainty bands for recommendations.
- Add export (PDF/CSV) for teacher/student reports.
- Add cohort benchmarking (compare against class averages).

## 7. Credits and References
- OpenAI API and SDK documentation
- Chart.js and `react-chartjs-2` documentation
- Express and Vite official docs
- XLSX (`sheetjs`) documentation

## 8. Conclusion
Digital Learning Twin transforms raw assessment spreadsheets into clear, interpretable learning analytics and goal-driven study guidance. It demonstrates a practical AI-assisted workflow for personalized education planning, with robust fallback behavior for real-world reliability during hackathon demos.
