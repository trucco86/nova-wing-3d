import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeEncounter,
  compareEncounters,
} from '../tools/gameplay-boss-encounter-metrics.mjs';

const route = (shieldEnd, input = []) => [
  { age: 0, shield: 100, mode: 'orbital', phase: 'approach' },
  {
    age: 9,
    shield: 100,
    mode: 'physical',
    phase: 'windup',
    kind: 'pincer',
    cycle: 0,
    danger: true,
    guide: 'ZONA SEGURA →',
    input,
  },
  { age: 12, shield: shieldEnd, mode: 'orbital', phase: 'recovery' },
];

test('encounter measures attack windows, exposure, inputs and shield loss', () => {
  const result = summarizeEncounter(route(80, ['KeyD']));
  assert.equal(result.shieldLoss, 20);
  assert.equal(result.observedSeconds, 12);
  assert.equal(result.attackWindows, 1);
  assert.equal(result.guidedSamples, 1);
  assert.equal(result.inputSamples, 1);
  assert.deepEqual(result.distinctAttacks, ['pincer']);
});

test('comparable samples produce a difference, not a release gate', () => {
  const passive = summarizeEncounter(route(70));
  const reactive = summarizeEncounter(route(90, ['KeyD']));
  const comparison = compareEncounters(passive, reactive);
  assert.equal(comparison.status, 'REVIEW_REQUIRED');
  assert.equal(comparison.shieldLossDifference, 20);
  assert.equal(comparison.releaseAuthorized, false);
});

test('missing inputs or different durations cannot prove a dodge advantage', () => {
  const passive = summarizeEncounter(route(70));
  const reactive = summarizeEncounter(route(90));
  const comparison = compareEncounters(passive, reactive);
  assert.equal(comparison.status, 'INSUFFICIENT_EXPOSURE');
  const short = summarizeEncounter(route(90, ['KeyD']).slice(0, 2));
  assert.equal(compareEncounters(passive, short).shieldLossDifference, null);
});
