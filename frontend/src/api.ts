import axios from 'axios';
import type { LearningGoal, StudentProfile, StudyRecommendation } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
});

const authHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
});

export const fetchProfile = async (accessToken: string): Promise<StudentProfile> => {
  const response = await api.get<StudentProfile>('/student/profile', {
    headers: authHeaders(accessToken),
  });
  return response.data;
};

export const fetchRecommendations = async (
  accessToken: string,
  goal: LearningGoal
): Promise<{ recommendations: StudyRecommendation[]; goal: LearningGoal; source: 'ai' | 'fallback' }> => {
  const response = await api.get<{
    recommendations: StudyRecommendation[];
    goal: LearningGoal;
    source: 'ai' | 'fallback';
  }>('/recommendations', {
    headers: authHeaders(accessToken),
    params: {
      targetScore: goal.targetScore,
      targetMonths: goal.targetMonths,
      weeklyStudyHours: goal.weeklyStudyHours,
    },
  });

  return response.data;
};
