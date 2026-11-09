import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { reachSectorBoss } from './mission-scenarios.mjs';
import { defeatBoss } from './combat-helper.mjs';

function saveSector(sector) {
  const save = JSON.stringify({
    version: 1,
    sector,
    credits: 250,
    weapon: 0,
    armor: 0,
    pods: 0,
    score: 15,
  });
  return { getItem: (key) => (key === 'nova-wing-3d-v1' ? save : null), setItem() {} };
}

test('completed sectors emit exactly one ranking event with positive score delta', (t) => {
  const started = [];
  const completed = [];
  const h = harness({
    storage: saveSector(1),
    onStageStarted: (event) => started.push(event),
    onStageFinished: (event) => completed.push(event),
  });
  t.after(() => h.close());
  h.game.start(true);
  assert.deepEqual(started, [{ sector: 2 }]);
  reachSectorBoss(h);
  defeatBoss(h);
  assert.equal(h.game.snapshot().state, 'shop');
  assert.equal(completed.length, 1);
  assert.equal(completed[0].sector, 2);
  assert.equal(completed[0].outcome, 'cleared');
  assert.ok(completed[0].points >= 50);
  assert.ok(completed[0].durationMs >= 80000);
  assert.ok(completed[0].totalPoints >= 65);
  h.advance(1);
  assert.equal(completed.length, 1, 'shop stays idempotent');
  h.game.nextSector();
  assert.deepEqual(started, [{ sector: 2 }, { sector: 3 }]);
  assert.equal(completed.length, 1);
});

test('ranking callback errors are isolated from the actual flight', (t) => {
  const h = harness({
    onStageStarted: () => {
      throw new Error('offline');
    },
    onStageFinished: () => {
      throw new Error('network');
    },
  });
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.game.snapshot().state, 'playing');
});

test('game over stores one defeated attempt without awarding a cleared stage', (t) => {
  const finished = [];
  const h = harness({
    storage: saveSector(1),
    onStageFinished: (result) => finished.push(result),
  });
  t.after(() => h.close());
  h.game.start(true);
  // Respawn grants a protective window; only attempt a hit when gameplay resumes.
  for (let i = 0; i < 12 && h.game.snapshot().state !== 'lost'; i++) {
    h.advance(4, 0.1);
    if (h.game.snapshot().state === 'playing') h.game.damage(100000);
  }
  assert.equal(h.game.snapshot().state, 'lost');
  assert.equal(finished.length, 1);
  assert.equal(finished[0].sector, 2);
  assert.equal(finished[0].outcome, 'defeated');
  assert.ok(finished[0].durationMs > 0);
  h.advance(1);
  assert.equal(finished.length, 1, 'game-over event remains once-only');
});
