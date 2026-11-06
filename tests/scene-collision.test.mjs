import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createObstacle } from '../src/encounters.js';
import {
  intersectsSolid,
  resolveMovingObstacle,
  sweepSphereAabb,
} from '../src/scene-collision.js';

const point = (x, y, z) => ({ x, y, z });
const cube = (center, half) => [{ center, half }];
const origin = point(0, 0, 0);

test('a boosted ship cannot tunnel through a thin wall in a single frame', () => {
  const solids = cube(origin, point(0.3, 8, 8));
  const from = point(-40, 0, 0);
  const to = point(40, 0, 0);
  const hit = sweepSphereAabb(from, to, origin, solids[0].half, 1.3);
  assert.ok(hit);
  assert.ok(hit.time > 0 && hit.time < 1);
  const result = resolveMovingObstacle(from, to, solids, origin, origin);
  assert.equal(result.collided, true);
  assert.ok(result.position.x < -1.6);
  assert.equal(intersectsSolid(result.position, solids, origin, 1.3), false);
});

test('relative sweep catches a solid that scrolls through a stationary ship', () => {
  const solids = cube(origin, point(2, 2, 2));
  const from = point(0, 0, 0);
  const before = point(0, 0, -35);
  const after = point(0, 0, 35);
  const result = resolveMovingObstacle(from, from, solids, before, after);
  assert.equal(result.collided, true);
  assert.ok(result.position.z > 38.3, 'body pushed ahead of approaching obstacle');
  assert.equal(intersectsSolid(result.position, solids, after, 1.3), false);
});

test('starting inside a solid ejects the body through the nearest surface', () => {
  const solids = cube(origin, point(7, 3, 6));
  const inside = point(0, 0, 0);
  const result = resolveMovingObstacle(inside, inside, solids, origin, origin, 1);
  assert.equal(result.collided, true);
  assert.ok(result.position.y < -4);
  assert.equal(intersectsSolid(result.position, solids, origin, 1), false);
});

test('the tunnel gate opening remains traversable without invisible walls', () => {
  const tunnel = createObstacle('tunnel');
  const solids = tunnel.userData.solids;
  const valid = resolveMovingObstacle(
    point(9, 10, -75),
    point(9, 10, -140),
    solids,
    origin,
    origin,
  );
  assert.equal(valid.collided, false);
  assert.deepEqual(valid.position, point(9, 10, -140));
  const invalid = resolveMovingObstacle(
    point(-25, 10, -75),
    point(-25, 10, -140),
    solids,
    origin,
    origin,
  );
  assert.equal(invalid.collided, true);
  assert.ok(invalid.position.z > -110);
});

test('visible structural geometry has a collider and detail meshes are tagged', () => {
  for (const kind of ['tunnel', 'gantry', 'reactor', 'carrier', 'satellite', 'debris']) {
    const obstacle = createObstacle(kind);
    let solidMeshes = 0;
    obstacle.traverse((mesh) => {
      if (!mesh.isMesh) return;
      assert.ok(['solid', 'decoration'].includes(mesh.userData.collisionRole));
      if (mesh.userData.collisionRole === 'solid') solidMeshes++;
    });
    assert.equal(obstacle.userData.solids.length, solidMeshes, kind);
    assert.ok(solidMeshes > 0);
    for (const { center, half } of obstacle.userData.solids) {
      for (const axis of ['x', 'y', 'z']) {
        assert.ok(Number.isFinite(center[axis]), kind);
        assert.ok(Number.isFinite(half[axis]) && half[axis] > 0, kind);
      }
    }
  }
  const debris = createObstacle('debris');
  assert.ok(debris.userData.solids.length >= 5, 'wreckage fins are physical');
  const gate = createObstacle('carrier');
  assert.ok(gate.userData.solids.length >= 10, 'hangar, turret and hull are physical');
});

test('static queries reject invalid spawn positions inside solids', () => {
  const solids = cube(point(12, 5, 0), point(3, 4, 7));
  assert.equal(intersectsSolid(point(12, 5, 0), solids, origin, 1), true);
  assert.equal(intersectsSolid(point(0, 5, 0), solids, origin, 1), false);
  assert.equal(intersectsSolid(point(12, 5, 0), solids, point(12, 0, 0), 1), false);
});

test('solid registry preserves translated obstacle mesh bounds', () => {
  const obstacle = createObstacle('debris');
  obstacle.position.set(10, 4, -50);
  const a = new T.Box3().setFromObject(obstacle);
  assert.ok(a.max.x > 10);
  assert.ok(a.min.z < -50);
  const cloned = createObstacle('debris');
  assert.notEqual(obstacle, cloned);
  assert.deepEqual(
    obstacle.userData.solids.map((s) => s.center.toArray()),
    cloned.userData.solids.map((s) => s.center.toArray()),
  );
});
