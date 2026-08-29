import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, resolveIdentity, requireAuth, requireActiveAccess } from '../middleware/auth.js';

export const progressRouter = Router();
progressRouter.use(optionalAuth);

function requireString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// GET /api/progress?clientId=&moduleId=
// If a valid Authorization token is present, the logged-in identity always
// wins over the supplied clientId (so nobody can read another anon device's
// progress just by knowing its UUID once they're logged in).
progressRouter.get('/', async (req, res, next) => {
  try {
    const { clientId } = resolveIdentity(req, requireString(req.query.clientId));
    const moduleId = requireString(req.query.moduleId);
    if (!clientId || !moduleId) {
      res.status(400).json({ error: '"clientId" and "moduleId" query params are required' });
      return;
    }

    const records = await prisma.progressRecord.findMany({ where: { clientId, moduleId } });
    const results = Object.fromEntries(
      records.map((r) => [
        r.frameSlug,
        { frameId: r.frameSlug, completed: r.completed, correct: r.correct, total: r.total },
      ])
    );
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/summary?clientId=
progressRouter.get('/summary', async (req, res, next) => {
  try {
    const { clientId } = resolveIdentity(req, requireString(req.query.clientId));
    if (!clientId) {
      res.status(400).json({ error: '"clientId" query param is required' });
      return;
    }

    const records = await prisma.progressRecord.findMany({
      where: { clientId, completed: true },
      select: { moduleId: true },
    });

    const summary: Record<string, number> = {};
    for (const r of records) {
      summary[r.moduleId] = (summary[r.moduleId] ?? 0) + 1;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

interface UpsertProgressBody {
  clientId?: unknown;
  moduleId?: unknown;
  frameSlug?: unknown;
  completed?: unknown;
  correct?: unknown;
  total?: unknown;
}

// POST /api/progress
// Body: { clientId, moduleId, frameSlug, completed, correct, total }
// Requires login + an unexpired trial/subscription — this is the "recording
// that you actually used the content" action a trial gates (teachers are
// exempt, same as GET /api/modules/:id — see requireActiveAccess).
progressRouter.post('/', requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const body = req.body as UpsertProgressBody;
    const { clientId, userId } = resolveIdentity(req, requireString(body.clientId));
    const moduleId = requireString(body.moduleId);
    const frameSlug = requireString(body.frameSlug);
    const completed = typeof body.completed === 'boolean' ? body.completed : undefined;
    const correct = typeof body.correct === 'number' ? body.correct : undefined;
    const total = typeof body.total === 'number' ? body.total : undefined;

    if (
      !clientId ||
      !moduleId ||
      !frameSlug ||
      completed === undefined ||
      correct === undefined ||
      total === undefined
    ) {
      res.status(400).json({
        error:
          'Body must include clientId (string), moduleId (string), frameSlug (string), completed (boolean), correct (number), total (number)',
      });
      return;
    }

    const record = await prisma.progressRecord.upsert({
      where: { clientId_moduleId_frameSlug: { clientId, moduleId, frameSlug } },
      create: { clientId, moduleId, frameSlug, completed, correct, total, userId },
      update: { completed, correct, total, userId },
    });

    res.status(200).json({
      frameId: record.frameSlug,
      completed: record.completed,
      correct: record.correct,
      total: record.total,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/progress?clientId=&moduleId=
progressRouter.delete('/', async (req, res, next) => {
  try {
    const { clientId } = resolveIdentity(req, requireString(req.query.clientId));
    const moduleId = requireString(req.query.moduleId);
    if (!clientId || !moduleId) {
      res.status(400).json({ error: '"clientId" and "moduleId" query params are required' });
      return;
    }

    await prisma.progressRecord.deleteMany({ where: { clientId, moduleId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
