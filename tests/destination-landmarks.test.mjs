import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import {
  createDestinationLandmarks,
  updateDestinationLandmarks,
} from '../src/destination-landmarks.js';

test('worlds have identifiable, non-colliding geometry and distinct silhouettes', () => {
  const names = new Map([
    [4, 'venus-sulfur-cloud-columns'],
    [5, 'europa-fractured-glacial-spires'],
    [6, 'neptune-turbulent-cloud-columns'],
    [9, 'titan-icy-mineral-monoliths'],
  ]);
  for (const [world, landmark] of names) {
    const root = createDestinationLandmarks(world);
    assert.equal(root.name, 'destination-landmarks');
    assert.ok(root.getObjectByName(landmark)?.isInstancedMesh);
    assert.ok(root.children.every((x) => x.userData.visualOnly));
    assert.ok(root.children.every((x) => x.castShadow === false));
    root.traverse((child) => assert.equal(child.userData.hitbox, undefined));
    for (const mesh of root.children.filter((x) => x.isInstancedMesh)) {
      assert.ok(mesh.count <= 54, 'bounded instances per world');
      assert.equal(mesh.frustumCulled, false);
      assert.ok(mesh.instanceColor);
    }
    assert.equal(createDestinationLandmarks(world - 0)?.userData.world, world);
  }
  assert.ok(createDestinationLandmarks(0) === null);
  assert.ok(createDestinationLandmarks(8) === null);
});

test('Venus lightning pulses, Neptune clouds drift, and pause reproduces a frame', () => {
  for (const world of [4, 6]) {
    const root = createDestinationLandmarks(world);
    updateDestinationLandmarks(root, 13.1);
    const cloud = root.getObjectByName(
      world === 4 ? 'venus-sulfur-cloud-columns' : 'neptune-turbulent-cloud-columns',
    );
    const x = cloud.position.x;
    const alpha = cloud.material.opacity;
    const lightning = root.getObjectByName('venus-lightning-at-cloud-horizon');
    const lAlpha = lightning?.material.opacity;
    updateDestinationLandmarks(root, 13.1);
    assert.equal(cloud.position.x, x);
    assert.equal(cloud.material.opacity, alpha);
    if (lightning) assert.equal(lightning.material.opacity, lAlpha);
    updateDestinationLandmarks(root, 19.1);
    assert.notEqual(cloud.position.x, x);
  }
});

test('High/Medium quality changes only decorative objects, not the planet or collisions', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const terrain = scene.getObjectByName('europa-fractured-glacial-spires');
  const plates = scene.getObjectByName('europa-rift-ice-plates-high');
  assert.ok(terrain?.isInstancedMesh);
  assert.ok(plates?.isInstancedMesh);
  world.setGraphicsQuality('medium');
  assert.equal(terrain.visible, true);
  assert.equal(plates.visible, false);
  world.setDestinationArrival(27);
  assert.equal(plates.visible, false);
  // Arrival re-render must not undo graphics quality or resurrect a hidden
  // scene prop on the next frame.
  world.setDestinationArrival(28);
  assert.equal(plates.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(plates.visible, true);
  world.setSector(SECTORS[9], 9);
  assert.ok(scene.getObjectByName('titan-methane-lake-shores')?.isInstancedMesh);
  assert.equal(scene.getObjectByName('europa-fractured-glacial-spires'), undefined);
  world.reset();
  assert.equal(scene.getObjectByName('destination-escape').visible, false);
});

test('Jupiter spot, Neptune storm and Saturn rings are physically attached to their planet', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[3], 3);
  let planet = scene.getObjectByName('destination-celestial-body');
  assert.equal(planet.material.uniforms.kind.value, 0);
  world.setDestinationArrival(14);
  assert.equal(planet.material.uniforms.drift.value, 14);
  world.setSector(SECTORS[6], 6);
  planet = scene.getObjectByName('destination-celestial-body');
  assert.equal(planet.material.uniforms.kind.value, 3);
  world.setSector(SECTORS[7], 7);
  planet = scene.getObjectByName('destination-celestial-body');
  assert.equal(planet.getObjectByName('saturn-planetary-ring-system').isMesh, true);
  assert.equal(planet.children.filter((x) => x.name === 'saturn-astronomical-band').length, 3);
  world.setSector(SECTORS[4], 4);
  assert.equal(scene.getObjectByName('saturn-planetary-ring-system'), undefined);
});

test('planetary horizon objects never spin or drift with generic obstacle travel', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[4], 4);
  const root = scene.getObjectByName('destination-landmarks');
  assert.ok(root.userData.fixedSky, 'landmarks belong to the horizon');
  world.setDestinationArrival(30);
  const before = { x: root.position.x, z: root.position.z, rot: root.rotation.z };
  world.update(0.5, 30, 450, true);
  assert.deepEqual(
    { x: root.position.x, z: root.position.z, rot: root.rotation.z },
    before,
    'only clouds may drift, not the entire planet environment',
  );
  world.setDestinationArrival(30);
  assert.deepEqual(
    { x: root.position.x, z: root.position.z, rot: root.rotation.z },
    before,
    'pausing/re-rendering the same mission time is deterministic',
  );
});
