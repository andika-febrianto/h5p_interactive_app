import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { subjectInputSchema } from '../lib/frameValidation.js';

export const subjectsRouter = Router();

// GET /api/subjects
subjectsRouter.get('/', async (_req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { id: 'asc' } });
    res.json(subjects);
  } catch (err) {
    next(err);
  }
});

// GET /api/subjects/:id
subjectsRouter.get('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!subject) {
      res.status(404).json({ error: `Subject "${req.params.id}" not found` });
      return;
    }
    res.json(subject);
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects — create a new mata pelajaran (guru only)
subjectsRouter.post('/', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const parsed = subjectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existing = await prisma.subject.findUnique({ where: { id: parsed.data.id } });
    if (existing) {
      res.status(409).json({ error: `Subject "${parsed.data.id}" sudah ada.` });
      return;
    }

    const subject = await prisma.subject.create({ data: parsed.data });
    res.status(201).json(subject);
  } catch (err) {
    next(err);
  }
});

// PUT /api/subjects/:id — update an existing mata pelajaran (guru only)
subjectsRouter.put('/:id', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const parsed = subjectInputSchema.omit({ id: true }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existing = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: `Subject "${req.params.id}" not found` });
      return;
    }

    const subject = await prisma.subject.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(subject);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id — guru only. Blocked (409) if modules still reference it.
subjectsRouter.delete('/:id', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const moduleCount = await prisma.module.count({ where: { subjectId: req.params.id } });
    if (moduleCount > 0) {
      res.status(409).json({
        error: `Tidak bisa menghapus: masih ada ${moduleCount} modul yang memakai mata pelajaran ini.`,
      });
      return;
    }

    await prisma.subject.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
