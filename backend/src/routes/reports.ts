import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole('TEACHER'));

// GET /api/reports/overview — one row per student: modules touched, frames
// completed, and total correct/possible across everything they've done.
reportsRouter.get('/overview', async (_req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { progress: true },
      orderBy: { name: 'asc' },
    });

    const overview = students.map((s) => {
      const progress = s.progress ?? [];
      const modulesTouched = new Set(progress.map((p) => p.moduleId)).size;
      const framesCompleted = progress.filter((p) => p.completed).length;
      const correct = progress.reduce((sum, p) => sum + p.correct, 0);
      const total = progress.reduce((sum, p) => sum + p.total, 0);
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        modulesTouched,
        framesCompleted,
        correct,
        total,
        accuracyPct: total > 0 ? Math.round((correct / total) * 100) : null,
      };
    });

    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/modules/:moduleId — every student's progress on one module.
reportsRouter.get('/modules/:moduleId', async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId;
    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) {
      res.status(404).json({ error: `Module "${moduleId}" not found` });
      return;
    }

    const frameCount = await prisma.frame.count({ where: { moduleId } });

    const records = await prisma.progressRecord.findMany({
      where: { moduleId, userId: { not: null } },
      include: { user: true },
    });

    const byStudent = new Map<string, { name: string; email: string; completed: number; correct: number; total: number }>();
    for (const r of records) {
      if (!r.user) continue;
      const entry = byStudent.get(r.user.id) ?? {
        name: r.user.name,
        email: r.user.email,
        completed: 0,
        correct: 0,
        total: 0,
      };
      if (r.completed) entry.completed += 1;
      entry.correct += r.correct;
      entry.total += r.total;
      byStudent.set(r.user.id, entry);
    }

    res.json({
      module: { id: mod.id, title: mod.title, frameCount },
      students: Array.from(byStudent.entries()).map(([id, v]) => ({ id, ...v })),
    });
  } catch (err) {
    next(err);
  }
});
