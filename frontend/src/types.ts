export type Concept = {
  id: string;
  name: string;
  prerequisites: string[];
};

export type StudentState = {
  conceptId: string;
  mastery: number;
  lastPracticedAt: string;
  attempts: number;
  correct: number;
  avgResponseTime: number;
  retention: number;
  effectiveMastery: number;
  confidence: number;
  uncertainty: number;
};

export type Misconception = {
  conceptId: string;
  errorType: string;
  count: number;
};

export type Recommendation = {
  conceptId: string;
  conceptName: string;
  score: number;
  reason: string;
};

export type InterventionPlan = {
  conceptId: string;
  title: string;
  steps: string[];
};

export type TimelineEvent = {
  timestamp: string;
  conceptId: string;
  masteryDelta: number;
  retentionDelta: number;
  effectiveMasteryDelta: number;
  recommendationShift: number | null;
};

export type ProjectionSummary = {
  baselineReadiness: number;
  projectedReadiness: number;
  expectedImprovement: number;
  assumptions: string;
};

export type CoachResponse = {
  message: string;
  bullets: string[];
  source: "openai" | "template";
};

export type CoachChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CoachChatResponse = {
  reply: string;
  source: "openai" | "template";
};

export type LearningPersona = {
  momentum: number;
  resilience: number;
  efficiency: number;
  label: string;
  summary: string;
};

export type StrategyPlanInput = {
  id: string;
  name: string;
  focusConceptIds: string[];
  sessionsPerDay: number;
  accuracyBias: number;
};

export type StrategyPlanResult = {
  id: string;
  name: string;
  projectedReadiness: number;
  expectedImprovement: number;
  trajectory: { day: number; readiness: number }[];
};

export type StrategyArenaResponse = {
  baselineReadiness: number;
  results: StrategyPlanResult[];
  winnerId: string;
  winnerReason: string;
};

export type LearningTwinResponse = {
  conceptGraph: Concept[];
  studentState: StudentState[];
  concepts: {
    id: string;
    mastery: number;
    retention: number;
    effectiveMastery: number;
    confidence: number;
    uncertainty: number;
  }[];
  misconceptions: Misconception[];
  recommendations: Recommendation[];
  interventions: InterventionPlan[];
  timeline: TimelineEvent[];
  projection: ProjectionSummary;
  persona: LearningPersona;
  coach: CoachResponse;
  explanation: string;
};
