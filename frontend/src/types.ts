export type TopicInsight = {
  topic: string;
  attempts: number;
  accuracy01: number;
  masteryTimeDays: number | null;
  mastery01: number;
  retention01: number;
  averageDurationMinutes: number;
};

export type CognitiveProfile = {
  consistency: number;
  speedIndex: number;
  retentionIndex: number;
  adaptability: number;
  focusRisk: 'low' | 'medium' | 'high';
};

export type LearningInsights = {
  overallAccuracy01: number;
  accuracyOverTime: Array<{ date: string; accuracy01: number }>;
  topicInsights: TopicInsight[];
  metricScores: {
    accuracyOverTime01: number;
    mastery01: number;
    retention01: number;
  };
  profile: CognitiveProfile;
};

export type LearningGoal = {
  targetScore: number;
  targetMonths: number;
  weeklyStudyHours: number;
};

export type StudyRecommendation = {
  title: string;
  why: string;
  action: string;
};

export type StudentProfile = {
  id: string;
  userId?: string;
  studentName: string;
  uploadedAt: string;
  insights: LearningInsights;
  latestGoal?: LearningGoal;
  recommendations: StudyRecommendation[];
};
