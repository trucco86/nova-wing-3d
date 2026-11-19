import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { CITY_SHIP_CLEARANCE, resolveCitySolidContact } from '../src/city-collision.js';

function fullLaneWall({ z = 0, previousZ = z } = {}) {
  return {
    kind: 'solid-bulkhead',
    solid: true,
    active: true,
    center: new Vector3(0, 18, z),
    half: new Vector3(80, 60, 1),
    previousX: 0,
    previousY: 18,
    previousZ,
  };
}

test('QA161: impassable wall stops the ship at the actual approach face from either direction', () => {
  const wall = fullLaneWall();
  const extent = wall.half.z + CITY_SHIP_CLEARANCE.z;
  const margin = 0.08;
  for (const [startZ, endZ, expectedZ] of [
    [-35, 35, -extent - margin],
    [35, -35, extent + margin],
  ]) {
    const before = new Vector3(0, 6, startZ);
    const next = new Vector3(0, 6, endZ);
    assert.equal(resolveCitySolidContact(before, next, wall), true);
    assert.ok(Math.abs(next.z - expectedZ) < 1e-10);
    assert.equal(next.x, 0, 'no lateral teleport into forbidden area');
    assert.equal(next.y, 6, 'no vertical teleport through a full-height wall');
    assert.equal(
      resolveCitySolidContact(next, next, wall),
      false,
      'resolved position is outside, without repeated collision jitter',
    );
  }
});

test('QA161: large time steps cannot carry the ship through a moving solid from the far side', () => {
  const wall = fullLaneWall({ z: 14, previousZ: -4 });
  const before = new Vector3(0, 6, -25);
  const next = new Vector3(0, 6, 18);
  assert.equal(resolveCitySolidContact(before, next, wall), true);
  assert.ok(
    next.z <= wall.center.z - wall.half.z - CITY_SHIP_CLEARANCE.z,
    'retreats to the original far-facing side, using new collider position',
  );
  assert.equal(next.x, 0);
  assert.equal(next.y, 6);
});

test('QA161: escaping an existing overlap stays possible without trapping the pilot', () => {
  const wall = fullLaneWall();
  for (const exitZ of [-30, 30]) {
    const previous = new Vector3(0, 6, 0);
    const next = new Vector3(0, 6, exitZ);
    assert.equal(resolveCitySolidContact(previous, next, wall), false);
    assert.equal(next.z, exitZ);
  }
});

test('QA161: open corridors keep the original free flight space', () => {
  const wall = fullLaneWall();
  const before = new Vector3(0, 6, -35);
  const next = new Vector3(0, 6, -12);
  assert.equal(resolveCitySolidContact(before, next, wall), false);
  assert.equal(next.z, -12);
});
