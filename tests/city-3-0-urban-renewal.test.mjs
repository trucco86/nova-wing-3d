import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCity30DistrictLife, animateCity30, setCity30Quality,
} from '../src/city-30-district-life.js';
import { createWorld } from '../src/visuals.js';

const buildings = Array.from({ length: 50 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (105 + (i % 3) * 5),
  z: -30 - Math.floor(i / 2) * 19,
  h: 64 + i % 3 * 9,
  w: 18,
  depth: 17,
}));
const at = (mesh) => {
  const m = new T.Matrix4();
  mesh.getMatrixAt(0, m);
  return [...m.elements];
};
test('building-anchored city adds window variety, broken facade, scaffold and real skywalks', () => {
  const city = createCity30DistrictLife(buildings);
  assert.equal(city.userData.anchors, buildings.length);
  assert.ok(city.userData.damaged > 0);
  assert.ok(city.userData.bridges > 0, 'towers connect via supported walkways');
  assert.equal(city.getObjectByName('city-matrix-structural-frames-and-skybridges').isInstancedMesh,
    true);
  const windows = city.getObjectByName('city-matrix-dense-windows');
  assert.ok(windows.count > 100, 'facades get richer, nonrepeating window patterns');
  assert.ok(city.getObjectByName('city-matrix-warm-window-variation').count > 0);
  assert.ok(city.getObjectByName('city-matrix-broken-facades').count > 0);
  assert.ok(!city.getObjectByName('city-matrix-high-detail').visible);
  setCity30Quality(city, 'high');
  assert.ok(city.getObjectByName('city-matrix-high-detail').visible);
  const clone = city.clone(true);
  assert.notEqual(clone, city, 'loop tiles can clone separate animation matrices');
  assert.equal(clone.userData.anchors, buildings.length);
  setCity30Quality(clone, 'medium');
  assert.ok(!clone.getObjectByName('city-matrix-high-detail').visible);
  const taxi = city.getObjectByName('city-matrix-taxi-cabs');
  const old = at(taxi);
  animateCity30(city, 230);
  assert.notDeepEqual(at(taxi), old);
  const current = at(taxi);
  animateCity30(city, 230);
  assert.deepEqual(at(taxi), current, 'pause leaves urban taxis frozen');
  assert.equal(city.children.filter((o) => o.isInstancedMesh).length, 3);
  assert.equal(city.getObjectByName('city-matrix-rooftop-taxis').children.length, 2);
});
test('green city details integrate with real street tiles, quality and outside sectors', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const root = near.getObjectByName('city-matrix-streets');
  assert.ok(root && far.getObjectByName('city-matrix-streets'));
  assert.ok(root.userData.damaged > 0);
  assert.ok(near.getObjectByName('city-matrix-dense-windows'));
  assert.ok(near.getObjectByName('city-matrix-green-walkway-neon'));
  world.setGraphicsQuality('high');
  assert.ok(root.getObjectByName('city-matrix-high-detail').visible);
  world.setGraphicsQuality('medium');
  assert.ok(!root.getObjectByName('city-matrix-high-detail').visible);
  world.update(0.25, 0.25, 48, true);
  assert.equal(near.getObjectByName('city-matrix-taxi-cabs').count <= 5, true);
});
