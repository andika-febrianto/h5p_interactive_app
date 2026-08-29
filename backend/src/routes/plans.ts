import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const plansRouter = Router();

// GET /api/plans — public, used by the pricing page.
plansRouter.get('/', async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { priceIdr: 'asc' } });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});
