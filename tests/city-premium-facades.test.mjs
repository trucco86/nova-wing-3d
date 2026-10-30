import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';

test('City 2.2 high facade detail has dense window layers within fixed GPU budgets', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const high = near.getObjectByName('city-high-details');
  assert.ok(near && far && high);
  assert.equal(high.visible, false);
  const limits = [
    ['city-facade-windows-cool', 15000, 4000],
    ['city-facade-windows-amber', 3000, 100],
    ['city-facade-side-windows', 6600, 1000],
    ['city-facade-panel-modules', 800, 700],
  ];
  for (const [name, capacity, minimum] of limits) {
    const mesh = near.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.ok(mesh.count > minimum, name + ' must be visibly populated');
    assert.ok(mesh.count <= capacity, name + ' cannot exceed its allocated buffer');
    assert.ok(far.getObjectByName(name)?.isInstancedMesh, name + ' in distant city');
  }
  const commonWindows = near.children.find((obj) => obj.isInstancedMesh && obj.count === 2800);
  assert.ok(commonWindows, 'medium keeps its pre-existing windows');
  world.setGraphicsQuality('high');
  assert.equal(high.visible, true);
  assert.equal(far.getObjectByName('city-high-details').visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(high.visible, false);
  assert.equal(far.getObjectByName('city-high-details').visible, false);
  world.update(40, 40, 48, true);
  world.reset();
  assert.equal(high.visible, false);
  assert.ok(Number.isFinite(near.position.z));
});
