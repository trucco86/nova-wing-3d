import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dodgeDecision,
  dodgeKeys,
  dodgeTouchOffset,
} from '../tools/gameplay-boss-dodge-policy.mjs';

const warning = {
  mode: 'physical',
  danger: true,
  guide: 'ZONA SEGURA ↑→',
  phase: 'windup',
};

test('physical warning maps visible radar arrows to genuine control inputs', () => {
  const decision = dodgeDecision(warning);
  assert.equal(decision.x, 1);
  assert.equal(decision.y, 1);
  assert.deepEqual(dodgeKeys(decision), ['KeyD', 'KeyW']);
  const touch = dodgeTouchOffset(decision, 20);
  assert.ok(touch.x > 0);
  assert.ok(touch.y < 0);
  assert.ok(Math.abs(Math.hypot(touch.x, touch.y) - 20) < 0.001);
});

test('already safe or inactive warnings produce no unnecessary movement', () => {
  assert.deepEqual(dodgeKeys(dodgeDecision({ ...warning, danger: false })), []);
  assert.deepEqual(dodgeKeys(dodgeDecision({ ...warning, phase: 'recover' })), []);
  assert.deepEqual(dodgeKeys(dodgeDecision({ ...warning, mode: 'orbital' })), []);
});

test('missing or contradictory directions do not invent a safe route', () => {
  const guides = [null, 'ESQUIVE · FORA DA ÁREA', 'ZONA SEGURA ↑↓', 'ZONA SEGURA •'];
  for (const guide of guides) {
    assert.deepEqual(dodgeKeys(dodgeDecision({ ...warning, guide })), []);
  }
  assert.equal(dodgeDecision({ ...warning, danger: null }).reason, 'missing-guidance');
});

test('left and downward decisions preserve keyboard and touchscreen orientation', () => {
  const decision = dodgeDecision({ ...warning, guide: 'ZONA SEGURA ↓←' });
  assert.deepEqual(dodgeKeys(decision), ['KeyA', 'KeyS']);
  const touch = dodgeTouchOffset(decision, 20);
  assert.ok(touch.x < 0);
  assert.ok(touch.y > 0);
  assert.throws(() => dodgeTouchOffset(decision, 0), /radius/);
});
