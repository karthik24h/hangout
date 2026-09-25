import type { CorsOptions } from 'cors';

// Requests without Origin (for example server-to-server clients) do not use CORS.
export function isOriginAllowed(origin: string | undefined, allowedOrigins: readonly string[]) {
  return origin === undefined || allowedOrigins.includes(origin);
}

export function createCorsOptions(allowedOrigins: string[]): CorsOptions {
  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    maxAge: 600,
    optionsSuccessStatus: 204,
  };
}
