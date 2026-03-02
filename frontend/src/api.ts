import axios from 'axios';
import type { LearningGoal, StudentProfile, StudyRecommendation } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
});

export const uploadWorkbook = async (file: File): Promise<StudentProfile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ profile: StudentProfile }>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.profile;
};

export const fetchProfile = async (studentId: string): Promise<StudentProfile> => {
  const response = await api.get<StudentProfile>('/student/profile', { params: { studentId } });
  return response.data;
};

export const fetchRecommendations = async (
  studentId: string,
  goal: LearningGoal
): Promise<{ recommendations: StudyRecommendation[]; goal: LearningGoal; source: 'ai' | 'fallback' }> => {
  const response = await api.get<{ recommendations: StudyRecommendation[]; goal: LearningGoal; source: 'ai' | 'fallback' }>('/recommendations', {
    params: {
      studentId,
      targetScore: goal.targetScore,
      targetMonths: goal.targetMonths,
      weeklyStudyHours: goal.weeklyStudyHours,
    },
  });

  return response.data;
};
