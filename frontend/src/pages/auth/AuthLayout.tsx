import type { ReactNode } from 'react';
import './auth.css';

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-page">
      <header className="auth-brand">
        <span className="auth-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 5v14M19 5v14M5 12h14" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          </svg>
        </span>
        Hangout<span className="auth-brand-dot">.</span>
      </header>
      <main className="auth-stage">
        <aside className="auth-intro">
          <span className="auth-eyebrow">BETTER TOGETHER</span>
          <h1>
            A little closer.
            <br />
            Even from afar.
          </h1>
          <p>
            Make room for your people. Watch, listen, and share the moments that bring you together.
          </p>
          <div className="auth-features">
            <span>Watch together</span>
            <span>Share music</span>
            <span>Stay connected</span>
          </div>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-art-orbit" />
            <div className="auth-art-disc">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="m9 5 11 7-11 7z" />
              </svg>
            </div>
            <div className="auth-art-note">♫</div>
            <div className="auth-art-caption">
              <span /> A shared moment.
            </div>
          </div>
        </aside>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-content">
            <div className="auth-heading">
              <h2 id="auth-title" tabIndex={-1}>
                {title}
              </h2>
              <p>{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </main>
      <footer className="auth-footer">A place for your people.</footer>
    </div>
  );
}
