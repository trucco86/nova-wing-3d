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

test('attack telemetry captures normalized player movement, radar, commands and damage per window', async () => {
  const samples = [
    {
      age: 1,
      mode: 'physical',
      phase: 'windup',
      kind: 'ice-quake',
      cycle: 2,
      danger: true,
      guide: 'ZONA SEGURA →',
      player: { x: -5, y: 0 },
      flightBounds: { horizontal: 10, minY: -5, maxY: 5 },
      shield: 100,
      lives: 3,
      decision: { action: 'dodge' },
      input: ['KeyD'],
    },
    {
      age: 1.25,
      mode: 'physical',
      phase: 'attack',
      kind: 'ice-quake',
      cycle: 2,
      danger: true,
      guide: 'ZONA SEGURA →',
      player: { x: 0, y: 2.5 },
      flightBounds: { horizontal: 10, minY: -5, maxY: 5 },
      shield: 90,
      lives: 3,
      decision: { action: 'dodge' },
      input: ['KeyD'],
    },
    {
      age: 1.5,
      mode: 'orbital',
      phase: 'recovery',
      kind: null,
      cycle: 2,
      player: { x: 5, y: 5 },
      flightBounds: { horizontal: 10, minY: -5, maxY: 5 },
      shield: 90,
      lives: 3,
      decision: { action: 'fire-recovery' },
      input: [],
    },
  ];
  const result = summarizeEncounter(samples).attackWindowTelemetry;
  assert.equal(result.status, 'OBSERVED');
  assert.equal(result.completeWindows, 1);
  assert.equal(result.windows[0].kind, 'ice-quake');
  assert.equal(result.windows[0].durationSeconds, 0.25);
  assert.equal(result.windows[0].dodgeDurationSeconds, 0.25);
  assert.deepEqual(result.windows[0].radarDirections, ['→']);
  assert.deepEqual(result.windows[0].inputKeys, ['KeyD']);
  assert.deepEqual(result.windows[0].playerPositionStart, { x: 0.25, y: 0.5 });
  assert.deepEqual(result.windows[0].playerPositionEnd, { x: 0.5, y: 0.75 });
  assert.equal(result.windows[0].shieldDelta, -10);
  assert.equal(result.windows[0].livesLost, 0);
  assert.equal(result.releaseAuthorized, false);
});

test('attack telemetry marks incomplete windows and blocks unordered clocks', async () => {
  const incomplete = summarizeEncounter([
    {
      age: 1,
      mode: 'physical',
      phase: 'windup',
      kind: 'cryo-pincer',
      cycle: 4,
      shield: 100,
      lives: 3,
      decision: { action: 'observe-danger' },
      input: [],
    },
    { age: 1.25, mode: 'orbital', phase: 'recovery', shield: 100, lives: 3 },
  ]).attackWindowTelemetry;
  assert.equal(incomplete.status, 'INSUFFICIENT_EXPOSURE');
  assert.equal(incomplete.windows[0].complete, false);
  assert.equal(incomplete.windows[0].playerPositionStart, null);
  const blocked = summarizeEncounter([
    { age: 2, mode: 'orbital', phase: 'recovery', shield: 100 },
    { age: 2, mode: 'orbital', phase: 'recovery', shield: 100 },
  ]).attackWindowTelemetry;
  assert.equal(blocked.status, 'BLOCKED');
  assert.equal(blocked.windows.length, 0);
});
