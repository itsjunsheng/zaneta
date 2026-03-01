import OpenAI from "openai";
import { Concept, CoachResponse, InterventionPlan, MisconceptionFlag, ProjectionSummary, Recommendation, StudentState } from "../models/types";
import { generateExplanation } from "../learningModel";

type CoachInput = {
  studentStates: StudentState[];
  recommendations: Recommendation[];
  misconceptions: MisconceptionFlag[];
  concepts: Concept[];
  interventions: InterventionPlan[];
  projection: ProjectionSummary;
};

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type CoachChatInput = CoachInput & {
  message: string;
  history?: ChatTurn[];
};

const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey ? new OpenAI({ apiKey }) : null;

export const generateTemplateCoachResponse = (input: CoachInput): CoachResponse => {
  const message = generateExplanation(
    input.studentStates,
    input.recommendations,
    input.misconceptions,
    input.concepts
  );

  const bullets = [
    `Next concept: ${input.recommendations[0]?.conceptName ?? "continue practice"}.`,
    `7-day readiness lift estimate: ${(input.projection.expectedImprovement * 100).toFixed(1)} points.`,
    input.misconceptions[0]
      ? `Address ${input.misconceptions[0].errorType.replace(/_/g, " ")} explicitly in drills.`
      : "No strong misconception pattern yet; keep tracking errors."
  ];

  return {
    message,
    bullets,
    source: "template"
  };
};

export const generateCoachResponse = async (input: CoachInput): Promise<CoachResponse> => {
  if (!client) {
    return generateTemplateCoachResponse(input);
  }

  try {
    const promptPayload = {
      recommendations: input.recommendations,
      misconceptions: input.misconceptions,
      projection: input.projection,
      studentStates: input.studentStates.map((state) => ({
        conceptId: state.conceptId,
        mastery: Number(state.mastery.toFixed(3)),
        attempts: state.attempts,
        correct: state.correct
      })),
      interventions: input.interventions
    };

    const prompt = [
      "You are an instructional coach.",
      "Return strict JSON with keys: message (string), bullets (array of exactly 3 short strings).",
      "Keep concise and action-oriented.",
      JSON.stringify(promptPayload)
    ].join("\n");

    const response = await client.responses.create({
      model,
      temperature: 0.3,
      max_output_tokens: 260,
      input: prompt
    });

    const content = response.output_text?.trim();
    if (!content) {
      return generateTemplateCoachResponse(input);
    }

    const parsed = JSON.parse(content) as { message?: string; bullets?: string[] };
    if (!parsed.message || !Array.isArray(parsed.bullets)) {
      return generateTemplateCoachResponse(input);
    }

    return {
      message: parsed.message,
      bullets: parsed.bullets.slice(0, 3),
      source: "openai"
    };
  } catch {
    return generateTemplateCoachResponse(input);
  }
};

const fallbackChatResponse = (input: CoachChatInput): { reply: string; source: "template" | "openai" } => {
  const base = generateTemplateCoachResponse(input);
  return {
    reply: `${base.message} Next action: ${base.bullets[0]} You asked: "${input.message}"`,
    source: "template"
  };
};

export const generateCoachChatResponse = async (
  input: CoachChatInput
): Promise<{ reply: string; source: "template" | "openai" }> => {
  if (!client) {
    return fallbackChatResponse(input);
  }

  try {
    const promptPayload = {
      recommendations: input.recommendations,
      misconceptions: input.misconceptions,
      projection: input.projection,
      interventions: input.interventions,
      studentStates: input.studentStates.map((state) => ({
        conceptId: state.conceptId,
        mastery: Number(state.mastery.toFixed(3)),
        attempts: state.attempts,
        correct: state.correct
      })),
      history: (input.history ?? []).slice(-8),
      message: input.message
    };

    const prompt = [
      "You are an interactive instructional coach for a student dashboard.",
      "Respond in 2-4 concise sentences with practical steps.",
      "Use the provided learner context and keep answers specific.",
      JSON.stringify(promptPayload)
    ].join("\n");

    const response = await client.responses.create({
      model,
      temperature: 0.4,
      max_output_tokens: 260,
      input: prompt
    });

    const content = response.output_text?.trim();
    if (!content) {
      return fallbackChatResponse(input);
    }

    return {
      reply: content,
      source: "openai"
    };
  } catch {
    return fallbackChatResponse(input);
  }
};
