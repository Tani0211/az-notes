/* oxlint-disable react/react-compiler -- Request-time analytics on a dynamic server page. */
import Link from 'next/link';
import {
  viewer,
  listNotes,
  db,
  ADMIN_EMAIL,
  getCalendar,
} from '../../lib/server';
import { AdminView } from '../../components/admin';
import { Shell } from '../../components/shell';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const user = await viewer(true, '/admin');
  if (!user!.admin)
    return (
      <Shell user={user!}>
        <div className="empty-state">
          <h1>Admin access required</h1>
          <p>
            This workspace is for the notes team. Ask the owner to grant access
            to your sign-in email.
          </p>
          <Link className="button" href="/library">
            Back to library
          </Link>
        </div>
      </Shell>
    );
  const notes = await listNotes(true);
  const [members, views, downloads, active, trend, popular, admins] =
    await Promise.all([
      db()
        .prepare('SELECT COUNT(*) AS total FROM members')
        .first<{ total: number }>(),
      db()
        .prepare("SELECT COUNT(*) AS total FROM events WHERE kind='view'")
        .first<{ total: number }>(),
      db()
        .prepare("SELECT COUNT(*) AS total FROM events WHERE kind='download'")
        .first<{ total: number }>(),
      db()
        .prepare('SELECT COUNT(*) AS total FROM members WHERE lastSeen>=?')
        .bind(Date.now() - 86400000)
        .first<{ total: number }>(),
      db()
        .prepare(
          "SELECT to_char(to_timestamp(createdAt / 1000.0) AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, COUNT(*) AS total FROM events WHERE createdAt>=? AND kind='view' GROUP BY day ORDER BY day",
        )
        .bind(Date.now() - 7 * 86400000)
        .all<{ day: string; total: number }>(),
      db()
        .prepare(
          "SELECT notes.title,COUNT(*) AS total FROM events JOIN notes ON notes.id=events.noteId WHERE events.kind='view' GROUP BY notes.id, notes.title ORDER BY total DESC LIMIT 5",
        )
        .all<{ title: string; total: number }>(),
      user!.owner
        ? db()
            .prepare(
              'SELECT email,createdAt FROM admins ORDER BY createdAt DESC',
            )
            .all<{ email: string; createdAt: number }>()
        : Promise.resolve({ results: [] }),
    ]);
  return (
    <AdminView
      user={user!}
      initialCalendar={await getCalendar()}
      initialNotes={notes}
      ownerEmail={ADMIN_EMAIL}
      admins={admins.results}
      stats={{
        members: members?.total || 0,
        views: views?.total || 0,
        downloads: downloads?.total || 0,
        active: active?.total || 0,
      }}
      trend={trend.results}
      popular={popular.results}
    />
  );
}
