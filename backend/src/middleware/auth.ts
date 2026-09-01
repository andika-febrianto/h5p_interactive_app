import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, clientIdForUser, type Role } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role; sessionId: string };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/** Attaches `req.auth` when a valid access token is present. Never rejects
 *  the request — routes that work for both logged-in and anonymous users
 *  (like progress tracking) use this instead of `requireAuth`. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.auth = payload;
  }
  next();
}

/** Rejects the request with 401 unless a valid access token is present.
 *  Note: this only checks the JWT's own signature/expiry — it does NOT
 *  check whether the session has been revoked (see schema comment on
 *  `Session` for why). Revocation takes effect the next time the client
 *  tries to refresh, and naturally within ACCESS_TOKEN_EXPIRES_IN either way. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Sesi berakhir, silakan masuk kembali.' });
    return;
  }
  req.auth = payload;
  next();
}

/** Use after requireAuth. Rejects with 403 if the user's role isn't allowed. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan ini.' });
      return;
    }
    next();
  };
}

/** Use after requireAuth, on routes that "consume" learning content (viewing
 *  a full module, recording progress). Blocks with 403 once the user's
 *  subscription period has ended — whether that's an expired free trial or
 *  a paid plan that wasn't renewed. Access is judged purely by
 *  `currentPeriodEnd > now`, NOT by `status`: a CANCELED paid plan still
 *  works until the period it was already paid for ends (standard SaaS
 *  behavior — cancelling stops the next renewal, it doesn't revoke what was
 *  already paid for). Deliberately NOT applied to guru/* content-management
 *  routes or to browsing endpoints (subjects/module list) — only to
 *  actually consuming a module's content. */
export async function requireActiveAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: 'Login diperlukan.' });
    return;
  }
  // Teachers and Parents aren't gated by trial/subscription status —
  // this only restricts a STUDENT's access to consuming module content.
  // Teachers manage content; Parents need to view module frames to create
  // assignments for their children.
  if (req.auth.role === 'TEACHER' || req.auth.role === 'PARENT') {
    next();
    return;
  }
  try {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.auth.userId } });
    const hasAccess = !!subscription && subscription.currentPeriodEnd > new Date();
    if (!hasAccess) {
      res.status(403).json({
        error: 'Masa aktif langganan Anda sudah berakhir. Berlangganan untuk melanjutkan belajar.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** Resolves the effective progress-tracking clientId + userId for this
 *  request: prefers the logged-in identity over whatever clientId the
 *  client supplied (query/body), so nobody can write progress under
 *  someone else's account just by knowing their anonymous UUID. */
export function resolveIdentity(req: Request, suppliedClientId: string | null) {
  if (req.auth) {
    return { clientId: clientIdForUser(req.auth.userId), userId: req.auth.userId };
  }
  return { clientId: suppliedClientId, userId: null as string | null };
}
