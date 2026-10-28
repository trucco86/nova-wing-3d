-- Prevent a queued score start from recreating an account after deletion.
-- Deletion tombstones contain only the Firebase UID and a deletion timestamp.
-- They are not exposed publicly and MUST have a retention/privacy policy before PROD.
-- Enforced by atomic Worker D1 batch() operations on start and DELETE /v1/me.
CREATE TABLE IF NOT EXISTS deleted_player_uids (
  uid TEXT PRIMARY KEY NOT NULL,
  deleted_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS deleted_player_uids_deleted_at ON deleted_player_uids (deleted_at);
