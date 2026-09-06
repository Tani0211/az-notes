import initialCalendar from '../content/phase-calendar.json';
import type { PhasePeriod } from './calendar';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { googleUser } from './google-auth';
import { redirect } from 'next/navigation';
import seed from '../content/seed.json';
import type { Note, Viewer, ReadingState } from './types';
export const ADMIN_EMAIL = 'singhalrashmi0211@gmail.com';
export const db = () => env.DB;
export const files = () => env.FILES;
export const isAdmin = (email: string) =>
  email.trim().toLowerCase() === ADMIN_EMAIL;
export async function viewer(
  required = false,
  path = '/library',
): Promise<Viewer | null> {
  const google = await googleUser();
  const user = google || (await getChatGPTUser());
  if (!user && required) redirect('/?returnTo=' + encodeURIComponent(path));
  if (!user) return null;
  const owner = isAdmin(user.email);
  const granted = owner
    ? true
    : !!(await db()
        .prepare('SELECT email FROM admins WHERE email=?')
        .bind(user.email.trim().toLowerCase())
        .first());
  return {
    userId: user.userId,
    email: user.email,
    displayName: user.fullName || 'Learner',
    admin: granted,
    owner,
    signOutPath: google
      ? '/api/auth/signout?callbackUrl=' +
        encodeURIComponent('/signout-with-chatgpt?return_to=/')
      : '/signout-with-chatgpt?return_to=/',
  };
}
export async function initialize() {
  const ready = await db()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind('b15-seed-v1')
    .first();
  if (ready) return;
  const statements = seed.map((n) =>
    db()
      .prepare(
        'INSERT OR IGNORE INTO notes (id,title,topic,date,week,phase,summary,driveUrl,codeUrl,fileKey,status,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        n.id,
        n.title,
        n.topic,
        n.date,
        n.week,
        n.phase,
        n.summary,
        n.driveUrl,
        n.codeUrl,
        '',
        'published',
        Date.now(),
      ),
  );
  statements.push(
    db()
      .prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)')
      .bind('b15-seed-v1', 'imported'),
  );
  await db().batch(statements);
}
export async function listNotes(admin = false) {
  await initialize();
  const { results } = await db()
    .prepare(
      admin
        ? 'SELECT * FROM notes ORDER BY date DESC,id DESC'
        : "SELECT * FROM notes WHERE status = 'published' ORDER BY date DESC,id DESC",
    )
    .all<Note>();
  return results;
}
export async function findNote(id: string, admin = false) {
  await initialize();
  const note = await db()
    .prepare('SELECT * FROM notes WHERE id = ?')
    .bind(id)
    .first<Note>();
  return note && (note.status === 'published' || admin) ? note : null;
}
export async function readingState(userId: string) {
  const { results } = await db()
    .prepare(
      'SELECT noteId,saved,completed,lastPage FROM reading WHERE userId = ?',
    )
    .bind(userId)
    .all<ReadingState>();
  return results;
}
export async function touch(user: Viewer) {
  const now = Date.now();
  await db()
    .prepare(
      'INSERT INTO members (id,email,name,joinedAt,lastSeen) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,lastSeen=excluded.lastSeen',
    )
    .bind(user.userId, user.email, user.displayName, now, now)
    .run();
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return (
    req.headers.get('x-b15-action') === '1' &&
    (!origin || origin === new URL(req.url).origin)
  );
}
export async function apiUser(req?: Request, admin = false) {
  const user = await viewer();
  if (!user) throw new ApiError('Please sign in to continue.', 401);
  if (admin && !user.admin)
    throw new ApiError('Admin access is required.', 403);
  if (req && !sameOrigin(req))
    throw new ApiError('This request must come from the website.', 403);
  return user;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}
export function driveId(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'drive.google.com')
      return null;
    const id =
      u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ||
      u.searchParams.get('id');
    return id && /^[A-Za-z0-9_-]{10,150}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function validateNote(input: unknown): Omit<Note, 'id' | 'updatedAt'> {
  if (!input || typeof input !== 'object')
    throw new ApiError('Lecture details are required.');
  const n = input as Record<string, unknown>;
  const str = (key: string, max: number) => {
    const v = n[key] ?? '';
    if (typeof v !== 'string' || v.length > max)
      throw new ApiError('Please check the ' + key + ' field.');
    return v.trim();
  };
  const title = str('title', 150),
    topic = str('topic', 80),
    date = str('date', 10),
    summary = str('summary', 3000),
    driveUrl = str('driveUrl', 500),
    codeUrl = str('codeUrl', 500),
    fileKey = str('fileKey', 200);
  const week = Number(n.week ?? 0);
  const phase = Number(n.phase ?? -1);
  if (!Number.isInteger(phase) || phase < -1 || phase > 5)
    throw new ApiError('Choose a phase from 0 to 5.');
  if (!title || !topic) throw new ApiError('A title and topic are required.');
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)))
  )
    throw new ApiError('Choose a valid lecture date.');
  if (!Number.isInteger(week) || week < 0 || week > 200)
    throw new ApiError('Week must be between 0 and 200.');
  for (const url of [driveUrl])
    if (url && !driveId(url))
      throw new ApiError('Use a Google Drive file sharing link.');
  if (codeUrl) {
    let valid = false;
    try {
      const u = new URL(codeUrl);
      valid =
        u.protocol === 'https:' &&
        ['gist.github.com', 'github.com'].includes(u.hostname);
    } catch {}
    if (!valid) throw new ApiError('Use an HTTPS GitHub or GitHub Gist link.');
  }
  if (fileKey && !/^notes\/[a-f0-9-]+\.pdf$/.test(fileKey))
    throw new ApiError('Invalid uploaded file.');
  const status =
    n.status === 'published'
      ? 'published'
      : n.status === 'draft'
        ? 'draft'
        : null;
  if (!status) throw new ApiError('Choose draft or published.');
  if (status === 'published' && !driveUrl && !fileKey)
    throw new ApiError('Add a PDF upload or Drive link before publishing.');
  return {
    title,
    topic,
    date,
    week,
    phase,
    summary,
    driveUrl,
    codeUrl,
    fileKey,
    status,
  };
}

export async function getCalendar(): Promise<PhasePeriod[]> {
  const row = await db()
    .prepare('SELECT value FROM settings WHERE key=?')
    .bind('phase-calendar')
    .first<{ value: string }>();
  return row ? JSON.parse(row.value) : initialCalendar;
}
