import test from 'node:test';
import assert from 'node:assert/strict';
import { executePlayerAction, runPlayerSession } from '../tools/gameplay-player-runtime.mjs';

test('player runtime refuses QA fixture routes before opening a browser', async () => {
  await assert.rejects(
    runPlayerSession({
      browser: {},
      url: 'http://127.0.0.1:4173/__dynamic.html?sector=0',
      decide: async () => ({ type: 'stop' }),
    }),
    /refuses QA fixture/,
  );
});

test('player runtime requires an injected decision policy', async () => {
  await assert.rejects(
    runPlayerSession({
      browser: {},
      url: 'http://127.0.0.1:4173/',
    }),
    /policy adapter/,
  );
});

test('player runtime only sends allowlisted game keys', async () => {
  const calls = [];
  const page = {
    keyboard: {
      down: async (key) => calls.push(['down', key]),
      up: async (key) => calls.push(['up', key]),
    },
  };
  await assert.rejects(
    executePlayerAction(page, { type: 'key', key: 'KeyT', durationMs: 50 }),
    /Unsupported gameplay key/,
  );
  assert.deepEqual(calls, []);
});

test('player runtime releases a key after the requested bounded duration', async () => {
  const calls = [];
  const page = {
    keyboard: {
      down: async (key) => calls.push(['down', key]),
      up: async (key) => calls.push(['up', key]),
    },
  };
  const result = await executePlayerAction(page, {
    type: 'key',
    key: 'Space',
    durationMs: 50,
  });
  assert.deepEqual(calls, [['down', 'Space'], ['up', 'Space']]);
  assert.equal(result.durationMs, 50);
});

test('player runtime can stop with an explicit reason', async () => {
  const result = await executePlayerAction({}, {
    type: 'stop',
    reason: 'no-safe-action',
  });
  assert.deepEqual(result, { type: 'stop', reason: 'no-safe-action' });
});
