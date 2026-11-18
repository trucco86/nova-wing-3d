import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { crossesSolid } from '../src/flight.js';

test('QA157: a shared orbit axis preserves projectile positions and velocities', () => {
  const axis = new Vector3(0, 1, 0);
  const initialPosition = new Vector3(27, -3, -68);
  const initialVelocity = new Vector3(-1.5, 0.8, 173);
  const turns = [0, 0.006, -0.09, 0.8, -1.2, Math.PI, -Math.PI / 2];
  for (const turn of turns) {
    const originalPosition = initialPosition.clone().applyAxisAngle(new Vector3(0, 1, 0), -turn);
    const sharedPosition = initialPosition.clone().applyAxisAngle(axis, -turn);
    const originalVelocity = initialVelocity.clone().applyAxisAngle(new Vector3(0, 1, 0), -turn);
    const sharedVelocity = initialVelocity.clone().applyAxisAngle(axis, -turn);
    assert.ok(originalPosition.distanceTo(sharedPosition) < 1e-12);
    assert.ok(originalVelocity.distanceTo(sharedVelocity) < 1e-12);
    assert.deepEqual(axis.toArray(), [0, 1, 0], 'rotation must not mutate the shared axis');
  }
});

test('QA157: reused pod hitbox preserves swept collisions', () => {
  const half = new Vector3(1.6, 1.6, 1.6);
  const pod = new Vector3(5, 4, -10);
  const trajectories = [
    { start: new Vector3(5, 4, -30), end: new Vector3(5, 4, 20), hits: true },
    { start: new Vector3(8.2, 4, -30), end: new Vector3(8.2, 4, 20), hits: false },
    { start: new Vector3(5, 7.5, -30), end: new Vector3(5, 7.5, 20), hits: false },
    { start: new Vector3(5, 4, -30), end: new Vector3(5, 4, -25), hits: false },
  ];
  for (const { start, end, hits } of trajectories) {
    assert.equal(crossesSolid(start, end, pod, half, 0.5), hits);
    assert.equal(
      crossesSolid(start, end, pod, half, 0.5),
      crossesSolid(start, end, pod, new Vector3(1.6, 1.6, 1.6), 0.5),
    );
    assert.deepEqual(half.toArray(), [1.6, 1.6, 1.6], 'collision must not mutate shared half');
  }
});

test('QA157: live orbit and hostile projectile loops do not allocate these vectors per shot', () => {
  const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
  assert.match(source, /const projectileOrbitAxis = new T\.Vector3\(0, 1, 0\);/);
  assert.match(source, /const podCollisionHalf = new T\.Vector3\(1\.6, 1\.6, 1\.6\);/);
  assert.equal((source.match(/\.applyAxisAngle\(projectileOrbitAxis, -turn\)/g) ?? []).length, 4);
  assert.doesNotMatch(source, /\.applyAxisAngle\(new T\.Vector3\(0, 1, 0\), -turn\)/);
  assert.match(
    source,
    /crossesSolid\(from, b\.o\.position, p\.position, podCollisionHalf, 0\.5\)/,
  );
});
