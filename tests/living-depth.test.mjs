import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createLivingDepth,
  updateLivingDepth,
  setLivingDepthQuality,
  livingDepthProfile,
} from '../src/living-depth.js';

test('all ten sectors have individual living midground and background visual identities', () => {
  const names = new Set();
  for (let i = 0; i < 10; i++) {
    const root = createLivingDepth(i);
    const identity = livingDepthProfile(i);
    assert.equal(root.name, 'living-depth-' + identity.name);
    assert.equal(root.userData.visualOnly, true);
    assert.equal(root.userData.fixedSky, true);
    assert.equal(root.userData.lanes.length, 2);
    assert.ok(!names.has(identity.name), 'sector art cannot repeat');
    names.add(identity.name);
    assert.ok(root.getObjectByName('ambient-middle-vehicle-bodies').isInstancedMesh);
    assert.ok(root.getObjectByName('ambient-distant-vehicle-bodies').isInstancedMesh);
    assert.ok(root.userData.lanes.every((l) => l.frames.count <= 28));
    root.userData.materials.forEach((m) => m.dispose());
    root.userData.geometries.forEach((g) => g.dispose());
  }
});

test('layered traffic moves in simulation time, freezes when time freezes, and respects Medium quality', () => {
  const root = createLivingDepth(3);
  const middle = root.getObjectByName('ambient-middle-vehicle-bodies');
  const matrix = new T.Matrix4();
  middle.getMatrixAt(0, matrix);
  const initial = matrix.elements.slice();
  updateLivingDepth(root, 5);
  middle.getMatrixAt(0, matrix);
  const later = matrix.elements.slice();
  assert.notDeepEqual(later, initial);
  updateLivingDepth(root, 5);
  middle.getMatrixAt(0, matrix);
  assert.deepEqual(matrix.elements, later, 'pause must never create random motion');
  setLivingDepthQuality(root, 'medium');
  assert.equal(middle.count, 6);
  assert.equal(root.getObjectByName('ambient-distant-vehicle-bodies').count, 14);
  setLivingDepthQuality(root, 'high');
  assert.equal(middle.count, 12);
  root.userData.materials.forEach((m) => m.dispose());
  root.userData.geometries.forEach((g) => g.dispose());
});
