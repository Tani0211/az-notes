CREATE TABLE flashcard_daily_usage (
  day text PRIMARY KEY,
  clicks integer NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  "updatedAt" bigint NOT NULL
);
