import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import { CITY_AD_CREATIVES, cityVolumesOverlap, planCityAdSlots } from '../src/city-ad-slots.js';

const volume = (b) => ({
  x: b.x,
  y: b.h / 2 - 7,
  z: b.z,
  w: b.w,
  h: b.h,
  depth: b.depth,
});

test('QA110: 3D overlap rejects penetrations at any axis and accepts clearance in height', () => {
  const box = { x: 140, y: 28, z: -110, w: 12, h: 20, depth: 3 };
  assert.equal(cityVolumesOverlap(box, { ...box, x: 151 }), true);
  assert.equal(cityVolumesOverlap(box, { ...box, x: 158 }), false);
  assert.equal(cityVolumesOverlap(box, { ...box, y: 49 }), false);
  assert.equal(cityVolumesOverlap(box, { ...box, z: -114 }), false);
});

test('QA110: grounded inventory uses stable IDs, real supports and 3D spatial exclusions', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.43, true);
  world.setSector(SECTORS[0]);
  const allIds = new Set();
  for (const name of ['launch-city', 'launch-city-far']) {
    const tile = scene.getObjectByName(name);
    const inventory = tile.getObjectByName('city-premium-ad-inventory');
    assert.ok(inventory?.isGroup, 'tile must expose a visible ad inventory');
    assert.ok(inventory.userData.total >= 7, 'meaningful media density spread throughout stage');
    assert.ok(inventory.userData.total <= 12, 'avoid illegible ad clutter');
    const counts = inventory.userData.counts;
    assert.ok(counts.facade >= 2 && counts.rear >= 1 && counts.banner >= 2 && counts.roof >= 1);
    const slots = inventory.userData.slots;
    assert.equal(slots.length, inventory.userData.total);
    const buildings = tile.userData.buildingFootprints;
    const district = tile.getObjectByName('city-architectural-districts');
    const structures = [
      ...buildings,
      ...district.userData.towerFootprints,
      ...district.userData.platformFootprints,
    ];
    for (const slot of slots) {
      assert.ok(!allIds.has(slot.id), 'slot ID is globally stable and never reused between tiles');
      allIds.add(slot.id);
      assert.ok(CITY_AD_CREATIVES.some((creative) => creative.id === slot.creative));
      const host = buildings[slot.hostIndex];
      assert.equal(slot.x, host.x, 'screen must belong to an actual building');
      assert.ok(Math.abs(slot.x) - slot.width / 2 > 118, 'no panel enters maglev or pilot lane');
      assert.ok(slot.width < host.w && slot.height > 1);
      if (slot.surface === 'front-facade' || slot.surface === 'rear-facade') {
        const expectedZ =
          host.z +
          (slot.surface === 'rear-facade' ? -host.depth / 2 - 2.05 : host.depth / 2 + 2.05);
        assert.ok(Math.abs(slot.z - expectedZ) < 0.0001);
        assert.ok(slot.y > -7 && slot.y < host.h - 7);
      } else {
        assert.equal(slot.surface, 'roof-cap');
        assert.ok(slot.y - slot.height / 2 >= host.h - 3 + 3.9);
      }
      const panel = {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        w: slot.width,
        h: slot.height,
        depth: 0.36,
      };
      assert.ok(
        structures.every(
          (solid) => solid === host || !cityVolumesOverlap(panel, volume(solid), 0.72),
        ),
        'new ad cannot interpenetrate an unrelated building or support',
      );
      assert.ok(
        slots.every(
          (other) =>
            other === slot ||
            !cityVolumesOverlap(
              panel,
              {
                x: other.x,
                y: other.y,
                z: other.z,
                w: other.width,
                h: other.height,
                depth: 0.36,
              },
              1.2,
            ),
        ),
        'new ads cannot intersect one another',
      );
    }
    assert.ok(
      inventory.getObjectByName('city-ad-grounded-metal-frames-and-mounts')?.isInstancedMesh,
    );
    const artwork = inventory.getObjectByName('city-ad-atlas-generic-artwork');
    assert.ok(artwork?.isInstancedMesh, 'three generic creatives share one WebGL artwork batch');
    assert.equal(artwork.count, slots.length);
    assert.equal(artwork.geometry.getAttribute('adCreativeIndex').count, slots.length);
    for (const child of inventory.children) {
      assert.equal(child.userData.visualOnly, true, 'outdoor decor is not a phantom collider');
      assert.equal(child.userData.solid, undefined);
      assert.equal(child.userData.hitbox, undefined);
    }
    const original = planCityAdSlots(buildings, {
      variant: inventory.userData.variant,
      districtBuildings: district.userData.towerFootprints,
    });
    assert.ok(original.length >= slots.length, 'legacy signs reserve potential new hosts');
  }
});

test('QA110: urban materials are glossy but controlled, with medium/high unchanged', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.43, true);
  world.setSector(SECTORS[0]);
  const tile = scene.getObjectByName('launch-city');
  const body = tile.getObjectByName('city-base-building-bodies');
  const roof = tile.getObjectByName('city-base-building-roofs');
  const glazing = tile.getObjectByName('city34-tempered-glass-panes');
  assert.ok(body.material.metalness >= 0.76 && body.material.roughness <= 0.25);
  assert.ok(roof.material.metalness >= 0.78 && roof.material.roughness <= 0.23);
  assert.ok(glazing.material.roughness <= 0.18);
  for (const quality of ['medium', 'high']) {
    world.setGraphicsQuality(quality);
    for (const name of ['launch-city', 'launch-city-far']) {
      const city = scene.getObjectByName(name);
      assert.equal(city.getObjectByName('city-premium-ad-inventory').visible, true);
    }
  }
});
