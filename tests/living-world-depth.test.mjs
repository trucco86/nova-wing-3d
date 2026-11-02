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
    assert.deepEqual(
      Array.from(near.instanceMatrix.array),
      next,
      'same simulated time freezes scene',
    );
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

test('Medium updates only drawn instances and High restores identical time-based motion', () => {
  const world = createLivingWorldLayers('city', 'medium');
  const second = world.userData.layers[0].mesh;
  const third = world.userData.layers[1].mesh;
  const matrixAt = (mesh, index) => {
    const matrix = new T.Matrix4();
    mesh.getMatrixAt(index, matrix);
    return matrix.toArray();
  };
  const invisibleSecond = matrixAt(second, 17);
  const invisibleThird = matrixAt(third, 27);
  const helper = world.userData.transformHelper;
  updateLivingWorldLayers(world, { time: 9, travel: 360 });
  assert.equal(world.userData.transformHelper, helper, 'reuses one transform across frames');
  assert.deepEqual(matrixAt(second, 17), invisibleSecond, 'hidden second-plane item is not updated');
  assert.deepEqual(matrixAt(third, 27), invisibleThird, 'hidden third-plane item is not updated');
  const visibleMedium = matrixAt(second, 0);
  setLivingWorldQuality(world, 'high');
  updateLivingWorldLayers(world, { time: 9, travel: 360 });
  assert.deepEqual(matrixAt(second, 0), visibleMedium, 'switching quality preserves motion');
  assert.notDeepEqual(matrixAt(second, 17), invisibleSecond, 'High fills restored second-plane slots');
  assert.notDeepEqual(matrixAt(third, 27), invisibleThird, 'High fills restored third-plane slots');
  const reference = createLivingWorldLayers('city', 'high');
  updateLivingWorldLayers(reference, { time: 9, travel: 360 });
  for (const i of [0, 9, 17])
    assert.deepEqual(
      matrixAt(second, i),
      matrixAt(reference.userData.layers[0].mesh, i),
      'High mode output is identical to original premium animation',
    );
  for (const node of [world, reference]) {
    node.userData.geometry.dispose();
    node.userData.materials.forEach((material) => material.dispose());
  }
});
