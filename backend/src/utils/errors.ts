export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Authentication required', details?: unknown): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Access denied', details?: unknown): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Resource not found', details?: unknown): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message: string = 'Resource already exists', details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static tooManyRequests(message: string = 'Too many requests', details?: unknown): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS', details);
  }

  static internal(message: string = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }

  static serviceUnavailable(message: string = 'Service unavailable', details?: unknown): AppError {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', error);

  if (isAppError(error)) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    return res.status(400).json({
      error: 'Invalid JSON',
      code: 'INVALID_JSON',
    });
  }

  // PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; detail?: string };
    if (pgError.code === '23505') {
      // Unique violation
      return res.status(409).json({
        error: 'Resource already exists',
        code: 'DUPLICATE_ENTRY',
        details: pgError.detail,
      });
    }
    if (pgError.code === '23503') {
      // Foreign key violation
      return res.status(400).json({
        error: 'Referenced resource does not exist',
        code: 'INVALID_REFERENCE',
        details: pgError.detail,
      });
    }
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

// Async wrapper to catch errors in async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

import { Request, Response, NextFunction } from 'express';
