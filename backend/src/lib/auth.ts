import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me';
// Deliberately short — a revoked session's outstanding access token becomes
// useless within this window even though JWTs themselves can't be revoked.
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET is not set. Using an insecure default — set JWT_SECRET in production.'
  );
}

export type Role = 'TEACHER' | 'STUDENT';

export interface AccessTokenPayload {
  userId: string;
  role: Role;
  sessionId: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** A random opaque string — NOT a JWT. It has to be a plain lookup-able
 *  secret because (unlike the access token) it must be revocable server-side. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

/** One-way, deterministic hash used to store/look up refresh tokens without
 *  ever persisting the raw secret. (Not bcrypt: we need exact-match lookup
 *  by hash, not a slow salted comparison — same tradeoff as API key storage.) */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Canonical progress-tracking identity for a logged-in user. Keeps the
 *  ProgressRecord composite key shape (clientId, moduleId, frameSlug)
 *  unchanged while still being derivable deterministically from a userId. */
export function clientIdForUser(userId: string): string {
  return `user:${userId}`;
}
