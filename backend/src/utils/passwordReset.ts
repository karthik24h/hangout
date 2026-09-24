import crypto from 'node:crypto';
import { pool } from '../config/database';

const RESET_TOKEN_TTL_HOURS = 1;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createPasswordResetToken(userId: number): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
}

export async function validatePasswordResetToken(token: string): Promise<{ userId: number } | null> {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT user_id FROM password_reset_tokens 
     WHERE token_hash = $1 
     AND expires_at > NOW() 
     AND used_at IS NULL`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return { userId: result.rows[0].user_id };
}

export async function usePasswordResetToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await pool.query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1`,
    [tokenHash]
  );
}

export async function cleanupExpiredResetTokens(): Promise<number> {
  const result = await pool.query(
    `DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL`
  );
  return result.rowCount ?? 0;
}