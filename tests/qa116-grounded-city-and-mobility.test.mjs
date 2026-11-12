import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  animateCityTraffic,
  createCityTraffic,
  setCityTrafficQuality,
} from '../src/city-traffic.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const position = (mesh, i) => {
  const matrix = new T.Matrix4();
  mesh.getMatrixAt(i, matrix);
  return new T.Vector3().setFromMatrixPosition(matrix);
};

test('QA116: full-size buses remain on road without entering compact-car lanes or rails', () => {
  const traffic = createCityTraffic();
  const bus = traffic.getObjectByName('city-traffic-bus-merged-detail');
  const road = traffic.getObjectByName('city-traffic-road-hull');
  assert.ok(bus?.isInstancedMesh);
  assert.ok(bus.geometry.getAttribute('color'));
  bus.geometry.computeBoundingBox();
  assert.ok(bus.geometry.boundingBox.max.z - bus.geometry.boundingBox.min.z >= 27);
  for (const quality of ['medium', 'high']) {
    setCityTrafficQuality(traffic, quality);
    assert.equal(bus.count, quality === 'medium' ? 2 : 4);
    for (const travel of [0, 350, 925, 1700, 2300]) {
      animateCityTraffic(traffic, travel);
      for (let i = 0; i < bus.count; i++) {
        const p = position(bus, i);
        assert.ok(Math.abs(p.x) >= 35 && Math.abs(p.x) < 41);
        assert.equal(p.y, -1.5);
        assert.ok(p.z < -50 && p.z > -1900);
      }
      const roadX = Math.abs(position(road, 2).x);
      assert.ok(
        roadX + 3 < Math.abs(position(bus, 0).x) - 5,
        'no parallel car/bus lane penetration',
      );
    }
  }
});

test('QA116: denser flying traffic stays inside the reserved aerial lane without facade penetration', () => {
  const traffic = createCityTraffic();
  const flying = traffic.getObjectByName('city-traffic-flycar-taxi');
  assert.ok(flying?.isInstancedMesh);
  for (const quality of ['medium', 'high']) {
    setCityTrafficQuality(traffic, quality);
    assert.equal(flying.count, quality === 'high' ? 13 : 7);
    for (const distance of [0, 270, 905, 1777]) {
      animateCityTraffic(traffic, distance);
      for (let i = 0; i < flying.count; i++) {
        const p = position(flying, i);
        assert.ok(Math.abs(p.x) - 7.5 > 72, 'flying cars stay outside player flight lane');
        assert.ok(Math.abs(p.x) + 7.5 < 118, 'flying cars stay outside building frontages');
        assert.ok(p.y > 65 && p.y < 140);
      }
    }
  }
  assert.equal(
    traffic.children.reduce((sum, group) => sum + group.children.length, 0),
    22,
    'the bus fleet must not increase original per-tile traffic draw calls',
  );
  assert.ok(
    traffic.children.every((group) => group.children.every((mesh) => mesh.userData.visualOnly)),
  );
});

test('QA116: natural city palette and grounded bridge physics survive world quality switches', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.43, true);
  try {
    world.setSector(SECTORS[0]);
    for (const quality of ['medium', 'high']) {
      world.setGraphicsQuality(quality);
      for (const name of ['launch-city', 'launch-city-far']) {
        const tile = scene.getObjectByName(name);
        const bridges = tile.getObjectByName('city-upper-playable-skybridges');
        const road = tile.getObjectByName('city-active-traffic');
        const buildings = tile.getObjectByName('city-base-building-bodies');
        assert.ok(bridges.visible && road.visible);
        assert.equal(bridges.userData.groundedSupports.length, 6);
        assert.ok(buildings.material.metalness >= 0.76);
        const supporting = bridges.userData.groundedSupports;
        assert.ok(supporting.every((pier) => pier.footY === -7 && Math.abs(pier.x) > 72));
      }
    }
  } finally {
    world.destroy?.();
  }
});

test('QA116: generic rear billboards face outward from real buildings with no extra render batches', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.41, true);
  try {
    world.setSector(SECTORS[0]);
    for (const tileName of ['launch-city', 'launch-city-far']) {
      const tile = scene.getObjectByName(tileName);
      const ads = tile.getObjectByName('city-premium-ad-inventory');
      const screens = ads.getObjectByName('city-ad-atlas-generic-artwork');
      const mounts = ads.getObjectByName('city-ad-grounded-metal-frames-and-mounts');
      assert.ok(screens?.isInstancedMesh && mounts?.isInstancedMesh);
      assert.equal(
        ads.children.length,
        2,
        'rear screens must reuse existing atlas and frame batches',
      );
      const rear = ads.userData.slots.filter((slot) => slot.surface === 'rear-facade');
      assert.ok(rear.length >= 1, 'a building back needs an actual advertising panel');
      for (const slot of rear) {
        const host = tile.userData.buildingFootprints[slot.hostIndex];
        assert.ok(Math.abs(slot.z - (host.z - host.depth / 2 - 2.05)) < 0.001);
        const i = ads.userData.slots.findIndex((candidate) => candidate.id === slot.id);
        const matrix = new T.Matrix4();
        screens.getMatrixAt(i, matrix);
        assert.ok(
          matrix.elements[0] < 0,
          'rear artwork is rotated, never mirror-readable backwards',
        );
        assert.ok(matrix.elements[10] < 0, 'rear normal points toward the back of the building');
        assert.ok(slot.width < host.w && slot.height > 1);
      }
    }
  } finally {
    world.destroy?.();
  }
});
