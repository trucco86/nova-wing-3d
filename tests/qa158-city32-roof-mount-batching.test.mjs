import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCity32Living, setCity32Quality, updateCity32Living } from '../src/city-32-living.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const anchors = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (110 + (i % 8) * 13),
  z: -35 - Math.floor(i / 2) * 19,
  h: 45 + (i % 8) * 10,
  w: 12 + (i % 5),
  depth: 14,
}));

function matrixPositionAndScale(mesh, i) {
  const matrix = new T.Matrix4();
  const position = new T.Vector3();
  const scale = new T.Vector3();
  mesh.getMatrixAt(i, matrix);
  matrix.decompose(position, new T.Quaternion(), scale);
  return { position, scale };
}

test('QA158: all roof mounts are batched without moving the original searchlights', () => {
  const root = createCity32Living(anchors);
  const lights = root.getObjectByName('city32-sky-searchlights');
  const mounts = lights.getObjectByName('city32-searchlight-roof-mounts');
  const towers = lights.children.filter((node) => node.isGroup);
  assert.ok(mounts?.isInstancedMesh);
  assert.equal(mounts.material.type, 'MeshStandardMaterial');
  assert.equal(towers.length, 6);
  assert.equal(mounts.userData.highCount, towers.length);
  assert.equal(mounts.userData.mediumCount, 3);
  assert.equal(mounts.count, 3);
  assert.equal(
    towers.some((tower) => tower.children.some((child) => child.isMesh && child.name.includes('mount'))),
    false,
    'static mounts must not remain as per-tower draw calls',
  );
  setCity32Quality(root, 'high');
  assert.equal(mounts.count, 6);
  for (let i = 0; i < mounts.count; i++) {
    const { position, scale } = matrixPositionAndScale(mounts, i);
    assert.ok(position.distanceTo(towers[i].position) < 1e-8, 'mount remains fixed to roof');
    assert.ok(scale.distanceTo(new T.Vector3(6, 2.1, 6)) < 1e-5);
    assert.ok(towers[i].getObjectByName('city32-searchlight-pivot'), 'moving beam is preserved');
  }
  const mountMatrices = Array.from({ length: 6 }, (_, i) => {
    const matrix = new T.Matrix4();
    mounts.getMatrixAt(i, matrix);
    return [...matrix.elements];
  });
  updateCity32Living(root, 500);
  for (let i = 0; i < 6; i++) {
    const matrix = new T.Matrix4();
    mounts.getMatrixAt(i, matrix);
    assert.deepEqual([...matrix.elements], mountMatrices[i], 'static mount never uploads on tick');
  }
  setCity32Quality(root, 'medium');
  assert.equal(mounts.count, 3);
  assert.equal(towers.filter((tower) => tower.visible).length, 3);
});

test('QA158: incomplete city anchors still maintain the Medium/High mount selection', () => {
  const leftOnly = anchors.filter((anchor) => anchor.x < 0);
  const root = createCity32Living(leftOnly);
  const mounts = root.getObjectByName('city32-searchlight-roof-mounts');
  const towers = root.getObjectByName('city32-sky-searchlights').children.filter((x) => x.isGroup);
  assert.equal(towers.length, 3);
  assert.equal(mounts.count, 2, 'only indices 0 and 2 remain in Medium');
  setCity32Quality(root, 'high');
  assert.equal(mounts.count, 3);
  setCity32Quality(root, 'medium');
  assert.equal(mounts.count, 2);
});

test('QA158: both scrolling city tiles preserve separate batches and deterministic LOD', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0], 0);
  world.setGraphicsQuality('high');
  const [near, far] = ['launch-city', 'launch-city-far'].map((name) =>
    scene.getObjectByName(name).getObjectByName('city32-living-metropolis'),
  );
  const nearMounts = near.getObjectByName('city32-searchlight-roof-mounts');
  const farMounts = far.getObjectByName('city32-searchlight-roof-mounts');
  assert.ok(nearMounts?.isInstancedMesh && farMounts?.isInstancedMesh);
  assert.equal(nearMounts.count, 6);
  assert.equal(farMounts.count, 6);
  assert.notEqual(nearMounts.instanceMatrix, farMounts.instanceMatrix, 'far clone has own buffer');
  for (const root of [near, far]) {
    const towers = root.getObjectByName('city32-sky-searchlights').children.filter((o) => o.isGroup);
    assert.equal(towers.length, 6);
    assert.equal(
      towers.filter((tower) => tower.children.some((child) => child.name === 'city32-searchlight-mount')).length,
      0,
    );
  }
  world.setGraphicsQuality('medium');
  assert.equal(nearMounts.count, 3);
  assert.equal(farMounts.count, 3);
  world.setGraphicsQuality('high');
  assert.equal(nearMounts.count, 6);
  assert.equal(farMounts.count, 6);
});
