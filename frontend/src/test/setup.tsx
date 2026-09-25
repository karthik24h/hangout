import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
globalThis.fetch = vi.fn();

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
globalThis.confirm = vi.fn().mockReturnValue(true);

// Mock window.alert
globalThis.alert = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockReset();
});
