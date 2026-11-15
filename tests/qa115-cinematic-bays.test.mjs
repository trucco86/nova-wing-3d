import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('QA115: angled corridor-facing bay geometry is anchored to actual buildings and never enters flight lane', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  let detailed = 0;
  for (const tileName of ['launch-city', 'launch-city-far']) {
    const tile = scene.getObjectByName(tileName);
    const hero = tile.getObjectByName('city40-hero-architecture');
    assert.equal(
      hero.userData.metrics.drawUnits,
      4,
      '3D sculpted bays are merged, not one GPU call per window',
    );
    assert.ok(hero.userData.metrics.bytes < 3 * 1024 * 1024);
    assert.ok(hero.userData.metrics.triangles < 45000);
    for (const face of hero.userData.corridorFacades) {
      assert.equal(face.sculptedPodiums.length, 2);
      detailed++;
      const host = tile.userData.buildingFootprints[face.hostIndex];
      assert.ok(face.minLaneAbsX >= 118);
      for (const podium of face.sculptedPodiums) {
        assert.ok(Math.abs(podium.outerX) >= 118);
        assert.ok(podium.centerZ > host.z - host.depth / 2);
        assert.ok(podium.centerZ < host.z + host.depth / 2);
        assert.ok(podium.height > 8);
      }
    }
    const glass = hero.getObjectByName('city40-deep-bay-glazing');
    assert.ok(glass.geometry.index.count > 0);
    assert.ok([...glass.geometry.getAttribute('position').array].every(Number.isFinite));
    const masonry = hero.getObjectByName('city40-sculpted-masonry');
    assert.ok([...masonry.geometry.getAttribute('normal').array].every(Number.isFinite));
    hero.traverse((node) => {
      assert.equal(node.userData.solid, undefined);
      assert.equal(node.userData.hitbox, undefined);
    });
  }
  assert.ok(detailed >= 5, 'both districts show meaningful premium geometry');
});

test('QA115: medium/high changes only precision geometry, not host positions', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  const tiles = ['launch-city', 'launch-city-far'].map((name) => scene.getObjectByName(name));
  const footprints = tiles.map((tile) => tile.userData.buildingFootprints.map((v) => ({ ...v })));
  for (const tier of ['high', 'medium', 'high']) {
    world.setGraphicsQuality(tier);
    for (const tile of tiles) {
      const hero = tile.getObjectByName('city40-hero-architecture');
      assert.equal(hero.getObjectByName('city40-architectural-medium').visible, true);
      assert.equal(hero.getObjectByName('city40-precision-high').visible, tier === 'high');
    }
  }
  tiles.forEach((tile, i) => assert.deepEqual(tile.userData.buildingFootprints, footprints[i]));
});
