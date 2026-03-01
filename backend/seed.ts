import { db } from "./models/store";
import { Concept, StudentState } from "./models/types";

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

const concepts: Concept[] = [
  { id: "Fractions", name: "Fractions", prerequisites: [] },
  { id: "Ratios", name: "Ratios", prerequisites: ["Fractions"] },
  {
    id: "ProportionalReasoning",
    name: "Proportional Reasoning",
    prerequisites: ["Ratios"]
  },
  {
    id: "AlgebraReadiness",
    name: "Algebra Readiness",
    prerequisites: ["ProportionalReasoning"]
  }
];

const studentStates: StudentState[] = [
  {
    conceptId: "Fractions",
    mastery: 0.8,
    lastPracticedAt: daysAgo(1),
    attempts: 12,
    correct: 10,
    avgResponseTime: 8.2
  },
  {
    conceptId: "Ratios",
    mastery: 0.4,
    lastPracticedAt: daysAgo(3),
    attempts: 10,
    correct: 4,
    avgResponseTime: 11.6
  },
  {
    conceptId: "ProportionalReasoning",
    mastery: 0.2,
    lastPracticedAt: daysAgo(7),
    attempts: 7,
    correct: 2,
    avgResponseTime: 13.8
  },
  {
    conceptId: "AlgebraReadiness",
    mastery: 0.1,
    lastPracticedAt: daysAgo(10),
    attempts: 5,
    correct: 1,
    avgResponseTime: 15.2
  }
];

export const seedStore = () => {
  db.concepts = concepts;
  db.studentStates = studentStates;
  db.interactions = [];
  db.timelineEvents = [];
};
