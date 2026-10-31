import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { createCity33Premium, setCity33Quality, updateCity33Premium } from '../src/city-33-premium.js';

const anchors = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (112 + i % 8 * 13),
  z: -30 - Math.floor(i / 2) * 19,
  h: 53 + i % 8 * 8,
  w: 13 + i % 5,
  depth: 14,
}));
function matrix(mesh) {
  const m = new T.Matrix4();
  mesh.getMatrixAt(0, m);
  return [...m.elements];
}

test('City 3.3 facades have layered premium materials, distinct recesses and coherent metallic crowns', () => {
  const city = createCity33Premium(anchors);
  const medium = city.getObjectByName('city33-architecture-medium');
  const high = city.getObjectByName('city33-architecture-high');
  for (const name of ['city33-facade-recessed-panels','city33-facade-recessed-glass',
    'city33-stepped-roof-crowns','city33-side-service-conduits','city33-rooftop-hvac']) {
    const mesh = medium.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.ok(mesh.count >= 180, name + ' on all buildings');
  }
  assert.ok(medium.getObjectByName('city33-facade-recessed-panels').instanceColor);
  assert.equal(high.visible, false);
  setCity33Quality(city, 'high');
  assert.equal(high.visible, true);
  assert.ok(high.getObjectByName('city33-precision-window-mullions').count >= 900);
  const murals = medium.getObjectByName('city33-facade-integrated-campaigns');
  assert.ok(murals.children.length >= 2 && murals.children.length <= 5);
  for (const ad of murals.children) {
    assert.ok(ad.material.map?.isTexture);
    assert.ok(ad.userData.brand);
    assert.ok(Math.abs(ad.position.x) >= 100);
  }
  city.traverse((part) => assert.notEqual(part.userData.hitbox, true));
});

test('City 3.3 mid-stage busway and active construction have no collisions and animate deterministically', () => {
  const city = createCity33Premium(anchors);
  const bridge = city.getObjectByName('city33-midstage-transit');
  const road = bridge.getObjectByName('city33-suspended-busway-decks');
  const bus = city.getObjectByName('city33-bus-hull');
  assert.ok(road?.isInstancedMesh && road.count >= 50);
  assert.ok(bus.isInstancedMesh && bus.count === 4);
  setCity33Quality(city, 'high');
  assert.equal(bus.count, 8);
  const initial = matrix(bus);
  updateCity33Premium(city, 270);
  assert.notDeepEqual(matrix(bus), initial);
  const frozen = matrix(bus);
  updateCity33Premium(city, 270);
  assert.deepEqual(matrix(bus), frozen, 'same simulated travel yields identical positions');
  const works = city.getObjectByName('city33-active-construction-sites');
  assert.equal(works.getObjectByName('city33-animated-cranes').children.length, 3);
  assert.ok(works.getObjectByName('city33-scaffold-verticals').count >= 20);
  assert.equal(works.getObjectByName('city33-welding-sparks').count, 12);
  setCity33Quality(city, 'medium');
  assert.equal(works.getObjectByName('city33-welding-sparks').count, 6);
  assert.equal(bus.count, 4);
  city.traverse((part) => assert.notEqual(part.userData.hitbox, true));
});

test('City 3.3 integration follows Alto/Médio, pause, reset and stage isolation', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const work = near.getObjectByName('city33-premium-urban-life');
  assert.ok(work && far.getObjectByName('city33-premium-urban-life'));
  assert.equal(work.visible, true);
  world.setGraphicsQuality('high');
  assert.equal(work.getObjectByName('city33-architecture-high').visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(work.getObjectByName('city33-architecture-high').visible, false);
  const bus = work.getObjectByName('city33-bus-hull');
  world.update(1, 1, 60, true);
  const running = matrix(bus);
  world.update(1, 2, 60, false);
  assert.deepEqual(matrix(bus), running);
  world.reset();
  assert.notDeepEqual(matrix(bus), running);
  world.setSector(SECTORS[1]);
  assert.equal(work.visible, false);
  world.setSector(SECTORS[0]);
  world.setLaunchAscent(0.8, true);
  assert.equal(near.visible, false);
});
