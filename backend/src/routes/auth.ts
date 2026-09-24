import { Router } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { createSession, revokeSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '../utils/sessions';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Signup
router.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/api/logout', requireAuth, async (req, res) => {
  try {
    if (req.sessionToken) {
      await revokeSession(req.sessionToken);
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/api/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// Recovery stays disabled until identity verification is implemented.
router.post('/api/reset-password', (_req, res) => {
  res.status(501).json({ error: 'Password recovery is not available yet' });
});

export default router;