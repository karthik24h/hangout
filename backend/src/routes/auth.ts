import { Router } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import {
  createSession,
  revokeSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  revokeAllUserSessions,
} from '../utils/sessions';
import { requireAuth } from '../middleware/auth';
import {
  createPasswordResetToken,
  validatePasswordResetToken,
  usePasswordResetToken,
} from '../utils/passwordReset';
import { validateBody, authValidationRules } from '../middleware/validation';
import { asyncHandler, AppError } from '../utils/errors';

const router = Router();

// Signup
router.post(
  '/api/signup',
  validateBody(authValidationRules.signup),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw AppError.conflict('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  })
);

// Login
router.post(
  '/api/login',
  validateBody(authValidationRules.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  })
);

// Logout
router.post(
  '/api/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.sessionToken) {
      await revokeSession(req.sessionToken);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ message: 'Logged out successfully' });
  })
);

// Get current user
router.get(
  '/api/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

// Request password reset
router.post(
  '/api/reset-password/request',
  validateBody(authValidationRules.resetPasswordRequest),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const userId = userResult.rows[0].id;
    const token = await createPasswordResetToken(userId);

    // TODO: Send email with reset link
    // For now, return the token in development
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'Password reset token generated (dev mode)',
        resetToken: token,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`,
      });
    }

    res.json({ message: 'If the email exists, a reset link has been sent' });
  })
);

// Reset password with token
router.post(
  '/api/reset-password/confirm',
  validateBody(authValidationRules.resetPasswordConfirm),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };

    const validation = await validatePasswordResetToken(token);
    if (!validation) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      hashedPassword,
      validation.userId,
    ]);

    await usePasswordResetToken(token);

    // Revoke all existing sessions for security
    await revokeAllUserSessions(validation.userId);

    res.json({ message: 'Password has been reset successfully' });
  })
);

export default router;
