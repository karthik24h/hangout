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

function parsePositiveInteger(value: string | undefined, fallback: number, setting: string): number {
  const parsed = Number(value || fallback);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`${setting} must be a positive integer`);
  return parsed;
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
  const mediaMaxFileBytes = parsePositiveInteger(source.MEDIA_MAX_FILE_BYTES, 5 * 1024 ** 3, 'MEDIA_MAX_FILE_BYTES');
  const mediaMaxUserBytes = parsePositiveInteger(source.MEDIA_MAX_USER_BYTES, 20 * 1024 ** 3, 'MEDIA_MAX_USER_BYTES');
  const mediaMaxUserItems = parsePositiveInteger(source.MEDIA_MAX_USER_ITEMS, 20, 'MEDIA_MAX_USER_ITEMS');
  const mediaMaxDurationSeconds = parsePositiveInteger(source.MEDIA_MAX_DURATION_SECONDS, 4 * 60 * 60, 'MEDIA_MAX_DURATION_SECONDS');
  if (mediaMaxUserBytes < mediaMaxFileBytes) throw new Error('MEDIA_MAX_USER_BYTES must be at least MEDIA_MAX_FILE_BYTES');
  return {
    port,
    databaseUrl,
    frontendUrl,
    frontendOrigins,
    mediaStorageDir: source.MEDIA_STORAGE_DIR || './storage/media',
    mediaMaxFileBytes,
    mediaMaxUserBytes,
    mediaMaxUserItems,
    mediaMaxDurationSeconds,
  };
}
