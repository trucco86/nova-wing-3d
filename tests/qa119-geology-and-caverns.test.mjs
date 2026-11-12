import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMarsPremium, updateMarsArrival, updateMarsPremium } from '../src/mars-premium.js';
import { createAsteroidInterior, constrainCavernPosition, crossesCavernWall } from '../src/asteroid-interior.js';
import { createEuropaSurface, createEuropaGlacialRidgeGeometry, updateEuropaSurface } from '../src/europa-surface.js';

test('QA119: five distinct Mars mesas keep true weathered stone relief with four batched geological layers', () => {
  const mars = createMarsPremium();
  const surface = mars.getObjectByName('mars-surface-scene');
  const mesas = surface.children.filter((node) => node.name.startsWith('mars-distant-mesa-'));
  assert.equal(mesas.length, 5);
  let previous = null;
  for (const [index, mesa] of mesas.entries()) {
    assert.ok(Math.abs(mesa.position.x) >= 280, 'geology must not intrude into flight corridor');
    assert.equal(mesa.userData.marsChunk, true, 'existing stage streaming must be retained');
    assert.equal(mesa.children.length, 2, 'rock and all strata use two GPU draws instead of five');
    const body = mesa.getObjectByName('mars-layered-sedimentary-mesa');
    const bands = mesa.getObjectByName('mars-sedimentary-strata-batched');
    assert.ok(body.isMesh && bands.isInstancedMesh);
    assert.equal(bands.count, 4);
    assert.equal(bands.userData.visualOnly, true);
    assert.ok(body.geometry.getAttribute('position').count > 70, 'weathering is sculpted, not a seven-sided primitive');
    assert.ok(body.geometry.getAttribute('normal').count > 0);
    assert.ok(bands.instanceColor?.count >= 4, 'strata have alternating natural stone layers');
    assert.ok(body.material.roughness > 0.8 && bands.material.roughness > 0.8);
    const transform = new T.Matrix4();
    for (let layer = 0; layer < bands.count; layer++) {
      bands.getMatrixAt(layer, transform);
      assert.ok(transform.elements[13] > 0);
    }
    const vertex = body.geometry.getAttribute('position');
    const contour = Array.from({ length: vertex.count }, (_, i) => [
      vertex.getX(i).toFixed(4),
      vertex.getZ(i).toFixed(4),
    ]);
    if (previous) assert.notDeepEqual(contour, previous, 'mesa silhouettes should not all repeat');
    previous = contour;
    assert.equal(mesa.name, 'mars-distant-mesa-' + index);
  }
  updateMarsArrival(mars, 27);
  assert.equal(surface.visible, true);
  const start = mesas.map((mesa) => mesa.position.z);
  updateMarsPremium(mars, 105);
  const streamed = mesas.map((mesa) => mesa.position.z);
  assert.notDeepEqual(streamed, start);
  updateMarsPremium(mars, 105);
  assert.deepEqual(mesas.map((mesa) => mesa.position.z), streamed, 'stage time is deterministic on pause');
  mars.traverse((node) => {
    assert.notEqual(node.userData.hitbox, true, 'visual cliffs cannot create invisible collisions');
  });
});

test('QA119: asteroid cavern has no neon hoop and keeps real mineral seams outside the shot corridor', () => {
  const scene = new T.Scene();
  const cave = createAsteroidInterior(scene);
  cave.reset(true);
  cave.setPhase('transition');
  const corridor = scene.getObjectByName('asteroid-cavern');
  assert.equal(corridor.children.length, 8);
  for (const section of corridor.children) {
    const seams = section.getObjectByName('asteroid-cavern-stratified-ore-seams');
    assert.ok(seams?.isInstancedMesh);
    assert.equal(seams.count, 8);
    assert.equal(seams.userData.visualOnly, true);
    assert.ok(seams.material.isMeshStandardMaterial, 'veins use physically lit rock rather than always-on neon');
    assert.ok(seams.material.roughness > 0.3);
    assert.ok(!section.children.some((child) => child.geometry?.type === 'TorusGeometry'),
      'repeated portal ring must be replaced with rocky faults');
    const m = new T.Matrix4();
    for (let i = 0; i < seams.count; i++) {
      seams.getMatrixAt(i, m);
      assert.ok(Math.hypot(m.elements[12], m.elements[13]) > 40);
    }
  }
  const before = cave.snapshot();
  cave.update(0, 50);
  assert.deepEqual(cave.snapshot(), before, 'pause cannot drift asteroid cave');
  assert.equal(constrainCavernPosition({ x: 60, y: 10 }).x, 27);
  assert.equal(crossesCavernWall({ x: 0, y: 10, z: 0 }, { x: 0, y: 10, z: -200 }), false);
  cave.destroy();
  assert.equal(scene.children.length, 0);
});

test('QA119: Europa ridges have five physical colour bands and keep the same two terrain draws', () => {
  const geo = createEuropaGlacialRidgeGeometry();
  assert.ok(geo.index && geo.index.count >= 150, 'actual faceted rock geometry, not a plain cone');
  assert.equal(geo.getAttribute('color').count, geo.getAttribute('position').count);
  assert.equal(geo.getAttribute('normal').count, geo.getAttribute('position').count);
  assert.ok(geo.boundingSphere.radius < 2);
  geo.dispose();
  const root = createEuropaSurface();
  assert.equal(root.children.length, 3, 'two terrain batches and existing snow particle system');
  const ice = root.getObjectByName('europa-blue-crevasse-ridges');
  assert.ok(ice.isInstancedMesh && ice.material.vertexColors && ice.count === 26);
  const m = new T.Matrix4();
  for (let i = 0; i < ice.count; i++) {
    ice.getMatrixAt(i, m);
    assert.ok(Math.abs(m.elements[12]) >= 175, 'shards never enter the flight corridor');
  }
  updateEuropaSurface(root, 26, true, true);
  assert.equal(root.visible, true);
  updateEuropaSurface(root, 27, true, false);
  assert.equal(root.getObjectByName('europa-windborne-ice-snow').visible, false);
  updateEuropaSurface(root, 90, false, false);
  assert.equal(root.visible, false, 'tunnel and boss suppression are preserved');
  root.traverse((node) => {
    assert.notEqual(node.userData.collider, true);
    node.geometry?.dispose();
    node.material?.dispose();
  });
});
