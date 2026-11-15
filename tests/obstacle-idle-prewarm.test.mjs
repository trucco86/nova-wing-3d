import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleIdlePrewarm } from '../src/obstacle-idle-prewarm.js';

test('prewarms each unique asset in its own idle task', async () => {
  const tasks = [];
  const primed = [];
  const stop = scheduleIdlePrewarm({
    kinds: ['satellite', 'carrier', 'satellite', 'debris'],
    prime: async (kind) => primed.push(kind),
    schedule: (callback) => {
      tasks.push(callback);
      return tasks.length;
    },
  });
  assert.equal(tasks.length, 1);
  await tasks.shift()();
  assert.deepEqual(primed, ['satellite']);
  assert.equal(tasks.length, 1);
  await tasks.shift()();
  await tasks.shift()();
  assert.deepEqual(primed, ['satellite', 'carrier', 'debris']);
  assert.equal(tasks.length, 0);
  stop();
});

test('cancellation prevents future idle work', async () => {
  const tasks = [];
  const cancelled = [];
  const primed = [];
  const stop = scheduleIdlePrewarm({
    kinds: ['carrier', 'debris'],
    prime: (kind) => primed.push(kind),
    schedule: (callback) => {
      tasks.push(callback);
      return tasks.length;
    },
    cancel: (id) => cancelled.push(id),
  });
  stop();
  assert.deepEqual(cancelled, [1]);
  await tasks.shift()();
  assert.deepEqual(primed, []);
  assert.equal(tasks.length, 0);
});

test('a failed prewarm does not prevent later assets', async () => {
  const tasks = [];
  const errors = [];
  const primed = [];
  scheduleIdlePrewarm({
    kinds: ['carrier', 'debris'],
    prime: (kind) => {
      if (kind === 'carrier') throw new Error('shader unsupported');
      primed.push(kind);
    },
    schedule: (callback) => {
      tasks.push(callback);
      return tasks.length;
    },
    onError: (_error, kind) => errors.push(kind),
  });
  await tasks.shift()();
  await tasks.shift()();
  assert.deepEqual(errors, ['carrier']);
  assert.deepEqual(primed, ['debris']);
});

test('forced idle timeout during flight never builds a mesh or consumes its slot', async () => {
  const tasks = [];
  const primed = [];
  let phase = 'playing';
  scheduleIdlePrewarm({
    kinds: ['fighter', 'carrier', 'debris'],
    canPrime: (deadline) =>
      phase === 'map' && deadline.timeRemaining() >= 4,
    prime: (kind) => primed.push(kind),
    schedule: (callback) => {
      tasks.push(callback);
      return tasks.length;
    },
  });
  await tasks.shift()({ didTimeout: true, timeRemaining: () => 0 });
  assert.deepEqual(primed, [], 'the busy flight must not compile meshes or shaders');
  assert.equal(tasks.length, 1, 'the unfinished fighter is retried in another idle slot');
  phase = 'map';
  await tasks.shift()({ didTimeout: false, timeRemaining: () => 2 });
  assert.deepEqual(primed, [], 'a visually busy campaign screen also defers warmup');
  await tasks.shift()({ didTimeout: false, timeRemaining: () => 12 });
  assert.deepEqual(primed, ['fighter']);
  await tasks.shift()({ didTimeout: false, timeRemaining: () => 12 });
  await tasks.shift()({ didTimeout: false, timeRemaining: () => 12 });
  assert.deepEqual(primed, ['fighter', 'carrier', 'debris']);
  assert.equal(tasks.length, 0);
});

test('pausing and cancelling after an unsafe flight slot drops all deferred models', async () => {
  const tasks = [];
  const cancelled = [];
  const primed = [];
  let token = 0;
  const stop = scheduleIdlePrewarm({
    kinds: ['tank', 'walker'],
    canPrime: () => false,
    prime: (kind) => primed.push(kind),
    schedule: (callback) => {
      tasks.push(callback);
      return ++token;
    },
    cancel: (id) => cancelled.push(id),
  });
  await tasks.shift()({ didTimeout: true, timeRemaining: () => 0 });
  assert.deepEqual(primed, []);
  stop();
  assert.deepEqual(cancelled, [2]);
  await tasks.shift()({ didTimeout: false, timeRemaining: () => 16 });
  assert.deepEqual(primed, []);
  assert.equal(tasks.length, 0);
});

test('invalid eligibility callbacks are rejected instead of leaving assets half-prepared', () => {
  assert.throws(
    () => scheduleIdlePrewarm({ kinds: [], prime() {}, schedule() {}, canPrime: null }),
    TypeError,
  );
});
