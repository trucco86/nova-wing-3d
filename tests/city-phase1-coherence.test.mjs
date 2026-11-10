import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createCityDistricts } from '../src/city-districts.js';
import {
  cityAscentGroundFlow,
  cityFootprintsOverlap,
  placeCityDistrictTower,
} from '../src/city-spatial-layout.js';
import { createWorld } from '../src/visuals.js';

test('district tower placement reserves real occupied X/Z footprints', () => {
  const blocking = [{ x: 121, z: -354, w: 20, depth: 20 }];
  const shifted = placeCityDistrictTower({ x: 121, z: -354, w: 18, depth: 29 }, blocking, 1);
  assert.ok(shifted.x > 121, 'a real blocking tower moves the new landmark outward');
  assert.ok(!cityFootprintsOverlap(shifted, blocking[0]));

  // Same spatial distribution used for the repeated 1,900-unit urban tiles.
  const anchors = Array.from({ length: 200 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (105 + ((i * 37) % 196)),
    z: -30 - Math.floor(i / 2) * 19,
    w: 7 + (i % 13),
    depth: 8 + (i % 11),
  }));
  const district = createCityDistricts(anchors);
  const towers = district.userData.towerFootprints;
  assert.equal(towers.length, 24, 'three districts with four towers per side');
  const occupied = [...anchors];
  for (const tower of towers) {
    assert.ok(Math.abs(tower.x) >= 108, 'district skyline stays beyond the playable corridor');
    assert.ok(
      occupied.every((other) => !cityFootprintsOverlap(tower, other)),
      'district footprint must never intersect an existing building',
    );
    occupied.push(tower);
  }
});

test('ascent eases visual street movement without stopping the mission clock', () => {
  assert.equal(cityAscentGroundFlow(0), 1);
  assert.equal(cityAscentGroundFlow(0.08), 1);
  assert.equal(cityAscentGroundFlow(0.55), 0);
  assert.ok(cityAscentGroundFlow(0.3) < 1 && cityAscentGroundFlow(0.3) > 0);

  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const city = scene.getObjectByName('launch-city');
  const ground = scene.getObjectByName('launch-ground');
  const step = 1 / 60;
  const speed = 180;

  world.update(step, step, speed, true);
  const before = city.position.z;
  assert.ok(before > 0, 'urban flythrough scrolls normally before boost');
  assert.equal(ground.material.uniforms.travel.value, before);

  world.setLaunchAscent(0.55, true);
  world.update(step, step * 2, speed, true);
  assert.ok(Math.abs(city.position.z - before) < 0.0001, 'tower mass settles during climb');
  assert.ok(
    Math.abs(ground.material.uniforms.travel.value - city.position.z) < 0.0001,
    'street texture and towers cannot slide at different velocities',
  );
  assert.equal(city.visible, true, 'city is still visible during the early atmosphere reveal');

  world.setLaunchAscent(0, true);
  world.update(step, step * 3, speed, true);
  assert.ok(city.position.z > before, 'visual street movement resumes after reset');
  world.reset();
  assert.equal(city.position.z, 0);
  assert.equal(ground.material.uniforms.travel.value, 0);
});
