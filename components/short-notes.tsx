'use client';
/* oxlint-disable nextjs/no-img-element -- Authenticated images cannot pass through the public image optimizer. */

import {
  Check,
  Code2,
  Copy,
  Image as ImageIcon,
  Search,
  StickyNote,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { ShortNote, Viewer } from '../lib/types';
import { MathText } from './math-text';
import { Shell } from './shell';

export function ShortNotesView({
  user,
  notes,
}: {
  user: Viewer;
  notes: ShortNote[];
}) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All topics');
  const [phase, setPhase] = useState('all');
  const [copied, setCopied] = useState('');
  const topics = [...new Set(notes.map((note) => note.topic))].sort();
  const filtered = notes.filter(
    (note) =>
      (topic === 'All topics' || note.topic === topic) &&
      (phase === 'all' || note.phase === Number(phase)) &&
      `${note.title} ${note.topic} ${note.tag} ${note.body}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  async function copyCode(note: ShortNote) {
    try {
      await navigator.clipboard.writeText(note.code);
      setCopied(note.id);
      window.setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  }

  return (
    <Shell user={user} active="short-notes">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL NOTES. QUICK CLARITY.</span>
          <h1>Short Notes</h1>
          <p>Brief topic-wise posts, kept separate from the lecture library.</p>
        </div>
        <span className="library-badge">
          <span className="tiny-dot" /> {notes.length} POSTS
        </span>
      </div>
      <section className="library-panel short-notes-panel">
        <div className="filter-row short-note-filters">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              maxLength={150}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a short note…"
              aria-label="Search short notes"
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </label>
          <select
            aria-label="Filter short notes by topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option>All topics</option>
            {topics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filter short notes by phase"
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
          >
            <option value="all">All phases</option>
            <option value="-1">General</option>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <option key={item} value={item}>
                Phase {item}
              </option>
            ))}
          </select>
        </div>
        <div className="short-note-grid">
          {filtered.map((note) => (
            <details className="short-note-card" id={note.id} key={note.id}>
              <summary>
                <div className="short-note-card-top">
                  <span className="topic-label">{note.topic}</span>
                  <span className="short-note-formats">
                    {note.imageKey && (
                      <ImageIcon size={14} aria-label="Has image" />
                    )}
                    {note.code && <Code2 size={14} aria-label="Has code" />}
                  </span>
                </div>
                <StickyNote size={24} />
                <h2>{note.title}</h2>
                <p>
                  {note.body
                    ? note.body.slice(0, 145) +
                      (note.body.length > 145 ? '…' : '')
                    : 'Open this post to view the note.'}
                </p>
                <div className="short-note-summary-meta">
                  <span>
                    {note.phase >= 0 ? `Phase ${note.phase}` : 'General'}
                  </span>
                  {note.tag && <span>{note.tag}</span>}
                  <strong>Open note</strong>
                </div>
              </summary>
              <div className="short-note-content">
                {note.body && (
                  <p>
                    <MathText>{note.body}</MathText>
                  </p>
                )}
                {note.imageKey && (
                  <a
                    className="short-note-image-link"
                    href={`/api/short-notes/${note.id}/image`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open full-size image"
                  >
                    <img
                      src={`/api/short-notes/${note.id}/image`}
                      alt={`Visual note for ${note.title}`}
                    />
                  </a>
                )}
                {note.code && (
                  <div className="short-note-code">
                    <div className="short-note-code-head">
                      <span>{note.language || 'code'}</span>
                      <button
                        type="button"
                        onClick={() => void copyCode(note)}
                        aria-label={`Copy code from ${note.title}`}
                      >
                        {copied === note.id ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copied === note.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre>
                      <code>{note.code}</code>
                    </pre>
                  </div>
                )}
                {note.source && (
                  <p className="short-note-source">
                    <strong>Source:</strong>{' '}
                    {/^https:\/\//i.test(note.source) ? (
                      <a href={note.source} target="_blank" rel="noreferrer">
                        {note.source}
                      </a>
                    ) : (
                      note.source
                    )}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <StickyNote size={29} />
            <h3>
              {notes.length
                ? 'No matching short notes'
                : 'Short notes are coming soon'}
            </h3>
            <p>
              {notes.length
                ? 'Try another topic or clear your search.'
                : 'New topic-wise posts will appear here when they are published.'}
            </p>
          </div>
        )}
      </section>
      <div className="workspace-footer">
        <span>AZ Notes · Short explanations for quick revision</span>
        <span>{filtered.length} visible posts</span>
      </div>
    </Shell>
  );
}
