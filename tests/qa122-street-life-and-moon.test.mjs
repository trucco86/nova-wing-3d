import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCity122StreetInfill,
  animateCity122StreetLife,
  planCity122SidewalkParcels,
  planCity122OuterParcels,
  planCity122GroundCells,
  setCity122Quality,
} from '../src/city-122-street-infill.js';
import { CITY_RETAIL_RESERVATIONS, cityFootprintsOverlap } from '../src/city-spatial-layout.js';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';

test('QA122: street lots occupy the genuine sidewalk band, never buildings, retail podiums or flight lane', () => {
  const existing = [
    { x: 145, z: -220, w: 35, depth: 36, h: 65 },
    { x: -130, z: -720, w: 30, depth: 44, h: 60 },
  ];
  const lots = planCity122SidewalkParcels(existing);
  assert.ok(lots.length > 55, 'street infill must reach a substantial fraction of 1.9 km');
  assert.equal(lots.filter((x) => x.side === -1).length > 20, true);
  assert.equal(lots.filter((x) => x.side === 1).length > 20, true);
  const seen = new Set();
  for (const lot of lots) {
    assert.ok(Math.abs(lot.x) - lot.w / 2 >= 95, 'no prop crosses the approved flight lane');
    assert.ok(lot.z >= -1900 && lot.z < 0, 'all lots belong to one road tile');
    assert.ok(!existing.some((b) => cityFootprintsOverlap(lot, b, 1)));
    assert.ok(!CITY_RETAIL_RESERVATIONS.some((b) => cityFootprintsOverlap(lot, b, 1)));
    const key = lot.side + ':' + lot.sector;
    assert.ok(!seen.has(key), 'unique parcel slots');
    seen.add(key);
  }
  assert.deepEqual(planCity122SidewalkParcels(existing), lots, 'repeatable layout');
});

test('QA122: outer blocks fill both far corridors without intruding on buildings, shops or district infrastructure', () => {
  const buildings = [
    { x: 146, z: -29, w: 27, depth: 34, h: 85 },
    { x: -224, z: -195, w: 35, depth: 24, h: 72 },
  ];
  const district = [{ x: 268, z: -150, w: 40, depth: 49, h: 40 }];
  const lots = planCity122OuterParcels(buildings, district);
  assert.ok(lots.length > 65, 'outer empty blocks must be occupied across the city');
  assert.ok(lots.some((lot) => lot.band === 0));
  assert.ok(lots.some((lot) => lot.band === 1));
  assert.ok(lots.filter((lot) => lot.side === -1).length > 25);
  assert.ok(lots.filter((lot) => lot.side === 1).length > 25);
  assert.ok(
    lots.some((lot) => lot.z < -1700),
    'the end of the 1.9 km route cannot be empty',
  );
  const types = new Set(lots.map((lot) => lot.kind));
  assert.deepEqual(types, new Set(['parking', 'garden', 'delivery', 'plaza', 'service', 'access']));
  const reserved = [...buildings, ...district, ...CITY_RETAIL_RESERVATIONS];
  for (const [index, lot] of lots.entries()) {
    assert.ok(Math.abs(lot.x) - lot.w / 2 >= 125, 'reserve train and flight space');
    assert.ok(lot.z - lot.depth / 2 > -1900 && lot.z + lot.depth / 2 < 0);
    assert.ok(
      reserved.every((b) => !cityFootprintsOverlap(lot, b, 5)),
      'real parcel exclusion',
    );
    assert.ok(
      lots.every((other, i) => index === i || !cityFootprintsOverlap(lot, other, 2)),
      'courtyards and roads never overlap each other',
    );
  }
  assert.deepEqual(planCity122OuterParcels(buildings, district), lots, 'layout is deterministic');
});

test('QA122: empty ground between towers gains safe patterned parcels on both sides', () => {
  const towers = [
    { x: 173, z: -250, w: 29, depth: 33 },
    { x: -343, z: -900, w: 37, depth: 42 },
  ];
  const district = [{ x: 240, z: -1600, w: 47, depth: 49 }];
  const courtyards = planCity122OuterParcels(towers, district);
  const cells = planCity122GroundCells(towers, district, courtyards);
  assert.ok(cells.length > 170, 'most empty ground requires a designed surface');
  assert.ok(cells.filter((c) => c.side < 0).length > 60);
  assert.ok(cells.filter((c) => c.side > 0).length > 60);
  assert.ok(cells.some((c) => c.z < -1800), 'the far end of the road has usable ground');
  assert.deepEqual(new Set(cells.map((c) => c.type)), new Set([0, 1, 2, 3, 4]));
  const reserved = [...towers, ...district, ...CITY_RETAIL_RESERVATIONS, ...courtyards];
  for (const c of cells) {
    assert.ok(Math.abs(c.x) - c.w / 2 >= 125, 'flight and transit safety bands stay empty');
    assert.ok(c.z - c.depth / 2 > -1900 && c.z + c.depth / 2 < 0);
    assert.ok(reserved.every((b) => !cityFootprintsOverlap(c, b, 2)), 'floor does not cover occupied structures');
  }
  assert.deepEqual(planCity122GroundCells(towers, district, courtyards), cells);
});

test('QA122: visible street fronts, sidewalks, service kiosks and amber signs are GPU-instanced with no ghost hitboxes', () => {
  const anchors = Array.from({ length: 60 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (145 + (i % 7) * 24),
    z: -25 - i * 29,
    w: 17,
    depth: 15,
    h: 35 + (i % 5) * 14,
  }));
  const root = createCity122StreetInfill(anchors);
  assert.equal(root.name, 'city122-lived-in-street-blocks');
  assert.equal(root.userData.visualOnly, true);
  const names = [
    'city122-grounded-pedestrian-pavements',
    'city122-service-entries-and-transit-shelters',
    'city122-real-ground-floor-storefront-glazing',
    'city122-grounded-street-tree-canopies',
    'city122-subtle-amber-street-wayfinding',
    'city122-service-bench-and-planter-furniture',
    'city122-loading-bay-small-furniture',
  ];
  for (const name of names) {
    const mesh = root.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.ok(mesh.count > 0, name);
    assert.equal(mesh.userData.visualOnly, true);
    assert.equal(mesh.castShadow, false);
    assert.equal(mesh.receiveShadow, false);
    assert.equal(mesh.userData.hitbox, undefined);
    assert.equal(mesh.userData.collider, undefined);
    assert.ok(mesh.material.isMeshStandardMaterial, 'real PBR material without a neon wash');
  }
  const blocks = root.getObjectByName('city122-grounded-pedestrian-pavements');
  const positions = [];
  const matrix = new T.Matrix4();
  for (let i = 0; i < blocks.count; i++) {
    blocks.getMatrixAt(i, matrix);
    const x = matrix.elements[12],
      y = matrix.elements[13],
      z = matrix.elements[14];
    assert.ok(Math.abs(x) >= 95, 'sidewalk outside protected flight space');
    const slabHeight = matrix.elements[5];
    const slabDepth = matrix.elements[10];
    if (Math.abs(slabDepth - 28) < 0.001 || Math.abs(slabDepth - 30) < 0.001) {
      assert.ok(Math.abs(y - slabHeight / 2 + 7) < 0.0001, 'secondary asphalt rests on y=-7');
    } else {
      assert.ok(Math.abs(y + 6.72) < 0.0001, 'existing sidewalk keeps its placement');
    }
    positions.push([x, y, z]);
  }
  assert.ok(new Set(positions.map((p) => p[2])).size > 20, 'actually fills street depth');
  const ground = root.userData.groundCells;
  assert.ok(ground.length > 80, 'large city ground gaps need urban material');
  const vapor = root.getObjectByName('city122-grounded-vent-vapor-high');
  assert.ok(vapor?.isInstancedMesh && vapor.count > 0, 'real vents create shared High vapor');
  assert.equal(vapor.userData.visualOnly, true);
  assert.equal(vapor.material.transparent, true);
  assert.equal(vapor.material.depthWrite, false);
  const firstPlume = new T.Matrix4();
  const lastPlume = new T.Matrix4();
  vapor.getMatrixAt(0, firstPlume);
  const outer = root.userData.outerParcels;
  assert.ok(outer.length > 60, 'outer districts should be populated without extra draw batches');
  assert.ok(outer.some((lot) => lot.kind === 'delivery'));
  assert.ok(outer.some((lot) => lot.kind === 'garden'));
  const trees = root.getObjectByName('city122-grounded-street-tree-canopies');
  assert.ok(trees.count > 0, 'tree crowns must occupy real sidewalk parcels');
  assert.ok(root.userData.pedestrians.length > 0, 'street needs actual pedestrians');
  const first = root.userData.pedestrians[0];
  const bodies = root.getObjectByName('city122-service-entries-and-transit-shelters');
  const before = new T.Matrix4();
  const after = new T.Matrix4();
  bodies.getMatrixAt(first.body, before);
  animateCity122StreetLife(root, 330);
  bodies.getMatrixAt(first.body, after);
  vapor.getMatrixAt(0, lastPlume);
  assert.notEqual(firstPlume.elements[13], lastPlume.elements[13], 'vapor plume rises only as play advances');
  assert.ok(root.userData.groundSignalIndices.length > 0, 'signals are grounded in existing GPU batches');
  assert.notEqual(before.elements[14], after.elements[14], 'pedestrians must walk on the pavement');
  assert.equal(
    after.elements[12],
    before.elements[12],
    'walking must stay in protected sidewalk lane',
  );
  animateCity122StreetLife(root, 330);
  const still = new T.Matrix4();
  bodies.getMatrixAt(first.body, still);
  assert.deepEqual(still.elements, after.elements, 'repeatable animation for the same clock');
  setCity122Quality(root, 'medium');
  assert.equal(root.getObjectByName('city122-extra-street-furniture-high').visible, false);
  setCity122Quality(root, 'high');
  assert.equal(root.getObjectByName('city122-extra-street-furniture-high').visible, true);
  assert.equal(vapor.visible, true);
  assert.equal(root.getObjectByName('city122-visible-street-life-medium').visible, true);
});

test('QA122: fractured moon actually appears over Stage 1 city, disappears on ascent and never replaces real orbital Moon', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0], 0);
  const moon = scene.getObjectByName('world-orbital-globe');
  const earthMoon = scene.getObjectByName('launch-orbit-moon');
  assert.ok(moon && earthMoon && moon !== earthMoon);
  assert.equal(moon.visible, true, 'cracked moon must not be hidden in opening city');
  assert.equal(moon.material.uniforms.crackIntensity.value, 1);
  assert.ok(moon.material.fragmentShader.includes('branchA'), 'actual branching moon cracks');
  assert.ok(Math.abs(moon.position.x) < 220, 'visible against city skyline on phone');
  assert.ok(moon.position.y > 230);
  assert.ok(moon.position.z < -1900 && moon.position.z > -2400, 'moon belongs to far sky');
  assert.equal(moon.material.uniforms.backgroundDepth.value, 1, 'buildings must render in front');
  assert.ok(
    moon.material.vertexShader.includes('clip.w*.999999'),
    'city lunar depth must be behind even the far skyline, not merely the near buildings',
  );
  assert.ok(
    scene.getObjectByName('world-orbital-globe')?.material.vertexShader.includes('backgroundDepth'),
    'moon shader preserves normal depth for other sectors',
  );
  assert.equal(
    scene.getObjectByName('world-orbital-globe')?.material.fragmentShader.includes('craterRim'),
    true,
    'city moon must include crater relief',
  );
  assert.ok(
    earthMoon.material.fragmentShader.includes('branchA'),
    'later orbit moon must preserve the exact branching fissure pattern',
  );
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearStreet = near.getObjectByName('city122-lived-in-street-blocks');
  const farStreet = far.getObjectByName('city122-lived-in-street-blocks');
  assert.ok(nearStreet && farStreet && nearStreet !== farStreet);
  assert.ok(nearStreet.userData.outerParcels.length > 25, 'real city must gain outer blocks');
  assert.ok(nearStreet.userData.groundCells.length > 50, 'both real road tiles have filled ground');
  assert.deepEqual(nearStreet.userData.groundCells, farStreet.userData.groundCells);
  assert.deepEqual(
    nearStreet.userData.outerParcels,
    farStreet.userData.outerParcels,
    'both tiles clone the same collision-free geometry',
  );
  const originalLots = nearStreet.userData.outerParcels;
  const district = near.getObjectByName('city-architectural-districts');
  const occupied = [
    ...near.userData.buildingFootprints,
    ...district.userData.towerFootprints,
    ...district.userData.platformFootprints,
    ...CITY_RETAIL_RESERVATIONS,
  ];
  assert.ok(
    originalLots.every((lot) =>
      occupied.every((footprint) => !cityFootprintsOverlap(lot, footprint, 5)),
    ),
    'the full world must never place outdoor structures into real towers, mall or launch platform',
  );
  assert.ok(nearStreet.visible && farStreet.visible);
  world.setGraphicsQuality('medium');
  assert.equal(nearStreet.getObjectByName('city122-extra-street-furniture-high').visible, false);
  world.setGraphicsQuality('high');
  assert.equal(nearStreet.getObjectByName('city122-extra-street-furniture-high').visible, true);
  world.setLaunchAscent(0.25, true);
  assert.equal(moon.visible, false, 'cracked city moon retires before realistic orbit');
  world.setSector(SECTORS[1], 1);
  assert.equal(moon.material.uniforms.backgroundDepth.value, 0, 'other sector depths unchanged');
  assert.equal(nearStreet.visible, false, 'other planets cannot inherit street props');
  assert.equal(farStreet.visible, false);
  world.setSector(SECTORS[0], 0);
  assert.equal(moon.visible, true, 'city stage restart restores moon without stale state');
  assert.equal(nearStreet.visible, true);
});

test('QA122: urban environmental lighting is neutral and warm while other planets keep their authored grade', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0], 0);
  // DynamicFlight nests lights under the orbitalFrame, so inspect the
  // rendered scene graph rather than only the scene's direct children.
  const directional = [];
  scene.traverse((node) => {
    if (node.isDirectionalLight) directional.push(node);
  });
  const closeTo = (color, hex) => {
    const expected = new T.Color(hex);
    return (
      Math.abs(color.r - expected.r) +
        Math.abs(color.g - expected.g) +
        Math.abs(color.b - expected.b) <
      0.01
    );
  };
  assert.ok(
    directional.some((l) => closeTo(l.color, '#b4a99b')),
    'missing warm fill: ' + directional.map((l) => l.color.getHexString()).join(', '),
  );
  assert.ok(
    directional.some((l) => closeTo(l.color, '#cdb49a')),
    'missing stone-color rim: ' + directional.map((l) => l.color.getHexString()).join(', '),
  );
  assert.ok(!directional.some((l) => closeTo(l.color, '#ff82dc')));
  const urbanColor = scene.fog.color.getHexString();
  assert.equal(urbanColor, '737c7b');
  world.setSector(SECTORS[1], 1);
  assert.notEqual(
    scene.fog.color.getHexString(),
    urbanColor,
    'Mars keeps its unique scene palette',
  );
});
