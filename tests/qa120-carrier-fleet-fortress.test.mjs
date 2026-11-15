import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createPremiumLandmarkHull,
  PREMIUM_LANDMARK_PARTS,
} from '../src/premium-landmark-hulls.js';
import {
  createDestinationLandmarks,
  setDestinationLandmarkQuality,
} from '../src/destination-landmarks.js';
import { createMothershipInterior, updateMothershipInterior } from '../src/mothership-interior.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const landmarkCases = [
  { index: 7, name: 'saturn-blockade-dreadnoughts', shape: 'dreadnought', count: 8 },
  { index: 8, name: 'orion-gravitational-spires', shape: 'orion-lens', count: 32 },
  { index: 9, name: 'titan-fortress-perimeter-towers', shape: 'titan-fortress', count: 28 },
];

test('QA120: Saturn, Orion and Titan silhouettes are multi-part indexed PBR assets with one draw per destination', () => {
  for (const item of landmarkCases) {
    const hull = createPremiumLandmarkHull(item.shape);
    assert.equal(hull.userData.premiumHull, item.shape);
    assert.ok(hull.index && hull.getAttribute('normal') && hull.getAttribute('uv'));
    assert.ok(
      hull.getAttribute('position').count >= 130,
      item.shape + ': real multipiece geometric detail',
    );
    assert.ok(
      hull.getAttribute('position').count < 1000,
      item.shape + ': bounded mobile complexity',
    );
    assert.ok(hull.boundingSphere?.radius > 0);
    assert.ok(PREMIUM_LANDMARK_PARTS[item.shape] >= 8);
    hull.dispose();
    const root = createDestinationLandmarks(item.index);
    const mesh = root.getObjectByName(item.name);
    assert.ok(mesh?.isInstancedMesh);
    assert.equal(mesh.count, item.count);
    assert.equal(mesh.geometry.userData.premiumHull, item.shape);
    assert.ok(mesh.material.isMeshStandardMaterial);
    assert.ok(mesh.instanceColor);
    assert.equal(mesh.userData.visualOnly, true);
    assert.equal(mesh.userData.collider, undefined);
    // Instanced decorative silhouettes must not enter the active pilot/shot
    // corridor, even after nonuniform scale and rotation.
    mesh.geometry.computeBoundingSphere();
    const matrix = new T.Matrix4();
    const center = new T.Vector3();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      center.setFromMatrixPosition(matrix);
      assert.ok(Math.abs(center.x) >= 100, item.shape + ': center outside pilot lane');
    }
    setDestinationLandmarkQuality(root, 'medium');
    assert.equal(mesh.visible, item.index === 9 ? false : true);
    setDestinationLandmarkQuality(root, 'high');
    assert.equal(mesh.visible, true);
    root.traverse((node) => {
      assert.equal(node.userData.hitbox, undefined);
      node.geometry?.dispose();
      node.material?.dispose();
    });
  }
  assert.throws(() => createPremiumLandmarkHull('unknown'), RangeError);
});

test('QA120: Devastador hangar panes have supported metal frames and real PBR glass at half the window draw cost', () => {
  const root = createMothershipInterior();
  assert.equal(root.userData.sections.length, 6);
  let windowDraws = 0;
  for (const section of root.userData.sections) {
    const panes = section.children.filter((node) => node.name === 'carrier-hangar-window');
    const frames = section.children.filter(
      (node) => node.name === 'carrier-hangar-window-armored-frame',
    );
    assert.equal(panes.length, 2);
    assert.equal(frames.length, 2);
    windowDraws += panes.length + frames.length;
    for (const mesh of [...panes, ...frames]) {
      assert.ok(mesh.isInstancedMesh && mesh.count === 4);
      assert.equal(mesh.userData.visualOnly, true);
      assert.ok(mesh.material.isMeshStandardMaterial);
      const transform = new T.Matrix4();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, transform);
        assert.ok(
          Math.abs(transform.elements[12]) > 65,
          'glass physically attached to side bulkhead',
        );
        assert.ok(Math.abs(transform.elements[12]) < 75, 'do not penetrate the distant side hull');
      }
    }
    for (const mesh of panes) {
      assert.ok(mesh.material.metalness >= 0.4);
      assert.ok(mesh.material.roughness > 0.2 && mesh.material.roughness < 0.5);
    }
  }
  assert.equal(windowDraws, 24, 'previously 48 individual neon window draws');
});

test('QA120: Devastador drive coils and rotating five-blade turbines retain mission animation in two GPU draws per engine', () => {
  const root = createMothershipInterior();
  const engines = [];
  root.traverse((obj) => {
    if (
      obj.name === 'devastador-main-drive-engine' ||
      obj.name === 'devastador-reactor-coolant-pump'
    )
      engines.push(obj);
  });
  assert.equal(engines.length, 4);
  for (const engine of engines) {
    const coils = engine.getObjectByName('devastador-drive-coil-arrays');
    const fan = engine.getObjectByName('carrier-drive-fan-blade');
    assert.ok(coils?.isInstancedMesh && fan?.isInstancedMesh);
    assert.equal(coils.count, 4, 'all four coolant coils remain visible');
    assert.equal(fan.count, 5, 'all five blades remain visible');
    assert.ok(coils.material.isMeshStandardMaterial && fan.material.isMeshStandardMaterial);
    assert.ok(coils.instanceColor && fan.instanceColor);
    const turbine = engine.getObjectByName('carrier-destroyable-drive-fan-visual');
    assert.ok(turbine && turbine.userData.hitbox === undefined);
  }
  updateMothershipInterior(root, 75);
  const before = engines.map(
    (engine) => engine.getObjectByName('carrier-destroyable-drive-fan-visual').rotation.z,
  );
  updateMothershipInterior(root, 75);
  assert.deepEqual(
    engines.map(
      (engine) => engine.getObjectByName('carrier-destroyable-drive-fan-visual').rotation.z,
    ),
    before,
  );
  updateMothershipInterior(root, 76);
  assert.notDeepEqual(
    engines.map(
      (engine) => engine.getObjectByName('carrier-destroyable-drive-fan-visual').rotation.z,
    ),
    before,
  );
});

test('QA120: all three premium destination sets survive actual world switching, reveal and quality changes', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  for (const item of landmarkCases) {
    world.setSector(SECTORS[item.index], item.index);
    world.setDestinationArrival(32);
    const mesh = scene.getObjectByName(item.name);
    assert.ok(mesh?.isInstancedMesh);
    assert.equal(mesh.geometry.userData.premiumHull, item.shape);
    const before = mesh.count;
    world.setGraphicsQuality('medium');
    world.setGraphicsQuality('high');
    assert.equal(mesh.count, before);
    world.setDestinationArrival(32);
    assert.ok(mesh.count > 0);
  }
  world.setSector(SECTORS[0], 0);
  for (const item of landmarkCases) assert.equal(scene.getObjectByName(item.name), undefined);
});
