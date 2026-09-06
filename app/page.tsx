import Link from 'next/link';
import { chatGPTSignInPath } from './chatgpt-auth';
import { viewer } from '../lib/server';
import { googleReady } from '../lib/google-auth';
import { GoogleSignIn } from '../components/google-signin';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  ArrowUpRight,
  LockKeyhole,
  Code2,
  Layers3,
  ArrowRight,
} from 'lucide-react';
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
            B15<span className="brand-light"> Notes</span>
            <small>THE DSA NOTEBOOK</small>
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="welcome-main">
        <section className="welcome-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> ALGOZENITH · BATCH 15
          </span>
          <h1>
            A good lecture.
            <br />A great set of <em>notes.</em>
          </h1>
          <p className="welcome-description">
            Revisit the ideas. Understand the code.
            <br />
            Your companion to Vivek Gupta sir’s DSA lectures.
          </p>
          <div className="welcome-facts">
            <span>
              <BookOpen size={18} /> Lecture notes
            </span>
            <span>
              <Code2 size={18} /> Code references
            </span>
            <span>
              <Layers3 size={18} /> Topic by topic
            </span>
          </div>
          <p className="credit">
            Built for the batch. Ready for your next revision.
          </p>
        </section>
        <section className="signin-card">
          <div className="signin-illustration">
            <div className="notebook-spine" />
            <span className="eyebrow">B15 / DSA</span>
            <BookOpen size={54} strokeWidth={1.15} />
            <div>
              <strong>
                The revision
                <br />
                notebook.
              </strong>
              <span>CONCEPTS → CODE → CLARITY</span>
            </div>
            <span className="notebook-tab">15</span>
          </div>
          <div className="signin-body">
            <span className="pill">
              <LockKeyhole size={13} /> YOUR LEARNING SPACE
            </span>
            <h2>Welcome to B15 Notes</h2>
            <p>
              Sign in to read and download notes, save your place, and keep
              track of your revision.
            </p>
            <GoogleSignIn ready={googleReady()} />
            <a
              className="button primary wide"
              target="_top"
              href={chatGPTSignInPath('/library')}
            >
              Sign in with ChatGPT <ArrowRight size={18} />
            </a>
            <p className="fineprint">
              Everyone is welcome. Your notes and revision progress stay in your
              account.
            </p>
          </div>
        </section>
      </main>
      <footer className="welcome-footer">
        <span>An independent notes companion for AlgoZenith B15.</span>
        <a href="https://maang.in" target="_blank" rel="noreferrer">
          Visit AlgoZenith <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
