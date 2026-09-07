CREATE TABLE notes (
  id text PRIMARY KEY,
  title text NOT NULL,
  topic text NOT NULL,
  date text NOT NULL DEFAULT '',
  week integer NOT NULL DEFAULT 0,
  phase integer NOT NULL DEFAULT -1 CHECK (phase BETWEEN -1 AND 5),
  summary text NOT NULL DEFAULT '',
  "driveUrl" text NOT NULL DEFAULT '',
  "codeUrl" text NOT NULL DEFAULT '',
  "fileKey" text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  "updatedAt" bigint NOT NULL
);
CREATE INDEX idx_notes_status_date ON notes (status, date);

CREATE TABLE members (
  id text PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  "joinedAt" bigint NOT NULL,
  "lastSeen" bigint NOT NULL
);
CREATE INDEX idx_members_last_seen ON members ("lastSeen");

CREATE TABLE reading (
  "userId" text NOT NULL,
  "noteId" text NOT NULL REFERENCES notes(id),
  saved integer NOT NULL DEFAULT 0 CHECK (saved IN (0, 1)),
  completed integer NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  "lastPage" integer NOT NULL DEFAULT 1 CHECK ("lastPage" > 0),
  PRIMARY KEY ("userId", "noteId")
);

CREATE TABLE events (
  "userId" text NOT NULL,
  "noteId" text NOT NULL REFERENCES notes(id),
  kind text NOT NULL CHECK (kind IN ('view', 'download')),
  bucket bigint NOT NULL,
  "createdAt" bigint NOT NULL,
  PRIMARY KEY ("userId", "noteId", kind, bucket)
);
CREATE INDEX idx_events_created ON events ("createdAt");

CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE admins (
  email text PRIMARY KEY,
  "addedBy" text NOT NULL,
  "createdAt" bigint NOT NULL
);
