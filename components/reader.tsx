'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Download,
  FileText,
  Maximize2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import type { Note, ReadingState, Viewer } from '../lib/types';
import { Shell } from './shell';
export function Reader({
  note,
  user,
  initialState,
  related,
}: {
  note: Note;
  user: Viewer;
  initialState: ReadingState | null;
  related: Pick<Note, 'id' | 'title'>[];
}) {
  const [state, setState] = useState(
      initialState || { noteId: note.id, saved: 0, completed: 0, lastPage: 1 },
    ),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(initialState?.lastPage || 1),
    [message, setMessage] = useState('');
  const file = `/api/notes/${note.id}/file`;
  useEffect(() => {
    void fetch(`/api/notes/${note.id}/event`, {
      method: 'POST',
      headers: { 'x-az-notes-action': '1' },
    }).catch(() => {});
  }, [note.id]);
  async function update(values: Record<string, number | boolean>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch(`/api/notes/${note.id}/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify(values),
      });
      const d = (await r.json()) as ReadingState & { error?: string };
      if (!r.ok) throw Error(d.error);
      setState(d);
      if ('lastPage' in values) setMessage('Reading place saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell user={user}>
      <Link className="back-link" href="/library">
        <ArrowLeft size={16} /> Back to library
      </Link>
      <div className="reader-heading">
        <div>
          <span className="eyebrow">
            {note.phase >= 0 ? `Phase ${note.phase} · ` : ''}
            {note.topic} {note.status === 'draft' ? '· DRAFT' : ''}
          </span>
          <h1>{note.title}</h1>
          <p>
            {note.date
              ? new Date(note.date + 'T12:00:00Z').toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })
              : 'Bonus lecture'}{' '}
            <span>·</span> Digital DSA notes
          </p>
        </div>
        <div className="reader-actions">
          <button
            disabled={busy}
            className={'button ' + (state.saved ? 'subtle' : '')}
            onClick={() => update({ saved: !state.saved })}
          >
            <Bookmark size={16} fill={state.saved ? 'currentColor' : 'none'} />
            {state.saved ? 'Saved' : 'Save'}
          </button>
          <button
            disabled={busy}
            className={'button ' + (state.completed ? 'subtle' : 'primary')}
            onClick={() => update({ completed: !state.completed })}
          >
            <Check size={16} />
            {state.completed ? 'Revised' : 'Mark as revised'}
          </button>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <output className="notice" style={{ display: 'block' }}>
          {message}
        </output>
      )}
      <div className="reader-grid">
        <section className="pdf-panel">
          <div className="pdf-toolbar">
            <span className="pill">
              <FileText size={15} /> Digital notes
            </span>
            <div className="pdf-actions">
              <a
                className="icon-button"
                href={file}
                target="_blank"
                rel="noreferrer"
                title="Open PDF in a new tab"
                aria-label="Open PDF in a new tab"
              >
                <Maximize2 size={17} />
              </a>
              <a className="button primary" href={file + '?download=1'}>
                <Download size={16} />
                <span>Download</span>
              </a>
            </div>
          </div>
          <object
            key={file}
            data={file + '#page=' + state.lastPage}
            type="application/pdf"
            className="pdf-frame"
            aria-label={note.title + ' PDF'}
          >
            <div className="pdf-fallback">
              <BookOpen size={36} />
              <h3>Read your lecture notes</h3>
              <p>Your browser may open PDFs in a separate tab.</p>
              <a
                className="button primary"
                href={file}
                target="_blank"
                rel="noreferrer"
              >
                Open PDF <ExternalLink size={16} />
              </a>
            </div>
          </object>
          <div className="pdf-bottom">
            <span>
              PDF not appearing?{' '}
              {note.driveUrl ? (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`/api/notes/${note.id}/open`}
                >
                  Open in Drive <ArrowUpRight size={13} />
                </a>
              ) : (
                <a target="_blank" rel="noreferrer" href={file}>
                  Open in a new tab
                </a>
              )}
            </span>
            <span>PDF links stay clickable.</span>
          </div>
        </section>
        <aside className="reader-aside">
          <section className="aside-card">
            <span className="section-kicker">IN THIS LECTURE</span>
            <h2>{note.topic}</h2>
            <p>
              {note.summary ||
                'Revisit the lecture concepts, worked examples, and explanations in the notes.'}
            </p>
            <div className="inline-hint">
              <FileText size={17} />
              <span>Links included in the digital notes remain clickable.</span>
            </div>
          </section>
          <section className="aside-card">
            <span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span>
            <h2>Your reading place</h2>
            <p>Save the page you want to return to.</p>
            <form
              className="page-form"
              onSubmit={(e) => {
                e.preventDefault();
                void update({ lastPage: page });
              }}
            >
              <label>
                Page
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                Save place
              </button>
            </form>
            <span className="saved-page">Saved at page {state.lastPage}</span>
          </section>
          {related.length > 0 && (
            <section className="aside-card">
              <span className="section-kicker">KEEP EXPLORING</span>
              {related.map((n) => (
                <Link
                  key={n.id}
                  className="related-note"
                  href={'/notes/' + n.id}
                >
                  <BookOpen size={16} />
                  <span>{n.title}</span>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </section>
          )}
        </aside>
      </div>
    </Shell>
  );
}
