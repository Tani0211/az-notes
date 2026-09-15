'use client';

import { upload as uploadBlob } from '@vercel/blob/client';
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { ShortNote } from '../lib/types';

const emptyShortNote: ShortNote = {
  id: '',
  title: '',
  topic: '',
  phase: -1,
  tag: '',
  source: '',
  body: '',
  code: '',
  language: 'cpp',
  imageKey: '',
  status: 'draft',
  createdAt: 0,
  updatedAt: 0,
};

export function AdminShortNotes({
  initialNotes,
}: {
  initialNotes: ShortNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [edit, setEdit] = useState<ShortNote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  function field<K extends keyof ShortNote>(key: K, value: ShortNote[K]) {
    setEdit((note) => (note ? { ...note, [key]: value } : null));
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setError('');
    setMessage('');
    if (file.size > 10 * 1024 * 1024) {
      setError('Choose an image no larger than 10 MB.');
      return;
    }
    const extensions: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const extension = extensions[file.type];
    if (!extension) {
      setError('Use a PNG, JPEG, or WebP image.');
      return;
    }
    setBusy(true);
    try {
      const pathname = `short-notes/${crypto.randomUUID()}.${extension}`;
      const blob = await uploadBlob(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/upload',
        headers: { 'x-az-notes-action': '1' },
        contentType: file.type,
      });
      const response = await fetch('/api/upload/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify({ pathname: blob.pathname }),
      });
      const result = (await response.json()) as {
        key?: string;
        error?: string;
      };
      if (!response.ok || !result.key) throw Error(result.error);
      field('imageKey', result.key);
      setMessage(`${file.name} uploaded. Save the short note to attach it.`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Image upload failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(
        edit.id ? `/api/short-notes/${edit.id}` : '/api/short-notes',
        {
          method: edit.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-az-notes-action': '1',
          },
          body: JSON.stringify(edit),
        },
      );
      const result = (await response.json()) as ShortNote & {
        id?: string;
        error?: string;
      };
      if (!response.ok) throw Error(result.error);
      const saved = edit.id
        ? { ...edit, updatedAt: Date.now() }
        : { ...edit, ...result };
      setNotes((current) => [
        saved,
        ...current.filter((note) => note.id !== saved.id),
      ]);
      setEdit(null);
      setMessage(
        saved.status === 'published'
          ? 'Short note published.'
          : 'Short note saved as a draft.',
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save note.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(note: ShortNote) {
    if (!window.confirm(`Permanently delete “${note.title}”?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/short-notes/${note.id}`, {
        method: 'DELETE',
        headers: { 'x-az-notes-action': '1' },
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw Error(result.error);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setEdit(null);
      setMessage('Short note deleted.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not delete note.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <p className="notice error">{error}</p>}
      {message && <output className="notice">{message}</output>}
      {edit ? (
        <form className="form-panel content-manager" onSubmit={save}>
          <div className="form-heading">
            <div>
              <span className="section-kicker">SHORT NOTE</span>
              <h2>{edit.id ? 'Edit post' : 'Create a short post'}</h2>
            </div>
            <button
              className="button"
              type="button"
              onClick={() => setEdit(null)}
            >
              <ArrowLeft size={15} /> Back
            </button>
          </div>
          <div className="form-grid">
            <label>
              Title
              <input
                required
                maxLength={150}
                value={edit.title}
                onChange={(event) => field('title', event.target.value)}
                placeholder="e.g. Binary search boundary checklist"
              />
            </label>
            <label>
              Topic
              <input
                required
                maxLength={80}
                list="short-note-topics"
                value={edit.topic}
                onChange={(event) => field('topic', event.target.value)}
                placeholder="e.g. Binary Search"
              />
              <datalist id="short-note-topics">
                {[...new Set(notes.map((note) => note.topic))].map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </datalist>
            </label>
            <label>
              Phase
              <select
                value={edit.phase}
                onChange={(event) => field('phase', Number(event.target.value))}
              >
                <option value={-1}>Outside phases / general</option>
                {[0, 1, 2, 3, 4, 5].map((phase) => (
                  <option key={phase} value={phase}>
                    Phase {phase}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tag
              <input
                maxLength={200}
                value={edit.tag}
                onChange={(event) => field('tag', event.target.value)}
                placeholder="e.g. checklist, common mistake"
              />
            </label>
            <label>
              Source
              <input
                maxLength={500}
                value={edit.source}
                onChange={(event) => field('source', event.target.value)}
                placeholder="Optional lecture, book, or URL"
              />
            </label>
            <label>
              Visibility
              <select
                value={edit.status}
                onChange={(event) =>
                  field('status', event.target.value as ShortNote['status'])
                }
              >
                <option value="draft">Draft — admin only</option>
                <option value="published">Published — student workspace</option>
              </select>
            </label>
            <label className="full-span">
              Short explanation
              <textarea
                rows={7}
                maxLength={12000}
                value={edit.body}
                onChange={(event) => field('body', event.target.value)}
                placeholder="Write a brief explanation, checklist, formula, or mistake to remember. Plain text and line breaks are preserved."
              />
            </label>
            <label>
              Code language
              <input
                maxLength={30}
                value={edit.language}
                onChange={(event) => field('language', event.target.value)}
                placeholder="cpp"
              />
            </label>
            <label className="full-span">
              Optional code snippet
              <textarea
                className="code-input"
                rows={9}
                maxLength={12000}
                value={edit.code}
                onChange={(event) => field('code', event.target.value)}
                placeholder="Paste only the small piece of code needed for this note."
              />
            </label>
            <div className="full-span upload-area">
              <label className="field">
                <span>
                  <ImagePlus size={16} /> Optional handwritten or digital image
                </span>
                <small>
                  PNG, JPEG, or WebP up to 10 MB. One image per post.
                </small>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={busy}
                  onChange={(event) =>
                    void uploadImage(event.target.files?.[0])
                  }
                />
              </label>
              {edit.imageKey && (
                <div className="attached-file">
                  <span>
                    <Check size={14} /> Image attached
                  </span>
                  <button
                    className="button"
                    type="button"
                    disabled={busy}
                    onClick={() => field('imageKey', '')}
                  >
                    Detach image
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions split-actions">
            {edit.id ? (
              <button
                className="button danger"
                type="button"
                disabled={busy}
                onClick={() => void remove(edit)}
              >
                <Trash2 size={15} /> Delete post
              </button>
            ) : (
              <span />
            )}
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
              <h2>Short Notes</h2>
              <span>Small topic-wise posts, separate from lecture PDFs</span>
            </div>
            <div className="manager-header-actions">
              <input
                className="admin-search"
                aria-label="Search short notes"
                placeholder="Search posts…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="button primary"
                onClick={() => {
                  setEdit({ ...emptyShortNote });
                  setError('');
                  setMessage('');
                }}
              >
                <Plus size={16} /> Add short note
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>POST</th>
                  <th>FORMAT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {notes
                  .filter((note) =>
                    `${note.title} ${note.topic} ${note.tag}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((note) => (
                    <tr key={note.id}>
                      <td>
                        <strong>{note.title}</strong>
                        <small>
                          {note.phase >= 0 ? `Phase ${note.phase} · ` : ''}
                          {note.topic}
                        </small>
                      </td>
                      <td>
                        {[
                          note.body && 'Text',
                          note.code && 'Code',
                          note.imageKey && 'Image',
                        ]
                          .filter(Boolean)
                          .join(' + ')}
                      </td>
                      <td>
                        <span className={'status ' + note.status}>
                          {note.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${note.title}`}
                          onClick={() => {
                            setEdit({ ...note });
                            setError('');
                            setMessage('');
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!notes.length && (
            <div className="empty-state">
              <ImagePlus size={28} />
              <h3>No short notes yet</h3>
              <p>
                Add a small text, image, or code post whenever you have time.
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
