import { afterEach, describe, expect, it, vi } from 'vitest';
import { signup } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('signup errors', () => {
  it.each([
    [
      {
        error: 'Validation failed',
        details: [{ field: 'password', message: 'password must be at least 8 characters' }],
      },
      'password must be at least 8 characters',
    ],
    [{ error: 'Email already registered' }, 'Email already registered'],
    [{}, 'Signup failed'],
  ])('shows the specific error for %j', async (body, message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => body,
      })
    );
    await expect(
      signup({ name: 'test1', email: 'test1@gmail.com', password: 'short' })
    ).rejects.toThrow(message);
  });
});
