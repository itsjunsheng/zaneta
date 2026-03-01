# Learning Twin 2.0 (Hackathon MVP)

Learning Twin is now a **Predictive Study Copilot**: it not only tracks mastery, but also simulates competing study strategies and delivers mission-style coaching.

## Features

- Bayesian Knowledge Tracing-style mastery updates
- Exponential forgetting/retention modeling
- Effective mastery (`mastery * retention`) tracking
- Misconception detection from repeated error types
- Recommendation engine for top next concepts
- OpenAI-backed interactive AI coach chat (with deterministic fallback)
- **Strategy Arena**: A/B/C study-plan duel with projected readiness trajectories
- **Learning Persona**: momentum, resilience, efficiency fingerprint
- **Mission Simulator**: batch interaction scenarios (recovery, fluency, exam pressure)
- Concept dependency graph with mastery/risk encoding
- What-changed timeline (delta after each interaction)
- Intervention mode plans for flagged misconceptions
- Confidence/uncertainty per concept
- 7-day readiness projection metric

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind + Recharts + React Flow
- Backend: Node.js + Express + TypeScript + in-memory store

## Project Structure

```text
/backend
  server.ts
  learningModel.ts
  seed.ts
  /routes
    api.ts
  /models
    store.ts
    types.ts

/frontend
  /src
    /api
    /components
    /hooks
    /pages
```

## Seeded Concept Graph

- Fractions -> Ratios -> Proportional Reasoning -> Algebra Readiness

Initial mastery:

- Fractions: 0.8
- Ratios: 0.4
- Proportional Reasoning: 0.2
- Algebra Readiness: 0.1

## API Endpoints

- `GET /concepts`
- `GET /student-state`
- `POST /interactions`
- `GET /recommendations`
- `GET /learning-twin`
- `POST /strategy-arena`
- `POST /coach/chat`
- `GET /health`

Example interaction:

```json
{
  "conceptId": "Ratios",
  "correct": false,
  "responseTime": 14,
  "errorType": "numerator_denominator_confusion"
}
```

## Run Locally

### 1) Start backend

```bash
cd backend
npm install
# copy env template and set your key
copy .env.example .env
npm run dev
```

Backend default URL: `http://localhost:4000`

Backend env vars:

- `OPENAI_API_KEY`: optional, enables live LLM coach
- `OPENAI_MODEL`: optional, defaults to `gpt-4o-mini`
- `PORT`: optional, defaults to `4000`

### 2) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

If needed, set a custom backend URL:

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:4000
```

## Demo Flow

1. Open Mission Control and show the **Learning Persona** card.
2. Run **Strategy Arena** and explain why the winning plan beats alternatives.
3. Trigger **Mission Simulator** scenarios and show timeline/recommendation shifts.
4. Ask the **AI Coach chat** tactical follow-up questions.
5. Highlight interventions and forgetting-risk signals as actionable outputs.

## Notes

- This MVP intentionally favors deterministic, explainable logic over model complexity.
- No authentication is included.
- Data is reset on backend restart (in-memory store).
- If OpenAI is unavailable or key is missing, AI Coach automatically falls back to template logic.
