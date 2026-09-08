'use client';
/* oxlint-disable nextjs/no-html-link-for-pages -- Auth.js sign-out requires top-level navigation. */
import Link from 'next/link';
import {
  BookOpen,
  Library,
  Bookmark,
  CheckCheck,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import type { Viewer } from '../lib/types';
export function Shell({
  user,
  children,
  active = 'library',
}: {
  user: Viewer;
  children: React.ReactNode;
  active?: string;
}) {
  const [open, setOpen] = useState(false),
    [online, setOnline] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    async function pulse() {
      if (document.hidden) return;
      try {
        const r = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'x-az-notes-action': '1' },
        });
        if (!r.ok) throw Error();
        const d = (await r.json()) as { online: number };
        if (live) setOnline(d.online);
      } catch {
        if (live) setOnline(null);
      }
    }
    void pulse();
    const timer = setInterval(pulse, 45000);
    document.addEventListener('visibilitychange', pulse);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', pulse);
    };
  }, []);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={'sidebar ' + (open ? 'is-open' : '')}>
        <div className="sidebar-brand">
          <Link className="brand" href="/library">
            <span className="brand-mark">
              <BookOpen size={22} />
            </span>
            <span>
              AZ<span className="brand-light"> Notes</span>
              <small>THE DSA NOTEBOOK</small>
            </span>
          </Link>
          <button
            className="mobile-only icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="collection-card">
          <span className="collection-icon">AZ</span>
          <div>
            <strong>AZ Notes</strong>
            <small>Structured DSA learning</small>
          </div>
          <span className="tiny-dot" />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          <Link
            className={active === 'library' ? 'selected' : ''}
            href="/library"
          >
            <Library size={19} /> Notes library
          </Link>
          <Link
            className={active === 'saved' ? 'selected' : ''}
            href="/library?view=saved"
          >
            <Bookmark size={19} /> Saved notes
          </Link>
          <Link
            className={active === 'completed' ? 'selected' : ''}
            href="/library?view=completed"
          >
            <CheckCheck size={19} /> Revision progress
          </Link>
          {user.admin && (
            <>
              <span className="nav-label">MANAGE</span>
              <Link
                className={active === 'admin' ? 'selected' : ''}
                href="/admin"
              >
                <ShieldCheck size={19} /> Admin workspace
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <GraduationCap size={21} />
            <p>
              Small revisions.
              <br />
              <strong>Stronger foundations.</strong>
            </p>
          </div>
          <div className="sidebar-credit">Made for learners everywhere.</div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="header-left">
            <button
              className="mobile-only icon-button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span>
              Workspace <span className="breadcrumb-slash">/</span>{' '}
              <strong>
                {active === 'admin' ? 'Administration' : 'Lecture library'}
              </strong>
            </span>
          </div>
          <div className="header-actions">
            <span
              className="online"
              title="Unique signed-in users active in the last 2 minutes"
            >
              <span className="live-dot" />
              {online === null ? 'Connecting…' : `${online} online`}
              <Users size={14} />
            </span>
            <ThemeToggle />
            <div className="avatar" title={user.email}>
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <a
              className="icon-button"
              href={user.signOutPath}
              target="_top"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </a>
          </div>
        </header>
        <main id="main" className="workspace">
          {children}
        </main>
      </div>
    </div>
  );
}
