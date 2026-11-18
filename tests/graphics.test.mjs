import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter, bossModel, createWorld } from '../src/visuals.js';
test('ship and boss meshes contain finite coordinates and valid indices', () => {
  for (const model of [fighter(), fighter(true), bossModel()]) {
    let vertices = 0;
    model.traverse((o) => {
      const p = o.geometry?.attributes.position;
      if (!p) return;
      vertices += p.count;
      for (const value of p.array) assert.ok(Number.isFinite(value));
      for (const i of o.geometry.index?.array ?? []) assert.ok(i >= 0 && i < p.count);
    });
    assert.ok(vertices > 100);
  }
});
test('fighters reuse geometry but have independent transforms', () => {
  const a = fighter(),
    b = fighter();
  assert.notEqual(a, b);
  assert.equal(a.children[0].geometry, b.children[0].geometry);
  a.position.x = 9;
  assert.equal(b.position.x, 0);
  assert.equal(a.userData.flames.length, 2);
});
test('city remains present after one full scenery wrap and reset', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5);
  world.update(40, 40, 48, true);
  let count = 0;
  scene.traverse((o) => {
    if (o.isInstancedMesh) count++;
    assert.ok(Number.isFinite(o.position.z));
  });
  // QA122 adds seven street batches and one optional High-only shared vent-fog batch per tile.
  // Verify the new functionality is present, then account for exactly those
  // sixteen measured batches without changing the historical non-city GPU budget.
  const streets = ['launch-city', 'launch-city-far'].map((name) =>
    scene.getObjectByName(name).getObjectByName('city122-lived-in-street-blocks'),
  );
  const streetDraws = streets.reduce(
    (total, root) =>
      total +
      root.children.reduce(
        (n, tier) => n + tier.children.filter((o) => o.isInstancedMesh).length,
        0,
      ),
    0,
  );
  assert.equal(
    streetDraws,
    16,
    'seven grounded batches plus one shared high-only vapor batch per tile',
  );
  const impactRoot = scene.getObjectByName('city-scripted-destruction');
  const impactBatches = Object.values(impactRoot.userData.impacts).reduce(
    (total, impact) => total + impact.children.filter((node) => node.isInstancedMesh).length,
    0,
  );
  assert.equal(impactBatches, 3, 'one pooled shard GPU batch for each authored impact');
  // QA141 replaces dozens of individual monument Mesh draws with six
  // InstancedMesh batches and adds two baseline window batches to the deep
  // skyline. Account for exactly those eight instances rather than masking
  // a future unbounded increase with an arbitrary upper limit.
  const citadel = scene.getObjectByName('city-horizon-megastructure');
  const citadelDraws = [];
  citadel.traverse((node) => {
    if (node.isInstancedMesh) citadelDraws.push(node);
  });
  assert.equal(citadelDraws.length, 6, 'four medium + two precision monument batches');
  const deep = scene.getObjectByName('city34-concept-skyline');
  const mediumWindows = [
    deep.getObjectByName('city34-facade-baseline-amber'),
    deep.getObjectByName('city34-facade-baseline-cool'),
  ];
  assert.ok(mediumWindows.every((node) => node?.isInstancedMesh && node.count === 42));
  const qa141Draws = citadelDraws.length + mediumWindows.length;
  assert.equal(qa141Draws, 8);
  // QA145 replaces 49 individually drawn shuttles with exactly three
  // instanced material layers per tile. The instance tally increases by six
  // even while the real draw budget falls by 92 potential meshes.
  const evacuationDraws = ['launch-city', 'launch-city-far'].reduce((sum, name) => {
    const fleet = scene.getObjectByName(name).getObjectByName('city-evacuation-instanced-fleet');
    assert.ok(fleet?.isGroup);
    assert.equal(fleet.children.length, 3);
    return sum + fleet.children.filter((mesh) => mesh.isInstancedMesh).length;
  }, 0);
  assert.equal(evacuationDraws, 6);
  // QA146 also replaces 42 individual static meshes per tile with five
  // material-accurate instance batches. Count exactly ten *additional*
  // instanced draws across both city tiles, not an open-ended range.
  const qa146Batches = ['launch-city', 'launch-city-far'].reduce((total, name) => {
    const tile = scene.getObjectByName(name);
    const district = tile.getObjectByName('city-architectural-districts');
    const adverts = tile.getObjectByName('city-premium-infrastructure');
    const stations = ['frame', 'cap', 'lowLight'].map((key) =>
      district.getObjectByName('city-maglev-station-batched-' + key),
    );
    const signs = ['frame', 'trim'].map((key) =>
      adverts.getObjectByName('city-commercial-billboard-batched-' + key),
    );
    assert.ok([...stations, ...signs].every((mesh) => mesh?.isInstancedMesh));
    return total + stations.length + signs.length;
  }, 0);
  assert.equal(qa146Batches, 10);
  // QA158 replaces six individual searchlight roof mounts per city tile with
  // one static instance batch. Count the two new InstancedMesh objects while
  // preserving the full six authored mounts and their animated beam pivots.
  const qa158Batches = ['launch-city', 'launch-city-far'].reduce((total, name) => {
    const city32 = scene.getObjectByName(name).getObjectByName('city32-living-metropolis');
    const mounts = city32.getObjectByName('city32-searchlight-roof-mounts');
    assert.ok(mounts?.isInstancedMesh);
    assert.equal(mounts.userData.highCount, 6);
    return total + 1;
  }, 0);
  assert.equal(qa158Batches, 2);
  assert.ok(
    count >=
      180 +
        streetDraws +
        impactBatches +
        qa141Draws +
        evacuationDraws +
        qa146Batches +
        qa158Batches &&
      count <=
        260 +
          streetDraws +
          impactBatches +
          qa141Draws +
          evacuationDraws +
          qa146Batches +
          qa158Batches,
    'historical instance budget with QA146 and QA158 exact new batches',
  );
  const closeCity = scene.getObjectByName('launch-city');
  const farCity = scene.getObjectByName('launch-city-far');
  const closeDetail = closeCity.getObjectByName('city-high-details');
  const farDetail = farCity.getObjectByName('city-high-details');
  assert.equal(closeDetail.visible, false, 'medium avoids premium geometry');
  world.setGraphicsQuality('high');
  assert.equal(closeDetail.visible, true);
  assert.equal(farDetail.visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(closeDetail.visible, false);
  assert.equal(farDetail.visible, false);
  world.reset();
  world.update(0.1, 0.1, 48, true);
});

test('NOVA-7 has a sealed, symmetric forward fuselage in gameplay and hangar', () => {
  const ship = fighter();
  const fuselage = ship.getObjectByName('ship-fuselage');
  assert.ok(fuselage, 'player fighter and showroom share the front fuselage');
  assert.equal(fuselage.geometry.type, 'LatheGeometry');
  const profile = fuselage.geometry.parameters.points;
  assert.ok(profile.length >= 8);
  assert.equal(profile.at(-1).x, 0, 'nose finishes at the exact central axis');
  assert.ok(profile.every((point, i) => i === 0 || point.y > profile[i - 1].y));
  assert.ok(profile.every((point, i) => i === 0 || point.x <= profile[i - 1].x));
  assert.ok(Math.abs(fuselage.rotation.x + Math.PI / 2) < 0.001);
  assert.equal(
    ship.children.some((o) => o.geometry?.type === 'ConeGeometry' && o.position.z < -3),
    false,
  );
});

test('NOVA-7 fuselage has one forward contour, shared by gameplay and hangar', () => {
  const ship = fighter();
  const hull = ship.getObjectByName('ship-fuselage');
  assert.ok(hull?.isMesh, 'single fuselage mesh is present');
  assert.equal(hull.geometry.type, 'LatheGeometry');
  assert.equal(
    ship.children.filter(
      (child) => child.geometry?.type === 'ConeGeometry' && child.position.z < -2,
    ).length,
    0,
    'no separate mismatched four-sided nose remains',
  );
  const bounds = new T.Box3().setFromObject(hull);
  assert.ok(bounds.min.z < -4.5, 'nose extends smoothly in flight direction');
  assert.ok(bounds.max.z > 1.8, 'fuselage joins rear body');
  assert.ok(bounds.min.x < -0.7 && bounds.max.x > 0.7);
});
