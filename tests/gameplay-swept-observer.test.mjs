import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossedSolid, inspectSweptCity } from '../tools/gameplay-swept-observer.mjs';

const wall = { kind: 'wall', active: true, x: 0, y: 0, z: 0, halfX: 1, halfY: 3, halfZ: 3 };
const point = (x, y = 0) => ({ x, y, z: 0 });
const sample = (seconds, x, collider = wall) => ({
  seconds,
  sector: 1,
  state: 'playing',
  player: { x, y: 0 },
  playerDepth: 0,
  cityPhysicalSolids: [collider],
});

test('detects a complete crossing in either direction', () => {
  assert.equal(crossedSolid(point(-5), point(5), wall, wall), true);
  assert.equal(crossedSolid(point(5), point(-5), wall, wall), true);
});

test('uses relative motion of a moving solid', () => {
  const before = { ...wall, x: -5 };
  const after = { ...wall, x: 5 };
  assert.equal(crossedSolid(point(0), point(0), before, after), true);
});

test('ignores safe bypasses, tangency, and departures from the interior', () => {
  assert.equal(crossedSolid(point(-5, 4), point(5, 4), wall, wall), false);
  assert.equal(crossedSolid(point(-5, 3), point(5, 3), wall, wall), false);
  assert.equal(crossedSolid(point(0), point(5), wall, wall), false);
});

test('excludes inactive solids and geometry changes', () => {
  const hidden = { ...wall, active: false };
  const changed = { ...wall, halfX: 2 };
  assert.equal(crossedSolid(point(-5), point(5), wall, hidden), false);
  assert.equal(crossedSolid(point(-5), point(5), wall, changed), false);
});

test('deduplicates candidate crossings and retains replay evidence', () => {
  const samples = [sample(0, -5), sample(0.1, 5), sample(0.2, -5)];
  const result = inspectSweptCity(samples);
  assert.equal(result.status, 'FINDINGS');
  assert.equal(result.pairs, 2);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].detectedAt, 0.1);
  assert.equal(result.humanApproval, 'PENDING');
  assert.equal(result.releaseAuthorized, false);
});

test('does not infer crossings from discontinuities or tile wraps', () => {
  const wrapped = { ...wall, x: 100 };
  const gap = [sample(0, -5), sample(1, 5)];
  const wrap = [sample(0, -5), sample(0.1, 5, wrapped)];
  assert.equal(inspectSweptCity(gap).status, 'BLOCKED');
  assert.equal(inspectSweptCity(wrap).status, 'BLOCKED');
  assert.equal(inspectSweptCity([]).status, 'BLOCKED');
});

test('valid observation without crossing is not release approval', () => {
  const result = inspectSweptCity([sample(0, -5), sample(0.1, -4)]);
  assert.equal(result.status, 'OBSERVED_OK');
  assert.equal(result.releaseAuthorized, false);
});
