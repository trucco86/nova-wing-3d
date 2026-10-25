-- Initial schema only. Do NOT migrate against production until security and privacy review.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  uid TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 2 AND 24),
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seasons (
  season_id TEXT PRIMARY KEY NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  rule_set TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1))
);

CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY NOT NULL,
  uid TEXT NOT NULL REFERENCES players(uid) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES seasons(season_id),
  build_sha TEXT NOT NULL,
  nonce_hash TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  idempotency_key TEXT NOT NULL,
  UNIQUE (uid, idempotency_key)
);

CREATE TABLE IF NOT EXISTS scores (
  score_id TEXT PRIMARY KEY NOT NULL,
  run_id TEXT NOT NULL UNIQUE REFERENCES runs(run_id) ON DELETE CASCADE,
  uid TEXT NOT NULL REFERENCES players(uid) ON DELETE CASCADE,
  season_id TEXT NOT NULL REFERENCES seasons(season_id),
  points INTEGER NOT NULL CHECK (points >= 0),
  sector INTEGER NOT NULL CHECK (sector BETWEEN 1 AND 10),
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  verdict TEXT NOT NULL CHECK (verdict IN ('verified', 'rejected')),
  verified_at TEXT NOT NULL,
  verdict_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  season_id TEXT NOT NULL REFERENCES seasons(season_id),
  uid TEXT NOT NULL REFERENCES players(uid),
  best_score_id TEXT NOT NULL REFERENCES scores(score_id),
  PRIMARY KEY (season_id, uid)
);

CREATE INDEX IF NOT EXISTS scores_by_season ON scores (season_id, points DESC, verified_at);
CREATE INDEX IF NOT EXISTS runs_by_player ON runs (uid, started_at);

-- Match the read-only Worker query's season + verified-score filtering.
CREATE INDEX IF NOT EXISTS scores_verified_season
  ON scores (season_id, verdict, points DESC, verified_at ASC);
CREATE INDEX IF NOT EXISTS runs_status_by_player
  ON runs (uid, status, expires_at);
