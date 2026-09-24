import { Request, Response, NextFunction } from 'express';

// Validation result types
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: Record<string, unknown>;
}

// Validation rules
export type Validator<T> = (value: unknown) => T;
export type AsyncValidator<T> = (value: unknown) => Promise<T>;

export interface ValidationRules {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'password';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: Validator<unknown> | AsyncValidator<unknown>;
    enum?: unknown[];
    transform?: (value: unknown) => unknown;
  };
}

export function validateBody(rules: ValidationRules) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip validation if body is not parsed (e.g., malformed JSON)
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body', code: 'INVALID_BODY' });
    }
    const errors: ValidationError[] = [];
    const data: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      
      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation if not required and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeError = validateType(value, rule.type, field);
        if (typeError) {
          errors.push(typeError);
          continue;
        }
      }

      // String validations
      if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          errors.push({ field, message: `${field} must be at least ${rule.minLength} characters`, value });
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rule.maxLength} characters`, value });
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field, message: `${field} format is invalid`, value });
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rule.enum.join(', ')}`, value });
      }

      // Custom validator
      if (rule.custom) {
        try {
          const result = rule.custom(value);
          if (result instanceof Promise) {
            await result;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Validation failed';
          errors.push({ field, message, value });
        }
      }

      // Transform
      if (rule.transform) {
        data[field] = rule.transform(value);
      } else {
        data[field] = value;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    req.body = data;
    next();
  };
}

function validateType(value: unknown, type: string, field: string): ValidationError | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field, message: `${field} must be a string`, value };
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { field, message: `${field} must be a number`, value };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field, message: `${field} must be a boolean`, value };
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { field, message: `${field} must be a valid email`, value };
      }
      break;
    case 'url':
      if (typeof value !== 'string') {
        return { field, message: `${field} must be a valid URL`, value };
      }
      try {
        new URL(value);
      } catch {
        return { field, message: `${field} must be a valid URL`, value };
      }
      break;
    case 'password':
      if (typeof value !== 'string' || value.length < 8) {
        return { field, message: `${field} must be at least 8 characters`, value };
      }
      break;
  }
  return null;
}

// Common validation rule sets
export const authValidationRules = {
  signup: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'password' as const },
  },
  login: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 1 },
  },
  resetPasswordRequest: {
    email: { required: true, type: 'email' as const },
  },
  resetPasswordConfirm: {
    token: { required: true, type: 'string' as const, minLength: 1 },
    password: { required: true, type: 'password' as const },
  },
};

export const roomValidationRules = {
  create: {
    name: { required: false, type: 'string' as const, maxLength: 100, transform: (v: unknown) => v || 'Unnamed Room' },
    type: { required: true, type: 'string' as const, enum: ['video', 'music'] },
    password: { required: false, type: 'string' as const, maxLength: 100 },
    privacy: { required: false, type: 'string' as const, enum: ['public', 'private', 'invite_only'], transform: (v: unknown) => v || 'public' },
  },
  join: {
    password: { required: false, type: 'string' as const, maxLength: 100 },
  },
};