import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';
export const notes = sqliteTable(
  'notes',
  {
    id: text().primaryKey(),
    title: text().notNull(),
    topic: text().notNull(),
    date: text().notNull().default(''),
    week: integer().notNull().default(0),
    phase: integer().notNull().default(-1),
    summary: text().notNull().default(''),
    driveUrl: text().notNull().default(''),
    codeUrl: text().notNull().default(''),
    fileKey: text().notNull().default(''),
    status: text().notNull().default('draft'),
    updatedAt: integer().notNull(),
  },
  (t) => [index('idx_notes_status_date').on(t.status, t.date)],
);
export const members = sqliteTable(
  'members',
  {
    id: text().primaryKey(),
    email: text().notNull(),
    name: text().notNull(),
    joinedAt: integer().notNull(),
    lastSeen: integer().notNull(),
  },
  (t) => [index('idx_members_last_seen').on(t.lastSeen)],
);
export const reading = sqliteTable(
  'reading',
  {
    userId: text().notNull(),
    noteId: text()
      .notNull()
      .references(() => notes.id),
    saved: integer().notNull().default(0),
    completed: integer().notNull().default(0),
    lastPage: integer().notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.userId, t.noteId] })],
);
export const events = sqliteTable(
  'events',
  {
    userId: text().notNull(),
    noteId: text()
      .notNull()
      .references(() => notes.id),
    kind: text().notNull(),
    bucket: integer().notNull(),
    createdAt: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.noteId, t.kind, t.bucket] }),
    index('idx_events_created').on(t.createdAt),
  ],
);
export const settings = sqliteTable('settings', {
  key: text().primaryKey(),
  value: text().notNull(),
});
export const admins = sqliteTable('admins', {
  email: text().primaryKey(),
  addedBy: text().notNull(),
  createdAt: integer().notNull(),
});
