import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { fighter, createFlyingRobot } from '../src/visuals.js';
import { createBossModel, createSubboss } from '../src/bosses.js';
import { createGroundEnemy } from '../src/encounters.js';
import { createCityTraffic, setCityTrafficQuality } from '../src/city-traffic.js';

function visualPieces(root, pattern) {
  const matches = [];
  root.traverse((object) => {
    if (object.name?.includes(pattern)) matches.push(object);
  });
  return matches;
}
function noDecorativeColliders(group) {
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    assert.equal(mesh.userData.hitbox, undefined);
    const coordinates = mesh.geometry?.attributes?.position;
    assert.ok(coordinates && coordinates.count > 0);
    for (const value of coordinates.array) assert.ok(Number.isFinite(value));
  });
}

test('NOVA-7 retains its aircraft fuselage and painted surfaces with actual raised 3D detailing', () => {
  const ship = fighter();
  const kit = ship.getObjectByName('nova7-premium-airframe');
  assert.ok(kit?.isGroup);
  assert.equal(visualPieces(kit, 'airframe-swept-fairing').length, 2);
  assert.equal(visualPieces(kit, 'airframe-intake-louver').length, 6);
  assert.equal(visualPieces(kit, 'airframe-engine-turbine-ring').length, 2);
  assert.equal(visualPieces(kit, 'airframe-weapon-pod').length, 2);
  assert.ok(ship.getObjectByName('ship-fuselage')?.geometry.type === 'LatheGeometry');
  assert.ok(ship.userData.flames.length === 2);
  assert.ok(kit.children.some((part) => part.geometry?.type === 'ExtrudeGeometry'));
  assert.ok(ship.userData.paint.length >= 1, 'new panels join existing skin paint pipeline');
  noDecorativeColliders(kit);
  const hostile = fighter(true, 1);
  assert.ok(hostile.getObjectByName('enemy-premium-airframe'));
  assert.ok(hostile.children.some((child) => child.userData.sharedWingProfile !== undefined) === false);
});

test('transforming mecha keeps targeting pivots and has layered chest, actuator and wrist details', () => {
  const mecha = createFlyingRobot();
  const detail = mecha.getObjectByName('mech-premium-mechanics');
  assert.ok(detail?.isGroup);
  assert.equal(visualPieces(detail, 'mech-layered-chest-plate').length, 2);
  assert.equal(visualPieces(detail, 'mech-rear-heatsink-fin').length, 6);
  assert.equal(visualPieces(detail, 'mech-dorsal-nozzle-trim').length, 2);
  assert.ok(mecha.userData.mecha.arms.left.muzzle);
  assert.ok(mecha.userData.mecha.arms.right.muzzle);
  assert.equal(visualPieces(mecha, 'mech-wrist-targeting-rail').length, 2);
  assert.equal(visualPieces(mecha, 'mech-dual-arm-cannon-collar').length, 2);
  assert.ok(mecha.getObjectByName('mech-turbine-rotor'));
  noDecorativeColliders(detail);
});

test('all ten bosses and subbosses have new armoured detailing without replacing weak points', () => {
  for (const [index, sector] of SECTORS.entries()) {
    const boss = createBossModel(sector, index, true);
    const kit = boss.getObjectByName('boss-premium-surface-' + index);
    assert.ok(kit?.isGroup, 'boss hard-surface armor must exist: ' + index);
    assert.equal(visualPieces(kit, 'boss-raised-armor-shield').length, 2);
    assert.equal(visualPieces(kit, 'boss-cooling-gill').length, 6);
    assert.equal(visualPieces(kit, 'boss-side-defense-turret').length, 2);
    assert.ok(Array.isArray(boss.userData.parts) && boss.userData.parts.length > 0);
    assert.ok(boss.getObjectByName('boss-signature-crest')?.geometry.type === 'ExtrudeGeometry');
    noDecorativeColliders(kit);
    const subboss = createSubboss(index);
    assert.ok(subboss.getObjectByName('subboss-premium-armor-' + index));
    assert.equal(visualPieces(subboss, 'subboss-rear-reactor').length, 2);
  }
});

test('ground enemies retain turret articulation and existing collision solids', () => {
  for (const kind of ['tank', 'walker']) {
    for (const variant of [-1, 0, 1, 2]) {
      const g = createGroundEnemy(kind, variant);
      const detail = g.getObjectByName(kind === 'tank' ? 'tank-premium-armor' : 'walker-premium-armor');
      assert.ok(detail);
      assert.ok(g.userData.turret?.isGroup);
      assert.equal(visualPieces(detail, 'ground-enemy-service-grille').length, 6);
      noDecorativeColliders(detail);
    }
  }
});

test('moving city cars, taxis and escaping ships have instanced tapered bodies with bounded draw calls', () => {
  const world = createCityTraffic();
  for (const role of ['road', 'flycar', 'escape']) {
    const group = world.getObjectByName('city-traffic-' + role);
    const prow = group.getObjectByName('city-traffic-' + role + '-prow');
    const glass = group.getObjectByName('city-traffic-' + role + '-glazing');
    assert.ok(prow?.isInstancedMesh && glass?.isInstancedMesh);
    assert.equal(prow.geometry.type, 'BufferGeometry');
    assert.notEqual(prow.geometry, new T.BoxGeometry(1, 1, 1));
    assert.equal(glass.geometry.type, 'BufferGeometry');
    const normal = prow.geometry.attributes.normal;
    assert.ok(normal.count > 0);
  }
  const allDraws = world.children.reduce((sum, role) => sum + role.children.length, 0);
  assert.equal(allDraws, 19, 'only 19 GPU groups despite 25 independently moving vehicles');
  setCityTrafficQuality(world, 'high');
  assert.equal(world.getObjectByName('city-traffic-road-prow').count, 12);
  setCityTrafficQuality(world, 'medium');
  assert.equal(world.getObjectByName('city-traffic-road-prow').count, 8);
});
