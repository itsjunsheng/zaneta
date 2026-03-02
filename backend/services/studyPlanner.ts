import { LearningGoal, LearningInsights, StudyRecommendation } from '../types';

export const buildRuleBasedRecommendations = (
  insights: LearningInsights,
  goal: LearningGoal
): StudyRecommendation[] => {
  const recommendations: StudyRecommendation[] = [];

  const weakTopics = insights.topicInsights.filter((topic) => topic.accuracy01 < 0.7);
  if (weakTopics.length > 0) {
    recommendations.push({
      title: 'Target weakest topics first',
      why: `${weakTopics.length} topic(s) are below 0.70 average accuracy score.`,
      action: `Allocate 40% of weekly hours (${Math.round(goal.weeklyStudyHours * 0.4)}h) to ${weakTopics
        .slice(0, 3)
        .map((topic) => topic.topic)
        .join(', ')} using short practice cycles and retrieval quizzes.`,
    });
  }

  const highMasteryTime = insights.topicInsights.filter(
    (topic) => topic.masteryTimeDays !== null && topic.masteryTimeDays > 30
  );
  if (highMasteryTime.length > 0) {
    recommendations.push({
      title: 'Reduce mastery friction',
      why: `${highMasteryTime.length} topic(s) take over 30 days to reach mastery.`,
      action:
        'Introduce pre-lesson previews (15 min), then 2 focused revision blocks within 48 hours of each class.',
    });
  }

  if (insights.profile.retentionIndex < 0.65) {
    recommendations.push({
      title: 'Strengthen long-term retention',
      why: `Retention score is ${insights.profile.retentionIndex.toFixed(2)}.`,
      action:
        'Apply spaced repetition: day 1, day 3, day 7, day 14 review cadence for each newly learned concept.',
    });
  }

  if (insights.profile.speedIndex < 0.5) {
    recommendations.push({
      title: 'Improve working speed safely',
      why: `Speed score is ${insights.profile.speedIndex.toFixed(2)} with high time per attempt.`,
      action: 'Run two timed drills weekly (20 minutes) and post-drill error analysis for process efficiency.',
    });
  }

  const currentScorePercent = insights.overallAccuracy01 * 100;
  const scoreGap = Math.max(0, goal.targetScore - currentScorePercent);
  if (scoreGap > 0) {
    const monthlyLift = scoreGap / Math.max(goal.targetMonths, 1);
    recommendations.push({
      title: 'Goal trajectory planning',
      why: `To reach ${goal.targetScore}, you need ~${monthlyLift.toFixed(1)} points gain per month.`,
      action: `Set a monthly checkpoint test and adjust weekly load around ${goal.weeklyStudyHours}h to maintain trajectory.`,
    });
  }

  return recommendations.slice(0, 6);
};
