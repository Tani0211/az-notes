'use client';
import Link from 'next/link';
import { useState } from 'react';
import { upload as uploadBlob } from '@vercel/blob/client';
import {
  Plus,
  ArrowUpRight,
  Pencil,
  ShieldCheck,
  Upload,
  ArrowLeft,
  Check,
  Trash2,
  BookOpen,
} from 'lucide-react';
import type { Note, Viewer } from '../lib/types';
import { phaseForDate, type PhasePeriod } from '../lib/calendar';
import { Shell } from './shell';
const emptyNote: Note = {
  id: '',
  title: '',
  topic: '',
  date: '',
  week: 0,
  phase: -1,
  summary: '',
  driveUrl: '',
  fileKey: '',
  status: 'draft',
};
type Props = {
  initialCalendar: PhasePeriod[];
  user: Viewer;
  initialNotes: Note[];
  ownerEmail: string;
  admins: { email: string; createdAt: number }[];
  stats: { members: number; views: number; downloads: number; active: number };
  trend: { day: string; total: number }[];
  popular: { title: string; total: number }[];
};
export function AdminView({
  initialCalendar,
  user,
  initialNotes,
  ownerEmail,
  admins,
  stats,
  trend,
  popular,
}: Props) {
  const [calendar, setCalendar] = useState(initialCalendar);
  const [chartNow] = useState(() => Date.now());
  const [tab, setTab] = useState('notes'),
    [notes, setNotes] = useState(initialNotes),
    [edit, setEdit] = useState<Note | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [team, setTeam] = useState(admins),
    [email, setEmail] = useState(''),
    [search, setSearch] = useState('');
  function field<K extends keyof Note>(key: K, value: Note[K]) {
    setEdit((n) => (n ? { ...n, [key]: value } : null));
  }
  async function save(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch(edit.id ? '/api/notes/' + edit.id : '/api/notes', {
        method: edit.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify(edit),
      });
      const d = (await r.json()) as { id: string; key: string; error?: string };
      if (!r.ok) throw Error(d.error);
      setNotes((ns) => [
        { ...edit, id: d.id, updatedAt: Date.now() },
        ...ns.filter((n) => n.id !== d.id),
      ]);
      setMessage(
        edit.status === 'published'
          ? 'Lecture published. Students can read it now.'
          : 'Draft saved. Only the notes team can see it.',
      );
      setEdit(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save lecture.');
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setError('');
    setMessage('');
    if (file.size > 30 * 1024 * 1024) {
      setError('Choose a PDF no larger than 30 MB.');
      return;
    }
    setBusy(true);
    try {
      const pathname = `notes/${crypto.randomUUID()}.pdf`;
      const blob = await uploadBlob(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/upload',
        headers: { 'x-az-notes-action': '1' },
        multipart: true,
        contentType: 'application/pdf',
      });
      const r = await fetch('/api/upload/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify({ pathname: blob.pathname }),
      });
      const d = (await r.json()) as { key: string; error?: string };
      if (!r.ok) throw Error(d.error);
      field('fileKey', d.key);
      setMessage(`${file.name} uploaded. Save the lecture to attach it.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }
  async function access(action: 'add' | 'remove', target: string) {
    if (
      action === 'remove' &&
      !window.confirm(
        'Remove admin access for ' +
          target +
          '? They will keep student access.',
      )
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify({ email: target, action }),
      });
      const d = (await r.json()) as { id: string; key: string; error?: string };
      if (!r.ok) throw Error(d.error);
      const normalized = target.trim().toLowerCase();
      setTeam((t) =>
        action === 'add'
          ? [
              ...t.filter((x) => x.email !== normalized),
              { email: normalized, createdAt: Date.now() },
            ]
          : t.filter((x) => x.email !== normalized),
      );
      setEmail('');
      setMessage(
        action === 'add'
          ? 'Admin access granted. They can sign in with that email.'
          : 'Admin access removed.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change access.');
    } finally {
      setBusy(false);
    }
  }
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(chartNow - (6 - i) * 86400000);
    const key = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
    return {
      day: date.toLocaleDateString('en-IN', {
        weekday: 'short',
        timeZone: 'Asia/Kolkata',
      }),
      total: trend.find((t) => t.day === key)?.total || 0,
    };
  });
  const max = Math.max(1, ...chartDays.map((d) => d.total));
  return (
    <Shell user={user} active="admin">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={14} /> {user.owner ? 'OWNER' : 'ADMIN'} WORKSPACE
          </span>
          <h1>A better week of notes</h1>
          <p>
            Publish lectures, care for the collection, and see how students use
            it.
          </p>
        </div>
        {!edit && (
          <button
            className="button primary"
            onClick={() => {
              setEdit({ ...emptyNote });
              setTab('notes');
              setError('');
              setMessage('');
            }}
          >
            <Plus size={17} /> Add lecture
          </button>
        )}
      </div>
      <div className="tabs admin-tabs">
        {[
          ['notes', 'Manage notes'],
          ['analytics', 'Usage'],
          ['calendar', 'Course calendar'],
          ...(user.owner ? [['team', 'Admin access']] : []),
          ['guide', 'Publishing guide'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={tab === k ? 'active' : ''}
            onClick={() => {
              if (
                edit &&
                !window.confirm(
                  'Leave this form? Unsaved changes will be lost.',
                )
              )
                return;
              setTab(k);
              setEdit(null);
              setError('');
              setMessage('');
            }}
          >
            {label}
          </button>
        ))}
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
      {tab === 'notes' &&
        (edit ? (
          <form className="form-panel" onSubmit={save}>
            <div className="form-heading">
              <h2>{edit.id ? 'Edit lecture' : 'New lecture'}</h2>
              <button
                className="button"
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm('Discard unsaved changes?')) setEdit(null);
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            </div>
            <div className="form-grid">
              <label className="full-span">
                Lecture title
                <input
                  required
                  maxLength={150}
                  value={edit.title}
                  onChange={(e) => field('title', e.target.value)}
                  placeholder="e.g. Backtracking Framework"
                />
              </label>
              <label>
                Topic
                <input
                  required
                  maxLength={80}
                  list="topics"
                  value={edit.topic}
                  onChange={(e) => field('topic', e.target.value)}
                  placeholder="e.g. Backtracking"
                />
                <datalist id="topics">
                  {[...new Set(notes.map((n) => n.topic))].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </datalist>
              </label>
              <label>
                Original upload date
                <input
                  type="date"
                  value={edit.date}
                  onChange={(e) => {
                    const date = e.target.value;
                    const suggestion = phaseForDate(date, calendar);
                    setEdit((n) =>
                      n
                        ? {
                            ...n,
                            date,
                            phase: suggestion?.phase ?? -1,
                            week: suggestion?.week ?? 0,
                          }
                        : null,
                    );
                  }}
                />
                <small>
                  For older notes, use the original Sheet date. Phase and week
                  are suggested automatically.
                </small>
              </label>
              <label>
                Course phase
                <select
                  value={edit.phase}
                  onChange={(e) => field('phase', Number(e.target.value))}
                >
                  <option value={-1}>Bonus / outside phases</option>
                  {[0, 1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      Phase {p}
                    </option>
                  ))}
                </select>
                <small>
                  {phaseForDate(edit.date, calendar)
                    ? 'Suggested from the course calendar. You can override it.'
                    : 'Gap week or no scheduled period. Choose a phase manually.'}
                </small>
              </label>
              <label>
                Week
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={edit.week}
                  onChange={(e) => field('week', Number(e.target.value))}
                />
                <small>
                  Use 0 for a bonus session. Use the course week from the phase
                  plan.
                </small>
              </label>
              <label>
                Visibility
                <select
                  value={edit.status}
                  onChange={(e) =>
                    field('status', e.target.value as Note['status'])
                  }
                >
                  <option value="draft">Draft — visible to admins</option>
                  <option value="published">
                    Published — visible to signed-in students
                  </option>
                </select>
              </label>
              <label className="full-span">
                What’s covered
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={edit.summary}
                  onChange={(e) => field('summary', e.target.value)}
                  placeholder="A short description of the concepts in this lecture."
                />
              </label>
              <label className="full-span">
                Digital notes — Google Drive link
                <input
                  type="url"
                  maxLength={500}
                  value={edit.driveUrl}
                  onChange={(e) => field('driveUrl', e.target.value)}
                  placeholder="https://drive.google.com/file/d/…/view"
                />
                <small>
                  Use a file sharing link. The PDF needs to be readable through
                  its Drive sharing settings.
                </small>
              </label>
              <div className="full-span upload-area">
                <label className="field">
                  <span>
                    <Upload
                      size={16}
                      style={{ display: 'inline', marginRight: 7 }}
                    />
                    Or upload a PDF
                  </span>
                  <small>
                    Up to 30 MB. An uploaded copy takes priority over the
                    digital Drive link.
                  </small>
                  <input
                    aria-label="Upload PDF"
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={busy}
                    onChange={(e) => void upload(e.target.files?.[0])}
                  />
                </label>
                {edit.fileKey && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginTop: 12,
                      fontSize: 13,
                    }}
                  >
                    <span>
                      <Check size={14} style={{ display: 'inline' }} /> PDF
                      attached
                    </span>
                    <button
                      className="button"
                      type="button"
                      disabled={busy}
                      onClick={() => field('fileKey', '')}
                    >
                      Detach upload
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <span className="muted" style={{ fontSize: 12 }}>
                {edit.status === 'draft'
                  ? 'Students cannot see this draft.'
                  : 'Saving makes these notes available to students.'}
              </span>
              <button className="button primary" disabled={busy}>
                {busy
                  ? 'Saving…'
                  : edit.status === 'published'
                    ? 'Save and publish'
                    : 'Save draft'}
              </button>
            </div>
          </form>
        ) : (
          <section className="library-panel">
            <div className="library-heading">
              <div>
                <h2>Your collection</h2>
                <span>
                  {notes.filter((n) => n.status === 'published').length}{' '}
                  published · {notes.filter((n) => n.status === 'draft').length}{' '}
                  drafts
                </span>
              </div>
              <input
                className="admin-search"
                aria-label="Search managed notes"
                placeholder="Search lectures…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>LECTURE</th>
                    <th>DATE</th>
                    <th>SOURCE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {notes
                    .filter((n) =>
                      (n.title + ' ' + n.topic)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((n) => (
                      <tr key={n.id}>
                        <td>
                          <strong>{n.title}</strong>
                          <small>
                            {n.phase >= 0 ? `Phase ${n.phase} · ` : ''}
                            {n.topic}
                          </small>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {n.date || 'Bonus'}
                        </td>
                        <td>
                          {n.fileKey
                            ? 'Uploaded PDF'
                            : n.driveUrl
                              ? 'Google Drive'
                              : 'No PDF'}
                        </td>
                        <td>
                          <span className={'status ' + n.status}>
                            {n.status === 'published' ? (
                              <Check size={12} />
                            ) : null}
                            {n.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="icon-button"
                              title="Edit lecture"
                              aria-label={'Edit ' + n.title}
                              onClick={() => {
                                setEdit({ ...n });
                                setError('');
                                setMessage('');
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <Link
                              className="icon-button"
                              title="Preview lecture"
                              aria-label={'Preview ' + n.title}
                              href={'/notes/' + n.id}
                            >
                              <ArrowUpRight size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!notes.length && (
              <div className="empty-state">
                <BookOpen size={25} />
                <h3>Your first lecture starts here</h3>
                <p>Add a lecture and attach its PDF to begin.</p>
              </div>
            )}
          </section>
        ))}
      {tab === 'analytics' && (
        <>
          <div className="stats-row">
            {[
              ['Learners who visited', stats.members],
              ['Active in the last 24h', stats.active],
              ['Lecture opens', stats.views],
              ['Download requests', stats.downloads],
            ].map(([label, total]) => (
              <div className="stat-card" key={label}>
                <span>{label}</span>
                <strong>{total}</strong>
              </div>
            ))}
          </div>
          <div className="analytics-grid">
            <section className="form-panel">
              <h2>Lecture opens</h2>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Last 7 days · India time
              </p>
              <figure
                className="chart"
                aria-label={chartDays
                  .map((d) => `${d.day}: ${d.total} opens`)
                  .join(', ')}
              >
                {chartDays.map((d, i) => (
                  <div className="chart-col" key={i}>
                    <span>{d.total}</span>
                    <div
                      className="chart-bar"
                      style={{ height: Math.max(2, (d.total / max) * 120) }}
                    />
                    <span>{d.day}</span>
                  </div>
                ))}
              </figure>
              <p className="muted" style={{ fontSize: 12 }}>
                Repeated opens by the same learner within five minutes count
                once.
              </p>
            </section>
            <section className="form-panel">
              <h2>Most-read lectures</h2>
              {popular.length ? (
                popular.map((p, i) => (
                  <div className="rank-row" key={p.title}>
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    <span>{p.title}</span>
                    <strong>{p.total}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>
                    As learners open notes, the most-read lectures will appear
                    here.
                  </p>
                </div>
              )}
            </section>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
            The header shows unique signed-in users active within two minutes.
            Downloads count successful website download requests; external Drive
            downloads are not tracked. Usage totals include admins.
          </p>
        </>
      )}
      {tab === 'calendar' && (
        <section className="form-panel">
          <h2>Your phase calendar</h2>
          <p className="admin-intro" style={{ margin: '12px 0 25px' }}>
            New notes are assigned a phase and course week from their original
            upload date. Leave future periods empty until scheduled. Dates
            outside these ranges, including gap weeks, need a manual phase
            choice. Updating the calendar changes future suggestions; existing
            notes keep their saved phase.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              setMessage('');
              try {
                const r = await fetch('/api/calendar', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-az-notes-action': '1',
                  },
                  body: JSON.stringify(calendar),
                });
                const d = (await r.json()) as { error?: string };
                if (!r.ok) throw Error(d.error);
                setMessage(
                  'Course calendar saved. New upload dates will use these phase periods.',
                );
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : 'Could not save the calendar.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PHASE</th>
                    <th>START DATE</th>
                    <th>END DATE</th>
                    <th>COURSE WEEKS</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((p, i) => (
                    <tr key={p.phase}>
                      <td>
                        <strong>Phase {p.phase}</strong>
                      </td>
                      <td>
                        <input
                          className="calendar-date"
                          type="date"
                          aria-label={'Phase ' + p.phase + ' start'}
                          value={p.start}
                          onChange={(e) =>
                            setCalendar((c) =>
                              c.map((x, j) =>
                                j === i ? { ...x, start: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="calendar-date"
                          type="date"
                          aria-label={'Phase ' + p.phase + ' end'}
                          value={p.end}
                          onChange={(e) =>
                            setCalendar((c) =>
                              c.map((x, j) =>
                                j === i ? { ...x, end: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>
                        {p.phase * 4 + 1}–{p.phase * 4 + 4}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button className="button primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save phase calendar'}
              </button>
            </div>
          </form>
        </section>
      )}
      {tab === 'team' && user.owner && (
        <section className="form-panel">
          <h2>Share the publishing work</h2>
          <p className="admin-intro" style={{ marginTop: 12 }}>
            Admins can publish and edit lectures, upload PDFs, and view usage
            statistics. Only you, the owner, can change admin access.
          </p>
          <form
            className="team-form"
            onSubmit={(e) => {
              e.preventDefault();
              void access('add', email);
            }}
          >
            <label className="field">
              New admin’s email
              <input
                type="email"
                maxLength={254}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </label>
            <button className="button primary" disabled={busy}>
              <Plus size={16} /> Grant access
            </button>
          </form>
          <p className="muted mb-20" style={{ fontSize: 12 }}>
            They must sign in with this email. This grants access; it does not
            send an invitation email.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ACCOUNT</th>
                  <th>ROLE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{ownerEmail}</td>
                  <td>
                    <span className="pill">Owner</span>
                  </td>
                  <td className="muted">Permanent</td>
                </tr>
                {team.map((a) => (
                  <tr key={a.email}>
                    <td>{a.email}</td>
                    <td>
                      <span className="status">Admin</span>
                    </td>
                    <td>
                      <button
                        disabled={busy}
                        className="button"
                        onClick={() => void access('remove', a.email)}
                      >
                        <Trash2 size={14} /> Remove access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 'guide' && (
        <section className="form-panel">
          <h2>Your weekly publishing routine</h2>
          <ol className="help-list">
            <li>
              <strong>Add a lecture.</strong> Enter its title, topic, date,
              week, and a short description.
            </li>
            <li>
              <strong>Attach the notes.</strong> Paste a Drive file link or
              upload a PDF of up to 30 MB.
            </li>
            <li>
              <strong>Save a draft.</strong> Open its preview from the
              collection and check the correct PDF and links are attached.
            </li>
            <li>
              <strong>Publish.</strong> Change visibility to Published and save.
              Signed-in students can now open it.
            </li>
            <li>
              <strong>Correct later.</strong> Edit the same lecture to replace
              its PDF. Its website link and students’ bookmarks stay the same.
              Change it back to Draft to withdraw it.
            </li>
          </ol>
          <div className="notice">
            Uploaded PDFs are served through the website’s login checks. Drive
            files keep their existing Google sharing settings, so someone who
            already has a public Drive link can still open it outside this
            website.
          </div>
          <h3 style={{ margin: '25px 0 10px' }}>What your students can do</h3>
          <p className="admin-intro">
            Sign in, search by topic or week, read your digital PDFs, bookmark
            lectures, save a page number, and mark lectures as revised. Their
            revision state is stored in their account.
          </p>
        </section>
      )}
    </Shell>
  );
}
