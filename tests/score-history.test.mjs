import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HISTORY_STORAGE_KEY,
  readLocalHistory,
  recordLocalResult,
  localScoreSummary,
} from '../src/score-history.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) || null,
    setItem: (key, value) => map.set(key, value),
    map,
  };
}
const entry = (id, points = 12) => ({
  id,
  sector: 3,
  points,
  durationMs: 132000,
  completedAt: '2026-10-27T18:30:00.000Z',
});

test('every completed level is preserved independently of the campaign checkpoint', () => {
  const storage = fakeStorage();
  storage.setItem('nova-wing-3d-v1', JSON.stringify({ version: 1, sector: 3 }));
  assert.equal(recordLocalResult(storage, entry('one')), true);
  assert.equal(recordLocalResult(storage, entry('two', 35)), true);
  assert.equal(recordLocalResult(storage, entry('two', 35)), true);
  assert.deepEqual(
    readLocalHistory(storage).map((v) => v.id),
    ['two', 'one'],
  );
  assert.deepEqual(localScoreSummary(storage), { count: 2, best: 35, total: 47 });
  assert.equal(JSON.parse(storage.getItem('nova-wing-3d-v1')).sector, 3);
});

test('corrupted input and blocked storage do not crash gameplay', () => {
  const storage = fakeStorage();
  storage.setItem(HISTORY_STORAGE_KEY, '{bad');
  assert.deepEqual(readLocalHistory(storage), []);
  assert.equal(recordLocalResult(storage, { ...entry('invalid'), sector: 12 }), false);
  assert.equal(
    recordLocalResult(
      {
        getItem: () => null,
        setItem: () => {
          throw Error('blocked');
        },
      },
      entry('first'),
    ),
    false,
  );
  assert.deepEqual(
    readLocalHistory({
      getItem: () => {
        throw Error('blocked');
      },
    }),
    [],
  );
});

test('history is bounded to the latest 100 recorded games', () => {
  const storage = fakeStorage();
  for (let i = 0; i < 110; i++)
    assert.equal(recordLocalResult(storage, entry('run-' + i, i)), true);
  const history = readLocalHistory(storage);
  assert.equal(history.length, 100);
  assert.equal(history[0].id, 'run-109');
  assert.equal(history.at(-1).id, 'run-10');
});

test('defeated attempts are saved and legacy victories remain readable', () => {
  const storage = fakeStorage();
  const original = entry('legacy', 27);
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([original]));
  assert.equal(readLocalHistory(storage)[0].outcome, 'cleared');
  assert.equal(
    recordLocalResult(storage, {
      ...entry('defeat', 9),
      outcome: 'defeated',
    }),
    true,
  );
  const history = readLocalHistory(storage);
  assert.deepEqual(
    history.map((row) => row.outcome),
    ['defeated', 'cleared'],
  );
  assert.deepEqual(localScoreSummary(storage), { count: 2, best: 27, total: 36 });
  assert.equal(
    recordLocalResult(storage, {
      ...entry('invalid', 11),
      outcome: 'unknown',
    }),
    false,
  );
});

test('unsorted imported histories are displayed newest first without reordering equal timestamps', () => {
  const storage = fakeStorage();
  storage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify([
      { ...entry('older', 41), completedAt: '2026-10-27T18:10:00.000Z' },
      { ...entry('latest', 13), outcome: 'defeated', completedAt: '2026-10-27T18:20:00.000Z' },
    ]),
  );
  assert.deepEqual(
    readLocalHistory(storage).map(({ id }) => id),
    ['latest', 'older'],
  );
  assert.deepEqual(localScoreSummary(storage), { count: 2, best: 41, total: 54 });
});
