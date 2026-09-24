import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import AuthLayout from './AuthLayout';
import AuthSwitchLink from './AuthSwitchLink';
import PasswordInput from './PasswordInput';

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (reset && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      const response = await apiFetch(`/reset-password/${reset ? 'confirm' : 'request'}`, {
        method: 'POST',
        body: JSON.stringify(reset ? { token, password } : { email }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Unable to process your request. Please try again.');
      if (import.meta.env.DEV && typeof data.resetToken === 'string') setDevToken(data.resetToken);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title={reset ? 'Choose a new password' : 'Forgot your password?'}
      subtitle={
        reset
          ? 'A fresh start for your account.'
          : 'Enter the email you used to create your account.'
      }
    >
      {error && (
        <p className="auth-notice" role="alert">
          {error}
        </p>
      )}
      {reset && !token ? (
        <p className="auth-notice" role="alert">
          This reset link is missing its token.{' '}
          <AuthSwitchLink to="/forgot-password">Request a new link</AuthSwitchLink>
        </p>
      ) : done ? (
        <div className="auth-notice" role="status">
          {reset
            ? 'Your password has been updated. Log in with your new password.'
            : 'Your recovery request has been received.'}
          {devToken && (
            <p>
              Development preview: email delivery is not configured.{' '}
              <AuthSwitchLink to={`/reset-password?token=${encodeURIComponent(devToken)}`}>
                Continue to reset password
              </AuthSwitchLink>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit}>
          {reset ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  className="form-input"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  minLength={8}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-describedby="reset-help"
                />
                <p className="form-hint" id="reset-help">
                  Use at least 8 characters.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm-password"
                  className="form-input"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  minLength={8}
                  required
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="recovery-email">
                Email
              </label>
              <input
                id="recovery-email"
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? 'Please wait…' : reset ? 'Reset password' : 'Request reset link'}
          </button>
        </form>
      )}
      <p className="auth-switch">
        <AuthSwitchLink to="/login">Back to login</AuthSwitchLink>
      </p>
    </AuthLayout>
  );
}
