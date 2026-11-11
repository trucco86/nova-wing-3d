import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import { updateCity32Living } from '../src/city-32-living.js';

function matrixAt(mesh, i) {
  const m = new T.Matrix4();
  mesh.getMatrixAt(i, m);
  return m;
}

test('QA109 continuity: two road tiles have different anchored architecture and no repeated facades', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.53, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearIdentity = near.getObjectByName('city-tile-local-identity');
  const farIdentity = far.getObjectByName('city-tile-local-identity');
  assert.equal(nearIdentity.userData.variant, 'civic');
  assert.equal(farIdentity.userData.variant, 'industrial');
  assert.equal(nearIdentity.userData.anchors, 200);
  assert.equal(farIdentity.userData.anchors, 200);
  assert.notEqual(
    nearIdentity.userData.crowns,
    farIdentity.userData.crowns,
    'the next road tile is not the same cloned architectural profile',
  );
  for (const tile of [near, far]) {
    const anchors = tile.userData.buildingFootprints;
    const identity = tile.getObjectByName('city-tile-local-identity');
    const district = tile.getObjectByName('city-architectural-districts');
    const roofs = district.getObjectByName('city-district-towers-and-infrastructure');
    const lights = district.getObjectByName('city-district-wayfinding-lights');
    const ledges = district.getObjectByName('city-district-crowns-and-gantries');
    const premium = district.getObjectByName('city-district-premium-windows');
    const original = identity.userData.originalCounts;

    assert.ok(identity.userData.crowns >= 15, 'keep supported roof variation in Medium');
    assert.ok(identity.userData.facadeDetails >= 30, 'real facade details remain in Medium');
    assert.equal(roofs.count, original.bodies + identity.userData.crowns);
    assert.equal(lights.count, original.lights + identity.userData.facadeIndices.length * 2);
    assert.equal(ledges.count, original.ledges + identity.userData.facadeIndices.length);
    assert.equal(premium.count, original.highLights + identity.userData.crowns);
    for (const { building: anchorIndex, index } of identity.userData.crownIndices) {
      assert.ok(index >= original.bodies, 'existing district tower geometry is retained');
      const e = matrixAt(roofs, index).elements;
      const building = anchors[anchorIndex];
      assert.ok(
        Math.abs(building.x - e[12]) < 0.001 && Math.abs(building.z - e[14]) < 0.001,
        'roof crown belongs to its real building',
      );
      assert.ok(
        Math.abs(e[13] - Math.abs(e[5]) / 2 - (building.h - 3)) < 0.001,
        'roof crown starts exactly on existing roof',
      );
      assert.ok(Math.abs(e[0]) <= building.w, 'roof detail stays inside real parcel');
    }
  }
  const nearBody = near.getObjectByName('city-base-building-bodies');
  const farBody = far.getObjectByName('city-base-building-bodies');
  assert.ok(nearBody.instanceColor && farBody.instanceColor);
  assert.notStrictEqual(nearBody.instanceColor, farBody.instanceColor);
  const a = new T.Color();
  const b = new T.Color();
  nearBody.getColorAt(0, a);
  farBody.getColorAt(0, b);
  assert.notEqual(a.getHex(), b.getHex(), 'separate palettes distinguish both city stretches');
  world.setGraphicsQuality('high');
  assert.equal(nearIdentity.userData.quality, 'high');
  assert.equal(farIdentity.userData.quality, 'high');
  assert.equal(near.getObjectByName('city-district-high-details').visible, true);
  assert.equal(far.getObjectByName('city-district-high-details').visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(nearIdentity.userData.quality, 'medium');
  assert.equal(farIdentity.userData.quality, 'medium');
  assert.equal(near.getObjectByName('city-district-high-details').visible, false);
  assert.equal(far.getObjectByName('city-district-high-details').visible, false);
});

test('QA109 continuity: horizon stays behind tiles instead of sliding through buildings', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.51, true);
  world.setSector(SECTORS[0]);
  const horizon = scene.getObjectByName('city-distant-horizon');
  assert.equal(horizon.position.z, -900);
  world.update(1, 1, 160, true);
  const fixed = horizon.position.clone();
  world.update(1, 2, 160, true);
  assert.deepEqual(horizon.position, fixed);
  const near = scene.getObjectByName('launch-city');
  assert.ok(near.position.z > 0, 'real road and buildings move forward while skyline is fixed');
  world.setSector(SECTORS[1]);
  assert.equal(horizon.visible, false);
  assert.equal(horizon.position.z, 0, 'other sectors cannot inherit the city skyline offset');
  world.reset();
  assert.equal(horizon.position.z, 0);
});

test('QA109 continuity: holograms never overhang the real host facade when animated', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.54, true);
  world.setSector(SECTORS[0]);
  for (const tile of [
    scene.getObjectByName('launch-city'),
    scene.getObjectByName('launch-city-far'),
  ]) {
    const living = tile.getObjectByName('city32-living-metropolis');
    for (const distance of [0, 40, 500, 1400]) {
      updateCity32Living(living, distance);
      for (const holo of living.getObjectByName('city32-holographic-signs').children) {
        const wall = tile.userData.buildingFootprints.find(
          (b) => b.x === holo.userData.anchor.x && b.z === holo.userData.anchor.z,
        );
        assert.ok(wall);
        assert.ok(
          holo.scale.x <= wall.w * 0.87 + 0.0001,
          'emissive sign pulse cannot stretch beyond the actual building wall',
        );
        assert.ok(holo.scale.x >= wall.w * 0.1, 'sign remains legible at every phase');
      }
    }
  }
});
