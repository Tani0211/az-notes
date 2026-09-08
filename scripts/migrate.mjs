import postgres from 'postgres';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Prefer the direct Neon endpoint for administrative migrations. Runtime
// requests can keep using the pooled DATABASE_URL provided by Vercel.
const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error(
    'Set DATABASE_URL (or DATABASE_URL_UNPOOLED) before running migrations.',
  );
  process.exit(1);
}

const sql = postgres(url, {
  max: 1,
  prepare: false,
  ssl: 'require',
  connect_timeout: 15,
});
const folder = new URL('../db/migrations/', import.meta.url);
try {
  const migrations = (await readdir(folder))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  await sql.begin(async (transaction) => {
    await transaction`SELECT pg_advisory_xact_lock(15150001)`;
    await transaction`
      CREATE TABLE IF NOT EXISTS az_notes_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    for (const name of migrations) {
      const source = await readFile(new URL(name, folder), 'utf8');
      const checksum = createHash('sha256').update(source).digest('hex');
      const [applied] =
        await transaction`SELECT checksum FROM az_notes_migrations WHERE name = ${name}`;
      if (applied) {
        if (applied.checksum !== checksum)
          throw new Error('Applied migration changed: ' + name);
        continue;
      }
      await transaction.unsafe(source);
      await transaction`INSERT INTO az_notes_migrations (name, checksum) VALUES (${name}, ${checksum})`;
      console.log('Applied ' + name);
    }

    // Seed only the supplied digital notes. Re-running never overwrites the
    // owner's published edits, calendar changes, or reading history.
    const [seeded] =
      await transaction`SELECT value FROM settings WHERE key = 'az-notes-seed-v1'`;
    if (!seeded) {
      const notes = JSON.parse(
        await readFile(
          new URL('../content/seed.json', import.meta.url),
          'utf8',
        ),
      );
      for (const note of notes) {
        await transaction`
          INSERT INTO notes (id, title, topic, date, week, phase, summary, "driveUrl", "fileKey", status, "updatedAt")
          VALUES (${note.id}, ${note.title}, ${note.topic}, ${note.date}, ${note.week}, ${note.phase}, ${note.summary}, ${note.driveUrl}, '', 'published', ${Date.now()})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      await transaction`INSERT INTO settings (key, value) VALUES ('az-notes-seed-v1', 'imported') ON CONFLICT DO NOTHING`;
      console.log('Imported ' + notes.length + ' digital notes.');
    }
    const calendar = JSON.parse(
      await readFile(
        new URL('../content/phase-calendar.json', import.meta.url),
        'utf8',
      ),
    );
    await transaction`INSERT INTO settings (key, value) VALUES ('phase-calendar', ${JSON.stringify(calendar)}) ON CONFLICT DO NOTHING`;
  });
  console.log('Database migrations and seed are ready.');
} catch (error) {
  // Database drivers can include connection metadata in errors; only emit the
  // actionable message and code, never the URL or an entire error object.
  console.error(
    'Migration failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  if (error && typeof error === 'object' && 'code' in error)
    console.error('Code:', error.code);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
