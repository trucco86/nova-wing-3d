import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleProvisional } from '../workers/ranking/src/provisional.js';

const endpoint = 'https://ranking.example.com/v1/runs/start';
const validStart = {
  nickname: 'Piloto Teste',
  consent: true,
  sector: 1,
  build: '1.24.21',
};

function scenario(body, headers = {}) {
  let databaseQueries = 0;
  const env = {
    FIREBASE_PROJECT_ID: 'nova-wing-hml',
    RANKING_SEASON: 'current',
    SCORE_WRITE_ENABLED: 'true',
    DB: {
      prepare() {
        databaseQueries += 1;
        return {
          bind() {
            return {
              first: async () => ({ count: 0 }),
              run: async () => ({ meta: { changes: 1 } }),
            };
          },
        };
      },
    },
  };
  const request = new Request(endpoint, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + 'a'.repeat(64),
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
    body,
    ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
  });
  return {
    invoke: () =>
      handleProvisional(
        request,
        env,
        new URL(endpoint),
        {},
        {
          verifyToken: async () => ({ uid: 'player-1' }),
          now: () => Date.UTC(2026, 9, 27),
        },
      ),
    queries: () => databaseQueries,
  };
}

test('reject UTF-8 payloads over 2048 bytes even when character count is below the limit', async () => {
  const raw = JSON.stringify({ ...validStart, ignored: 'á'.repeat(1060) });
  assert.ok(raw.length < 2048);
  assert.ok(Buffer.byteLength(raw, 'utf8') > 2048);
  const item = scenario(raw);
  const response = await item.invoke();
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'INVALID_BODY' });
  assert.equal(item.queries(), 0);
});

test('stop consuming an oversized streaming body without relying on Content-Length', async () => {
  let pulls = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(1024).fill(65));
      if (pulls === 16) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  const item = scenario(body);
  const response = await item.invoke();
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'INVALID_BODY' });
  assert.equal(item.queries(), 0);
  assert.ok(pulls <= 5, 'reader must stop near the 2048-byte boundary');
  assert.equal(cancelled, true);
});

test('reject malformed Content-Length and enforce the real body size when forged', async () => {
  const normal = JSON.stringify(validStart);
  const invalid = scenario(normal, { 'content-length': 'not-a-number' });
  assert.equal((await invalid.invoke()).status, 400);
  assert.equal(invalid.queries(), 0);

  const forged = scenario(JSON.stringify({ ...validStart, extra: 'x'.repeat(2200) }), {
    'content-length': '12',
  });
  const response = await forged.invoke();
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'INVALID_BODY' });
  assert.equal(forged.queries(), 0);
});

test('allow a valid 2048-byte JSON request at the exact limit', async () => {
  const base = JSON.stringify({ ...validStart, ignored: '' });
  const raw = JSON.stringify({
    ...validStart,
    ignored: 'x'.repeat(2048 - Buffer.byteLength(base, 'utf8')),
  });
  assert.equal(Buffer.byteLength(raw, 'utf8'), 2048);
  const item = scenario(raw);
  const response = await item.invoke();
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.verified, false);
  assert.equal(typeof result.runId, 'string');
  assert.ok(item.queries() >= 3);
});
