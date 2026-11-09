import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createAsteroidInterior } from '../src/asteroid-interior.js';

test('asteroid approach is a rocky opening, not concentric portal hoops', () => {
  const scene = new T.Scene();
  const asteroid = createAsteroidInterior(scene);
  asteroid.reset(true);
  const entrance = scene.getObjectByName('asteroid-entrance');
  const face = entrance.getObjectByName('asteroid-entrance-jagged-rock-face');
  const veins = entrance.getObjectByName('asteroid-entrance-mineral-faults');
  assert.ok(face.isInstancedMesh);
  assert.equal(face.count, 56);
  assert.ok(veins.isInstancedMesh);
  assert.equal(veins.count, 12);
  assert.equal(
    entrance.children.some((mesh) => mesh.geometry?.type === 'TorusGeometry'),
    false,
  );
  asteroid.destroy();
  assert.equal(scene.children.length, 0);
});

test('entering rock has continuous motion and a deterministic pause and reset', () => {
  const scene = new T.Scene();
  const asteroid = createAsteroidInterior(scene);
  const entrance = scene.getObjectByName('asteroid-entrance');
  asteroid.reset(true);
  asteroid.update(15, 45);
  const before = entrance.position.z;
  asteroid.setPhase('transition');
  assert.equal(entrance.position.z, before, 'switching phase cannot teleport the entrance');
  asteroid.update(0.05, 45);
  assert.ok(entrance.position.z > before);
  const z = entrance.position.z;
  asteroid.update(0, 45);
  assert.equal(entrance.position.z, z, 'pausing cannot drift');
  asteroid.update(10.95, 45);
  assert.ok(entrance.position.z > 50, 'rock passes behind the pilot, revealing the cavern');
  asteroid.reset(true);
  assert.equal(entrance.position.z, -630);
  assert.equal(entrance.scale.x, 1);
  asteroid.destroy();
});

test('the cavern stays behind its mouth and shares its forward speed through entry', () => {
  const scene = new T.Scene();
  const asteroid = createAsteroidInterior(scene);
  asteroid.reset(true);
  asteroid.update(16, 48);
  const mouth = scene.getObjectByName('asteroid-entrance');
  const tunnel = scene.getObjectByName('asteroid-cavern');
  const first = tunnel.children[0];
  assert.ok(first.position.z < mouth.position.z - 100, 'no tunnel section ahead of the opening');
  const before = first.position.z;
  asteroid.setPhase('transition');
  assert.equal(first.position.z, before, 'phase change preserves the visible cavern');
  const gap = mouth.position.z - first.position.z;
  for (const speed of [48, 90, 48]) {
    const previous = mouth.position.z;
    asteroid.update(0.05, speed);
    assert.ok(Math.abs(mouth.position.z - previous - speed * 0.05) < 1e-8);
    assert.ok(Math.abs(mouth.position.z - first.position.z - gap) < 1e-8);
    assert.equal(mouth.scale.x, 1, 'perspective supplies enlargement, not artificial scaling');
  }
  asteroid.setPhase('interior');
  assert.equal(mouth.visible, true, 'a time gate cannot remove rock before the camera crosses it');
  const positions = tunnel.children.map((section) => section.position.z);
  asteroid.update(0, 90);
  assert.deepEqual(
    tunnel.children.map((section) => section.position.z),
    positions,
  );
  asteroid.destroy();
});

test('entry motion and reset are identical at 30, 60 and 120 Hz', () => {
  const results = [];
  for (const hz of [30, 60, 120]) {
    const scene = new T.Scene();
    const asteroid = createAsteroidInterior(scene);
    asteroid.reset(true);
    asteroid.update(16, 48);
    asteroid.setPhase('transition');
    for (let frame = 0; frame < hz * 12; frame++) asteroid.update(1 / hz, 48);
    results.push(scene.getObjectByName('asteroid-entrance').position.z);
    asteroid.reset(true);
    const tunnel = scene.getObjectByName('asteroid-cavern');
    assert.ok(tunnel.children.every((section) => section.rotation.z === 0));
    assert.ok(tunnel.children.every((section) => section.position.z < -630));
    asteroid.destroy();
  }
  assert.ok(Math.max(...results) - Math.min(...results) < 1e-7);
});

test('the complete throat clears the chase camera before the entrance disappears', () => {
  const scene = new T.Scene();
  const asteroid = createAsteroidInterior(scene);
  asteroid.reset(true);
  asteroid.update(16, 48);
  asteroid.setPhase('transition');
  const mouth = scene.getObjectByName('asteroid-entrance');
  while (mouth.visible) asteroid.update(1 / 120, 48);
  const throat = mouth.getObjectByName('asteroid-entrance-throat');
  scene.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(throat);
  assert.ok(bounds.min.z > 62, 'all throat rock must be behind the farthest chase camera');
  asteroid.destroy();
});
