import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

/** Creates a new session row + matching access/refresh token pair for a user.
 *  Shared by register, login, and refresh so all three behave identically. */
async function issueSession(userId: string, role: 'TEACHER' | 'STUDENT' | 'PARENT', userAgent?: string) {
  const refreshToken = generateRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      userAgent: userAgent?.slice(0, 255),
      expiresAt: refreshTokenExpiry(),
    },
  });
  const accessToken = signAccessToken({ userId, role, sessionId: session.id });
  return { accessToken, refreshToken };
}

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  role: z.enum(['TEACHER', 'STUDENT', 'PARENT']),
  grade: z.number().int().min(1).max(6).optional(),
  semester: z.number().int().min(1).max(2).optional(),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
      return;
    }
    const { name, email, password, role, grade, semester } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email sudah terdaftar.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        grade: role === 'STUDENT' ? grade ?? null : null,
        semester: role === 'STUDENT' ? semester ?? null : null,
      },
    });

    // Every new account starts on a 14-day free trial with full access —
    // matches the "Free Trial: 14 hari, Semua fitur" plan on the pricing page.
    const trialPlan = await prisma.plan.findUnique({ where: { id: 'free_trial' } });
    if (trialPlan) {
      const trialDays = trialPlan.trialDays ?? 14;
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: trialPlan.id,
          status: 'TRIALING',
          currentPeriodEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    const { accessToken, refreshToken } = await issueSession(user.id, user.role, req.headers['user-agent']);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, semester: user.semester },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email dan kata sandi diperlukan.' });
      return;
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }

    const { accessToken, refreshToken } = await issueSession(user.id, user.role, req.headers['user-agent']);
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, semester: user.semester },
    });
  } catch (err) {
    next(err);
  }
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

// POST /api/auth/refresh — trades a still-valid refresh token for a new
// access token. Rotates the refresh token too (old one is revoked, a new
// one issued) so a stolen-and-replayed refresh token stops working the
// moment the legitimate client refreshes again.
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '"refreshToken" wajib diisi.' });
      return;
    }

    const tokenHash = hashRefreshToken(parsed.data.refreshToken);
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    const isValid = session && !session.revokedAt && session.expiresAt > new Date() && session.user;
    if (!session || !isValid || !session.user) {
      res.status(401).json({ error: 'Sesi tidak valid atau sudah berakhir, silakan masuk kembali.' });
      return;
    }

    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const { accessToken, refreshToken } = await issueSession(
      session.user.id,
      session.user.role,
      req.headers['user-agent']
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        grade: session.user.grade,
        semester: session.user.semester,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revokes the CURRENT session (the one whose access
// token was presented), so its refresh token can no longer be used.
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await prisma.session.update({
      where: { id: req.auth!.sessionId },
      data: { revokedAt: new Date() },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, semester: user.semester });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/sessions — list this user's active (non-revoked,
// non-expired) sessions, e.g. for a "perangkat yang sedang login" page.
authRouter.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.auth!.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(
      sessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        current: s.id === req.auth!.sessionId,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/sessions/:id — "cabut" (revoke) any of the caller's own
// sessions, e.g. to log a lost/stolen device out remotely.
authRouter.delete('/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.auth!.userId) {
      res.status(404).json({ error: 'Sesi tidak ditemukan.' });
      return;
    }
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
