import { randomUUID } from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { parseLearningWorkbook } from '../services/excelParser';
import { analyzeLearning } from '../services/learningAnalyzer';
import { generateAIRecommendations } from '../services/openaiCoach';
import { buildRuleBasedRecommendations } from '../services/studyPlanner';
import { studentStore } from '../storage/studentStore';
import { LearningGoal } from '../types';

const upload = multer({ storage: multer.memoryStorage() });

const goalSchema = z.object({
  targetScore: z.coerce.number().min(0).max(100),
  targetMonths: z.coerce.number().int().min(1).max(24),
  weeklyStudyHours: z.coerce.number().min(1).max(80),
});

const defaultGoal: LearningGoal = {
  targetScore: 90,
  targetMonths: 6,
  weeklyStudyHours: 10,
};

export const apiRouter = Router();

apiRouter.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required in form field "file".' });
    }

    const userId = String(res.locals.userId ?? '');
    const existingProfile = await studentStore.getByUserId(userId);
    const { studentName, events } = parseLearningWorkbook(req.file.buffer);
    const insights = analyzeLearning(events);
    const persistedGoal = existingProfile?.latestGoal ?? defaultGoal;

    const profile = {
      id: existingProfile?.id ?? randomUUID(),
      userId,
      studentName,
      uploadedAt: new Date().toISOString(),
      events,
      insights,
      latestGoal: persistedGoal,
      recommendations: buildRuleBasedRecommendations(insights, persistedGoal),
    };

    await studentStore.save(profile);

    return res.json({
      message: 'File uploaded and analyzed successfully.',
      studentId: profile.id,
      profile,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

apiRouter.get('/student/profile', requireAuth, async (_req, res) => {
  const userId = String(res.locals.userId ?? '');
  const profile = await studentStore.getByUserId(userId);

  if (!profile) {
    return res.status(404).json({ error: 'No student profile found for this account.' });
  }

  return res.json(profile);
});

apiRouter.get('/recommendations', requireAuth, async (req, res) => {
  const userId = String(res.locals.userId ?? '');
  const profile = await studentStore.getByUserId(userId);

  if (!profile) {
    return res.status(404).json({ error: 'No student profile found for this account.' });
  }

  const goalResult = goalSchema.safeParse({
    targetScore: req.query.targetScore ?? profile.latestGoal?.targetScore ?? defaultGoal.targetScore,
    targetMonths: req.query.targetMonths ?? profile.latestGoal?.targetMonths ?? defaultGoal.targetMonths,
    weeklyStudyHours: req.query.weeklyStudyHours ?? profile.latestGoal?.weeklyStudyHours ?? defaultGoal.weeklyStudyHours,
  });

  if (!goalResult.success) {
    return res.status(400).json({ error: 'Invalid goal inputs.', details: goalResult.error.flatten() });
  }

  const goal = goalResult.data;
  const fallback = buildRuleBasedRecommendations(profile.insights, goal);
  const aiResult = await generateAIRecommendations(profile.insights, goal, fallback);

  const updated = {
    ...profile,
    latestGoal: goal,
    recommendations: aiResult.recommendations,
  };

  await studentStore.save(updated);

  return res.json({
    studentId: updated.id,
    goal,
    profile: updated.insights.profile,
    source: aiResult.source,
    recommendations: aiResult.recommendations,
  });
});
