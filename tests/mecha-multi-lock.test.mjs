import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import {
  mechaMultiLockCapacity,
  availableMechaTargets,
  collectMultiLocks,
  multiLockCost,
} from '../src/mecha-multi-lock.js';

test('robot multi-target capacity grows 3, 5, 8, 12 without altering the legacy single-target beams', () => {
  assert.deepEqual([0, 6, 12, 18].map(mechaMultiLockCapacity), [3, 5, 8, 12]);
  assert.equal(mechaMultiLockCapacity(30), 12);
  assert.ok(multiLockCost(12) <= 60);
  assert.ok(multiLockCost(1) < multiLockCost(8));
});

test('front-cone scan rejects targets behind, far, occluded and duplicates', () => {
  const origin = new T.Vector3(0, 0, 5);
  const a = { id: 'drone-a', position: new T.Vector3(0, 0, -100), weak: false };
  const b = { id: 'reactor-b', position: new T.Vector3(20, 5, -140), weak: true };
  const blocked = { id: 'blocked', position: new T.Vector3(-3, 0, -80) };
  const behind = { id: 'behind', position: new T.Vector3(0, 0, 80) };
  const far = { id: 'far', position: new T.Vector3(0, 0, -400) };
  const candidates = availableMechaTargets(origin, [a, b, blocked, behind, far], {
    visible: (_, target) => target !== blocked.position,
  });
  assert.deepEqual(new Set(candidates.map((x) => x.id)), new Set(['drone-a', 'reactor-b']));
  const first = collectMultiLocks([], candidates, 3, 1);
  const second = collectMultiLocks(first, candidates, 3, 2);
  assert.equal(first.length, 1);
  assert.equal(second.length, 2);
  assert.equal(new Set(second.map((x) => x.id)).size, 2);
  const afterKill = collectMultiLocks(second, [candidates[0]], 3, 3);
  assert.equal(afterKill.length, 1);
});

test('robot hold/release accumulates real targets in Devastador QA without spending energy until firing', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.key('KeyT');
  assert.equal(h.game.snapshot().mecha.active, true);
  h.advance(6, 0.1);
  const before = h.game.snapshot().energy;
  h.key('KeyN');
  h.advance(0.7, 0.1);
  const tracking = h.game.snapshot();
  assert.equal(tracking.mecha.multiLockHeld, true);
  assert.ok(tracking.mecha.multiLockTargets >= 1);
  assert.ok(tracking.mecha.multiLockTargets <= tracking.mecha.multiLockCapacity);
  assert.equal(tracking.energy, before);
  h.key('KeyN', false);
  const fired = h.game.snapshot();
  assert.equal(fired.mecha.multiLockHeld, false);
  assert.equal(fired.mecha.multiLockTargets, 0);
  assert.ok(fired.energy < before);
  assert.ok(fired.shotDirections.length >= 1);
  assert.equal(fired.developerSession, true);
});

test('short LOCK press preserves the existing toggle-to-auto-aim behavior', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.key('KeyT');
  h.key('KeyN');
  h.key('KeyN', false);
  assert.equal(h.game.snapshot().mecha.lockEnabled, true);
  h.key('KeyN');
  h.key('KeyN', false);
  assert.equal(h.game.snapshot().mecha.lockEnabled, false);
});
