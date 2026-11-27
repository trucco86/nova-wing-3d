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

test('attack telemetry includes recovery boundary damage and player input correlation', () => {
  const samples = [
    { age: 1, mode: 'physical', phase: 'windup', kind: 'ice-quake', cycle: 1, danger: true, shield: 100, lives: 3, decision: { action: 'observe-danger' }, input: [], fireInput: null, player: { x: -5, y: 0 }, flightBounds: { horizontal: 10, minY: -5, maxY: 5 } },
    { age: 1.25, mode: 'physical', phase: 'attack', kind: 'ice-quake', cycle: 1, danger: true, shield: 100, lives: 3, decision: { action: 'dodge' }, input: ['KeyD'], fireInput: 'Space', player: { x: 0, y: 2.5 }, flightBounds: { horizontal: 10, minY: -5, maxY: 5 } },
    { age: 1.5, mode: 'orbital', phase: 'recovery', shield: 80, lives: 2, player: { x: 0, y: 0 }, flightBounds: { horizontal: 10, minY: -5, maxY: 5 } },
  ];
  const window = summarizeEncounter(samples).attackWindowTelemetry.windows[0];
  assert.equal(window.boundaryObserved, true);
  assert.equal(window.censored, false);
  assert.equal(window.shieldEnd, 80);
  assert.equal(window.shieldDelta, -20);
  assert.equal(window.livesEnd, 2);
  assert.equal(window.livesLost, 1);
  assert.equal(window.reactionTimeSeconds, 0.25);
  assert.deepEqual(window.playerPath[1].input, ['KeyD']);
  assert.equal(window.playerPath[1].fireInput, 'Space');
});

test('attack telemetry measures immediate reaction and separates consecutive cycles', () => {
  const base = (age, cycle, phase, danger, action) => ({ age, mode: 'physical', phase, kind: 'ice-quake', cycle, danger, shield: 100, lives: 3, decision: { action }, input: [] });
  const result = summarizeEncounter([
    base(1, 1, 'windup', true, 'dodge'),
    base(1.25, 1, 'attack', true, 'fire'),
    base(2, 2, 'windup', true, 'fire'),
    base(2.25, 2, 'attack', false, 'fire'),
    { age: 2.5, mode: 'orbital', phase: 'recovery', shield: 100, lives: 3 },
  ]).attackWindowTelemetry;
  assert.equal(result.windows.length, 2);
  assert.equal(result.windows[0].reactionTimeSeconds, 0);
  assert.equal(result.windows[1].reactionTimeSeconds, null);
  assert.equal(result.windows[0].boundaryObserved, true);
});

test('attack telemetry leaves final window censored without inventing end deltas', () => {
  const result = summarizeEncounter([
    { age: 1, mode: 'physical', phase: 'windup', kind: 'cryo-pincer', cycle: 4, shield: 100, lives: 3, decision: { action: 'observe-danger' }, danger: true },
    { age: 1.25, mode: 'physical', phase: 'attack', kind: 'cryo-pincer', cycle: 4, shield: 90, lives: 3, decision: { action: 'fire' }, danger: false },
  ]).attackWindowTelemetry.windows[0];
  assert.equal(result.censored, true);
  assert.equal(result.boundaryObserved, false);
  assert.equal(result.shieldEnd, 90);
  assert.equal(result.shieldDelta, null);
  assert.equal(result.livesLost, null);
  assert.equal(result.reactionTimeSeconds, null);
});
