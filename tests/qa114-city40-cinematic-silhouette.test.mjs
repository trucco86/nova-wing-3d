import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

// A visual upgrade is not complete if it spends new WebGL material batches,
// dynamic lights or hidden collision volumes on another minuscule decal.
test('QA114: cinematic skyline aperture is supported and remains in the same three merged material batches', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  const horizon = scene.getObjectByName('city-distant-horizon');
  const landmark = horizon.getObjectByName('city40-distant-signature');
  const ring = landmark.userData.aperture;
  assert.deepEqual(ring, {
    radius: 43, innerRadius: 36.5, segments: 12,
    supportedSkywayY: 157, nonPlayable: true,
  });
  assert.ok(178 - ring.radius < ring.supportedSkywayY &&
    178 + ring.radius > ring.supportedSkywayY, 'the aperture crosses the real skyway for support');
  assert.equal(landmark.userData.metrics.drawUnits, 3);
  assert.ok(landmark.userData.metrics.bytes < 256 * 1024);
  assert.ok(landmark.userData.metrics.triangles < 5000);
  assert.equal(landmark.userData.visualOnly, true);
  const all = [];
  landmark.traverse(node => {
    if (node.isMesh) all.push(node);
    assert.equal(node.userData.solid, undefined);
    assert.equal(node.userData.hitbox, undefined);
  });
  assert.equal(all.length, 3);
  for (const mesh of all) assert.ok(mesh.geometry.boundingSphere?.radius > 0);
  assert.ok(landmark.getObjectByName('city40-landmark-faceted-spires').geometry.index.count > 500);
});

test('QA114: flight-facing structural ribs are supported, keep the physical lane clear and add zero draw batches', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  for (const name of ['launch-city','launch-city-far']) {
    const tile = scene.getObjectByName(name);
    const hero = tile.getObjectByName('city40-hero-architecture');
    assert.equal(hero.userData.metrics.drawUnits, 4);
    assert.ok(hero.userData.metrics.bytes < 3 * 1024 * 1024);
    assert.ok(hero.userData.metrics.triangles < 45000);
    const columns = hero.userData.corridorFacades;
    assert.ok(columns.length >= 2);
    for (const facade of columns) {
      assert.equal(facade.supportedRibbonCount, 2);
      assert.equal(facade.sideColumns.length, 2);
      assert.ok(facade.minLaneAbsX >= 118);
      const footprint = tile.userData.buildingFootprints[facade.hostIndex];
      assert.ok(facade.sideColumns.every(z =>
        z >= footprint.z - footprint.depth / 2 &&
        z <= footprint.z + footprint.depth / 2
      ), 'architectural strips stay fixed to the host tower');
    }
  }
});

test('QA114: medium/high graphics change only existing precision batches, not gameplay surfaces', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  const skyline = scene.getObjectByName('city40-distant-signature');
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const original = [near, far].map(tile => tile.userData.buildingFootprints.map(b => ({ ...b })));
  for (const quality of ['medium','high','medium']) {
    world.setGraphicsQuality(quality);
    assert.equal(skyline.getObjectByName('city40-landmark-high').visible, quality === 'high');
    for (const tile of [near, far]) {
      const hero = tile.getObjectByName('city40-hero-architecture');
      assert.equal(hero.getObjectByName('city40-precision-high').visible, quality === 'high');
      assert.equal(hero.getObjectByName('city40-architectural-medium').visible, true);
    }
  }
  assert.deepEqual(near.userData.buildingFootprints, original[0]);
  assert.deepEqual(far.userData.buildingFootprints, original[1]);
});
