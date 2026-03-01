import {
  Concept,
  Interaction,
  InterventionPlan,
  LearningPersona,
  MisconceptionFlag,
  ProjectionSummary,
  Recommendation,
  StrategyPlanInput,
  StrategyPlanResult,
  StudentState
} from "./models/types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const LEARNING_RATE = 0.22;
const ERROR_PENALTY = 0.14;
const HALF_LIFE_DAYS = 5;

export const updateMastery = (state: StudentState, interaction: Interaction, learningRate = LEARNING_RATE): StudentState => {
  const prevMastery = state.mastery;

  // Diminishing returns: the closer mastery is to 1, the smaller positive updates become.
  const positiveGain = learningRate * (1 - prevMastery);
  // Incorrect answers reduce mastery more when confidence is high.
  const negativeLoss = ERROR_PENALTY * prevMastery;

  const nextMastery = interaction.correct
    ? clamp(prevMastery + positiveGain)
    : clamp(prevMastery - negativeLoss);

  const nextAttempts = state.attempts + 1;
  const nextCorrect = state.correct + (interaction.correct ? 1 : 0);
  const nextAvgResponseTime =
    (state.avgResponseTime * state.attempts + interaction.responseTime) / Math.max(nextAttempts, 1);

  return {
    ...state,
    mastery: nextMastery,
    attempts: nextAttempts,
    correct: nextCorrect,
    avgResponseTime: Number(nextAvgResponseTime.toFixed(2)),
    lastPracticedAt: interaction.timestamp
  };
};

export const forgettingFactor = (lastPracticedAt: string): number => {
  const now = Date.now();
  const last = new Date(lastPracticedAt).getTime();
  const elapsedMs = Math.max(0, now - last);
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  // Exponential decay where half-life determines memory retention drop pace.
  const lambda = Math.log(2) / HALF_LIFE_DAYS;
  const retention = Math.exp(-lambda * elapsedDays);

  return clamp(retention);
};

export const effectiveMastery = (state: StudentState): number => {
  return clamp(state.mastery * forgettingFactor(state.lastPracticedAt));
};

export const confidenceScore = (state: StudentState): number => {
  const attemptsSignal = 1 - Math.exp(-state.attempts / 8);
  const accuracy = state.attempts > 0 ? state.correct / state.attempts : 0.5;
  const confidence = 0.25 + attemptsSignal * 0.5 + accuracy * 0.25;
  return clamp(confidence);
};

export const misconceptionDetection = (
  interactions: Interaction[],
  threshold = 3
): MisconceptionFlag[] => {
  const keyCounts: Record<string, number> = {};

  interactions
    .filter((entry) => !entry.correct && entry.errorType)
    .forEach((entry) => {
      const key = `${entry.conceptId}::${entry.errorType}`;
      keyCounts[key] = (keyCounts[key] ?? 0) + 1;
    });

  return Object.entries(keyCounts)
    .filter(([, count]) => count >= threshold)
    .map(([key, count]) => {
      const [conceptId, errorType] = key.split("::");
      return { conceptId, errorType, count };
    })
    .sort((a, b) => b.count - a.count);
};

const mapByConcept = (states: StudentState[]) => {
  return Object.fromEntries(states.map((state) => [state.conceptId, state]));
};

export const scoreConceptRecommendations = (
  studentStates: StudentState[],
  conceptGraph: Concept[]
): Recommendation[] => {
  const byConcept = mapByConcept(studentStates);

  return conceptGraph.map((concept) => {
    const state = byConcept[concept.id];
    const retention = forgettingFactor(state.lastPracticedAt);
    const effMastery = clamp(state.mastery * retention);
    const lowMasteryNeed = 1 - effMastery;
    const forgettingRisk = 1 - retention;

    const prereqStates = concept.prerequisites
      .map((prereqId) => byConcept[prereqId])
      .filter(Boolean);

    const prereqGap = prereqStates.length
      ? prereqStates
          .map((prereqState) => 1 - effectiveMastery(prereqState))
          .reduce((sum, deficit) => sum + deficit, 0) / prereqStates.length
      : 0;

    const score =
      lowMasteryNeed * 0.55 +
      prereqGap * 0.2 +
      forgettingRisk * 0.25;

    let reason = "Low effective mastery and forgetting risk suggest immediate review.";
    if (prereqGap > 0.45) {
      reason = "Prerequisite gaps are blocking progress in this concept.";
    } else if (forgettingRisk > 0.5) {
      reason = "Memory decay is high, so spaced review is likely beneficial.";
    }

    return {
      conceptId: concept.id,
      conceptName: concept.name,
      score: Number(score.toFixed(4)),
      reason
    };
  }).sort((a, b) => b.score - a.score);
};

export const recommendNextConcept = (
  studentStates: StudentState[],
  conceptGraph: Concept[],
  limit = 3
): Recommendation[] => {
  return scoreConceptRecommendations(studentStates, conceptGraph).slice(0, limit);
};

export const buildInterventionPlans = (
  misconceptions: MisconceptionFlag[],
  conceptGraph: Concept[]
): InterventionPlan[] => {
  const conceptNameById = Object.fromEntries(conceptGraph.map((concept) => [concept.id, concept.name]));

  return misconceptions.slice(0, 3).map((misconception) => {
    const conceptName = conceptNameById[misconception.conceptId] ?? misconception.conceptId;
    const normalizedError = misconception.errorType.replace(/_/g, " ");

    return {
      conceptId: misconception.conceptId,
      title: `${conceptName}: ${normalizedError} remediation`,
      steps: [
        `Run 3 worked examples focused on ${normalizedError}.`,
        "Ask the learner to explain each step in words before computing.",
        "Finish with 2 mixed checks and compare reasoning against the worked example."
      ]
    };
  });
};

const computeReadiness = (states: StudentState[]): number => {
  return clamp(states.reduce((sum, state) => sum + effectiveMastery(state), 0) / Math.max(states.length, 1));
};

export const projectReadinessInDays = (
  studentStates: StudentState[],
  conceptGraph: Concept[],
  days = 7
): ProjectionSummary => {
  const simulated = studentStates.map((state) => ({ ...state }));

  const baselineReadiness = Number(computeReadiness(simulated).toFixed(4));

  for (let day = 1; day <= days; day += 1) {
    const ranked = scoreConceptRecommendations(simulated, conceptGraph);
    const nextConceptId = ranked[0]?.conceptId;
    const target = simulated.find((state) => state.conceptId === nextConceptId);
    if (!target) continue;

    const forgettingRisk = 1 - forgettingFactor(target.lastPracticedAt);
    const expectedGain = LEARNING_RATE * (1 - target.mastery) * (0.7 + forgettingRisk * 0.3);

    target.mastery = clamp(target.mastery + expectedGain);
    target.attempts += 1;
    target.correct += 1;
    target.lastPracticedAt = new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString();
  }

  const projectedReadiness = Number(computeReadiness(simulated).toFixed(4));

  return {
    baselineReadiness,
    projectedReadiness,
    expectedImprovement: Number((projectedReadiness - baselineReadiness).toFixed(4)),
    assumptions: "Assumes one focused practice session per day on the highest-priority concept."
  };
};

export const simulateStrategyArena = (
  studentStates: StudentState[],
  conceptGraph: Concept[],
  plans: StrategyPlanInput[],
  days = 10
): { baselineReadiness: number; results: StrategyPlanResult[]; winnerId: string; winnerReason: string } => {
  const baselineReadiness = Number(computeReadiness(studentStates).toFixed(4));

  const results = plans.map((plan) => {
    const simStates = studentStates.map((state) => ({ ...state }));
    const focus = plan.focusConceptIds.length ? plan.focusConceptIds : conceptGraph.map((c) => c.id);
    const trajectory: { day: number; readiness: number }[] = [{ day: 0, readiness: baselineReadiness }];

    for (let day = 1; day <= days; day += 1) {
      for (let session = 0; session < Math.max(plan.sessionsPerDay, 1); session += 1) {
        const conceptId = focus[(day + session - 1) % focus.length];
        const target = simStates.find((state) => state.conceptId === conceptId);
        if (!target) continue;

        const confidence = confidenceScore(target);
        const successSignal = clamp(0.35 + target.mastery * 0.45 + plan.accuracyBias * 0.2 + confidence * 0.1);
        const virtualCorrect = successSignal >= 0.55;

        const interaction: Interaction = {
          conceptId,
          correct: virtualCorrect,
          responseTime: virtualCorrect ? 8 : 13,
          timestamp: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString(),
          errorType: virtualCorrect ? undefined : "strategy_simulated_error"
        };

        const updated = updateMastery(target, interaction, LEARNING_RATE * (1 + plan.accuracyBias * 0.25));
        const idx = simStates.findIndex((state) => state.conceptId === conceptId);
        simStates[idx] = updated;
      }

      trajectory.push({ day, readiness: Number(computeReadiness(simStates).toFixed(4)) });
    }

    const projectedReadiness = trajectory[trajectory.length - 1].readiness;

    return {
      id: plan.id,
      name: plan.name,
      projectedReadiness,
      expectedImprovement: Number((projectedReadiness - baselineReadiness).toFixed(4)),
      trajectory
    };
  });

  const winner = results.reduce((best, current) =>
    current.projectedReadiness > best.projectedReadiness ? current : best
  );

  return {
    baselineReadiness,
    results,
    winnerId: winner.id,
    winnerReason: `${winner.name} maximizes projected readiness over ${days} days.`
  };
};

export const buildLearningPersona = (
  studentStates: StudentState[],
  timeline: Array<{ masteryDelta: number; conceptId: string }>
): LearningPersona => {
  const momentumRaw = timeline.slice(0, 6).reduce((sum, event) => sum + event.masteryDelta, 0);
  const momentum = clamp(0.5 + momentumRaw * 3);

  const resilienceRaw = studentStates.reduce((sum, state) => {
    const accuracy = state.attempts > 0 ? state.correct / state.attempts : 0;
    return sum + (accuracy >= 0.6 ? 1 : 0.4);
  }, 0) / Math.max(studentStates.length, 1);

  const efficiencyRaw = studentStates.reduce((sum, state) => {
    const accuracy = state.attempts > 0 ? state.correct / state.attempts : 0;
    const speedScore = clamp(1 - state.avgResponseTime / 20);
    return sum + (accuracy * 0.65 + speedScore * 0.35);
  }, 0) / Math.max(studentStates.length, 1);

  const resilience = clamp(resilienceRaw);
  const efficiency = clamp(efficiencyRaw);

  const vector = (momentum + resilience + efficiency) / 3;

  let label = "Steady Climber";
  let summary = "Consistent progress with balanced speed and accuracy.";

  if (vector > 0.76) {
    label = "Momentum Sprinter";
    summary = "Fast adaptation and strong recovery patterns suggest accelerated readiness gains.";
  } else if (efficiency < 0.45) {
    label = "Deep Thinker";
    summary = "Accuracy is developing, but response-time drag suggests fluency drills will unlock gains.";
  } else if (resilience < 0.5) {
    label = "Fragile Starter";
    summary = "Early setbacks persist; short confidence-building wins should stabilize growth.";
  }

  return {
    momentum: Number(momentum.toFixed(4)),
    resilience: Number(resilience.toFixed(4)),
    efficiency: Number(efficiency.toFixed(4)),
    label,
    summary
  };
};

export const generateExplanation = (
  studentStates: StudentState[],
  recommendations: Recommendation[],
  misconceptions: MisconceptionFlag[],
  concepts: Concept[]
): string => {
  const conceptMap = Object.fromEntries(concepts.map((concept) => [concept.id, concept]));
  const top = recommendations[0];

  if (!top) {
    return "No recommendation available yet. Continue practicing to build your learning twin.";
  }

  const topConcept = conceptMap[top.conceptId];
  const weakPrereqId = topConcept?.prerequisites.find((prereqId) => {
    const prereqState = studentStates.find((state) => state.conceptId === prereqId);
    if (!prereqState) return false;
    return effectiveMastery(prereqState) < 0.6;
  });

  if (weakPrereqId) {
    const prereqName = conceptMap[weakPrereqId]?.name ?? weakPrereqId;
    return `Strengthening ${prereqName} will improve ${top.conceptName} because it is a prerequisite dependency.`;
  }

  const misconception = misconceptions[0];
  if (misconception) {
    const misconceptionConcept = conceptMap[misconception.conceptId]?.name ?? misconception.conceptId;
    return `Frequent ${misconception.errorType.replace(/_/g, " ")} errors in ${misconceptionConcept} suggest a misconception. Focused correction should unlock progress.`;
  }

  return `${top.conceptName} is the highest-value next step based on current mastery and forgetting risk.`;
};
