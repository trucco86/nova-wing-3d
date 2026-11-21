import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMarvinRival } from '../src/marvin-rival.js';
import {
  EUROPA_CAVE_SPAWN_Z,
  EUROPA_CAVE_HANDOFF_DISTANCE,
  europaCaveApproachAt,
} from '../src/europa-cave-approach.js';
test('glacial cave grows from deep approach before physical deck takes ownership', () => {
  assert.ok(EUROPA_CAVE_SPAWN_Z < -900);
  const distant = europaCaveApproachAt(EUROPA_CAVE_SPAWN_Z, 1500);
  const approach = europaCaveApproachAt(-450, 1500);
  const align = europaCaveApproachAt(-70, 1500);
  const entry = europaCaveApproachAt(-10, 1500);
  const farExit = europaCaveApproachAt(1590, 1500);
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
  assert.deepEqual(europaCaveApproachAt(-70, 1500), europaCaveApproachAt(-70, 1500));
  assert.throws(() => europaCaveApproachAt(Infinity, 1500), RangeError);
  assert.throws(() => europaCaveApproachAt(-300, 0), RangeError);
});

test('Marvin stays outside Europa cave view but is not removed from the story', () => {
  const scene = new T.Scene();
  const marvin = createMarvinRival(scene);
  const notices = [];
  const options = {
    sector: 5,
    elapsed: 44,
    duration: 110,
    bossActive: false,
    player: new T.Vector3(0, 6, 9),
    fire: () => {
      throw new Error('no rival projectile while cave is visible');
    },
    notify: (line) => notices.push(line),
  };
  marvin.update({ ...options, suspended: true });
  assert.equal(marvin.snapshot().visible, false);
  assert.equal(marvin.snapshot().phase, 'cave-transit');
  assert.equal(marvin.target(), null, 'no invisible enemy hitbox in tunnel');
  assert.equal(notices.length, 0, 'no offscreen attack announcement');
  marvin.update({ ...options, elapsed: 50, suspended: false, fire: null });
  assert.equal(marvin.snapshot().visible, true, 'rival resumes after the physical cave');
  assert.equal(notices.length, 1);
  marvin.destroy();
});
