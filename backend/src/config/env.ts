import 'dotenv/config';

function parseOrigin(value: string, setting: string): string {
  try {
    const url = new URL(value.trim());
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid origin');
    }
    return url.origin;
  } catch {
    throw new Error(
      `${setting} must contain HTTP(S) origins without credentials, paths, queries, or fragments`
    );
  }
}

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
  const frontendUrl = parseOrigin(source.FRONTEND_URL || 'http://localhost:3000', 'FRONTEND_URL');
  const frontendOrigins = [
    ...new Set([
      frontendUrl,
      ...(source.ADDITIONAL_FRONTEND_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
        .map(origin => parseOrigin(origin, 'ADDITIONAL_FRONTEND_ORIGINS')),
    ]),
  ];
  return { port, databaseUrl, frontendUrl, frontendOrigins };
}
