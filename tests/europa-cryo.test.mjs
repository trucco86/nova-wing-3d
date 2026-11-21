import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EUROPA_CRYO_MAX_STACKS,
  EUROPA_CRYO_THAW_SECONDS,
  europaCryoHit,
  europaCryoRoll,
  europaCryoMovement,
  europaCryoBoost,
} from '../src/europa-cryo.js';

test('Europa cryo laser accumulates up to three ice layers with readable controls', () => {
  assert.equal(EUROPA_CRYO_MAX_STACKS, 3);
  assert.ok(EUROPA_CRYO_THAW_SECONDS > 10);
  assert.deepEqual([europaCryoHit(0), europaCryoHit(1), europaCryoHit(2), europaCryoHit(3)], [1, 2, 3, 3]);
  assert.deepEqual([europaCryoMovement(0), europaCryoMovement(3)], [1, 0.7]);
  assert.ok(europaCryoBoost(3) > 0.8, 'boost slowdown is bounded');
});
test('only completed ship roll removes exactly one ice layer', () => {
  assert.deepEqual([europaCryoRoll(3), europaCryoRoll(2), europaCryoRoll(1), europaCryoRoll(0)], [2, 1, 0, 0]);
  assert.throws(() => europaCryoHit(-1), RangeError);
  assert.throws(() => europaCryoRoll(4), RangeError);
  assert.throws(() => europaCryoMovement(0.5), RangeError);
});
