import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../context/AuthContext';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock services/api
vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Import after mocks
import { signup as apiSignup } from '../../services/api';
const Signup = await import('./Signup').then(m => m.default);

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Signup Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(apiSignup).mockReset();
  });

  it('renders signup form with name, email and password fields', () => {
    renderWithAuth(<Signup />);

    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows error when signup fails', async () => {
    vi.mocked(apiSignup).mockRejectedValueOnce(new Error('Email already registered'));

    renderWithAuth(<Signup />);

    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

  it('rejects a short password before calling signup', async () => {
    renderWithAuth(<Signup />);
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
      target: { value: 'test1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test1@gmail.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), {
      target: { value: 'short' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign up/i }).closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Password must be at least 8 characters'
    );
    expect(apiSignup).not.toHaveBeenCalled();
  });

  it('navigates to login page when link is clicked', () => {
    renderWithAuth(<Signup />);

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
