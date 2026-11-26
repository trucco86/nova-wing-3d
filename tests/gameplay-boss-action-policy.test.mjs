import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combatDecision } from '../tools/gameplay-boss-action-policy.mjs';

const state = { state: 'playing', boss: true, mode: 'physical' };

test('visible danger prioritizes evasive movement over firing', () => {
  const decision = combatDecision({
    ...state,
    phase: 'windup',
    danger: true,
    guide: 'ZONA SEGURA ↑→',
  });
  assert.equal(decision.action, 'dodge');
  assert.equal(decision.fire, false);
  assert.equal(decision.x, 1);
  assert.equal(decision.y, 1);
});

test('recovery and safe windows permit fire', () => {
  assert.equal(combatDecision({ ...state, phase: 'recovery' }).action, 'fire-recovery');
  assert.equal(combatDecision({ ...state, phase: 'attack', danger: false }).fire, true);
});

test('unknown dangerous direction is not treated as safe', () => {
  assert.equal(combatDecision({ ...state, phase: 'attack', danger: true }).fire, false);
  assert.equal(combatDecision({ ...state, phase: 'windup' }).action, 'observe-danger');
});

test('approach and inactive encounters do not fire', () => {
  assert.equal(combatDecision({ ...state, phase: 'approach' }).fire, false);
  assert.equal(combatDecision({ ...state, state: 'paused', phase: 'recovery' }).fire, false);
  assert.equal(combatDecision({ ...state, boss: false, phase: 'recovery' }).fire, false);
});
