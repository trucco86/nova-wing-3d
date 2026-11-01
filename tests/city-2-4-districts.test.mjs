import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { createCityDistricts } from '../src/city-districts.js';

test('three urban districts are distinct, instanced and outside the flight lane', () => {
  const districts = createCityDistricts();
  assert.equal(districts.name, 'city-architectural-districts');
  assert.deepEqual(districts.userData.districts, ['commerce', 'industrial', 'spaceport']);
  for (const name of districts.userData.districts) {
    assert.ok(districts.getObjectByName('city-district-' + name), name + ' exists');
  }
  const bodies = districts.getObjectByName('city-district-towers-and-infrastructure');
  const trim = districts.getObjectByName('city-district-crowns-and-gantries');
  const light = districts.getObjectByName('city-district-wayfinding-lights');
  const premium = districts.getObjectByName('city-district-high-details');
  const windows = premium.getObjectByName('city-district-premium-windows');
  const accents = premium.getObjectByName('city-district-premium-accents');
  assert.ok(bodies.isInstancedMesh && bodies.count > 26 && bodies.count < 125);
  assert.ok(trim.isInstancedMesh && trim.count > 27 && trim.count < 125);
  assert.ok(light.isInstancedMesh && light.count > 45 && light.count < 130);
  assert.ok(windows.isInstancedMesh && windows.count >= 100 && windows.count < 190);
  assert.ok(accents.isInstancedMesh && accents.count >= 20);
  assert.equal(premium.visible, false);

  for (const name of ['city-maglev-station-west', 'city-maglev-station-east']) {
    const station = districts.getObjectByName(name);
    assert.ok(station?.isGroup);
    assert.equal(station.userData.district, 'transit');
    assert.ok(Math.abs(station.position.x) >= 80, 'station remains outside corridor');
    assert.ok(station.children.length >= 8, 'station has canopy, platform and columns');
    assert.ok(station.children.every((part) => !part.userData.hitbox));
  }
  const transform = new T.Matrix4();
  const at = new T.Vector3();
  const scale = new T.Vector3();
  const rotation = new T.Quaternion();
  for (let i = 0; i < bodies.count; i++) {
    bodies.getMatrixAt(i, transform);
    transform.decompose(at, rotation, scale);
    assert.ok(Math.abs(at.x) >= 108, 'district core does not block flight');
    assert.ok(Number.isFinite(at.y) && Number.isFinite(at.z));
  }
});

test('City 2.4 districts survive wrap and quality switching, disappear in orbit and ocean', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearDistrict = city.getObjectByName('city-architectural-districts');
  const farDistrict = far.getObjectByName('city-architectural-districts');
  const highNear = city.getObjectByName('city-district-high-details');
  const highFar = far.getObjectByName('city-district-high-details');
  assert.ok(nearDistrict && farDistrict && highNear && highFar);
  world.setGraphicsQuality('medium');
  assert.equal(nearDistrict.visible, true);
  assert.equal(highNear.visible, false);
  assert.equal(highFar.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(highNear.visible, true);
  assert.equal(highFar.visible, true);
  world.update(42, 42, 48, true);
  assert.ok(city.position.z >= 0 && city.position.z < 1900);
  world.setSector(SECTORS[0]);
  assert.equal(nearDistrict.visible, true);
  world.setLaunchAscent(0.85, true);
  assert.equal(city.visible, false, 'districts retreat with city for orbit');
  world.setSector(SECTORS[1]);
  assert.equal(nearDistrict.visible, false, 'no city stations in ocean');
  assert.equal(farDistrict.visible, false);
  world.reset();
  assert.equal(city.position.z, 0);
});
