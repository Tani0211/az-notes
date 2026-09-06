'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state" style={{ minHeight: '80vh' }}>
      <h1>We couldn’t load this page</h1>
      <p>Please try again. Your saved notes are still in your account.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <Link href="/library">Back to library</Link>
    </main>
  );
}
