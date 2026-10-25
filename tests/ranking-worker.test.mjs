import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/ranking/src/index.js';
import { verifyFirebaseIdToken } from '../workers/ranking/src/firebase-jwt.js';

function b64(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

test('ranking API is read-only and cannot accept self-declared scores', async () => {
  const health = await worker.fetch(new Request('https://api.example/v1/health'), {});
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', scoreSubmissionsEnabled: false });
  for (const path of ['/v1/runs/start', '/v1/runs/finish']) {
    const res = await worker.fetch(new Request('https://api.example' + path, { method: 'POST' }), {});
    assert.equal(res.status, 501);
    assert.deepEqual(await res.json(), { error: 'SCORE_SUBMISSIONS_DISABLED' });
  }
});

test('unprovisioned D1 fails closed and cannot pretend to be a ranking', async () => {
  const res = await worker.fetch(
    new Request('https://api.example/v1/leaderboard?season=current'),
    {},
  );
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'DATABASE_UNAVAILABLE' });
});

test('public leaderboard binds parameters and never queries private identity fields', async () => {
  let statement;
  let parameters;
  const db = {
    prepare(sql) {
      statement = sql;
      return {
        bind(...args) {
          parameters = args;
          return { all: async () => ({ results: [{ nickname: 'Piloto', points: 83, sector: 2, verifiedAt: 'now' }] }) };
        },
      };
    },
  };
  const res = await worker.fetch(
    new Request('https://api.example/v1/leaderboard?season=season-one&limit=5'),
    { DB: db },
  );
  assert.equal(res.status, 200);
  assert.deepEqual(parameters, ['season-one', 'verified', 5]);
  assert.ok(!statement.includes('email'));
  assert.ok(!statement.includes('SELECT *'));
  assert.equal((await res.json()).entries[0].nickname, 'Piloto');

  const invalid = await worker.fetch(
    new Request('https://api.example/v1/leaderboard?season=foo%27%20OR%201%3D1'),
    { DB: db },
  );
  assert.equal(invalid.status, 400);
});

test('CORS is an explicit exact-origin allowlist, never a security bypass', async () => {
  const disallowed = await worker.fetch(
    new Request('https://api.example/v1/health', {
      headers: { origin: 'https://pr-54.nova-wing-preview.pages.dev' },
    }),
    { ALLOWED_ORIGINS: 'https://dev.nova-wing-preview.pages.dev' },
  );
  assert.equal(disallowed.status, 403);
  const allowed = await worker.fetch(
    new Request('https://api.example/v1/health', {
      headers: { origin: 'https://dev.nova-wing-preview.pages.dev' },
    }),
    { ALLOWED_ORIGINS: 'https://dev.nova-wing-preview.pages.dev' },
  );
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get('access-control-allow-origin'),
    'https://dev.nova-wing-preview.pages.dev',
  );
});

test('private player route refuses unauthenticated requests', async () => {
  const res = await worker.fetch(new Request('https://api.example/v1/me'), {
    FIREBASE_PROJECT_ID: 'nova-wing-dev',
  });
  assert.equal(res.status, 401);
});

test('Firebase ID token verifier checks RS256 signature and project claims', async () => {
  const keys = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const publicKey = { ...(await crypto.subtle.exportKey('jwk', keys.publicKey)), kid: 'test-key' };
  const now = 1800000000;
  const fetchKeys = async () => new Response(JSON.stringify({ keys: [publicKey] }), { status: 200 });
  const claims = {
    aud: 'nova-wing-dev',
    iss: 'https://securetoken.google.com/nova-wing-dev',
    sub: 'test-user',
    iat: now - 10,
    exp: now + 3600,
    auth_time: now - 20,
  };
  async function token(header, payload) {
    const prefix = b64(header) + '.' + b64(payload);
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keys.privateKey,
      new TextEncoder().encode(prefix),
    );
    return prefix + '.' + Buffer.from(signature).toString('base64url');
  }
  const valid = await token({ alg: 'RS256', kid: 'test-key' }, claims);
  assert.deepEqual(
    await verifyFirebaseIdToken(valid, 'nova-wing-dev', {
      fetchKeys,
      nowMs: now * 1000,
    }),
    { uid: 'test-user' },
  );
  for (const bad of [
    await token({ alg: 'HS256', kid: 'test-key' }, claims),
    await token({ alg: 'RS256', kid: 'test-key' }, { ...claims, aud: 'another-project' }),
    await token({ alg: 'RS256', kid: 'test-key' }, { ...claims, exp: now - 1 }),
    await token({ alg: 'RS256', kid: 'test-key' }, { ...claims, iss: 'invalid' }),
    valid.slice(0, -3) + 'abc',
    'not-a-jwt',
  ]) {
    await assert.rejects(
      verifyFirebaseIdToken(bad, 'nova-wing-dev', { fetchKeys, nowMs: now * 1000 }),
      /Invalid Firebase ID token/,
    );
  }
});
