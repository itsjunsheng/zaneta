import { CognitiveProfile, LearningInsights, RawLearningEvent, TopicInsight } from '../types';

const HARD_DIFFICULTY_THRESHOLD = 4;
const MASTERY_SCORE_THRESHOLD_01 = 0.8;
const LONG_GAP_DAYS = 30;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const average = (values: number[]): number =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const stdDev = (values: number[]): number => {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const daysBetween = (a: Date, b: Date): number =>
  Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const eventAccuracy01 = (event: RawLearningEvent): number => {
  if (event.maxScore <= 0) {
    return 0;
  }

  return clamp01(event.score / event.maxScore);
};

const monthKey = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const buildMonthlyAccuracySeries = (sortedEvents: RawLearningEvent[]): Array<{ date: string; accuracy01: number }> => {
  const byMonth = new Map<string, number[]>();

  for (const event of sortedEvents) {
    const key = monthKey(event.assessedAt);
    const list = byMonth.get(key) ?? [];
    list.push(eventAccuracy01(event));
    byMonth.set(key, list);
  }

  return [...byMonth.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, scores]) => ({
      date: month,
      accuracy01: average(scores),
    }));
};

const computeTopicAccuracyOverTime01 = (sortedEvents: RawLearningEvent[]): number => {
  const monthlySeries = buildMonthlyAccuracySeries(sortedEvents).map((point) => point.accuracy01);
  const mean = average(monthlySeries);
  const volatilityPenalty = stdDev(monthlySeries) * 0.25;

  return clamp01(mean - volatilityPenalty);
};

const computeMasteryTimeDays = (sortedEvents: RawLearningEvent[]): number | null => {
  const hardAttempts = sortedEvents.filter((event) => event.difficulty >= HARD_DIFFICULTY_THRESHOLD);
  const attemptsForMastery = hardAttempts.length > 0 ? hardAttempts : sortedEvents;
  const firstDate = new Date(sortedEvents[0].assessedAt);

  const masteryAttempt = attemptsForMastery.find((event) => eventAccuracy01(event) >= MASTERY_SCORE_THRESHOLD_01);
  if (!masteryAttempt) {
    return null;
  }

  return daysBetween(firstDate, new Date(masteryAttempt.assessedAt));
};

const masteryScore01 = (masteryTimeDays: number | null): number => {
  if (masteryTimeDays === null) {
    return 0;
  }

  // Faster mastery should approach 1.0, slower mastery approaches 0.0.
  return clamp01(1 / (1 + masteryTimeDays / 30));
};

const computeRetention01 = (sortedEvents: RawLearningEvent[]): number => {
  if (sortedEvents.length <= 1) {
    return 0.5;
  }

  let weightedRetention = 0;
  let totalWeight = 0;

  for (let index = 1; index < sortedEvents.length; index += 1) {
    const previous = eventAccuracy01(sortedEvents[index - 1]);
    const current = eventAccuracy01(sortedEvents[index]);
    const gapDays = daysBetween(new Date(sortedEvents[index - 1].assessedAt), new Date(sortedEvents[index].assessedAt));

    if (gapDays < LONG_GAP_DAYS) {
      continue;
    }

    // Retention is judged only on 30+ day gaps:
    // same/higher score => high retention; lower => low; much lower => very low.
    const ratio = current / Math.max(previous, 0.01);
    let retentionSample = 0.5;
    if (ratio >= 1) {
      retentionSample = 1;
    } else if (ratio >= 0.95) {
      retentionSample = 0.9;
    } else if (ratio >= 0.85) {
      retentionSample = 0.7;
    } else if (ratio >= 0.7) {
      retentionSample = 0.4;
    } else {
      retentionSample = 0.15;
    }

    const weight = gapDays / LONG_GAP_DAYS;

    weightedRetention += retentionSample * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    // No long-gap evidence yet; keep score neutral.
    return 0.5;
  }

  return clamp01(weightedRetention / totalWeight);
};

const computeTopicInsights = (events: RawLearningEvent[]): TopicInsight[] => {
  const grouped = new Map<string, RawLearningEvent[]>();

  for (const event of events) {
    const list = grouped.get(event.topic) ?? [];
    list.push(event);
    grouped.set(event.topic, list);
  }

  return [...grouped.entries()].map(([topic, topicEvents]) => {
    const sorted = [...topicEvents].sort(
      (a, b) => new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime()
    );

    const masteryTimeDays = computeMasteryTimeDays(sorted);

    return {
      topic,
      attempts: sorted.length,
      accuracy01: computeTopicAccuracyOverTime01(sorted),
      masteryTimeDays,
      mastery01: masteryScore01(masteryTimeDays),
      retention01: computeRetention01(sorted),
      averageDurationMinutes: average(sorted.map((event) => event.durationMinutes)),
    };
  });
};

const profileFromTopics = (topicInsights: TopicInsight[]): CognitiveProfile => {
  const consistency = average(topicInsights.map((topic) => topic.accuracy01));
  const retentionIndex = average(topicInsights.map((topic) => topic.retention01));
  const speedIndex = clamp01(
    1 - average(topicInsights.map((topic) => Math.min(topic.averageDurationMinutes, 120) / 120))
  );

  const adaptability = clamp01(
    consistency * 0.4 +
      retentionIndex * 0.35 +
      average(topicInsights.map((topic) => topic.mastery01)) * 0.25
  );

  const riskSignals = topicInsights.filter((topic) => topic.accuracy01 < 0.6 || topic.retention01 < 0.6).length;
  const focusRisk: 'low' | 'medium' | 'high' =
    riskSignals >= 4 ? 'high' : riskSignals >= 2 ? 'medium' : 'low';

  return {
    consistency,
    speedIndex,
    retentionIndex,
    adaptability,
    focusRisk,
  };
};

export const analyzeLearning = (events: RawLearningEvent[]): LearningInsights => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime()
  );

  const accuracyOverTime = buildMonthlyAccuracySeries(sortedEvents);
  const topicInsights = computeTopicInsights(events).sort((a, b) => a.topic.localeCompare(b.topic));

  const overallAccuracy01 = average(sortedEvents.map(eventAccuracy01));
  const metricScores = {
    accuracyOverTime01: average(topicInsights.map((topic) => topic.accuracy01)),
    mastery01: average(topicInsights.map((topic) => topic.mastery01)),
    retention01: average(topicInsights.map((topic) => topic.retention01)),
  };

  return {
    overallAccuracy01,
    accuracyOverTime,
    topicInsights,
    metricScores,
    profile: profileFromTopics(topicInsights),
  };
};
