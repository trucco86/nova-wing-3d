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
  assert.equal(entrance.children.some((mesh) => mesh.geometry?.type === 'TorusGeometry'), false);
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
