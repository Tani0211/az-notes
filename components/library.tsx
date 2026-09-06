'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  Bookmark,
  Check,
  ArrowUpRight,
  CalendarDays,
  Code2,
  FileText,
  X,
  ArrowRight,
  Layers3,
} from 'lucide-react';
import type { Note, ReadingState, Viewer } from '../lib/types';
import { Shell } from './shell';
export function LibraryView({
  notes,
  initialState,
  user,
  initialView,
}: {
  notes: Note[];
  initialState: ReadingState[];
  user: Viewer;
  initialView: string;
}) {
  const [query, setQuery] = useState(''),
    [phase, setPhase] = useState('all'),
    [topic, setTopic] = useState('All topics'),
    [week, setWeek] = useState('All weeks'),
    [view, setView] = useState(initialView),
    [layout, setLayout] = useState('grid'),
    [sort, setSort] = useState('newest'),
    [state, setState] = useState(initialState),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('');
  const topics = [...new Set(notes.map((n) => n.topic))].sort();
  const weeks = [...new Set(notes.map((n) => n.week))].sort((a, b) => a - b);
  const states = useMemo(
    () => new Map(state.map((s) => [s.noteId, s])),
    [state],
  );
  const revised = notes.filter((n) => states.get(n.id)?.completed).length;
  const saved = notes.filter((n) => states.get(n.id)?.saved).length;
  const filtered = notes
    .filter(
      (n) =>
        (phase === 'all' || n.phase === Number(phase)) &&
        (topic === 'All topics' || n.topic === topic) &&
        (week === 'All weeks' || n.week === Number(week)) &&
        (view !== 'saved' || states.get(n.id)?.saved) &&
        (view !== 'completed' || states.get(n.id)?.completed) &&
        `${n.title} ${n.topic} ${n.summary}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'oldest'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date),
    );
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, opts: unknown) => unknown;
        };
      }
    ).modelContext;
    if (!context) return;
    const life = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'filter_b15_notes',
            description:
              'Filter the visible B15 lecture library by a search term.',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string', maxLength: 150 } },
              required: ['query'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof (input as { query?: unknown }).query !== 'string' ||
                (input as { query: string }).query.length > 150
              )
                throw Error('A search query up to 150 characters is required.');
              const q = (input as { query: string }).query;
              setQuery(q);
              return { query: q };
            },
          },
          { signal: life.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => life.abort();
  }, []);
  async function bookmark(n: Note) {
    setBusy(n.id);
    setError('');
    try {
      const r = await fetch(`/api/notes/${n.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-b15-action': '1' },
        body: JSON.stringify({ saved: !states.get(n.id)?.saved }),
      });
      const d = (await r.json()) as ReadingState & { error?: string };
      if (!r.ok) throw Error(d.error);
      setState((s) => [...s.filter((x) => x.noteId !== n.id), d]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save note.');
    } finally {
      setBusy('');
    }
  }
  return (
    <Shell user={user} active={view === 'all' ? 'library' : view}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LEARN. REVISIT. UNDERSTAND.</span>
          <h1>Your DSA notebook</h1>
          <p>One place for every lecture, idea, and line of code.</p>
        </div>
        <span className="cohort-badge">
          <span className="tiny-dot" /> BATCH 15
        </span>
      </div>
      <div className="overview">
        <div className="overview-primary">
          <div>
            <span className="section-kicker">THE COLLECTION</span>
            <strong>
              {notes.length}
              <span>lecture notes</span>
            </strong>
            <p>From foundations to your next breakthrough.</p>
          </div>
          <BookOpen size={52} strokeWidth={1.15} />
        </div>
        <div className="overview-small">
          <span>
            <Layers3 size={17} /> Topics covered
          </span>
          <strong>{topics.length}</strong>
          <p>A growing DSA collection</p>
        </div>
        <div className="overview-small">
          <span>
            <Check size={17} /> Your revision
          </span>
          <strong>
            {revised}
            <small> / {notes.length}</small>
          </strong>
          <div className="progress-track">
            <i
              style={{
                width: `${notes.length ? (revised / notes.length) * 100 : 0}%`,
              }}
            />
          </div>
          <p>
            {revised === notes.length && notes.length
              ? 'All caught up. Nicely done.'
              : 'A little progress, every session.'}
          </p>
        </div>
      </div>
      <section className="phase-section" aria-label="Course phases">
        <div className="phase-heading">
          <h2>Your course, phase by phase</h2>
          <button
            className={phase === 'all' ? 'phase-all selected' : 'phase-all'}
            onClick={() => setPhase('all')}
          >
            All phases
          </button>
        </div>
        <div className="phase-rail">
          {[0, 1, 2, 3, 4, 5].map((p) => (
            <button
              className={
                'phase-button ' + (phase === String(p) ? 'selected' : '')
              }
              key={p}
              onClick={() => {
                setPhase(String(p));
                setTopic('All topics');
                setWeek('All weeks');
              }}
            >
              <span className="phase-number">{String(p).padStart(2, '0')}</span>
              <strong>Phase {p}</strong>
              <small>
                {notes.some((n) => n.phase === p)
                  ? `${notes.filter((n) => n.phase === p).length} lectures`
                  : p > 2
                    ? 'Upcoming'
                    : 'No notes yet'}
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="library-panel">
        <div className="library-heading">
          <div>
            <h2>Lecture library</h2>
            <span>Notes from Vivek Gupta sir’s live sessions</span>
          </div>
          <div className="segmented icon-segment">
            <button
              className={layout === 'grid' ? 'active' : ''}
              aria-label="Grid view"
              onClick={() => setLayout('grid')}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              className={layout === 'list' ? 'active' : ''}
              aria-label="List view"
              onClick={() => setLayout('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="filter-row">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              maxLength={150}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic, concept, or lecture…"
              aria-label="Search notes"
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </label>
          <select
            aria-label="Filter by topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option>All topics</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Filter by week"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          >
            <option>All weeks</option>
            {weeks.map((w) => (
              <option value={w} key={w}>
                {w ? `Week ${w}` : 'Bonus'}
              </option>
            ))}
          </select>
        </div>
        <div className="library-toolbar">
          <div className="tabs">
            {[
              ['all', 'All notes', notes.length],
              ['saved', 'Saved', saved],
              ['completed', 'Revised', revised],
            ].map(([key, label, count]) => (
              <button
                key={key}
                className={view === key ? 'active' : ''}
                onClick={() => setView(String(key))}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            aria-label="Sort notes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className={'notes-grid ' + (layout === 'list' ? 'list-view' : '')}>
          {filtered.map((n) => (
            <article
              key={n.id}
              className={
                'note-card ' + (states.get(n.id)?.completed ? 'is-revised' : '')
              }
            >
              <div className="card-top">
                <span className="topic-label">{n.topic}</span>
                <button
                  className={
                    'save-button ' + (states.get(n.id)?.saved ? 'saved' : '')
                  }
                  disabled={busy === n.id}
                  onClick={() => bookmark(n)}
                  aria-label={
                    states.get(n.id)?.saved
                      ? `Unsave ${n.title}`
                      : `Save ${n.title}`
                  }
                  aria-pressed={!!states.get(n.id)?.saved}
                >
                  <Bookmark
                    size={18}
                    fill={states.get(n.id)?.saved ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
              <Link href={'/notes/' + n.id} className="note-title">
                <h3>{n.title}</h3>
              </Link>
              <div className="note-meta">
                <CalendarDays size={13} />
                <span>
                  {n.date
                    ? new Date(n.date + 'T12:00:00Z').toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC',
                        },
                      )
                    : 'Bonus session'}
                </span>
                {states.get(n.id)?.completed && (
                  <span className="revised-label">
                    <Check size={12} /> Revised
                  </span>
                )}
              </div>
              <div className="note-resources">
                <span>
                  <FileText size={13} /> Digital PDF
                </span>
                {n.codeUrl && (
                  <span>
                    <Code2 size={13} /> Code
                  </span>
                )}
              </div>
              <div className="card-bottom">
                <span>
                  {n.phase >= 0 ? `PHASE ${n.phase} · ` : ''}
                  {n.week ? `Week ${String(n.week).padStart(2, '0')}` : 'BONUS'}
                </span>
                <Link href={'/notes/' + n.id}>
                  Open notes <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <Search size={30} />
            <h3>
              {Number(phase) > 2 && !filtered.length
                ? 'This phase is coming up'
                : view === 'saved'
                  ? 'Your saved notes will live here'
                  : view === 'completed'
                    ? 'Your revision journey starts here'
                    : 'No matching lectures'}
            </h3>
            <p>
              {Number(phase) > 2 && !filtered.length
                ? 'Notes will appear here as new lectures are published.'
                : view === 'saved'
                  ? 'Use the bookmark icon on a lecture to save it.'
                  : view === 'completed'
                    ? 'Mark a lecture as revised from its reading page.'
                    : 'Try another keyword or clear your filters.'}
            </p>
            <button
              className="button"
              onClick={() => {
                setView('all');
                setPhase('all');
                setQuery('');
                setTopic('All topics');
                setWeek('All weeks');
              }}
            >
              Browse all notes <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="library-footer">
          <span>
            {filtered.length} of {notes.length} lectures
          </span>
          <span>Updated as the batch learns.</span>
        </div>
      </section>
      <div className="workspace-footer">
        <span>B15 Notes · A companion for your DSA journey</span>
        <span>Lecture material by Vivek Gupta</span>
      </div>
    </Shell>
  );
}
