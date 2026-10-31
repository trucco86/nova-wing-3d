import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  animateCityBillboards,
  createCityPremiumInfrastructure,
  createMaglevTrain,
} from '../src/city-premium.js';
import { createWorld } from '../src/visuals.js';

const colorDifference = (a, b) =>
  Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

test('City 2.6 maglev has sculpted, finite aerodynamic noses and levitation chassis', () => {
  for (const side of [-1, 1]) {
    const train = createMaglevTrain(side);
    for (const name of [
      'city-maglev-aerodynamic-nose-front',
      'city-maglev-aerodynamic-nose-rear',
    ]) {
      const nose = train.getObjectByName(name);
      assert.ok(nose?.isMesh, name);
      assert.ok(nose.geometry.getAttribute('position').count >= 12);
      for (const n of nose.geometry.getAttribute('position').array) {
        assert.ok(Number.isFinite(n), name + ' must have finite geometry');
      }
      assert.ok(nose.geometry.index.count >= 24, 'nose should be a real 3D surface');
      assert.equal(nose.userData.visualOnly, true);
    }
    const chassis = train.children.filter((c) => c.name === 'city-maglev-levitation-chassis');
    assert.equal(chassis.length, 3, 'each of the three carriages has its own chassis');
    assert.ok(train.children.every((c) => !c.userData.hitbox));
    const bounds = new T.Box3().setFromObject(train);
    assert.ok(bounds.max.z - bounds.min.z >= 108, 'aeroshell extends beyond the boxy carriages');
  }
});

test('City 2.6 billboard beacons animate by travel without redrawing textures', () => {
  const city = createCityPremiumInfrastructure();
  const holder = new T.Group();
  holder.add(city);
  const signs = city.getObjectByName('city-commercial-billboards');
  assert.equal(signs.children.length, 6);
  const beacon = signs.children[0].getObjectByName('city-billboard-beacon');
  assert.ok(beacon?.isMesh);
  const panel = signs.children[0].getObjectByName('advertising-panel');
  const originalTexture = panel.material.map;
  animateCityBillboards(holder, 40);
  const firstColor = beacon.material.color.clone();
  animateCityBillboards(holder, 230);
  const nextColor = beacon.material.color.clone();
  assert.ok(colorDifference(firstColor, nextColor) > 0.01, 'beacon changes brightness as city moves');
  assert.strictEqual(panel.material.map, originalTexture, 'canvas texture is reused');
  animateCityBillboards(holder, 230);
  assert.ok(colorDifference(beacon.material.color, nextColor) < 1e-9, 'same travel is deterministic');
  animateCityBillboards(holder, NaN);
  assert.ok(colorDifference(beacon.material.color, nextColor) < 1e-9, 'bad delta is ignored');
});

test('City 2.6 animated signage respects Pause and is absent from non-city scenery', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const near = scene.getObjectByName('launch-city');
  const beacon = near.getObjectByName('city-billboard-beacon');
  assert.ok(beacon);
  world.update(1, 1, 48, true);
  const beforePause = beacon.material.color.clone();
  world.update(1, 2, 48, false);
  assert.ok(colorDifference(beacon.material.color, beforePause) < 1e-9);
  world.update(1, 3, 48, true);
  assert.ok(colorDifference(beacon.material.color, beforePause) > 0.0001);
  world.setLaunchAscent(0.85, true);
  assert.equal(near.visible, false, 'the city leaves the orbital flight corridor');
});
