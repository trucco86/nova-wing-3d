import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equipmentDecision } from '../tools/gameplay-boss-equipment-policy.mjs';

const state = {
  state: 'playing',
  boss: true,
  phase: 'recovery',
  pods: 3,
  podsDetached: false,
  robot: false,
  energy: 100,
};
const fire = { fire: true, x: 0, y: 0, action: 'fire-recovery' };

test('deploys equipped pods, then transforms once in safe recovery', () => {
  assert.equal(equipmentDecision(state, fire).equipment, 'pods');
  assert.equal(equipmentDecision(state, fire, ['pods']).equipment, 'robot');
  assert.equal(equipmentDecision(state, fire, ['pods', 'robot']), fire);
});

test('never overrides dodge, special, or danger', () => {
  const dodge = { fire: false, x: 1, y: 0, action: 'dodge' };
  const special = { fire: false, action: 'special-plasma', special: 'plasma' };
  assert.equal(equipmentDecision(state, dodge), dodge);
  assert.equal(equipmentDecision(state, special), special);
  assert.equal(equipmentDecision({ ...state, danger: true }, fire), fire);
});

test('does not invent unequipped pods or spend unavailable energy', () => {
  assert.equal(equipmentDecision({ ...state, pods: 0, energy: 14 }, fire), fire);
  assert.equal(equipmentDecision({ ...state, phase: 'attack' }, fire), fire);
  assert.equal(equipmentDecision({ ...state, state: 'collapsing' }, fire), fire);
});
