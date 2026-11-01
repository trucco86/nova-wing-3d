import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createLivingWorldLayers,
  updateLivingWorldLayers,
  setLivingWorldQuality,
  LIVING_WORLD_PROFILES,
} from '../src/living-world-depth.js';

test('all ten worlds provide unique near/far animated planes with fixed GPU draw counts', () => {
  const profiles = Object.values(LIVING_WORLD_PROFILES);
  assert.equal(profiles.length, 10);
  assert.equal(new Set(profiles.map((p) => p.name)).size, 10);
  for (const theme of Object.keys(LIVING_WORLD_PROFILES)) {
    const world = createLivingWorldLayers(theme);
    assert.equal(world.userData.visualOnly, true);
    assert.equal(world.userData.fixedSky, true);
    assert.equal(world.userData.layers.length, 2);
    assert.equal(world.children.length, 2, 'only two instanced draws per world');
    assert.ok(world.children.every((p) => p.isInstancedMesh && p.userData.visualOnly));
    for (const layer of world.userData.layers) {
      assert.ok(layer.width >= 120, 'busy lanes must stay clear of the player aiming window');
      assert.ok(layer.count <= 28);
    }
    const near = world.userData.layers[0].mesh;
    const before = Array.from(near.instanceMatrix.array);
    updateLivingWorldLayers(world, { time: 17, travel: 950 });
    assert.notDeepEqual(Array.from(near.instanceMatrix.array), before);
    const next = Array.from(near.instanceMatrix.array);
    updateLivingWorldLayers(world, { time: 17, travel: 950 });
    assert.deepEqual(Array.from(near.instanceMatrix.array), next, 'same simulated time freezes scene');
    setLivingWorldQuality(world, 'medium');
    assert.equal(world.userData.layers[0].mesh.count, 10);
    assert.equal(world.userData.layers[1].mesh.count, 14);
    setLivingWorldQuality(world, 'high');
    assert.equal(world.userData.layers[0].mesh.count, 18);
    assert.equal(world.userData.layers[1].mesh.count, 28);
    world.traverse((obj) => obj.geometry?.dispose());
    world.userData.materials.forEach((material) => material.dispose());
  }
});

test('ambient planes do not create targetable geometry, lights or collisions', () => {
  const world = createLivingWorldLayers('station');
  let models = 0;
  let collision = false;
  world.traverse((node) => {
    if (node.isMesh) {
      models++;
      collision ||= !!node.userData.collider || !!node.userData.damage || !!node.userData.target;
    }
  });
  assert.equal(models, 2);
  assert.equal(collision, false);
  assert.ok(world.userData.geometry instanceof T.BufferGeometry);
  assert.equal(createLivingWorldLayers('unknown'), null);
  world.userData.geometry.dispose();
  world.userData.materials.forEach((material) => material.dispose());
});
