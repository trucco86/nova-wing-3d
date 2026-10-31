import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { fighter, createFlyingRobot, scaleFighterVisual } from '../src/visuals.js';
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
  assert.equal(
    visualPieces(kit, 'airframe-swept-fairing').length,
    0,
    'bulky 3.3 fairings reverted',
  );
  assert.equal(visualPieces(kit, 'airframe-weapon-pod').length, 0, 'extra weapon pods removed');
  assert.equal(visualPieces(kit, 'airframe-fuselage-micro-seam').length, 2);
  assert.equal(visualPieces(kit, 'airframe-wing-panel-seam').length, 2);
  assert.equal(visualPieces(kit, 'airframe-low-profile-vent').length, 6);
  assert.equal(visualPieces(kit, 'airframe-engine-precision-ring').length, 4);
  assert.equal(visualPieces(kit, 'airframe-engine-turbine-vane').length, 12);
  assert.equal(visualPieces(kit, 'airframe-engine-inner-core').length, 2);
  assert.ok(ship.getObjectByName('ship-fuselage')?.geometry.type === 'LatheGeometry');
  assert.ok(ship.userData.flames.length === 2);
  assert.ok(kit.children.some((part) => part.geometry?.type === 'TubeGeometry'));
  assert.ok(
    kit.children.every((part) => Math.abs(part.position.x) <= 3.8),
    'new finishing never extends beyond original wings',
  );
  assert.ok(ship.userData.paint.length >= 1, 'new panels join existing skin paint pipeline');
  noDecorativeColliders(kit);
  const hostile = fighter(true, 1);
  assert.ok(hostile.getObjectByName('enemy-premium-airframe'));
  assert.ok(
    hostile.children.some((child) => child.userData.sharedWingProfile !== undefined) === false,
  );
});

test('transforming mecha keeps targeting pivots and has layered chest, actuator and wrist details', () => {
  const mecha = createFlyingRobot();
  const detail = mecha.getObjectByName('mech-premium-mechanics');
  assert.ok(detail?.isGroup);
  assert.equal(visualPieces(detail, 'mech-layered-chest-plate').length, 0);
  assert.equal(visualPieces(detail, 'mech-chest-machined-seam').length, 2);
  assert.equal(visualPieces(detail, 'mech-rear-cooling-slat').length, 6);
  assert.equal(visualPieces(detail, 'mech-dorsal-nozzle-ring').length, 2);
  assert.equal(visualPieces(detail, 'mech-dorsal-ignition-ring').length, 2);
  assert.equal(visualPieces(mecha, 'mech-main-turbine-stator').length, 6);
  assert.ok(mecha.userData.mecha.arms.left.muzzle);
  assert.ok(mecha.userData.mecha.arms.right.muzzle);
  assert.equal(visualPieces(mecha, 'mech-wrist-targeting-trim').length, 2);
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
      const detail = g.getObjectByName(
        kind === 'tank' ? 'tank-premium-armor' : 'walker-premium-armor',
      );
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
  assert.equal(
    allDraws,
    22,
    'only 22 GPU groups including merged mechanical trim on all 25 vehicles',
  );
  setCityTrafficQuality(world, 'high');
  assert.equal(world.getObjectByName('city-traffic-road-prow').count, 12);
  setCityTrafficQuality(world, 'medium');
  assert.equal(world.getObjectByName('city-traffic-road-prow').count, 8);
});

test('hero ship gets exactly 5% visual growth without touching physics-root scale', () => {
  const craft = fighter();
  const hull = craft.getObjectByName('ship-fuselage');
  const initial = new T.Box3().setFromObject(hull);
  scaleFighterVisual(craft, 1.05);
  assert.equal(craft.scale.x, 1, 'gameplay root and collision size remain unchanged');
  assert.equal(craft.userData.visualScale, 1.05);
  const updated = new T.Box3().setFromObject(hull);
  assert.ok(updated.getSize(new T.Vector3()).z > initial.getSize(new T.Vector3()).z * 1.049);
  const before = updated.getSize(new T.Vector3()).z;
  scaleFighterVisual(craft, 1.05);
  assert.equal(
    new T.Box3().setFromObject(hull).getSize(new T.Vector3()).z,
    before,
    'repeated skin application must never compound the size',
  );
  scaleFighterVisual(craft, 1);
  assert.ok(
    Math.abs(
      new T.Box3().setFromObject(hull).getSize(new T.Vector3()).z -
        initial.getSize(new T.Vector3()).z,
    ) < 0.000001,
  );
  assert.equal(fighter(true).scale.x, 1, 'enemy fighter size is unchanged');
});
