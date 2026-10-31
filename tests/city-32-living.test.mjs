import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import {
  createCity32Living,
  createCity32Skyline,
  updateCity32Living,
  setCity32Quality,
  CITY32_ADS,
} from '../src/city-32-living.js';

const anchors = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (110 + (i % 8) * 13),
  z: -35 - Math.floor(i / 2) * 19,
  h: 45 + (i % 8) * 10,
  w: 12 + (i % 5),
  depth: 14,
}));

const firstMatrix = (mesh) => {
  const m = new T.Matrix4();
  mesh.getMatrixAt(0, m);
  return [...m.elements];
};

test('City 3.2 puts original branded signs on actual facade anchors with a fixed draw budget', () => {
  const group = createCity32Living(anchors);
  assert.equal(group.userData.visualOnly, true);
  const sign = group.getObjectByName('city32-facade-advertisements');
  assert.ok(sign.children.length >= 12);
  assert.ok(sign.children.length <= 18);
  assert.ok(CITY32_ADS.length >= 10);
  const names = new Set(sign.children.map((o) => o.userData.brand));
  assert.ok(names.size >= 10, 'ten independent fictional advertisers');
  for (const s of sign.children) {
    assert.ok(Math.abs(s.position.x) >= 94);
    assert.ok(s.getObjectByName('city32-advertisement-panel').material.map?.isTexture);
    assert.equal(s.userData.visualOnly, true);
  }
  const lights = group.getObjectByName('city32-neon-billboard-frames');
  assert.ok(lights.isInstancedMesh);
  assert.ok(lights.instanceColor);
  assert.ok(lights.count >= 24);
  group.traverse((o) => assert.notEqual(o.userData.hitbox, true));
});

test('City 3.2 moving searchlights and aircraft are deterministic, quality-aware and collision-free', () => {
  const root = createCity32Living(anchors);
  const sweep = root
    .getObjectByName('city32-searchlight-0')
    .getObjectByName('city32-searchlight-pivot');
  const aircraft = root.getObjectByName('city32-civilian-aircraft');
  const lights = root.getObjectByName('city32-aircraft-navigation-lights');
  const original = firstMatrix(aircraft);
  setCity32Quality(root, 'high');
  assert.equal(aircraft.count, 18);
  assert.equal(lights.count, 18);
  updateCity32Living(root, 375);
  assert.notDeepEqual(firstMatrix(aircraft), original);
  const p = [sweep.rotation.x, sweep.rotation.z];
  const at = firstMatrix(aircraft);
  updateCity32Living(root, 375);
  assert.deepEqual([sweep.rotation.x, sweep.rotation.z], p);
  assert.deepEqual(firstMatrix(aircraft), at, 'animation must stop when travel pauses');
  setCity32Quality(root, 'medium');
  assert.equal(aircraft.count, 9);
  assert.equal(root.getObjectByName('city32-searchlight-5').visible, false);
  assert.equal(root.getObjectByName('city32-searchlight-0').visible, true);
  assert.equal(root.getObjectByName('city32-hologram-3').visible, false);
  root.traverse((o) => assert.notEqual(o.userData.hitbox, true));
});

test('City 3.2 distant skyline uses instancing and city scenery does not leak into orbit/ocean', () => {
  const horizon = createCity32Skyline();
  const mass = horizon.getObjectByName('city32-skyline-secondary-towers');
  const windows = horizon.getObjectByName('city32-skyline-illuminated-bands');
  assert.ok(mass.isInstancedMesh && windows.isInstancedMesh);
  assert.ok(mass.count >= 40);
  assert.ok(windows.instanceColor);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  world.setGraphicsQuality('medium');
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const scenery = city.getObjectByName('city32-living-metropolis');
  assert.ok(scenery.visible);
  assert.ok(far.getObjectByName('city32-living-metropolis'));
  assert.ok(
    scene.getObjectByName('city-distant-horizon').getObjectByName('city32-distant-city-lights'),
  );
  world.update(0.1, 0.1, 60, true);
  const moved = firstMatrix(scenery.getObjectByName('city32-civilian-aircraft'));
  world.update(0.1, 0.2, 60, false);
  assert.deepEqual(firstMatrix(scenery.getObjectByName('city32-civilian-aircraft')), moved);
  world.setSector(SECTORS[1]);
  assert.equal(scenery.visible, false);
  world.setSector(SECTORS[0]);
  world.setLaunchAscent(0.78, true);
  assert.equal(city.visible, false);
  assert.equal(scene.getObjectByName('city-distant-horizon').visible, false);
});


test('City 3.2 fictional advertising spans the full route and commercial districts are visually distinct', () => {
  const living = createCity32Living(anchors);
  const signage = living.getObjectByName('city32-facade-advertisements').children;
  const depths = signage.map((sign) => sign.position.z);
  assert.ok(Math.max(...depths) - Math.min(...depths) > 1350, 'ads remain visible beyond the opening district');
  const zones = living.getObjectByName('city32-commercial-districts');
  assert.ok(zones);
  assert.deepEqual(
    zones.children.filter((zone) => zone.isGroup).map((zone) => zone.userData.district),
    ['corporate', 'entertainment', 'transport'],
  );
  for (const zone of zones.children.filter((node) => node.isGroup)) {
    assert.ok(zone.children.length >= 2, 'each district has actual branded signs');
    assert.ok(zone.children.every((p) => p.material?.map?.isTexture));
  }
  for (const name of [
    'city32-district-horizontal-neons',
    'city32-district-lit-shopfronts',
    'city32-district-vertical-signs',
  ]) {
    const batch = zones.getObjectByName(name);
    assert.ok(batch?.isInstancedMesh, name);
    assert.ok(batch.instanceColor, name + ' has different colors');
    assert.ok(batch.count >= 30);
  }
});

test('opening maglev is visually aligned with a station and transverse pass crosses portrait camera', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  world.setGraphicsQuality('medium');
  const near = scene.getObjectByName('launch-city');
  const terminal = near.getObjectByName('city-maglev-opening-terminal');
  const main = near.getObjectByName('city-maglev-east');
  const bridge = near.getObjectByName('city32-cross-city-maglev-line');
  const crossing = near.getObjectByName('city32-cross-city-maglev-train');
  assert.ok(terminal?.isGroup);
  assert.equal(terminal.position.x, 80, 'boarding platform follows the side maglev tracks');
  assert.ok(main.visible, 'original east-line train stays in Medium');
  assert.ok(main.getObjectByName('city-maglev-campaign-side-panel')?.material.map?.isTexture);
  assert.ok(bridge.getObjectByName('city32-maglev-crossing-guideway')?.isMesh);
  assert.ok(crossing.visible, 'the overhead maglev pass is available in Medium and portrait');
  assert.ok(Math.abs(crossing.position.x) < 80, 'the transverse train overlaps the camera-forward view');
  assert.ok(crossing.position.y > 60, 'train passes above instead of through the flight lane');
  assert.ok(bridge.userData.visualOnly && crossing.userData.visualOnly);
  assert.ok(near.getObjectByName('city-maglev-terminal-advertisement')?.material.map?.isTexture);
  const first = crossing.position.x;
  world.update(1, 1, 48, true);
  assert.ok(crossing.position.x > first);
  const stopped = crossing.position.x;
  world.update(1, 2, 48, false);
  assert.equal(crossing.position.x, stopped, 'pause freezes the maglev pass');
  world.reset();
  assert.equal(crossing.position.x, -75);
  world.setSector(SECTORS[1]);
  assert.equal(near.visible, false, 'no train is visible over the ocean stage');
});
