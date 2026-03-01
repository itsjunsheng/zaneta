import { Concept, Interaction, LearningTimelineEvent, StudentState } from "./types";

export interface InMemoryStore {
  concepts: Concept[];
  studentStates: StudentState[];
  interactions: Interaction[];
  timelineEvents: LearningTimelineEvent[];
}

export const db: InMemoryStore = {
  concepts: [],
  studentStates: [],
  interactions: [],
  timelineEvents: []
};
