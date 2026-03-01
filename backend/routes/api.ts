import { Router } from "express";
import { db } from "../models/store";
import { Interaction, LearningTimelineEvent } from "../models/types";
import {
  buildLearningPersona,
  buildInterventionPlans,
  confidenceScore,
  forgettingFactor,
  misconceptionDetection,
  projectReadinessInDays,
  recommendNextConcept,
  simulateStrategyArena,
  scoreConceptRecommendations,
  updateMastery
} from "../learningModel";
import {
  generateCoachChatResponse,
  generateCoachResponse,
  generateTemplateCoachResponse
} from "../services/openaiCoach";

const router = Router();

const rankMap = (ranked: { conceptId: string }[]) => {
  return Object.fromEntries(ranked.map((item, index) => [item.conceptId, index + 1]));
};

const getCoachContext = () => {
  const misconceptions = misconceptionDetection(db.interactions);
  const recommendations = recommendNextConcept(db.studentStates, db.concepts);
  const interventions = buildInterventionPlans(misconceptions, db.concepts);
  const projection = projectReadinessInDays(db.studentStates, db.concepts, 7);

  return {
    misconceptions,
    recommendations,
    interventions,
    projection
  };
};

const buildTwinPayload = async (coachMode: "template" | "openai" = "template") => {
  const { misconceptions, recommendations, interventions, projection } = getCoachContext();

  const coachInput = {
    studentStates: db.studentStates,
    recommendations,
    misconceptions,
    concepts: db.concepts,
    interventions,
    projection
  };

  const coach =
    coachMode === "openai"
      ? await generateCoachResponse(coachInput)
      : generateTemplateCoachResponse(coachInput);

  return {
    conceptGraph: db.concepts,
    studentState: db.studentStates.map((entry) => {
      const retention = forgettingFactor(entry.lastPracticedAt);
      const confidence = confidenceScore(entry);
      return {
        ...entry,
        retention: Number(retention.toFixed(4)),
        effectiveMastery: Number((entry.mastery * retention).toFixed(4)),
        confidence: Number(confidence.toFixed(4)),
        uncertainty: Number((1 - confidence).toFixed(4))
      };
    }),
    concepts: db.studentStates.map((state) => {
      const retention = forgettingFactor(state.lastPracticedAt);
      const confidence = confidenceScore(state);
      return {
        id: state.conceptId,
        mastery: Number(state.mastery.toFixed(4)),
        retention: Number(retention.toFixed(4)),
        effectiveMastery: Number((state.mastery * retention).toFixed(4)),
        confidence: Number(confidence.toFixed(4)),
        uncertainty: Number((1 - confidence).toFixed(4))
      };
    }),
    misconceptions,
    recommendations,
    interventions,
    timeline: db.timelineEvents.slice(-12).reverse(),
    projection,
    persona: buildLearningPersona(db.studentStates, db.timelineEvents.slice(-12).reverse()),
    coach,
    explanation: coach.message
  };
};

router.get("/concepts", (_req, res) => {
  res.json(db.concepts);
});

router.get("/student-state", (_req, res) => {
  const state = db.studentStates.map((entry) => {
    const retention = forgettingFactor(entry.lastPracticedAt);
    const confidence = confidenceScore(entry);

    return {
      ...entry,
      retention: Number(retention.toFixed(4)),
      effectiveMastery: Number((entry.mastery * retention).toFixed(4)),
      confidence: Number(confidence.toFixed(4)),
      uncertainty: Number((1 - confidence).toFixed(4))
    };
  });

  res.json(state);
});

router.post("/interactions", async (req, res) => {
  const body = req.body as Partial<Interaction>;

  if (!body.conceptId || typeof body.correct !== "boolean") {
    return res.status(400).json({ error: "conceptId and correct are required." });
  }

  const conceptExists = db.concepts.some((concept) => concept.id === body.conceptId);
  if (!conceptExists) {
    return res.status(404).json({ error: "Unknown conceptId." });
  }

  const interaction: Interaction = {
    conceptId: body.conceptId,
    correct: body.correct,
    responseTime: typeof body.responseTime === "number" ? body.responseTime : 10,
    timestamp: body.timestamp ?? new Date().toISOString(),
    errorType: body.errorType
  };

  const currentState = db.studentStates.find((entry) => entry.conceptId === interaction.conceptId);
  if (!currentState) {
    return res.status(404).json({ error: "Student state missing for concept." });
  }

  const beforeRetention = forgettingFactor(currentState.lastPracticedAt);
  const beforeEffectiveMastery = currentState.mastery * beforeRetention;
  const beforeMastery = currentState.mastery;

  const beforeRanks = rankMap(scoreConceptRecommendations(db.studentStates, db.concepts));

  const updatedState = updateMastery(currentState, interaction);
  const idx = db.studentStates.findIndex((entry) => entry.conceptId === interaction.conceptId);

  db.studentStates[idx] = updatedState;
  db.interactions.push(interaction);

  const afterRetention = forgettingFactor(updatedState.lastPracticedAt);
  const afterEffectiveMastery = updatedState.mastery * afterRetention;
  const afterRanks = rankMap(scoreConceptRecommendations(db.studentStates, db.concepts));

  const timelineEvent: LearningTimelineEvent = {
    timestamp: interaction.timestamp,
    conceptId: interaction.conceptId,
    masteryDelta: Number((updatedState.mastery - beforeMastery).toFixed(4)),
    retentionDelta: Number((afterRetention - beforeRetention).toFixed(4)),
    effectiveMasteryDelta: Number((afterEffectiveMastery - beforeEffectiveMastery).toFixed(4)),
    recommendationShift:
      beforeRanks[interaction.conceptId] && afterRanks[interaction.conceptId]
        ? beforeRanks[interaction.conceptId] - afterRanks[interaction.conceptId]
        : null
  };

  db.timelineEvents.push(timelineEvent);

  const twin = await buildTwinPayload();

  return res.status(201).json({
    interaction,
    updatedState: {
      ...updatedState,
      retention: Number(afterRetention.toFixed(4)),
      effectiveMastery: Number(afterEffectiveMastery.toFixed(4)),
      confidence: Number(confidenceScore(updatedState).toFixed(4)),
      uncertainty: Number((1 - confidenceScore(updatedState)).toFixed(4))
    },
    ...twin
  });
});

router.get("/recommendations", async (_req, res) => {
  const mode = _req.query.mode === "openai" ? "openai" : "template";
  const twin = await buildTwinPayload(mode);

  res.json({
    recommendations: twin.recommendations,
    coach: twin.coach,
    explanation: twin.coach.message
  });
});

router.get("/learning-twin", async (_req, res) => {
  const mode = _req.query.mode === "openai" ? "openai" : "template";
  const twin = await buildTwinPayload(mode);
  res.json(twin);
});

router.post("/coach/chat", async (req, res) => {
  const body = req.body as {
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!body.message || typeof body.message !== "string") {
    return res.status(400).json({ error: "message is required." });
  }

  const { misconceptions, recommendations, interventions, projection } = getCoachContext();
  const reply = await generateCoachChatResponse({
    message: body.message.trim(),
    history: Array.isArray(body.history) ? body.history : [],
    studentStates: db.studentStates,
    recommendations,
    misconceptions,
    concepts: db.concepts,
    interventions,
    projection
  });

  return res.json(reply);
});

router.post("/strategy-arena", (req, res) => {
  const body = req.body as {
    days?: number;
    plans?: Array<{
      id: string;
      name: string;
      focusConceptIds: string[];
      sessionsPerDay: number;
      accuracyBias: number;
    }>;
  };

  const defaultPlans = [
    {
      id: "foundation-first",
      name: "Foundation First",
      focusConceptIds: ["Fractions", "Ratios"],
      sessionsPerDay: 2,
      accuracyBias: 0.15
    },
    {
      id: "exam-cram",
      name: "Exam Cram",
      focusConceptIds: ["AlgebraReadiness", "ProportionalReasoning"],
      sessionsPerDay: 3,
      accuracyBias: -0.05
    },
    {
      id: "mixed-spiral",
      name: "Mixed Spiral",
      focusConceptIds: db.concepts.map((concept) => concept.id),
      sessionsPerDay: 2,
      accuracyBias: 0.05
    }
  ];

  const plans = Array.isArray(body.plans) && body.plans.length > 0 ? body.plans : defaultPlans;
  const days = typeof body.days === "number" ? body.days : 10;
  const arena = simulateStrategyArena(db.studentStates, db.concepts, plans, days);

  return res.json(arena);
});

export default router;
