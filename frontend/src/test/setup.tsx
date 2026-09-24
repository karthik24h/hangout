import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
// @ts-expect-error - mocking global fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock window.confirm
// @ts-expect-error - mocking global confirm
global.confirm = vi.fn().mockReturnValue(true);

// Mock window.alert
// @ts-expect-error - mocking global alert
global.alert = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error - mocking global fetch
  (global.fetch as ReturnType<typeof vi.fn>).mockReset();
});
