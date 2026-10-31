import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter, bossModel, createWorld } from '../src/visuals.js';
test('ship and boss meshes contain finite coordinates and valid indices', () => {
  for (const model of [fighter(), fighter(true), bossModel()]) {
    let vertices = 0;
    model.traverse((o) => {
      const p = o.geometry?.attributes.position;
      if (!p) return;
      vertices += p.count;
      for (const value of p.array) assert.ok(Number.isFinite(value));
      for (const i of o.geometry.index?.array ?? []) assert.ok(i >= 0 && i < p.count);
    });
    assert.ok(vertices > 100);
  }
});
test('fighters reuse geometry but have independent transforms', () => {
  const a = fighter(),
    b = fighter();
  assert.notEqual(a, b);
  assert.equal(a.children[0].geometry, b.children[0].geometry);
  a.position.x = 9;
  assert.equal(b.position.x, 0);
  assert.equal(a.userData.flames.length, 2);
});
test('city remains present after one full scenery wrap and reset', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5);
  world.update(40, 40, 48, true);
  let count = 0;
  scene.traverse((o) => {
    if (o.isInstancedMesh) count++;
    assert.ok(Number.isFinite(o.position.z));
  });
  // City 3.2 adds bounded batches for signs, aircraft, holofotes and skyline.
  // Keep the GPU draw-call budget checked instead of freezing the old count.
  assert.ok(
    count >= 162 && count <= 210,
    'City 3.2 keeps extra neon and aerial traffic within a bounded instancing budget',
  );
  const closeCity = scene.getObjectByName('launch-city');
  const farCity = scene.getObjectByName('launch-city-far');
  const closeDetail = closeCity.getObjectByName('city-high-details');
  const farDetail = farCity.getObjectByName('city-high-details');
  assert.equal(closeDetail.visible, false, 'medium avoids premium geometry');
  world.setGraphicsQuality('high');
  assert.equal(closeDetail.visible, true);
  assert.equal(farDetail.visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(closeDetail.visible, false);
  assert.equal(farDetail.visible, false);
  world.reset();
  world.update(0.1, 0.1, 48, true);
});

test('NOVA-7 has a sealed, symmetric forward fuselage in gameplay and hangar', () => {
  const ship = fighter();
  const fuselage = ship.getObjectByName('ship-fuselage');
  assert.ok(fuselage, 'player fighter and showroom share the front fuselage');
  assert.equal(fuselage.geometry.type, 'LatheGeometry');
  const profile = fuselage.geometry.parameters.points;
  assert.ok(profile.length >= 8);
  assert.equal(profile.at(-1).x, 0, 'nose finishes at the exact central axis');
  assert.ok(profile.every((point, i) => i === 0 || point.y > profile[i - 1].y));
  assert.ok(profile.every((point, i) => i === 0 || point.x <= profile[i - 1].x));
  assert.ok(Math.abs(fuselage.rotation.x + Math.PI / 2) < 0.001);
  assert.equal(
    ship.children.some((o) => o.geometry?.type === 'ConeGeometry' && o.position.z < -3),
    false,
  );
});

test('NOVA-7 fuselage has one forward contour, shared by gameplay and hangar', () => {
  const ship = fighter();
  const hull = ship.getObjectByName('ship-fuselage');
  assert.ok(hull?.isMesh, 'single fuselage mesh is present');
  assert.equal(hull.geometry.type, 'LatheGeometry');
  assert.equal(
    ship.children.filter(
      (child) => child.geometry?.type === 'ConeGeometry' && child.position.z < -2,
    ).length,
    0,
    'no separate mismatched four-sided nose remains',
  );
  const bounds = new T.Box3().setFromObject(hull);
  assert.ok(bounds.min.z < -4.5, 'nose extends smoothly in flight direction');
  assert.ok(bounds.max.z > 1.8, 'fuselage joins rear body');
  assert.ok(bounds.min.x < -0.7 && bounds.max.x > 0.7);
});
