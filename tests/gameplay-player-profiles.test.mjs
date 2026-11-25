import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playerProfiles, steeringPlan } from '../tools/gameplay-player-profiles.mjs';

test('synthetic profiles are distinct, bounded, reproducible and cannot mutate the source via plans', () => {
  const names = Object.keys(playerProfiles);
  assert.equal(names.length, 3);
  const plans = names.map(steeringPlan);
  assert.equal(new Set(plans.map((plan) => JSON.stringify(plan))).size, 3);
  for (const plan of plans) {
    assert.ok(plan.every((step) => [-1, 0, 1].includes(step.direction)));
    assert.ok(plan.every((step) => Number.isInteger(step.ticks) && step.ticks > 0));
    assert.ok(plan.reduce((total, step) => total + step.ticks, 0) < 100);
  }
  const changed = steeringPlan('cautious');
  changed[0].ticks = 999;
  assert.notEqual(steeringPlan('cautious')[0].ticks, 999);
  assert.throws(() => steeringPlan('invalid'), /Unknown synthetic player/);
});
