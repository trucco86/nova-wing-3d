import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORBIT9_BOUNDS,
  ORBIT9_CLUE_POSITIONS,
  ORBIT9_SURVIVOR,
  ORBIT9_DISTRICTS,
  ORBIT9_OBSTACLES,
  ORBIT9_SCENERY_SOLIDS,
  ORBIT9_SPAWN,
  orbit9Blocked,
  orbit9Move,
  orbit9District,
  orbit9MapPoint,
} from '../src/orbit9-free-roam.js';
import { orbit9CameraPose, orbit9CameraIntersectsSolid } from '../src/orbit9-camera.js';

test('Orbit-9 offers three non-linear regions and reachable story landmarks', () => {
  assert.equal(ORBIT9_DISTRICTS.length, 4);
  assert.equal(ORBIT9_CLUE_POSITIONS.length, 3);
  for (const [x, z] of [...ORBIT9_CLUE_POSITIONS, ORBIT9_SURVIVOR]) {
    assert.ok(x > ORBIT9_BOUNDS.minX && x < ORBIT9_BOUNDS.maxX);
    assert.ok(z > ORBIT9_BOUNDS.minZ && z < ORBIT9_BOUNDS.maxZ);
    assert.equal(orbit9Blocked(x, z), false, 'story landmark must be accessible');
  }
  assert.equal(orbit9District(-38, -18).id, 'science');
  assert.equal(orbit9District(39, -55).id, 'reactor');
  assert.equal(orbit9District(-37, -82).id, 'archive');
  assert.equal(orbit9District(ORBIT9_SPAWN.x, ORBIT9_SPAWN.z).id, 'central');
});

test('free-roam movement stays inside world limits, allows strafing and slides on obstacles', () => {
  const edge = orbit9Move(0, 12, 500, -500);
  assert.ok(edge.x <= ORBIT9_BOUNDS.maxX);
  assert.ok(edge.z >= ORBIT9_BOUNDS.minZ);
  const corner = ORBIT9_OBSTACLES.find((block) => block.id === 'core');
  assert.ok(corner);
  const blocked = orbit9Move(0, -25, 0, -30);
  assert.ok(blocked.z > -35, 'cannot walk straight through reactor core');
  const lateral = orbit9Move(0, -25, 18, -30);
  assert.ok(lateral.x > 0, 'slide around the core sideways');
  assert.ok(lateral.z < -25, 'travel around obstacle when clear');
  const invalid = orbit9Move(NaN, 5, 1, 1);
  assert.deepEqual(invalid, ORBIT9_SPAWN);
});

test('district minimap positions are normalized and never outside the overlay', () => {
  for (const [x, z] of [[0, 12], [-38, -18], [39, -55], [-37, -82], ORBIT9_SURVIVOR]) {
    const spot = orbit9MapPoint(x, z);
    assert.ok(spot.x >= 0 && spot.x <= 100);
    assert.ok(spot.y >= 0 && spot.y <= 100);
  }
  assert.equal(orbit9MapPoint(-56, -100).x, 0);
  assert.equal(orbit9MapPoint(56, 18).y, 100);
  assert.equal(orbit9MapPoint(500, 500).x, 100);
});

test('QA180 decorative carrier walls are solid, cannot be crossed by boost, and do not conceal mission modules', () => {
  assert.equal(ORBIT9_SCENERY_SOLIDS.length, 13);
  for (const [x, z] of [[-50, -28], [-51, -80], [33.5, -36], [-33.5, 10]]) {
    assert.equal(orbit9Blocked(x, z), true, 'visible floor-height wall has a gameplay collider');
  }
  for (const [x, z] of ORBIT9_CLUE_POSITIONS) {
    assert.equal(orbit9Blocked(x, z), false, 'module remains reachable after adding solid scenery');
  }
  const sweep = orbit9Move(0, -25, 0, -70);
  assert.ok(sweep.z > -34, 'large movement cannot tunnel through the reactor core');
  const consoleStop = orbit9Move(-44, -28, -15, 0);
  assert.ok(consoleStop.x > -48.15, 'the cat cannot step through the science console');
});

test('QA180 camera remains outside low scenic walls even when the player stands next to one', () => {
  const pose = orbit9CameraPose(-46, -28, { yaw: -Math.PI / 2, mode: 'follow', aspect: 16 / 9 });
  assert.equal(pose.clipped, true, 'lens retracts before an opaque lab console');
  assert.equal(orbit9CameraIntersectsSolid(pose.eye), false, 'lens never enters lab console');
  assert.equal(orbit9CameraIntersectsSolid({ x: -50, y: 3, z: -28 }), true);
  assert.equal(orbit9CameraIntersectsSolid({ x: -50, y: 20, z: -28 }), false);
});
