import type { MouseEvent, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';

export default function AuthSwitchLink({ to, children }: { to: string; children: ReactNode }) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    event.preventDefault();
    // Commit the route inside the snapshot callback so both forms can crossfade.
    const transition = document.startViewTransition(() => {
      flushSync(() => navigate(to));
      document.getElementById('auth-title')?.focus({ preventScroll: true });
    });
    // A superseded transition can be skipped during rapid navigation.
    void transition.ready.catch(() => {});
  };

  return (
    <Link to={to} className="auth-switch-link" onClick={handleClick}>
      {children}
    </Link>
  );
}
