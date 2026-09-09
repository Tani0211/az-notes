import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function PublicLegal({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="welcome-header">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          <span>
            AZ<span className="brand-light"> Notes</span>
            <small>THE DSA NOTEBOOK</small>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="legal-main">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <article className="legal-card">{children}</article>
      </main>
      <footer className="welcome-footer legal-footer">
        <Link href="/">AZ Notes</Link>
        <span>
          <Link href="/privacy">Privacy</Link> ·{' '}
          <Link href="/terms">Terms</Link>
        </span>
      </footer>
    </div>
  );
}
