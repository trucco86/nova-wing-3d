import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbitalDelta, orbitalDecision } from '../tools/gameplay-boss-orbit-policy.mjs';

const state = {
  state: 'playing',
  boss: true,
  phase: 'recovery',
  mode: 'orbital',
  shield: 202,
  bossParts: 2,
  screen: { cues: [] },
};
const fire = { fire: true, x: 0, y: 0, action: 'fire-recovery' };

test('shortest radar arc crosses the wrap boundary', () => {
  assert.ok(orbitalDelta(3, -3) > 0);
  assert.ok(orbitalDelta(-3, 3) < 0);
  assert.equal(orbitalDelta(null, 2), null);
});

test('scans when no vulnerable cue or target is known', () => {
  assert.equal(orbitalDecision({ ...state, scanReady: true }, fire, 202).utility, 'scan');
});

test('turns toward visible radar target or sweeps without one', () => {
  const target = { ...state, targetVisible: true, playerAngle: 0, targetAngle: -2 };
  assert.equal(orbitalDecision(target, fire, 202).orbit, -1);
  assert.equal(orbitalDecision(state, fire, 202).orbit, 1);
  assert.equal(orbitalDecision({ ...target, mode: 'physical', danger: false }, fire, 202).orbit, 1);
});

test('low shield uses real repair availability and does not override danger', () => {
  const low = { ...state, shield: 100, repairReady: true };
  assert.equal(orbitalDecision(low, fire, 202).utility, 'repair');
  assert.equal(orbitalDecision({ ...low, mode: 'physical', danger: true }, fire, 202), fire);
});

test('open weakpoint preserves attack or uses available precision', () => {
  const open = { ...state, screen: { cues: [{ visible: true, state: 'open' }] } };
  assert.equal(orbitalDecision(open, fire, 202), fire);
  assert.equal(orbitalDecision({ ...open, precisionReady: true }, fire, 202).utility, 'precision');
});
