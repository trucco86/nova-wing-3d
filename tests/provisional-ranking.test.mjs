import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleProvisional } from '../workers/ranking/src/provisional.js';
import { UnauthorizedError } from '../workers/ranking/src/firebase-jwt.js';

function fakeD1() {
  const players = new Map();
  const runs = new Map();
  return {
    players,
    runs,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.startsWith('SELECT COUNT(*)')) {
                const [uid, since] = args;
                return { count: [...runs.values()].filter((r) => r.uid === uid && r.started_at > since).length };
              }
              if (sql.startsWith('SELECT status,sector')) {
                const [runId, uid] = args;
                const run = runs.get(runId);
                return run?.uid === uid ? run : null;
              }
              return null;
            },
            async all() {
              if (sql.includes('ROW_NUMBER() OVER')) {
                const [season, status, limit] = args;
                const best = new Map();
                for (const run of runs.values()) {
                  if (run.season_id !== season || run.status !== status) continue;
                  const current = best.get(run.uid);
                  if (!current || current.points < run.points) best.set(run.uid, run);
                }
                const results = [...best.values()]
                  .sort((a, b) => b.points - a.points)
                  .slice(0, limit)
                  .map((run) => ({
                    nickname: players.get(run.uid).nickname,
                    points: run.points, sector: run.sector, completedAt: run.completed_at,
                  }));
                return { results };
              }
              if (sql.startsWith('SELECT run_id AS runId')) {
                const [uid, status, limit] = args;
                return {
                  results: [...runs.values()].filter((run) => run.uid === uid && run.status === status)
                    .sort((a, b) => b.completed_at - a.completed_at)
                    .slice(0, limit).map((run) => ({
                      runId: run.run_id, sector: run.sector, points: run.points,
                      durationMs: run.duration_ms, completedAt: run.completed_at,
                    })),
                };
              }
              throw new Error('Unexpected SQL query');
            },
            async run() {
              if (sql.startsWith('INSERT INTO players')) {
                const [uid, nickname, consent_at, created_at] = args;
                players.set(uid, { uid, nickname, consent_at, created_at });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith('INSERT INTO provisional_runs')) {
                const [run_id, uid, season_id, nonce_hash, started_at, expires_at, sector, build_sha] = args;
                runs.set(run_id, {
                  run_id, uid, season_id, nonce_hash, started_at, expires_at, sector, build_sha,
                  status: 'started', points: null, duration_ms: null,
                });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith('UPDATE provisional_runs')) {
                const [status, points, duration_ms, completed_at, runId, uid, expected, nonce, minimumExpiry] = args;
                const record = runs.get(runId);
                if (!record || record.uid !== uid || record.status !== expected ||
                    record.nonce_hash !== nonce || record.expires_at < minimumExpiry)
                  return { meta: { changes: 0 } };
                Object.assign(record, { status, points, duration_ms, completed_at });
                return { meta: { changes: 1 } };
              }
              if (sql.startsWith('DELETE FROM players')) {
                const [uid] = args;
                players.delete(uid);
                for (const [key, value] of runs) if (value.uid === uid) runs.delete(key);
                return { meta: { changes: 1 } };
              }
              throw new Error('Unexpected SQL mutation');
            },
          };
        },
      };
    },
  };
}

function harness() {
  const db = fakeD1();
  const env = {
    DB: db, FIREBASE_PROJECT_ID: 'nova-wing-hml',
    SCORE_WRITE_ENABLED: 'true', RANKING_SEASON: 'current',
  };
  let clock = 1800000000000;
  const validA = 'a'.repeat(40);
  const validB = 'b'.repeat(40);
  const verifyToken = async (token, project) => {
    if (project !== 'nova-wing-hml' || (token !== validA && token !== validB))
      throw new UnauthorizedError();
    return { uid: token === validA ? 'player-a' : 'player-b' };
  };
  const invoke = async (path, { method = 'GET', token, body, environment = env } = {}) => {
    const url = new URL('https://ranking.example.com' + path);
    return handleProvisional(new Request(url, {
      method,
      headers: token ? {
        authorization: 'Bearer ' + token,
        ...(body ? { 'content-type': 'application/json' } : {}),
      } : body ? { 'content-type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    }), environment, url, {}, { verifyToken, now: () => clock });
  };
  return { env, db, invoke, validA, validB, advance: (ms) => { clock += ms; } };
}

test('score writes fail closed when disabled, missing token or explicit consent', async () => {
  const h = harness();
  const start = { nickname: 'Piloto Alpha', consent: true, sector: 1, build: '1.25.0' };
  let response = await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validA, body: start,
    environment: { ...h.env, SCORE_WRITE_ENABLED: 'false' },
  });
  assert.equal(response.status, 501);
  response = await h.invoke('/v1/runs/start', { method: 'POST', body: start });
  assert.equal(response.status, 401);
  response = await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validA, body: { ...start, consent: false },
  });
  assert.equal(response.status, 400);
  assert.equal(h.db.runs.size, 0);
});

test('authenticated runs create private history, dedupe finish and publish experimental ranking', async () => {
  const h = harness();
  const start = await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validA,
    body: { nickname: 'Piloto Alpha', consent: true, sector: 3, build: '1.25.0' },
  });
  assert.equal(start.status, 201);
  const started = await start.json();
  assert.equal(started.verified, false);
  assert.equal(h.db.runs.size, 1);
  h.advance(130000);
  const payload = {
    runId: started.runId, nonce: started.nonce,
    points: 128, sector: 3, durationMs: 120000,
  };
  const badNonce = await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validA,
    body: { ...payload, nonce: 'x'.repeat(32) },
  });
  assert.equal(badNonce.status, 403);
  const otherUser = await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validB, body: payload,
  });
  assert.equal(otherUser.status, 404);
  const completed = await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validA, body: payload,
  });
  assert.equal(completed.status, 201);
  assert.equal((await completed.json()).verified, false);
  assert.equal((await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validA, body: payload,
  })).status, 200);
  assert.equal((await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validA, body: { ...payload, points: 999 },
  })).status, 409);
  assert.equal(h.db.runs.size, 1);

  const publicList = await (await h.invoke('/v1/leaderboard?mode=experimental')).json();
  assert.equal(publicList.entries[0].nickname, 'Piloto Alpha');
  assert.equal(publicList.entries[0].points, 128);
  assert.equal(publicList.verified, false);
  assert.equal(JSON.stringify(publicList).includes('player-a'), false);
  const privateHistory = await (await h.invoke('/v1/me/history', { token: h.validA })).json();
  assert.equal(privateHistory.entries.length, 1);
  assert.equal(privateHistory.entries[0].points, 128);
  const otherHistory = await (await h.invoke('/v1/me/history', { token: h.validB })).json();
  assert.deepEqual(otherHistory.entries, []);
});

test('score cannot be submitted before meaningful gameplay; runs expire and are rate limited', async () => {
  const h = harness();
  const body = { nickname: 'Piloto Beta', consent: true, sector: 1, build: '1.25.0' };
  const first = await (await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validB, body,
  })).json();
  const data = { runId: first.runId, nonce: first.nonce, points: 50, sector: 1, durationMs: 30000 };
  assert.equal((await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validB, body: data,
  })).status, 422);
  for (let i = 1; i < 4; i++)
    assert.equal((await h.invoke('/v1/runs/start', {
      method: 'POST', token: h.validB, body,
    })).status, 201);
  assert.equal((await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validB, body,
  })).status, 429);
  h.advance(7200001);
  assert.equal((await h.invoke('/v1/runs/finish', {
    method: 'POST', token: h.validB, body: data,
  })).status, 422);
});

test('deleting account data removes provisional results and public ranking entry', async () => {
  const h = harness();
  const started = await (await h.invoke('/v1/runs/start', {
    method: 'POST', token: h.validA,
    body: { nickname: 'Piloto Alpha', consent: true, sector: 2, build: '1.25.0' },
  })).json();
  h.advance(70000);
  await h.invoke('/v1/runs/finish', { method: 'POST', token: h.validA,
    body: { runId: started.runId, nonce: started.nonce, points: 30, sector: 2, durationMs: 65000 } });
  const deleted = await h.invoke('/v1/me', { method: 'DELETE', token: h.validA });
  assert.equal(deleted.status, 200);
  assert.equal(h.db.runs.size, 0);
  assert.equal((await (await h.invoke('/v1/leaderboard?mode=experimental')).json()).entries.length, 0);
});
