export interface Concept {
  id: string;
  name: string;
  prerequisites: string[];
}

export interface StudentState {
  conceptId: string;
  mastery: number;
  lastPracticedAt: string;
  attempts: number;
  correct: number;
  avgResponseTime: number;
}

export interface Interaction {
  conceptId: string;
  correct: boolean;
  responseTime: number;
  timestamp: string;
  errorType?: string;
}

export interface MisconceptionFlag {
  conceptId: string;
  errorType: string;
  count: number;
}

export interface Recommendation {
  conceptId: string;
  conceptName: string;
  score: number;
  reason: string;
}

export interface LearningTwinConceptView {
  id: string;
  mastery: number;
  retention: number;
  effectiveMastery: number;
  confidence: number;
  uncertainty: number;
}

export interface InterventionPlan {
  conceptId: string;
  title: string;
  steps: string[];
}

export interface LearningTimelineEvent {
  timestamp: string;
  conceptId: string;
  masteryDelta: number;
  retentionDelta: number;
  effectiveMasteryDelta: number;
  recommendationShift: number | null;
}

export interface ProjectionSummary {
  baselineReadiness: number;
  projectedReadiness: number;
  expectedImprovement: number;
  assumptions: string;
}

export interface CoachResponse {
  message: string;
  bullets: string[];
  source: "openai" | "template";
}

export interface LearningPersona {
  momentum: number;
  resilience: number;
  efficiency: number;
  label: string;
  summary: string;
}

export interface StrategyPlanInput {
  id: string;
  name: string;
  focusConceptIds: string[];
  sessionsPerDay: number;
  accuracyBias: number;
}

export interface StrategyTrajectoryPoint {
  day: number;
  readiness: number;
}

export interface StrategyPlanResult {
  id: string;
  name: string;
  projectedReadiness: number;
  expectedImprovement: number;
  trajectory: StrategyTrajectoryPoint[];
}
