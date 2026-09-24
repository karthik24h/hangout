import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { readEnv } from './config/env';
import auth from './routes/auth';
import rooms from './routes/rooms';

export function createApp() {
  const app = express();
  app.use(cors({ origin: readEnv().frontendUrl }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/', (_req, res) => { res.json({ message: 'Welcome to the Hangout API' }); });
  app.get('/health', (_req, res) => { res.json({ ok: true }); });
  app.use(auth);
  app.use(rooms);
  app.use((_req, res) => { res.status(404).json({ message: 'Not found' }); });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error?.status === 400 ? 400 : error?.status === 413 ? 413 : 500;
    res.status(status).json({ message: status === 400 ? 'Invalid JSON' : status === 413 ? 'Request too large' : 'Server error' });
  };
  app.use(errors);
  return app;
}
