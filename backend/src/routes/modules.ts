import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializeModule } from '../lib/serialize.js';
import { requireAuth, requireRole, requireActiveAccess } from '../middleware/auth.js';
import { moduleInputSchema, frameInputSchema } from '../lib/frameValidation.js';

export const modulesRouter = Router();

function parseIntParam(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isInteger(n) ? n : undefined;
}

// GET /api/modules?grade=&semester=&subjectId=
// Returns module summaries (not full frame content) — used by the
// grade/semester/subject listing pages. Includes frameCount and the first
// frame's kind (for the card icon) without sending every frame's full payload.
modulesRouter.get('/', async (req, res, next) => {
  try {
    const grade = parseIntParam(req.query.grade);
    const semester = parseIntParam(req.query.semester);
    const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;

    if (req.query.grade !== undefined && grade === undefined) {
      res.status(400).json({ error: '"grade" must be an integer' });
      return;
    }
    if (req.query.semester !== undefined && semester === undefined) {
      res.status(400).json({ error: '"semester" must be an integer' });
      return;
    }

    const modules = await prisma.module.findMany({
      where: {
        ...(grade !== undefined ? { grade } : {}),
        ...(semester !== undefined ? { semester } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: [{ grade: 'asc' }, { semester: 'asc' }, { id: 'asc' }],
      include: {
        frames: { orderBy: { order: 'asc' }, take: 1, select: { kind: true } },
        _count: { select: { frames: true } },
      },
    });

    res.json(
      modules.map((m) => {
        const { frames, _count, ...rest } = m;
        return {
          ...serializeModule(rest),
          frameCount: _count?.frames ?? 0,
          firstFrameKind: frames?.[0]?.kind ?? 'text',
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/modules/:id — full module including ordered frames. Requires
// login; for STUDENT accounts, also requires an unexpired trial/subscription
// (see requireActiveAccess) — this is the actual "content" a trial gates.
modulesRouter.get('/:id', requireAuth, requireActiveAccess, async (req, res, next) => {
  try {
    const mod = await prisma.module.findUnique({
      where: { id: req.params.id },
      include: { frames: { orderBy: { order: 'asc' } } },
    });
    if (!mod) {
      res.status(404).json({ error: `Module "${req.params.id}" not found` });
      return;
    }
    res.json(serializeModule(mod));
  } catch (err) {
    next(err);
  }
});

// POST /api/modules — create a new module (guru only). Created with zero frames;
// add panels afterwards via POST /api/modules/:id/frames.
modulesRouter.post('/', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const parsed = moduleInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existingModule = await prisma.module.findUnique({ where: { id: parsed.data.id } });
    if (existingModule) {
      res.status(409).json({ error: `Module "${parsed.data.id}" sudah ada.` });
      return;
    }
    const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId } });
    if (!subject) {
      res.status(400).json({ error: `subjectId "${parsed.data.subjectId}" tidak ditemukan.` });
      return;
    }

    const mod = await prisma.module.create({ data: parsed.data });
    res.status(201).json(serializeModule({ ...mod, frames: [] }));
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:id — update a module's own fields (not its frames; guru only).
modulesRouter.put('/:id', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const parsed = moduleInputSchema.omit({ id: true }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existing = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: `Module "${req.params.id}" not found` });
      return;
    }
    if (parsed.data.subjectId !== existing.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId } });
      if (!subject) {
        res.status(400).json({ error: `subjectId "${parsed.data.subjectId}" tidak ditemukan.` });
        return;
      }
    }

    const mod = await prisma.module.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(serializeModule(mod));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/modules/:id — guru only. Cascades: also deletes this module's frames
// and any progress records referencing it (see schema's onDelete: Cascade).
modulesRouter.delete('/:id', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: `Module "${req.params.id}" not found` });
      return;
    }
    await prisma.module.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/modules/:id/frames — append a new panel to a module (guru only).
// The new frame is placed at the end (order = current max + 1) unless the
// caller supplies `order` explicitly.
modulesRouter.post('/:id/frames', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const mod = await prisma.module.findUnique({ where: { id: req.params.id } });
    if (!mod) {
      res.status(404).json({ error: `Module "${req.params.id}" not found` });
      return;
    }

    const parsed = frameInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const existingFrame = await prisma.frame.findUnique({
      where: { moduleId_slug: { moduleId: req.params.id, slug: parsed.data.id } },
    });
    if (existingFrame) {
      res.status(409).json({ error: `Panel dengan id "${parsed.data.id}" sudah ada di modul ini.` });
      return;
    }

    const maxOrder = await prisma.frame.aggregate({
      where: { moduleId: req.params.id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const { id: slug, kind, panel, title, note, ...data } = parsed.data;
    const frame = await prisma.frame.create({
      data: { moduleId: req.params.id, slug, kind, panel, title, note: note ?? null, order: nextOrder, data },
    });

    res.status(201).json({ id: frame.slug, kind: frame.kind, panel: frame.panel, title: frame.title, ...(frame.note ? { note: frame.note } : {}), ...data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:id/frames/:slug — replace a panel's content (guru only).
// Order is preserved; use the reorder endpoint to change panel sequence.
modulesRouter.put('/:id/frames/:slug', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.frame.findUnique({
      where: { moduleId_slug: { moduleId: req.params.id, slug: req.params.slug } },
    });
    if (!existing) {
      res.status(404).json({ error: `Panel "${req.params.slug}" not found in this module.` });
      return;
    }

    const parsed = frameInputSchema.safeParse({ ...req.body, id: req.params.slug });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }

    const { id: slug, kind, panel, title, note, ...data } = parsed.data;
    const frame = await prisma.frame.update({
      where: { moduleId_slug: { moduleId: req.params.id, slug: req.params.slug } },
      data: { kind, panel, title, note: note ?? null, data },
    });

    res.json({ id: frame.slug, kind: frame.kind, panel: frame.panel, title: frame.title, ...(frame.note ? { note: frame.note } : {}), ...data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/modules/:id/frames/:slug — guru only.
modulesRouter.delete('/:id/frames/:slug', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const existing = await prisma.frame.findUnique({
      where: { moduleId_slug: { moduleId: req.params.id, slug: req.params.slug } },
    });
    if (!existing) {
      res.status(404).json({ error: `Panel "${req.params.slug}" not found in this module.` });
      return;
    }
    await prisma.frame.delete({
      where: { moduleId_slug: { moduleId: req.params.id, slug: req.params.slug } },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PUT /api/modules/:id/frames/reorder — body: { order: string[] } — an array of
// frame slugs in their new display order (guru only). All existing slugs for
// this module must be present exactly once.
modulesRouter.put('/:id/frames/reorder', requireAuth, requireRole('TEACHER'), async (req, res, next) => {
  try {
    const order = req.body?.order;
    if (!Array.isArray(order) || !order.every((s) => typeof s === 'string')) {
      res.status(400).json({ error: 'Body harus berisi { order: string[] }' });
      return;
    }

    const existingFrames = await prisma.frame.findMany({ where: { moduleId: req.params.id } });
    const existingSlugs = new Set(existingFrames.map((f) => f.slug));
    const sameSet =
      order.length === existingSlugs.size && order.every((s) => existingSlugs.has(s));
    if (!sameSet) {
      res.status(400).json({
        error: 'Daftar "order" harus berisi persis semua id panel yang ada di modul ini, tanpa duplikat.',
      });
      return;
    }

    await prisma.$transaction(
      order.map((slug, index) =>
        prisma.frame.update({
          where: { moduleId_slug: { moduleId: req.params.id, slug } },
          data: { order: index },
        })
      )
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
