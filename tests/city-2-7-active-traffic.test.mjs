import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCityTraffic,
  setCityTrafficQuality,
  animateCityTraffic,
} from '../src/city-traffic.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const getTranslation = (mesh, i = 0) => {
  const matrix = new T.Matrix4();
  mesh.getMatrixAt(i, matrix);
  return new T.Vector3().setFromMatrixPosition(matrix);
};
const frame = (mesh) => {
  const matrix = new T.Matrix4();
  mesh.getMatrixAt(0, matrix);
  return matrix.elements.slice();
};

test('moving city has detailed surface cars, aerial taxis and ascending escape ships', () => {
  const traffic = createCityTraffic();
  assert.equal(traffic.name, 'city-active-traffic');
  assert.deepEqual(traffic.userData.roleCounts, { road: 12, flycar: 7, escape: 6 });
  for (const role of ['road', 'flycar', 'escape']) {
    const group = traffic.getObjectByName('city-traffic-' + role);
    assert.ok(group?.isGroup);
    assert.ok(group.children.length >= 5, 'each type has a 3D hull, glass and lighting');
    assert.ok(group.children.every((mesh) => mesh.isInstancedMesh && mesh.userData.visualOnly));
    assert.ok(group.children.every((mesh) => !mesh.userData.hitbox));
  }
  const road = traffic.getObjectByName('city-traffic-road-hull');
  const flying = traffic.getObjectByName('city-traffic-flycar-taxi');
  const escape = traffic.getObjectByName('city-traffic-escape-escape');
  assert.ok(road?.isInstancedMesh && flying?.isInstancedMesh && escape?.isInstancedMesh);
  const startingRoad = getTranslation(road);
  const startingFlying = getTranslation(flying);
  const startingEscape = getTranslation(escape);
  assert.ok(
    Math.abs(startingRoad.x) < 40 && startingRoad.y < 0,
    'ground vehicles run along the road',
  );
  assert.ok(
    Math.abs(startingFlying.x) > 60 && startingFlying.y > 60,
    'flying taxis use aerial routes',
  );
  assert.ok(startingEscape.y > 40, 'evacuation spacecraft already start ascending');
  animateCityTraffic(traffic, 600);
  assert.notDeepEqual(getTranslation(road).toArray(), startingRoad.toArray());
  assert.notDeepEqual(getTranslation(flying).toArray(), startingFlying.toArray());
  assert.ok(getTranslation(escape).y > startingEscape.y, 'ships climb towards space');
  const fixed = frame(escape);
  animateCityTraffic(traffic, 600);
  assert.deepEqual(frame(escape), fixed, 'movement is deterministic and pauses on fixed travel');
  animateCityTraffic(traffic, Number.NaN);
  assert.deepEqual(frame(escape), fixed, 'bad input cannot corrupt transforms');
});

test('Medium keeps visible traffic and High reveals more without new draw groups', () => {
  const traffic = createCityTraffic();
  const expected = { road: [8, 12], flycar: [4, 7], escape: [3, 6] };
  let drawCalls = 0;
  for (const [role, [medium, high]] of Object.entries(expected)) {
    const group = traffic.getObjectByName('city-traffic-' + role);
    drawCalls += group.children.length;
    assert.ok(group.children.every((mesh) => mesh.count === medium));
    setCityTrafficQuality(traffic, 'high');
    assert.ok(group.children.every((mesh) => mesh.count === high));
    setCityTrafficQuality(traffic, 'medium');
  }
  assert.equal(drawCalls, 22, '22 GPU batches per tile include merged real wheel and thruster details');
});

test('city traffic continues with gameplay, respects Pause and leaves orbital/ocean scenes', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const vehicles = near.getObjectByName('city-active-traffic');
  const farVehicles = far.getObjectByName('city-active-traffic');
  assert.ok(vehicles && farVehicles);
  const lead = vehicles.getObjectByName('city-traffic-flycar-taxi');
  const farLead = farVehicles.getObjectByName('city-traffic-flycar-taxi');
  assert.notDeepEqual(frame(lead), frame(farLead), 'looping tiles have staggered traffic');
  world.update(1, 1, 48, true);
  const moved = frame(lead);
  world.update(1, 2, 48, false);
  assert.deepEqual(frame(lead), moved, 'paused gameplay freezes street and air traffic');
  world.setGraphicsQuality('high');
  assert.equal(vehicles.getObjectByName('city-traffic-escape-escape').count, 6);
  world.setGraphicsQuality('medium');
  assert.equal(vehicles.getObjectByName('city-traffic-escape-escape').count, 3);
  world.setLaunchAscent(0.85, true);
  assert.equal(near.visible, false, 'traffic is hidden once the city recedes beneath the craft');
  world.setSector(SECTORS[1]);
  assert.equal(vehicles.visible, false, 'no flying cars from Earth in ocean sector');
  assert.equal(farVehicles.visible, false);
  world.setSector(SECTORS[0]);
  world.reset();
  assert.ok(Number.isFinite(getTranslation(lead).z));
});
