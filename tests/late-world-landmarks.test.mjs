import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createDestinationLandmarks,
  setDestinationLandmarkQuality,
  updateDestinationLandmarks,
} from '../src/destination-landmarks.js';

const primary = new Map([
  [3, 'jupiter-orbit9-hangar-gantries'],
  [4, 'venus-sulfur-cloud-columns'],
  [5, 'europa-fractured-glacial-spires'],
  [6, 'neptune-turbulent-cloud-columns'],
  [7, 'saturn-blockade-dreadnoughts'],
  [8, 'orion-gravitational-spires'],
  [9, 'titan-icy-mineral-monoliths'],
]);

test('seven unapproved destinations have bespoke 3D landmarks; approved first three are untouched', () => {
  for (let sector = 0; sector < 3; sector++) {
    assert.equal(createDestinationLandmarks(sector), null);
  }
  for (const [sector, id] of primary) {
    const world = createDestinationLandmarks(sector);
    assert.equal(world.userData.fixedSky, true);
    assert.equal(world.userData.world, sector);
    assert.ok(world.getObjectByName(id), 'missing destination identity at sector ' + (sector + 1));
    assert.ok(
      world.children.some((mesh) => mesh.isInstancedMesh && mesh.userData.highOnly),
      'missing separate High detail budget at sector ' + (sector + 1),
    );
    world.traverse((node) => assert.equal(node.userData.visualOnly, true));
  }
});

test('architectural layers remain outside player flight corridor and respect High/Medium', () => {
  const helper = new T.Object3D();
  for (const sector of primary.keys()) {
    const world = createDestinationLandmarks(sector);
    const layers = world.children.filter((node) => node.isInstancedMesh);
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        layer.getMatrixAt(i, helper.matrix);
        helper.matrix.decompose(helper.position, helper.quaternion, helper.scale);
        assert.ok(
          Math.abs(helper.position.x) >= 85,
          'destination detail encroaches on corridor at sector ' + (sector + 1),
        );
      }
    }
    setDestinationLandmarkQuality(world, 'medium');
    assert.ok(
      world.children.filter((node) => node.userData.highOnly).every((node) => !node.visible),
    );
    setDestinationLandmarkQuality(world, 'high');
    assert.ok(
      world.children.filter((node) => node.userData.highOnly).every((node) => node.visible),
    );
    updateDestinationLandmarks(world, 20);
    updateDestinationLandmarks(world, 20);
  }
});
