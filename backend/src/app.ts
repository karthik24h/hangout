import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { readEnv } from './config/env';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './utils/errors';
import auth from './routes/auth';
import rooms from './routes/rooms';

const csrfTokens = new Map<string, string>();

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for login, signup, logout, and password reset endpoints
  const skipPaths = ['/api/login', '/api/signup', '/api/logout', '/api/reset-password', '/api/reset-password/request', '/api/reset-password/confirm'];
  if (skipPaths.includes(req.path)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.cookies?.hangout_session;
  
  if (!sessionToken || !token || csrfTokens.get(sessionToken) !== token) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.hangout_session;
  if (sessionToken && !csrfTokens.has(sessionToken)) {
    csrfTokens.set(sessionToken, generateCsrfToken());
  }
  next();
}

export function getCsrfToken(sessionToken: string): string | undefined {
  return csrfTokens.get(sessionToken);
}

export function createApp() {
  const app = express();
  
  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for now, can be configured later
  }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  
  // Stricter rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use(cors({ origin: readEnv().frontendUrl, credentials: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use(authMiddleware);
  app.use(csrfTokenMiddleware);
  app.use(csrfMiddleware);
  
  // Get CSRF token endpoint
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    const sessionToken = req.cookies?.hangout_session;
    if (sessionToken) {
      const token = csrfTokens.get(sessionToken) || generateCsrfToken();
      csrfTokens.set(sessionToken, token);
      return res.json({ csrfToken: token });
    }
    res.status(401).json({ error: 'Not authenticated' });
  });
  
  app.get('/', (_req, res) => { res.json({ message: 'Welcome to the Hangout API' }); });
  app.get('/health', (_req, res) => { res.json({ ok: true }); });
  
  // Apply auth rate limiter to auth routes
  app.use('/api/login', authLimiter);
  app.use('/api/signup', authLimiter);
  app.use('/api/reset-password', authLimiter);
  
  app.use(auth);
  app.use(rooms);
  app.use((_req, res) => { res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }); });
  
  app.use(errorHandler);
  return app;
}
