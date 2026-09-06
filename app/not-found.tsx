import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="empty-state" style={{ minHeight: '80vh' }}>
      <h1>This note isn’t available</h1>
      <p>It may be a draft, or the link may be incorrect.</p>
      <Link className="button primary" href="/library">
        Back to library
      </Link>
    </main>
  );
}
