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

export type LearningTwinResponse = {
  concepts: {
    id: string;
    mastery: number;
    retention: number;
    effectiveMastery: number;
  }[];
  misconceptions: Misconception[];
  recommendations: Recommendation[];
  explanation: string;
};
