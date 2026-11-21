import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EUROPA_CAVE_SPAWN_Z,
  EUROPA_CAVE_HANDOFF_DISTANCE,
  europaCaveApproachAt,
} from '../src/europa-cave-approach.js';
test('glacial cave grows from deep approach before physical deck takes ownership', () => {
  assert.ok(EUROPA_CAVE_SPAWN_Z < -900);
  const distant = europaCaveApproachAt(EUROPA_CAVE_SPAWN_Z, 940);
  const approach = europaCaveApproachAt(-450, 940);
  const align = europaCaveApproachAt(-70, 940);
  const entry = europaCaveApproachAt(-10, 940);
  const farExit = europaCaveApproachAt(1030, 940);
  assert.deepEqual(
    [distant.phase, approach.phase, align.phase, entry.phase, farExit.phase],
    ['distant', 'approach', 'align', 'inside', 'exit'],
  );
  assert.equal(distant.inside, false);
  assert.equal(align.inside, false);
  assert.equal(entry.inside, true);
  assert.ok(approach.visualIntensity > distant.visualIntensity);
  assert.ok(entry.cameraIntensity > approach.cameraIntensity);
  assert.ok(EUROPA_CAVE_HANDOFF_DISTANCE < 40);
  assert.deepEqual(europaCaveApproachAt(-70, 940), europaCaveApproachAt(-70, 940));
  assert.throws(() => europaCaveApproachAt(Infinity, 940), RangeError);
  assert.throws(() => europaCaveApproachAt(-300, 0), RangeError);
});
