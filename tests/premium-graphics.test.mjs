import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createPremiumCityDetails, createPremiumShipDetails } from '../src/premium-graphics.js';
import { createShipModule, createWorld } from '../src/visuals.js';

function assertFiniteInstances(group) {
  const transform = new T.Matrix4();
  for (const mesh of group.children) {
    assert.equal(mesh.isInstancedMesh, true);
    assert.equal(mesh.userData.premiumDecoration, true);
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, transform);
      assert.ok(transform.elements.every(Number.isFinite), mesh.name + ':' + i);
    }
  }
}

test('premium city decorates signed building coordinates with five fixed draw calls', () => {
  const buildings = Array.from({ length: 200 }, (_, i) => ({
    x: (i % 2 ? -1 : 1) * (110 + i),
    y: 0,
    z: -30 - i * 19,
    h: 20 + i % 79,
    w: 10 + i % 8,
    depth: 12 + i % 7,
  }));
  const group = createPremiumCityDetails(buildings);
  assert.equal(group.name, 'city-premium-details');
  assert.equal(group.visible, false);
  assert.equal(group.children.length, 5);
  assert.equal(group.userData.drawCallBudget, 5);
  assert.deepEqual(group.children.map((x) => x.count), [400, 400, 400, 200, 40]);
  assertFiniteInstances(group);
  assert.equal(group.children.every((x) => x.userData.premiumDecoration), true);
});

test('premium city rejects malformed dimensions without silently generating broken GPU transforms', () => {
  assert.throws(() => createPremiumCityDetails(null), TypeError);
  assert.throws(() => createPremiumCityDetails([{ x: NaN, z: -5, h: 20, w: 10, depth: 12 }]), TypeError);
  assert.throws(() => createPremiumCityDetails([{ x: -10, z: -5, h: -1, w: 10, depth: 12 }]), TypeError);
});

test('all three starfighter variants receive finite premium detail hidden in lighter profiles', () => {
  for (const model of ['nova7', 'specter', 'aegis']) {
    const detail = createPremiumShipDetails(model);
    assert.equal(detail.children.length, 4);
    assert.equal(detail.userData.drawCallBudget, 4);
    assert.equal(detail.visible, false);
    assertFiniteInstances(detail);
    const ship = createShipModule(model);
    assert.equal(ship.getObjectByName('premium-ship-details')?.visible, false);
    assert.deepEqual(detail.children.map((x) => x.count), [16, 12, 12, 4]);
  }
});

test('world High activates both city loops while Medium has no premium decorations', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.35, true);
  const near = scene.getObjectByName('city-premium-details');
  const far = scene.getObjectByName('launch-city-far')?.getObjectByName('city-premium-details');
  assert.ok(near);
  assert.ok(far);
  world.setGraphicsQuality('medium');
  assert.equal(near.visible, false);
  assert.equal(far.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(near.visible, true);
  assert.equal(far.visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(near.visible, false);
});
