import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createAdaptiveGraphics, graphicsPixelRatioLimit } from '../src/graphics-quality.js';
import {
  createCityTraffic,
  animateCityTraffic,
  setCityTrafficQuality,
} from '../src/city-traffic.js';
import {
  createCityUrbanDrones,
  animateCityUrbanDrones,
  setCityUrbanDronesQuality,
} from '../src/city-urban-drones.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

function feed(controller, { start = 0, stop = 30000, delta = 42, active = true } = {}) {
  const decisions = [];
  for (let t = start; t <= stop; t += delta) {
    const decision = controller.sample(t, active);
    if (decision) decisions.push(decision);
  }
  return decisions;
}
const matrix = (mesh, index = 0) => {
  const result = new T.Matrix4();
  mesh.getMatrixAt(index, result);
  return result.elements.slice();
};

test('mobile High protects FPS with measured dynamic render scale, never changing settings', () => {
  const adaptive = createAdaptiveGraphics({ mode: 'high', coarsePointer: true, deviceMemory: 8 });
  assert.equal(adaptive.current().quality, 'high');
  assert.equal(graphicsPixelRatioLimit('high', { coarsePointer: true }), 1.12);
  const decisions = feed(adaptive, { delta: 43, stop: 29000 });
  assert.ok(decisions.length > 0, 'sustained slow rendering triggers adaptation');
  assert.ok(decisions.some((state) => state.resolutionScale < 1));
  assert.ok(adaptive.current().resolutionScale >= 0.68);
  assert.ok(adaptive.current().adaptive);
});

test('Auto falls from expensive High to Medium on sustained poor desktop FPS', () => {
  const adaptive = createAdaptiveGraphics({ mode: 'auto', coarsePointer: false, deviceMemory: 8 });
  assert.equal(adaptive.current().quality, 'high');
  const states = feed(adaptive, { delta: 60, stop: 100000 });
  assert.ok(states.some((state) => state.quality === 'medium'));
  assert.ok(adaptive.current().resolutionScale >= 0.75);
});

test('FPS adaptation ignores pause, hidden tabs, sporadic device stalls and initial warmup', () => {
  const adaptive = createAdaptiveGraphics({ mode: 'high', coarsePointer: true });
  feed(adaptive, { delta: 43, stop: 1900 });
  assert.equal(adaptive.current().resolutionScale, 1);
  feed(adaptive, { start: 2000, stop: 14000, delta: 400, active: false });
  assert.equal(adaptive.current().resolutionScale, 1);
  const states = feed(adaptive, { start: 14001, stop: 17000, delta: 700 });
  assert.equal(states.length, 0);
  assert.equal(adaptive.current().resolutionScale, 1);
  adaptive.reset('medium');
  assert.equal(adaptive.current().quality, 'medium');
  assert.equal(adaptive.current().resolutionScale, 1);
});

test('urban ground cars, flying taxis and escape craft have real mechanical merged detail', () => {
  const traffic = createCityTraffic();
  for (const role of ['road', 'flycar', 'escape']) {
    const group = traffic.getObjectByName('city-traffic-' + role);
    const mesh = group.getObjectByName('city-traffic-' + role + '-merged-detail');
    assert.ok(mesh?.isInstancedMesh, role + ' trim is one GPU draw batch');
    assert.ok(mesh.geometry.attributes.color, 'merged shell retains per-part vertex colours');
    assert.ok(mesh.geometry.attributes.normal.count > 100);
    assert.equal(mesh.userData.visualOnly, true);
    animateCityTraffic(traffic, 0);
    const before = matrix(mesh);
    animateCityTraffic(traffic, 300);
    assert.notDeepEqual(matrix(mesh), before);
    const snapshot = matrix(mesh);
    animateCityTraffic(traffic, 300);
    assert.deepEqual(matrix(mesh), snapshot, 'traffic does not drift while paused');
  }
  assert.equal(
    traffic.children.reduce((sum, group) => sum + group.children.length, 0),
    22,
  );
  setCityTrafficQuality(traffic, 'high');
  assert.equal(traffic.getObjectByName('city-traffic-road-merged-detail').count, 12);
  setCityTrafficQuality(traffic, 'medium');
  assert.equal(traffic.getObjectByName('city-traffic-road-merged-detail').count, 8);
});

test('independent city service drones follow visible aerial paths with no gameplay colliders', () => {
  const group = createCityUrbanDrones();
  const body = group.getObjectByName('city-moving-service-drones');
  const beacon = group.getObjectByName('city-moving-drone-beacons');
  assert.ok(body?.isInstancedMesh && beacon?.isInstancedMesh);
  assert.equal(body.count, 6);
  setCityUrbanDronesQuality(group, 'high');
  assert.equal(body.count, 12);
  const start = matrix(body);
  animateCityUrbanDrones(group, 380);
  assert.notDeepEqual(matrix(body), start);
  assert.deepEqual(matrix(beacon).length, 16);
  const fixed = matrix(body);
  animateCityUrbanDrones(group, 380);
  assert.deepEqual(matrix(body), fixed);
  animateCityUrbanDrones(group, Number.NaN);
  assert.deepEqual(matrix(body), fixed);
  setCityUrbanDronesQuality(group, 'medium');
  assert.equal(body.count, 6);
  assert.equal(group.userData.visualOnly, true);
});

test('city drone movement persists across city loops and is hidden outside Earth sector', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const a = near.getObjectByName('city-urban-drones');
  const b = far.getObjectByName('city-urban-drones');
  assert.ok(a && b);
  const primary = a.getObjectByName('city-moving-service-drones');
  const before = matrix(primary);
  world.update(0.8, 0.8, 48, true);
  assert.notDeepEqual(matrix(primary), before);
  const frozen = matrix(primary);
  world.update(0.8, 1.6, 48, false);
  assert.deepEqual(matrix(primary), frozen);
  world.setGraphicsQuality('high');
  assert.equal(primary.count, 12);
  world.setGraphicsQuality('medium');
  assert.equal(primary.count, 6);
  world.setSector(SECTORS[1]);
  assert.equal(a.visible, false);
  assert.equal(b.visible, false);
});
