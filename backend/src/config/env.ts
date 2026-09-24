import 'dotenv/config';

export function readEnv(source: NodeJS.ProcessEnv = process.env) {
  const port = Number(source.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535');
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl)
    throw new Error('DATABASE_URL is required; copy backend/.env.example to backend/.env');
  const parsed = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol))
    throw new Error('DATABASE_URL must use PostgreSQL');
  const frontendUrl = new URL(source.FRONTEND_URL || 'http://localhost:3000').origin;
  return { port, databaseUrl, frontendUrl };
}
