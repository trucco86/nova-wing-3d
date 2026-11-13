import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCity122StreetInfill,
  planCity122SidewalkParcels,
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

test('QA122: visible street fronts, sidewalks, service kiosks and amber signs are GPU-instanced with no ghost hitboxes', () => {
  const anchors = Array.from({ length: 60 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (145 + (i % 7) * 24),
    z: -25 - i * 29,
    w: 17,
    depth: 15,
    h: 35 + i % 5 * 14,
  }));
  const root = createCity122StreetInfill(anchors);
  assert.equal(root.name, 'city122-lived-in-street-blocks');
  assert.equal(root.userData.visualOnly, true);
  const names = [
    'city122-grounded-pedestrian-pavements',
    'city122-service-entries-and-transit-shelters',
    'city122-real-ground-floor-storefront-glazing',
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
    const x = matrix.elements[12], y = matrix.elements[13], z = matrix.elements[14];
    assert.ok(Math.abs(x) >= 95, 'sidewalk outside protected flight space');
    assert.ok(Math.abs(y + 6.72) < 0.0001, 'supported at y=-7 road floor');
    positions.push([x, y, z]);
  }
  assert.ok(new Set(positions.map((p) => p[2])).size > 20, 'actually fills street depth');
  setCity122Quality(root, 'medium');
  assert.equal(root.getObjectByName('city122-extra-street-furniture-high').visible, false);
  setCity122Quality(root, 'high');
  assert.equal(root.getObjectByName('city122-extra-street-furniture-high').visible, true);
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
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearStreet = near.getObjectByName('city122-lived-in-street-blocks');
  const farStreet = far.getObjectByName('city122-lived-in-street-blocks');
  assert.ok(nearStreet && farStreet && nearStreet !== farStreet);
  assert.ok(nearStreet.visible && farStreet.visible);
  world.setGraphicsQuality('medium');
  assert.equal(nearStreet.getObjectByName('city122-extra-street-furniture-high').visible, false);
  world.setGraphicsQuality('high');
  assert.equal(nearStreet.getObjectByName('city122-extra-street-furniture-high').visible, true);
  world.setLaunchAscent(0.25, true);
  assert.equal(moon.visible, false, 'cracked city moon retires before realistic orbit');
  world.setSector(SECTORS[1], 1);
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
  scene.traverse((node) => { if (node.isDirectionalLight) directional.push(node); });
  const closeTo = (color, hex) => {
    const expected = new T.Color(hex);
    return Math.abs(color.r - expected.r) +
      Math.abs(color.g - expected.g) +
      Math.abs(color.b - expected.b) < 0.01;
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
  assert.notEqual(scene.fog.color.getHexString(), urbanColor, 'Mars keeps its unique scene palette');
});
