import { UnauthorizedError, verifyFirebaseIdToken } from './firebase-jwt.js';
import { handleProvisional } from './provisional.js';

// The ranking remains read-only until score verification and anti-replay are complete.
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim());
  return origin && allowed.includes(origin)
    ? { 'access-control-allow-origin': origin, vary: 'Origin' }
    : { vary: 'Origin' };
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  return !origin || (env.ALLOWED_ORIGINS || '').split(',').some((value) => value.trim() === origin);
}

function parseSeason(url) {
  const season = url.searchParams.get('season') || 'current';
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(season)) return null;
  return season;
}

async function leaderboard(request, env, url, cors) {
  if (!env.DB) return json({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
  const season = parseSeason(url);
  const rawLimit = url.searchParams.get('limit') || '20';
  if (
    !season ||
    !/^[0-9]{1,2}$/.test(rawLimit) ||
    Number(rawLimit) < 1 ||
    Number(rawLimit) > 50 ||
    url.searchParams.has('cursor')
  ) {
    return json({ error: 'INVALID_QUERY' }, 400, cors);
  }
  try {
    // No UID, email, identity claims or raw gameplay traces leave this endpoint.
    const result = await env.DB.prepare(
      'SELECT p.nickname AS nickname, s.points AS points, s.sector AS sector, ' +
        's.verified_at AS verifiedAt FROM leaderboard_entries AS e ' +
        'JOIN players AS p ON p.uid = e.uid ' +
        'JOIN scores AS s ON s.score_id = e.best_score_id ' +
        'WHERE e.season_id = ? AND s.verdict = ? ' +
        'ORDER BY s.points DESC, s.verified_at ASC LIMIT ?',
    )
      .bind(season, 'verified', Number(rawLimit))
      .all();
    return json({ season, entries: result.results || [] }, 200, cors);
  } catch {
    return json({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
  }
}

async function myProfile(request, env, cors) {
  if (!env.FIREBASE_PROJECT_ID) return json({ error: 'AUTH_UNAVAILABLE' }, 503, cors);
  const authorization = request.headers.get('authorization') || '';
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(authorization);
  if (!match) return json({ error: 'UNAUTHORIZED' }, 401, cors);
  try {
    const { uid } = await verifyFirebaseIdToken(match[1], env.FIREBASE_PROJECT_ID);
    if (!env.DB) return json({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
    const player = await env.DB.prepare('SELECT nickname FROM players WHERE uid = ?')
      .bind(uid)
      .first();
    return json({ authenticated: true, nickname: player?.nickname || null }, 200, cors);
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: 'UNAUTHORIZED' }, 401, cors);
    return json({ error: 'DATABASE_UNAVAILABLE' }, 503, cors);
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (!isAllowedOrigin(request, env)) return json({ error: 'ORIGIN_NOT_ALLOWED' }, 403);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'access-control-allow-methods': 'GET, HEAD, POST, DELETE, OPTIONS',
          'access-control-allow-headers': 'Authorization, Content-Type',
          'access-control-max-age': '600',
        },
      });
    }
    const url = new URL(request.url);
    const experimental = await handleProvisional(request, env, url, cors);
    if (experimental) return experimental;
    if (request.method === 'GET' && url.pathname === '/v1/health') {
      return json({ status: 'ok', scoreSubmissionsEnabled: false }, 200, cors);
    }
    if (request.method === 'GET' && url.pathname === '/v1/leaderboard') {
      return leaderboard(request, env, url, cors);
    }
    if (request.method === 'GET' && url.pathname === '/v1/me') {
      return myProfile(request, env, cors);
    }
    if (url.pathname === '/v1/runs/start' || url.pathname === '/v1/runs/finish') {
      return json({ error: 'SCORE_SUBMISSIONS_DISABLED' }, 501, cors);
    }
    return json({ error: 'NOT_FOUND' }, 404, cors);
  },
};
