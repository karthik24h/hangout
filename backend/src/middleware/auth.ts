import { Request, Response, NextFunction } from 'express';
import { validateSession, revokeSession } from '../utils/sessions';
import { pool } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; name: string; email: string };
      sessionToken?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.hangout_session;
  console.log('Auth middleware - path:', req.path, 'token:', token);
  
  if (!token) {
    return next();
  }

  const session = await validateSession(token);
  if (!session) {
    res.clearCookie('hangout_session', { path: '/' });
    return next();
  }

  const userResult = await pool.query(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [session.userId]
  );

  if (userResult.rows.length === 0) {
    await revokeSession(token);
    res.clearCookie('hangout_session', { path: '/' });
    return next();
  }

  req.user = userResult.rows[0];
  req.sessionToken = token;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}