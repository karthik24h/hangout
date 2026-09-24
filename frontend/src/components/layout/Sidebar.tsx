import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import './sidebar.css';

const destinations = [
  { to: '/', label: 'Overview', icon: 'home' },
  { to: '/music', label: 'Music', icon: 'music' },
  { to: '/videos', label: 'Videos', icon: 'video' },
  { to: '/favorites', label: 'Favorites', icon: 'heart' },
] as const;

export default function Sidebar({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else if (dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 701px)');
    const closeOnResize = () => {
      if (breakpoint.matches) setOpen(false);
    };
    breakpoint.addEventListener('change', closeOnResize);
    return () => breakpoint.removeEventListener('change', closeOnResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const content = (mobile: boolean) => (
    <>
      <div className="side-heading">
        <div>
          <h2>Your space</h2>
        </div>
        {mobile && (
          <button className="side-close" onClick={close} aria-label="Close navigation">
            ×
          </button>
        )}
      </div>
      <nav className="side-nav" aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
        {destinations.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            aria-label={item.label}
            onClick={mobile ? close : undefined}
            className={({ isActive }) => `side-link${isActive ? ' is-active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            <span className="side-active-dot" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
      <div className="side-actions">
        <span className="side-overline">GET TOGETHER</span>
        <button
          className="side-link"
          title="Create a room"
          aria-label="Create a room"
          onClick={() => {
            if (mobile) close();
            onCreate();
          }}
        >
          <Icon name="plus" />
          <span>Create a room</span>
        </button>
        <button
          className="side-link"
          title="Join with a code"
          aria-label="Join with a code"
          onClick={() => {
            if (mobile) close();
            onJoin();
          }}
        >
          <Icon name="people" />
          <span>Join with a code</span>
        </button>
      </div>
      <div className="side-note">
        <div className="side-note-icon">
          <Icon name="music" />
          <Icon name="video" />
        </div>
        <h3>A place to press pause.</h3>
        <p>
          On the day. On the distance.
          <br />
          Make time for your people.
        </p>
      </div>
      <div className="side-bottom">
        <NavLink
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className={({ isActive }) => `side-link${isActive ? ' is-active' : ''}`}
          onClick={mobile ? close : undefined}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </NavLink>
        <span className="side-bottom-caption">A little closer, together.</span>
      </div>
    </>
  );

  return (
    <>
      <aside className="app-sidebar" aria-label="Sidebar">
        {content(false)}
      </aside>
      <div className="side-mobile-bar">
        <button
          ref={trigger}
          className="side-mobile-trigger"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-sidebar"
          aria-haspopup="dialog"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Menu
        </button>
        <span>Your space / Overview</span>
      </div>
      <dialog
        ref={drawer}
        id="mobile-sidebar"
        className="side-drawer"
        aria-label="Navigation"
        onCancel={close}
        onClose={() => setOpen(false)}
        onClick={event => {
          if (event.target === event.currentTarget) {
            const box = event.currentTarget.getBoundingClientRect();
            if (event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
              close();
          }
        }}
      >
        {content(true)}
      </dialog>
    </>
  );
}
