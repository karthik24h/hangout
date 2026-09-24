import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { apiFetch } from '../../services/api';
import PasswordRecovery from './PasswordRecovery';

vi.mock('../../services/api', () => ({ apiFetch: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const renderPage = (url: string, reset = false) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PasswordRecovery reset={reset} />
    </MemoryRouter>
  );

it('shows a recovery service error rather than claiming an email was sent', async () => {
  vi.mocked(apiFetch).mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Password recovery is currently unavailable.' }),
  } as Response);
  renderPage('/forgot-password');
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Request reset link' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('currently unavailable');
  expect(apiFetch).toHaveBeenCalledWith(
    '/reset-password/request',
    expect.objectContaining({ body: JSON.stringify({ email: 'person@example.com' }) })
  );
});

it('rejects a missing token without displaying a password form', () => {
  renderPage('/reset-password', true);
  expect(screen.getByRole('alert')).toHaveTextContent('missing its token');
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
});

it('checks matching passwords and submits the token with the new password', async () => {
  vi.mocked(apiFetch).mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
  renderPage('/reset-password?token=test-token', true);
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpassword123' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'different123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
  expect(screen.getByRole('alert')).toHaveTextContent('do not match');
  expect(apiFetch).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'newpassword123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
  expect(await screen.findByRole('status')).toHaveTextContent('password has been updated');
  expect(apiFetch).toHaveBeenCalledWith(
    '/reset-password/confirm',
    expect.objectContaining({
      body: JSON.stringify({ token: 'test-token', password: 'newpassword123' }),
    })
  );
});
