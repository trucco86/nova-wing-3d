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
