import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCityTraffic,
  setCityTrafficQuality,
  animateCityTraffic,
} from '../src/city-traffic.js';
import { createCity34Concept, setCity34ConceptQuality } from '../src/city-34-concept.js';
import { createWorld } from '../src/visuals.js';

const matrix = new T.Matrix4();
function instancePose(mesh, i) {
  mesh.getMatrixAt(i, matrix);
  return Array.from(matrix.elements);
}

test('QA142: 42 facades have batched framing and real room cells with no added draw', () => {
  const city = createCity34Concept();
  const stats = city.userData.fenestration;
  assert.deepEqual(stats, {
    towers: 42,
    mediumOccupiedRooms: 84,
    highOccupiedRooms: 756,
    facadeRibs: 84,
    materialBatches: 9,
    nonColliding: true,
  });
  const braces = city.getObjectByName('city34-multilevel-skybridges');
  const crowns = city.getObjectByName('city34-elevated-crown-lights');
  assert.equal(braces.count, 96, '84 facade ribs + 12 existing skybridge supports');
  assert.equal(crowns.count, 84);
  assert.equal(city.getObjectByName('city34-facade-cyan-rooms').count, 504);
  assert.equal(city.getObjectByName('city34-facade-amber-rooms').count, 252);
  assert.equal(city.getObjectByName('city34-facade-baseline-cool').count, 42);
  assert.equal(city.getObjectByName('city34-facade-baseline-amber').count, 42);
  const instanced = [];
  city.traverse((node) => {
    if (node.isInstancedMesh) instanced.push(node);
  });
  assert.equal(instanced.length, 9, 'no additional GPU material batches');
  city.traverse((node) => {
    assert.notEqual(node.userData.hitbox, true);
    assert.notEqual(node.userData.collider, true);
  });
  setCity34ConceptQuality(city, 'medium');
  assert.equal(city.getObjectByName('city34-facade-baseline-amber').visible, true);
  assert.equal(city.getObjectByName('city34-concept-high-detail').visible, false);
  setCity34ConceptQuality(city, 'high');
  assert.equal(city.getObjectByName('city34-concept-high-detail').visible, true);
});

test('QA142: medium traffic updates only visible vehicles but restores hidden High matrices', () => {
  const traffic = createCityTraffic();
  const taxi = traffic.getObjectByName('city-traffic-flycar-taxi');
  const hiddenIndex = 11;
  assert.equal(taxi.count, 7);
  animateCityTraffic(traffic, 273);
  const hiddenBefore = instancePose(taxi, hiddenIndex);
  animateCityTraffic(traffic, 351);
  assert.deepEqual(
    instancePose(taxi, hiddenIndex),
    hiddenBefore,
    'Medium avoids High-only updates',
  );
  setCityTrafficQuality(traffic, 'high');
  assert.equal(taxi.count, 13);
  assert.notDeepEqual(
    instancePose(taxi, hiddenIndex),
    hiddenBefore,
    'High initializes hidden vehicles',
  );
  const visible = instancePose(taxi, hiddenIndex);
  animateCityTraffic(traffic, 351);
  assert.deepEqual(
    instancePose(taxi, hiddenIndex),
    visible,
    'same time produces identical matrices',
  );
  setCityTrafficQuality(traffic, 'medium');
  assert.equal(taxi.count, 7);
  setCityTrafficQuality(traffic, 'high');
  assert.deepEqual(instancePose(taxi, hiddenIndex), visible, 'LOD switch cannot teleport a craft');
});

test('QA142: cloned traffic caches its own vehicle groups and correct phase', () => {
  const near = createCityTraffic();
  const far = near.clone(true);
  near.userData.trafficPhase = 0;
  far.userData.trafficPhase = 870;
  const nearTaxi = near.getObjectByName('city-traffic-flycar-taxi');
  const farTaxi = far.getObjectByName('city-traffic-flycar-taxi');
  animateCityTraffic(near, 512);
  animateCityTraffic(far, 512);
  assert.notDeepEqual(instancePose(nearTaxi, 0), instancePose(farTaxi, 0));
  const saved = instancePose(nearTaxi, 0);
  animateCityTraffic(far, 999);
  assert.deepEqual(instancePose(nearTaxi, 0), saved, 'clone shares no animated scene cache');
  near.getObjectByName = () => {
    throw new Error('frame-level recursive search');
  };
  far.getObjectByName = () => {
    throw new Error('frame-level recursive search');
  };
  assert.doesNotThrow(() => animateCityTraffic(near, 520));
  assert.doesNotThrow(() => animateCityTraffic(far, 520));
});

test('QA142: real city world still keeps both skies non-colliding and animated', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const a = near.getObjectByName('city-traffic-flycar-taxi');
  const b = far.getObjectByName('city-traffic-flycar-taxi');
  assert.ok(a && b);
  const start = instancePose(a, 0);
  world.update(0.5, 0.5, 400, true);
  assert.notDeepEqual(instancePose(a, 0), start);
  assert.notDeepEqual(instancePose(a, 0), instancePose(b, 0));
});
