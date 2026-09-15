CREATE TABLE flashcard_sets (
  id text PRIMARY KEY,
  name text NOT NULL,
  topic text NOT NULL,
  phase integer NOT NULL DEFAULT -1 CHECK (phase BETWEEN -1 AND 5),
  tag text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  "fileName" text NOT NULL DEFAULT '',
  "cardCount" integer NOT NULL DEFAULT 0 CHECK ("cardCount" >= 0),
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);
CREATE INDEX idx_flashcard_sets_status_topic
  ON flashcard_sets (status, topic, "createdAt" DESC);

CREATE TABLE flashcards (
  id text PRIMARY KEY,
  "setId" text NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL,
  UNIQUE ("setId", position)
);
CREATE INDEX idx_flashcards_set_position ON flashcards ("setId", position);

CREATE TABLE short_notes (
  id text PRIMARY KEY,
  title text NOT NULL,
  topic text NOT NULL,
  phase integer NOT NULL DEFAULT -1 CHECK (phase BETWEEN -1 AND 5),
  tag text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'cpp',
  "imageKey" text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  "createdAt" bigint NOT NULL,
  "updatedAt" bigint NOT NULL
);
CREATE INDEX idx_short_notes_status_topic
  ON short_notes (status, topic, "createdAt" DESC);
