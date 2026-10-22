import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickupStep } from '../src/pickup-assist.js';
const player = { x: 0, y: 6, z: 9 };
test('collects a ring crossing the player plane at high speed', () => {
  const result = pickupStep({ position: { x: 3, y: 8, z: -22 }, player, speed: 1000, dt: 0.06 });
  assert.equal(result.collected, true);
});
test('near misses outside the visible collection radius are not collected', () => {
  const result = pickupStep({ position: { x: 12, y: 6, z: 6 }, player, speed: 100, dt: 0.035 });
  assert.equal(result.collected, false);
  assert.equal(result.attracted, false);
});
test('magnetism starts when close in approach corridor but does not collect early', () => {
  const result = pickupStep({ position: { x: 7, y: 6, z: -19 }, player, speed: 90, dt: 0.035 });
  assert.equal(result.attracted, true);
  assert.ok(result.x < 7);
  assert.equal(result.collected, false);
});
test('pets use a smaller contact radius but accept close swept encounters', () => {
  const yes = pickupStep({
    position: { x: 3, y: 6, z: 0 },
    player,
    speed: 300,
    dt: 0.05,
    kind: 'pet:toy',
  });
  const no = pickupStep({
    position: { x: 7, y: 6, z: 0 },
    player,
    speed: 300,
    dt: 0.05,
    kind: 'pet:toy',
  });
  assert.equal(yes.collected, true);
  assert.equal(no.collected, false);
});
test('invalid motion never awards pickups', () => {
  const r = pickupStep({ position: { x: 0, y: 6, z: 0 }, player, speed: NaN, dt: 0.035 });
  assert.equal(r.collected, false);
});
