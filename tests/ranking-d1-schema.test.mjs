import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const schema = readFileSync(
  new URL('../workers/ranking/migrations/0001_initial.sql', import.meta.url),
  'utf8',
);


const provisionalSchema = readFileSync(
  new URL('../workers/ranking/migrations/0002_provisional_history.sql', import.meta.url),
  'utf8',
);
const deletionSchema = readFileSync(
  new URL('../workers/ranking/migrations/0003_account_deletion_tombstones.sql', import.meta.url),
  'utf8',
);

test('D1 candidate schema creates all tables and leaderboard query index', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(schema);
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name);
    for (const name of ['players', 'seasons', 'runs', 'scores', 'leaderboard_entries']) {
      assert.ok(names.includes(name), `missing table ${name}`);
    }
    assert.ok(
      db.prepare("SELECT name FROM sqlite_master WHERE name = 'scores_verified_season'").get(),
      'verified score lookup must be indexed',
    );
    const query = db
      .prepare(
        'EXPLAIN QUERY PLAN SELECT points FROM scores WHERE season_id = ? AND verdict = ? ORDER BY points DESC, verified_at ASC LIMIT 20',
      )
      .all('s1', 'verified');
    assert.ok(query.some((step) => String(step.detail).includes('scores_verified_season')));
  } finally {
    db.close();
  }
});

test('D1 candidate schema deletes player-linked ranking rows and rejects replay keys', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(schema);
    db.prepare(
      'INSERT INTO players (uid, nickname, consent_at, created_at) VALUES (?, ?, ?, ?)',
    ).run('u1', 'Pilot', '2026-10-25', '2026-10-25');
    db.prepare(
      'INSERT INTO seasons (season_id, starts_at, ends_at, rule_set) VALUES (?, ?, ?, ?)',
    ).run('s1', '2026-10-25', '2026-12-25', 'v1');
    const run = (id, nonce, key) =>
      db
        .prepare(
          "INSERT INTO runs (run_id, uid, season_id, build_sha, nonce_hash, started_at, expires_at, status, idempotency_key) VALUES (?, 'u1', 's1', 'sha', ?, '2026-10-25', '2026-10-26', 'pending', ?)",
        )
        .run(id, nonce, key);
    run('r1', 'nonce1', 'key1');
    assert.throws(() => run('r2', 'nonce2', 'key1'), /UNIQUE/);
    assert.throws(() => run('r2', 'nonce1', 'key2'), /UNIQUE/);
    db.prepare(
      "INSERT INTO scores (score_id, run_id, uid, season_id, points, sector, duration_ms, verdict, verified_at, verdict_version) VALUES ('sc1', 'r1', 'u1', 's1', 100, 2, 1000, 'verified', '2026-10-25', 'v1')",
    ).run();
    db.prepare(
      "INSERT INTO leaderboard_entries (season_id, uid, best_score_id) VALUES ('s1', 'u1', 'sc1')",
    ).run();
    db.prepare("DELETE FROM players WHERE uid = 'u1'").run();
    for (const name of ['players', 'runs', 'scores', 'leaderboard_entries']) {
      assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${name}`).get().n, 0, `orphaned ${name}`);
    }
  } finally {
    db.close();
  }
});

test('SQLite D1 schema prevents score resurrection after DELETE while preserving other users', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(schema);
    db.exec(provisionalSchema);
    db.exec(deletionSchema);
    const uid = 'player-a';
    const nick = 'Alpha';
    const stamp = '2026-10-27';
    const playerSql =
      'INSERT INTO players (uid,nickname,consent_at,created_at) ' +
      'SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM deleted_player_uids WHERE uid = ?) ' +
      'ON CONFLICT(uid) DO UPDATE SET nickname = excluded.nickname, consent_at = excluded.consent_at';
    const runSql =
      'INSERT INTO provisional_runs (run_id,uid,season_id,nonce_hash,started_at,expires_at,sector,build_sha) ' +
      'SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM players WHERE uid = ?) ' +
      'AND NOT EXISTS (SELECT 1 FROM deleted_player_uids WHERE uid = ?)';
    function start(user, id) {
      db.exec('BEGIN');
      try {
        const first = db.prepare(playerSql).run(user, nick, stamp, stamp, user);
        const second = db.prepare(runSql).run(id, user, 'current', 'hash-' + id,
          1800000000000, 1800000100000, 1, '1.24.23', user, user);
        db.exec('COMMIT');
        return [first.changes, second.changes];
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
    assert.deepEqual(start(uid, 'run-first'), [1, 1]);
    db.exec('BEGIN');
    db.prepare('INSERT OR IGNORE INTO deleted_player_uids (uid,deleted_at) VALUES (?,?)')
      .run(uid, stamp);
    db.prepare('DELETE FROM players WHERE uid = ?').run(uid);
    db.exec('COMMIT');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM provisional_runs').get().n, 0);

    // Previously queued starts and repetitions cannot bring the profile back.
    assert.deepEqual(start(uid, 'run-late'), [0, 0]);
    assert.deepEqual(start(uid, 'run-retry'), [0, 0]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM players').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM provisional_runs').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM deleted_player_uids').get().n, 1);

    // Account deletion is scoped strictly to its original Firebase UID.
    assert.deepEqual(start('player-b', 'run-other'), [1, 1]);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM players').get().n, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM provisional_runs').get().n, 1);
  } finally {
    db.close();
  }
});
