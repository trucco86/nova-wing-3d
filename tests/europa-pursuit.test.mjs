import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EUROPA_PURSUIT_START_SECONDS,
  EUROPA_PURSUIT_END_SECONDS,
  EUROPA_PURSUIT_SLOTS,
  europaPursuitAt,
} from '../src/europa-pursuit.js';

test('Europa super boost has exactly three deterministic side-lane chasers', () => {
  assert.equal(EUROPA_PURSUIT_SLOTS, 3);
  assert.equal(europaPursuitAt(EUROPA_PURSUIT_START_SECONDS, 0).active, true);
  assert.equal(europaPursuitAt(0.5, 0).active, false);
  assert.equal(europaPursuitAt(1, 0).active, true);
  assert.equal(europaPursuitAt(4, 1).fire, true);
  assert.equal(europaPursuitAt(5.8, 1).fire, false);
  assert.equal(europaPursuitAt(EUROPA_PURSUIT_END_SECONDS, 0).active, false);
  for (const t of [0, 0.85, 1.9, 3.7, 5.9, 6.15]) {
    for (let slot = 0; slot < EUROPA_PURSUIT_SLOTS; slot++) {
      const state = europaPursuitAt(t, slot, 10, 12);
      assert.deepEqual(state, europaPursuitAt(t, slot, 10, 12));
      assert.ok(Number.isFinite(state.bank));
      assert.ok(state.z < -55);
      assert.ok(Math.abs(state.x) < 48);
      assert.ok(state.y >= 7 && state.y <= 36);
    }
  }
  assert.ok(europaPursuitAt(3, 0, 20).x > europaPursuitAt(3, 0, -20).x);
  assert.throws(() => europaPursuitAt(-1, 0), RangeError);
  assert.throws(() => europaPursuitAt(3, 3), RangeError);
});
