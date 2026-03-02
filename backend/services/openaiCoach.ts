import OpenAI from 'openai';
import { LearningGoal, LearningInsights, StudyRecommendation } from '../types';

const getClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
};

const safeParseRecommendations = (text: string): StudyRecommendation[] => {
  const direct = (() => {
    try {
      return JSON.parse(text) as StudyRecommendation[];
    } catch {
      return null;
    }
  })();

  const parsed = Array.isArray(direct) ? direct : (() => {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]) as StudyRecommendation[];
    } catch {
      return null;
    }
  })();

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item) => item && typeof item.title === 'string' && typeof item.why === 'string' && typeof item.action === 'string')
    .slice(0, 6);
};

export const generateAIRecommendations = async (
  insights: LearningInsights,
  goal: LearningGoal,
  fallback: StudyRecommendation[]
): Promise<{ recommendations: StudyRecommendation[]; source: 'ai' | 'fallback' }> => {
  const client = getClient();
  if (!client) {
    return { recommendations: fallback, source: 'fallback' };
  }

  const prompt = `
You are an elite personalized learning strategist.
Given the learner analytics and target goal, produce exactly 4 practical, specific recommendations.
Make the recommendations sound tailored, not generic. Mention topics, pacing, cadence, and checkpoints.
Respond only as valid JSON array with objects: {"title":"...","why":"...","action":"..."}.

Learner analytics:
${JSON.stringify(insights)}

Goal:
${JSON.stringify(goal)}
`;

  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature: 0.7,
    });

    const text = response.output_text?.trim();
    if (!text) {
      return { recommendations: fallback, source: 'fallback' };
    }

    const sanitized = safeParseRecommendations(text);

    if (sanitized.length > 0) {
      return { recommendations: sanitized.slice(0, 4), source: 'ai' };
    }

    return { recommendations: fallback, source: 'fallback' };
  } catch {
    return { recommendations: fallback, source: 'fallback' };
  }
};
