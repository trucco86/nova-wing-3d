-- Provisional player history is separate from the official verified leaderboard.
-- Scores submitted by browsers must NEVER be labeled verified by this migration.
CREATE TABLE IF NOT EXISTS provisional_runs (
  run_id TEXT PRIMARY KEY NOT NULL,
  uid TEXT NOT NULL REFERENCES players(uid) ON DELETE CASCADE,
  season_id TEXT NOT NULL,
  nonce_hash TEXT NOT NULL UNIQUE,
  started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
  sector INTEGER NOT NULL CHECK (sector BETWEEN 1 AND 10),
  points INTEGER CHECK (points BETWEEN 0 AND 1000000),
  duration_ms INTEGER CHECK (duration_ms BETWEEN 1 AND 7200000),
  completed_at INTEGER,
  build_sha TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS provisional_runs_by_player
  ON provisional_runs (uid, started_at DESC);
CREATE INDEX IF NOT EXISTS provisional_runs_leaderboard
  ON provisional_runs (season_id, status, points DESC, completed_at ASC);
