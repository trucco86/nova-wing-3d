import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCity30DistrictLife,
  setCity30Quality,
  animateCity30,
} from '../src/city-30-district-life.js';
import { createCity32Living, setCity32Quality, updateCity32Living } from '../src/city-32-living.js';
import {
  createCity33Premium,
  setCity33Quality,
  updateCity33Premium,
} from '../src/city-33-premium.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const buildings = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (112 + (i % 8) * 13),
  z: -30 - Math.floor(i / 2) * 19,
  h: 53 + (i % 8) * 8,
  w: 13 + (i % 5),
  depth: 14,
}));
function matrix(mesh, i = 0) {
  const out = new T.Matrix4();
  mesh.getMatrixAt(i, out);
  return [...out.elements];
}
function countWrites(mesh) {
  let calls = 0;
  const previous = mesh.setMatrixAt.bind(mesh);
  mesh.setMatrixAt = (index, value) => {
    calls++;
    previous(index, value);
  };
  return () => calls;
}
test('City 3.0 taxis: Medium animates only rendered models; High restores exact motion and the far clone stays independent', () => {
  const near = createCity30DistrictLife(buildings);
  const far = near.clone();
  const cab = near.getObjectByName('city-matrix-taxi-cabs');
  const thrusters = near.getObjectByName('city-matrix-taxi-thrusters');
  const hiddenBefore = matrix(cab, 11);
  const cabWrites = countWrites(cab);
  const thrusterWrites = countWrites(thrusters);
  setCity30Quality(near, 'medium');
  animateCity30(near, 375);
  assert.equal(cabWrites(), 5);
  assert.equal(thrusterWrites(), 5);
  assert.deepEqual(matrix(cab, 11), hiddenBefore);
  setCity30Quality(near, 'high');
  animateCity30(near, 375);
  assert.equal(cabWrites(), 17);
  assert.equal(thrusterWrites(), 17);
  const reference = createCity30DistrictLife(buildings);
  setCity30Quality(reference, 'high');
  animateCity30(reference, 375);
  for (const i of [0, 4, 11])
    assert.deepEqual(matrix(cab, i), matrix(reference.getObjectByName('city-matrix-taxi-cabs'), i));
  far.getObjectByName('city-matrix-rooftop-taxis').userData.phase = 2;
  animateCity30(far, 375);
  assert.notDeepEqual(matrix(cab), matrix(far.getObjectByName('city-matrix-taxi-cabs')));
});

test('City 3.2 aircraft: Medium updates 9 visible pairs, hidden holos and searchlights do not animate', () => {
  const near = createCity32Living(buildings);
  const far = near.clone();
  const air = near.getObjectByName('city32-civilian-aircraft');
  const lights = near.getObjectByName('city32-aircraft-navigation-lights');
  const writesAir = countWrites(air),
    writesLight = countWrites(lights);
  const hiddenMatrix = matrix(air, 17);
  const hiddenSearchlight = near
    .getObjectByName('city32-searchlight-5')
    .getObjectByName('city32-searchlight-pivot');
  const hiddenBefore = hiddenSearchlight.rotation.z;
  setCity32Quality(near, 'medium');
  updateCity32Living(near, 375);
  assert.equal(writesAir(), 9);
  assert.equal(writesLight(), 9);
  assert.deepEqual(matrix(air, 17), hiddenMatrix);
  assert.equal(hiddenSearchlight.rotation.z, hiddenBefore);
  setCity32Quality(near, 'high');
  updateCity32Living(near, 375);
  assert.equal(writesAir(), 27);
  const reference = createCity32Living(buildings);
  setCity32Quality(reference, 'high');
  updateCity32Living(reference, 375);
  for (const i of [0, 8, 17])
    assert.deepEqual(
      matrix(air, i),
      matrix(reference.getObjectByName('city32-civilian-aircraft'), i),
    );
  far.userData.phase = 2.8;
  updateCity32Living(far, 375);
  assert.notDeepEqual(matrix(air), matrix(far.getObjectByName('city32-civilian-aircraft')));
});

test('City 3.3 buses and welding: Medium updates 4 buses, 6 sparks, only visible cranes, full High is identical to authored baseline', () => {
  const city = createCity33Premium(buildings);
  const far = city.clone();
  const hull = city.getObjectByName('city33-bus-hull');
  const sparks = city.getObjectByName('city33-welding-sparks');
  const writesHull = countWrites(hull);
  const writesSparks = countWrites(sparks);
  const hiddenBus = matrix(hull, 7);
  const hiddenSpark = matrix(sparks, 11);
  setCity33Quality(city, 'medium');
  updateCity33Premium(city, 375);
  assert.equal(writesHull(), 4);
  assert.equal(writesSparks(), 6);
  assert.deepEqual(matrix(hull, 7), hiddenBus);
  assert.deepEqual(matrix(sparks, 11), hiddenSpark);
  setCity33Quality(city, 'high');
  updateCity33Premium(city, 375);
  assert.equal(writesHull(), 12);
  assert.equal(writesSparks(), 18);
  const reference = createCity33Premium(buildings);
  setCity33Quality(reference, 'high');
  updateCity33Premium(reference, 375);
  for (const i of [0, 3, 7])
    assert.deepEqual(matrix(hull, i), matrix(reference.getObjectByName('city33-bus-hull'), i));
  for (const i of [0, 5, 11])
    assert.deepEqual(
      matrix(sparks, i),
      matrix(reference.getObjectByName('city33-welding-sparks'), i),
    );
  far.userData.phase = 2.1;
  updateCity33Premium(far, 375);
  assert.notDeepEqual(matrix(hull), matrix(far.getObjectByName('city33-bus-hull')));
});

test('hidden city stage and orbital ascent do not recompute decorative traffic while the route time continues', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  world.setGraphicsQuality('medium');
  const city = scene.getObjectByName('launch-city');
  const cabs = city.getObjectByName('city-matrix-taxi-cabs');
  const writes = countWrites(cabs);
  world.update(0.1, 1, 60, true);
  assert.ok(writes() > 0);
  const before = writes();
  world.setLaunchAscent(0.85, true);
  assert.equal(city.visible, false);
  world.update(0.1, 2, 60, true);
  assert.equal(writes(), before, 'hidden city must not consume frame animation work');
  world.setSector(SECTORS[1]);
  world.update(0.1, 3, 60, true);
  assert.equal(writes(), before, 'city must stay idle throughout Mars gameplay');
  world.setSector(SECTORS[0]);
  world.setLaunchAscent(0, true);
  if (city.visible) {
    world.update(0.1, 4, 60, true);
    assert.ok(writes() > before, 'visible city resumes its authored full-rate animation');
  }
});
