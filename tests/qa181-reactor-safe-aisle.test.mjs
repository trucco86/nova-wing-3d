import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ORBIT9_PLAYER_RADIUS,
  ORBIT9_OBSTACLES,
  orbit9Blocked,
  orbit9Move,
} from '../src/orbit9-free-roam.js';

test('QA181: north aisle permits a real westbound crossing at z=8 without teleporting', () => {
  let x = 39;
  let z = 8;
  let frames = 0;
  while (x > -36 && frames < 240) {
    const next = orbit9Move(x, z, -0.5, 0);
    assert.ok(next.x < x, 'westbound movement must make physical progress');
    assert.equal(next.z, 8);
    assert.equal(orbit9Blocked(next.x, next.z), false);
    x = next.x;
    z = next.z;
    frames++;
  }
  assert.ok(x <= -36);
  assert.ok(frames < 240);
});

test('QA181: the same stage still blocks the research pillar at the player radius', () => {
  const pillar = ORBIT9_OBSTACLES.find(({ id }) => id === 'research-pillar');
  assert.ok(pillar);
  assert.equal(orbit9Blocked(pillar.x, pillar.z), true);
  const safeLeft = pillar.x - pillar.halfX - ORBIT9_PLAYER_RADIUS - 0.1;
  assert.equal(orbit9Blocked(safeLeft, pillar.z), false);
  const moveIntoPillar = orbit9Move(safeLeft, pillar.z, 1, 0);
  assert.equal(moveIntoPillar.x, safeLeft);
});
