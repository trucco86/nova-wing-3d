import { UnauthorizedError, verifyFirebaseIdToken } from './firebase-jwt.js';

// Browser results are UNVERIFIED. This independent table cannot change the
// official, verified leaderboard until an authoritative replay validator exists.
const VALID_SEASON = /^[a-z0-9][a-z0-9-]{0,39}$/;
const VALID_NICKNAME = /^[\p{L}\p{N}_. -]{2,24}$/u;
const MAX_BODY = 2048;
const TTL_MS = 2 * 60 * 60 * 1000;
const HISTORY_LIMIT = 30;

function respond(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...cors,
    },
  });
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''))
    return null;

  // Never trust Content-Length: chunked requests can omit or forge the header.
  // Enforce the cap on actual UTF-8 bytes before parsing or retaining the body.
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^[0-9]+$/.test(declared) || Number(declared) > MAX_BODY))
    return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY) {
        // Abort uploads immediately; never buffer an unbounded request.
        void reader.cancel().catch(() => {});
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function seasonFor(env) {
  const season = env.RANKING_SEASON || 'current';
  return VALID_SEASON.test(season) ? season : null;
}

function scoreDataValid(data) {
  return Number.isInteger(data.points) && data.points >= 0 && data.points <= 1000000 &&
    Number.isInteger(data.sector) && data.sector >= 1 && data.sector <= 10 &&
    Number.isInteger(data.durationMs) && data.durationMs >= 30000 &&
    data.durationMs <= 7200000 &&
    typeof data.runId === 'string' && /^[0-9a-f-]{36}$/.test(data.runId) &&
    typeof data.nonce === 'string' && /^[A-Za-z0-9_-]{30,80}$/.test(data.nonce);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function randomNonce() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function authenticate(request, env, verifyToken) {
  if (!env.FIREBASE_PROJECT_ID) throw new Error('AUTH_UNAVAILABLE');
  const bearer = /^Bearer ([A-Za-z0-9._-]{30,12000})$/.exec(
    request.headers.get('authorization') || '',
  );
  if (!bearer) throw new UnauthorizedError();
  return (await verifyToken(bearer[1], env.FIREBASE_PROJECT_ID)).uid;
}

async function getHistory(db, uid, cors) {
  const result = await db.prepare(
    'SELECT run_id AS runId, sector, points, duration_ms AS durationMs, ' +
    'completed_at AS completedAt FROM provisional_runs ' +
    'WHERE uid = ? AND status = ? ORDER BY completed_at DESC LIMIT ?',
  ).bind(uid, 'completed', HISTORY_LIMIT).all();
  return respond({ entries: result.results || [], verified: false }, 200, cors);
}

async function leaderboard(db, url, env, cors) {
  const season = url.searchParams.get('season') || seasonFor(env);
  const limit = url.searchParams.get('limit') || '20';
  if (!season || !VALID_SEASON.test(season) || !/^[0-9]{1,2}$/.test(limit) ||
      Number(limit) < 1 || Number(limit) > 50 || url.searchParams.has('cursor'))
    return respond({ error: 'INVALID_QUERY' }, 400, cors);

  const result = await db.prepare(
    'SELECT p.nickname AS nickname, x.points AS points, x.sector AS sector, ' +
    'x.completed_at AS completedAt FROM (' +
    'SELECT uid, points, sector, completed_at, ' +
    'ROW_NUMBER() OVER (PARTITION BY uid ORDER BY points DESC, completed_at ASC) AS rn ' +
    'FROM provisional_runs WHERE season_id = ? AND status = ?) AS x ' +
    'JOIN players AS p ON p.uid = x.uid WHERE x.rn = 1 ' +
    'ORDER BY x.points DESC, x.completed_at ASC LIMIT ?',
  ).bind(season, 'completed', Number(limit)).all();
  return respond(
    { season, entries: result.results || [], verified: false, mode: 'experimental' },
    200,
    cors,
  );
}

async function start(db, uid, data, env, currentTime, cors) {
  const season = seasonFor(env);
  if (!season) return respond({ error: 'INVALID_SERVER_CONFIG' }, 503, cors);
  const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
  if (data.consent !== true || !VALID_NICKNAME.test(nickname) ||
      !Number.isInteger(data.sector) || data.sector < 1 || data.sector > 10 ||
      typeof data.build !== 'string' || !/^[A-Za-z0-9.-]{3,48}$/.test(data.build)) {
    return respond({ error: 'INVALID_RUN_START' }, 400, cors);
  }
  const rate = await db.prepare(
    'SELECT COUNT(*) AS count FROM provisional_runs WHERE uid = ? AND started_at > ?',
  ).bind(uid, currentTime - 600000).first();
  if (Number(rate?.count || 0) >= 4) return respond({ error: 'RATE_LIMITED' }, 429, cors);
  const nonce = randomNonce();
  const runId = crypto.randomUUID();
  const expiresAt = currentTime + TTL_MS;
  // Pseudonym is explicitly chosen, never derived from the player's Google name.
  await db.prepare(
    'INSERT INTO players (uid,nickname,consent_at,created_at) VALUES (?,?,?,?) ' +
    'ON CONFLICT(uid) DO UPDATE SET nickname = excluded.nickname, consent_at = excluded.consent_at',
  ).bind(uid, nickname, new Date(currentTime).toISOString(), new Date(currentTime).toISOString()).run();
  await db.prepare(
    'INSERT INTO provisional_runs ' +
    '(run_id,uid,season_id,nonce_hash,started_at,expires_at,sector,build_sha) ' +
    'VALUES (?,?,?,?,?,?,?,?)',
  ).bind(runId, uid, season, await sha256(nonce), currentTime, expiresAt, data.sector, data.build).run();
  return respond({ runId, nonce, expiresAt, verified: false }, 201, cors);
}

async function finish(db, uid, data, currentTime, cors) {
  if (!scoreDataValid(data)) return respond({ error: 'INVALID_RUN_FINISH' }, 400, cors);
  const existing = await db.prepare(
    'SELECT status,sector,started_at,expires_at,nonce_hash,points,duration_ms ' +
    'FROM provisional_runs WHERE run_id = ? AND uid = ?',
  ).bind(data.runId, uid).first();
  if (!existing) return respond({ error: 'RUN_NOT_FOUND' }, 404, cors);
  if ((await sha256(data.nonce)) !== existing.nonce_hash)
    return respond({ error: 'INVALID_NONCE' }, 403, cors);
  if (existing.status === 'completed') {
    return existing.points === data.points && existing.duration_ms === data.durationMs &&
      existing.sector === data.sector
      ? respond({ recorded: true, verified: false, runId: data.runId }, 200, cors)
      : respond({ error: 'RUN_ALREADY_COMPLETED' }, 409, cors);
  }
  const elapsed = currentTime - existing.started_at;
  if (existing.status !== 'started' || existing.expires_at < currentTime ||
      elapsed < 30000 || elapsed > TTL_MS ||
      existing.sector !== data.sector ||
      data.durationMs > elapsed + 15000 ||
      // Coarse plausibility gate only: NOT an authoritative anti-cheat guarantee.
      data.points > Math.ceil(data.durationMs / 1000) * 350 + 200)
    return respond({ error: 'RUN_NOT_ELIGIBLE' }, 422, cors);

  // Conditional update is atomic: concurrent/replayed finish cannot create
  // another completion or rewrite the stored score.
  const update = await db.prepare(
    'UPDATE provisional_runs SET status = ?, points = ?, duration_ms = ?, completed_at = ? ' +
    'WHERE run_id = ? AND uid = ? AND status = ? AND nonce_hash = ? AND expires_at >= ?',
  ).bind('completed', data.points, data.durationMs, currentTime,
    data.runId, uid, 'started', existing.nonce_hash, currentTime).run();
  if (update?.meta?.changes !== 1)
    return respond({ error: 'RUN_ALREADY_COMPLETED' }, 409, cors);
  return respond({ recorded: true, verified: false, runId: data.runId }, 201, cors);
}

/**
 * All mutations require independently verified Firebase JWTs and isolated D1.
 * Production uses the secure default verifier; tests inject a stub explicitly.
 */
export async function handleProvisional(request, env, url, cors = {}, {
  verifyToken = verifyFirebaseIdToken,
  now = () => Date.now(),
} = {}) {
  const path = url.pathname;
  const experimental = request.method === 'GET' && path === '/v1/leaderboard' &&
    url.searchParams.get('mode') === 'experimental';
  const history = request.method === 'GET' && path === '/v1/me/history';
  const deleteAccount = request.method === 'DELETE' && path === '/v1/me';
  const writing = request.method === 'POST' &&
    (path === '/v1/runs/start' || path === '/v1/runs/finish');
  if (!experimental && !history && !deleteAccount && !writing) return null;
  if (writing && env.SCORE_WRITE_ENABLED !== 'true')
    return respond({ error: 'SCORE_SUBMISSIONS_DISABLED' }, 501, cors);
  if (!env.DB) return respond({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
  if (experimental) {
    try { return await leaderboard(env.DB, url, env, cors); }
    catch { return respond({ error: 'DATABASE_UNAVAILABLE' }, 503, cors); }
  }

  let uid;
  try {
    uid = await authenticate(request, env, verifyToken);
  } catch (error) {
    return respond(
      { error: error instanceof UnauthorizedError ? 'UNAUTHORIZED' : 'AUTH_UNAVAILABLE' },
      error instanceof UnauthorizedError ? 401 : 503, cors,
    );
  }
  try {
    if (history) return await getHistory(env.DB, uid, cors);
    if (deleteAccount) {
      await env.DB.prepare('DELETE FROM players WHERE uid = ?').bind(uid).run();
      return respond({ deleted: true }, 200, cors);
    }
    const data = await readBody(request);
    if (!data) return respond({ error: 'INVALID_BODY' }, 400, cors);
    if (path === '/v1/runs/start') return await start(env.DB, uid, data, env, now(), cors);
    return await finish(env.DB, uid, data, now(), cors);
  } catch {
    return respond({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
  }
}
