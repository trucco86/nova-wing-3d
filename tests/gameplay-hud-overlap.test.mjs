import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHudOverlap, overlapRatio } from '../tools/gameplay-hud-overlap.mjs';

const label = (id, left, visible = true) => ({
  id,
  visible,
  left,
  top: 10,
  right: left + 40,
  bottom: 30,
});
const route = (positions) =>
  positions.map((left, seconds) => ({
    seconds,
    labels: [label('a', 0), label('b', left)],
  }));

test('normalizes overlap by the smaller visible label', () => {
  assert.equal(overlapRatio(label('a', 0), label('b', 20)), 0.5);
  assert.equal(overlapRatio(label('a', 0), label('b', 40)), 0);
});

test('persistent overlap produces a candidate with bounding box evidence', () => {
  const result = inspectHudOverlap(route([20, 20, 20, 20]));
  assert.equal(result.status, 'FINDINGS');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].seconds, 2);
  assert.equal(result.releaseAuthorized, false);
});

test('transient overlap and clean separation are not persistent findings', () => {
  const result = inspectHudOverlap(route([20, 20, 45, 20, 45]));
  assert.equal(result.status, 'OBSERVED_OK');
  assert.equal(result.findings.length, 0);
});

test('hidden labels do not establish observation coverage', () => {
  const samples = route([20, 20, 20]).map((sample) => ({
    ...sample,
    labels: [sample.labels[0], label('b', 20, false)],
  }));
  assert.equal(inspectHudOverlap(samples).status, 'INSUFFICIENT_EXPOSURE');
});

test('invalid geometry or clock is blocked', () => {
  const samples = route([20, 20, 20]);
  samples[1].seconds = 0;
  assert.equal(inspectHudOverlap(samples).status, 'BLOCKED');
});
