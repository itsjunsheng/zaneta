import type {
  Concept,
  CoachChatMessage,
  CoachChatResponse,
  LearningTwinResponse,
  StrategyArenaResponse,
  StrategyPlanInput,
  StudentState
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getConcepts: () => request<Concept[]>("/concepts"),
  getStudentState: () => request<StudentState[]>("/student-state"),
  getLearningTwin: () => request<LearningTwinResponse>("/learning-twin"),
  postInteraction: (body: {
    conceptId: string;
    correct: boolean;
    responseTime: number;
    errorType?: string;
    timestamp?: string;
  }) =>
    request("/interactions", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getRecommendations: () =>
    request<{
      recommendations: LearningTwinResponse["recommendations"];
      coach: LearningTwinResponse["coach"];
      explanation: string;
    }>(
      "/recommendations"
    ),
  postCoachChat: (body: { message: string; history: CoachChatMessage[] }) =>
    request<CoachChatResponse>("/coach/chat", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  postStrategyArena: (body?: { days?: number; plans?: StrategyPlanInput[] }) =>
    request<StrategyArenaResponse>("/strategy-arena", {
      method: "POST",
      body: JSON.stringify(body ?? {})
    })
};
