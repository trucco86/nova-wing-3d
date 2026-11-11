import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import {
  CITY_BUILDING_OUTER_LIMIT,
  CITY_CROSSING_GUIDEWAY,
  CITY_RETAIL_RESERVATIONS,
  CITY_TRANSIT_RESERVED_EDGE,
  cityBuildingHasClearFootprint,
  cityFootprintsOverlap,
  placeCityBaseBuilding,
  placeCityDistrictTower,
} from '../src/city-spatial-layout.js';

test('QA109: city plots have real rail, station, mall and elevated-crossing exclusions', () => {
  const insideTrack = { x: 105, z: -225, w: 20, depth: 18, h: 80 };
  assert.equal(cityBuildingHasClearFootprint(insideTrack), false);
  const resolved = placeCityBaseBuilding(insideTrack, [], 1);
  assert.ok(resolved.x - resolved.w / 2 >= CITY_TRANSIT_RESERVED_EDGE);
  assert.ok(resolved.x < CITY_BUILDING_OUTER_LIMIT);
  const overMall = { x: 151, z: -420, w: 19, depth: 18, h: 78 };
  const mallResolved = placeCityBaseBuilding(overMall, [], 1);
  assert.ok(CITY_RETAIL_RESERVATIONS.every((mall) => !cityFootprintsOverlap(mallResolved, mall)));
  const overhead = { x: 126, z: -345, w: 18, depth: 18, h: 99 };
  assert.equal(cityBuildingHasClearFootprint(overhead), false);
  const safe = placeCityDistrictTower(overhead, [], 1);
  assert.ok(
    !cityFootprintsOverlap(safe, CITY_CROSSING_GUIDEWAY),
    'high towers must not penetrate the suspended transverse maglev',
  );
});

test('QA109: full game city has 200 unique building parcels clear of rail, malls and district towers', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.53, true);
  try {
    world.setSector(SECTORS[0], 0);
    const city = scene.getObjectByName('launch-city');
    const far = scene.getObjectByName('launch-city-far');
    const base = city.userData.buildingFootprints;
    assert.equal(base.length, 200);
    assert.deepEqual(far.userData.buildingFootprints, base, 'cloned tiles use the exact approved parcels');
    const previouslyPlaced = [];
    for (const parcel of base) {
      assert.ok(cityBuildingHasClearFootprint(parcel, previouslyPlaced), 'no building/track/mall overlap');
      assert.ok(Math.abs(parcel.x) + parcel.w / 2 <= CITY_BUILDING_OUTER_LIMIT);
      previouslyPlaced.push(parcel);
    }
    const towers = city.getObjectByName('city-architectural-districts').userData.towerFootprints;
    assert.equal(towers.length, 24);
    for (const tower of towers) {
      assert.ok(cityBuildingHasClearFootprint(tower, previouslyPlaced), 'districts keep the city free of overlap');
      previouslyPlaced.push(tower);
    }
    assert.ok(
      base.filter((parcel) => parcel.h > 50).length > 90,
      'keep a richly layered skyline rather than deleting the taller buildings',
    );
  } finally {
    world.destroy?.();
  }
});

test('QA109: searchlight mounts and holograms belong to visible building rooftops and facades', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.41, true);
  try {
    world.setSector(SECTORS[0], 0);
    for (const city of [
      scene.getObjectByName('launch-city'),
      scene.getObjectByName('launch-city-far'),
    ]) {
      const buildings = city.userData.buildingFootprints;
      const living = city.getObjectByName('city32-living-metropolis');
      for (let i = 0; i < 6; i++) {
        const searchlight = living.getObjectByName('city32-searchlight-' + i);
        assert.ok(searchlight, 'roof searchlight ' + i + ' is retained');
        const roof = buildings.find(
          (b) => b.x === searchlight.position.x && b.z === searchlight.position.z,
        );
        assert.ok(roof, 'searchlight must sit above an actual building');
        assert.ok(Math.abs(searchlight.position.y - (roof.h - 7 + 1.05)) < 1e-5);
        const mount = searchlight.getObjectByName('city32-searchlight-mount');
        assert.ok(Math.abs(searchlight.position.y - mount.scale.y / 2 - (roof.h - 7)) < 1e-5);
      }
      for (let i = 0; i < 5; i++) {
        const sign = living.getObjectByName('city32-hologram-' + i);
        assert.ok(sign, 'sign is present in both tiles');
        const building = buildings.find(
          (b) => b.x === sign.position.x && Math.abs(b.z + b.depth / 2 + 1.8 - sign.position.z) < 1e-5,
        );
        assert.ok(building, 'hologram is physically anchored to its facade');
        assert.ok(sign.position.y > -7 && sign.position.y < building.h - 7);
      }
    }
  } finally {
    world.destroy?.();
  }
});

test('QA109: redundant elevated bus infrastructure rests on physical road-height piers', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.37, true);
  try {
    const city = scene.getObjectByName('launch-city');
    const busway = city.getObjectByName('city33-midstage-transit');
    const piers = busway.getObjectByName('city33-busway-grounded-piers');
    const braces = busway.getObjectByName('city33-busway-cantilever-braces');
    assert.ok(piers.isInstancedMesh && piers.count >= 14);
    assert.equal(piers.count, braces.count);
    const matrix = new T.Matrix4();
    for (let i = 0; i < piers.count; i++) {
      piers.getMatrixAt(i, matrix);
      const e = matrix.elements;
      assert.ok(Math.abs(e[13] - Math.abs(e[5]) / 2 + 7) < 1e-5);
      assert.ok(Math.abs(e[12]) > 72, 'supports stay outside the pilot flight corridor');
    }
  } finally {
    world.destroy?.();
  }
});
