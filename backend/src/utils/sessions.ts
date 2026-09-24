import crypto from 'node:crypto';
import { pool } from '../config/database';

const SESSION_COOKIE_NAME = 'hangout_session';
const SESSION_TTL_DAYS = 30;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(`INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
    userId,
    tokenHash,
    expiresAt,
  ]);

  return token;
}

export async function validateSession(token: string): Promise<{ userId: number } | null> {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT user_id FROM sessions 
     WHERE token_hash = $1 
     AND expires_at > NOW() 
     AND revoked_at IS NULL`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return { userId: result.rows[0].user_id };
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query(`UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await pool.query(
    `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await pool.query(
    `DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
  );
  return result.rowCount ?? 0;
}

export function getSessionCookieOptions(rememberMe = false): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    ...(rememberMe ? { maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000 } : {}),
    path: '/',
  };
}

export { SESSION_COOKIE_NAME };
