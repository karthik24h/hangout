import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './PasswordInput';
import AuthLayout from './AuthLayout';
import AuthSwitchLink from './AuthSwitchLink';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, rememberMe);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Your people. Your playlists. Your place.">
      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <svg
            className="alert-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="alert-content">
            <p className="alert-message">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group mb-6">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <PasswordInput
            id="password"
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="auth-options">
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <AuthSwitchLink to="/forgot-password">Forgot password?</AuthSwitchLink>
        </div>
        <button type="submit" className="auth-submit">
          Login
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <AuthSwitchLink to="/signup">Sign up</AuthSwitchLink>
      </p>
    </AuthLayout>
  );
}
