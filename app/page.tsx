import Link from 'next/link';
import { viewer } from '../lib/server';
import { googleReady } from '../lib/google-auth';
import { GoogleSignIn } from '../components/google-signin';
import { redirect } from 'next/navigation';
import { BookOpen, LockKeyhole, SearchCheck, Layers3 } from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const user = await viewer();
  if (user) redirect('/library');
  return (
    <div className="welcome">
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
      <main className="welcome-main">
        <section className="welcome-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> OPEN DSA LEARNING LIBRARY
          </span>
          <h1>
            A good lecture.
            <br />A great set of <em>notes.</em>
          </h1>
          <p className="welcome-description">
            Revisit the ideas. Strengthen your understanding.
            <br />
            Clear digital notes for students learning DSA anywhere.
          </p>
          <div className="welcome-facts">
            <span>
              <BookOpen size={18} /> Lecture notes
            </span>
            <span>
              <SearchCheck size={18} /> Quick revision
            </span>
            <span>
              <Layers3 size={18} /> Topic by topic
            </span>
          </div>
          <p className="credit">
            Built for learners everywhere. Ready for your next revision.
          </p>
        </section>
        <section className="signin-card">
          <div className="signin-illustration">
            <div className="notebook-spine" />
            <span className="eyebrow">AZ / DSA</span>
            <BookOpen size={54} strokeWidth={1.15} />
            <div>
              <strong>
                The revision
                <br />
                notebook.
              </strong>
              <span>CONCEPTS → CODE → CLARITY</span>
            </div>
            <span className="notebook-tab">AZ</span>
          </div>
          <div className="signin-body">
            <span className="pill">
              <LockKeyhole size={13} /> YOUR LEARNING SPACE
            </span>
            <h2>Welcome to AZ Notes</h2>
            <p>
              Sign in to read and download notes, save your place, and keep
              track of your revision.
            </p>
            <GoogleSignIn ready={googleReady()} />
            <p className="fineprint">
              Everyone is welcome. Your notes and revision progress stay in your
              Google account.
            </p>
          </div>
        </section>
      </main>
      <footer className="welcome-footer">
        <span>An independent DSA learning library for every student.</span>
        <span>
          <Link href="/privacy">Privacy</Link> ·{' '}
          <Link href="/terms">Terms</Link>
        </span>
      </footer>
    </div>
  );
}
