import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createDevastadorGrandHall,
  updateDevastadorGrandHall,
  DEVASTADOR_GRAND_HALL,
} from '../src/devastador-grand-hall.js';
import { createDevastadorSabotageCore } from '../src/devastador-sabotage.js';
import { disposeBoss } from '../src/bosses.js';
import { harness } from './harness.mjs';

test('reactor hall is truly monumental, with wall clearance outside the entire 360-degree flight path', () => {
  const model = createDevastadorSabotageCore();
  const hall = model.userData.grandHall;
  assert.equal(hall.name, 'devastador-colossal-reactor-hall');
  assert.ok(DEVASTADOR_GRAND_HALL.radius >= 230);
  assert.ok(DEVASTADOR_GRAND_HALL.safeOrbitRadius >= 175);
  assert.ok(DEVASTADOR_GRAND_HALL.radius - DEVASTADOR_GRAND_HALL.safeOrbitRadius >= 45);
  assert.equal(hall.userData.radius, DEVASTADOR_GRAND_HALL.radius);
  assert.equal(hall.userData.facilities.length, 4);
  assert.ok(hall.userData.walls >= 16);
  assert.ok(hall.getObjectByName('devastador-grand-hall-vaulted-ceiling'));
  assert.ok(hall.getObjectByName('devastador-grand-hall-deep-service-floor'));
  assert.ok(hall.getObjectByName('hall-open-hangar-throat-gantry'));
  for (const group of hall.userData.facilities) {
    const radial = Math.hypot(group.position.x, group.position.z);
    assert.ok(radial >= 220, 'entire facility must hug outer chamber ring');
    assert.equal(group.userData.visualOnly, true);
    assert.ok(group.children.length >= 7);
  }
  assert.ok(hall.userData.visualMeshes.every((mesh) => mesh.userData.visualOnly));
  assert.ok(hall.getObjectByName('hall-structural-fasteners-instanced').isInstancedMesh);
  assert.ok(hall.getObjectByName('hall-perimeter-energy-traces-instanced').isInstancedMesh);
  disposeBoss(model);
});

test('four industrial districts are visibly and mechanically distinct, not repeated generic tunnels', () => {
  const hall = createDevastadorGrandHall();
  for (const name of [
    'hall-capacitor-megacoil-0',
    'hall-cryogenic-heat-exchanger',
    'hall-colossal-engine-housing',
    'hall-bridge-hologram-table',
    'hall-engine-turbine-rotor',
  ])
    assert.ok(hall.getObjectByName(name), name);
  const meshes = [];
  hall.traverse((node) => {
    if (node.isMesh) meshes.push(node);
  });
  assert.ok(meshes.length > 100, 'high-detail room should contain real machinery');
  const engines = hall.userData.rotors;
  assert.equal(engines.length, 2);
  updateDevastadorGrandHall(hall, { orbit: Math.PI, time: 3, driveSpeed: 1 });
  const turning = engines[0].rotation.z;
  assert.notEqual(turning, 0);
  assert.equal(hall.rotation.y, Math.PI, 'hall compensates reactor rotation');
  updateDevastadorGrandHall(hall, { orbit: Math.PI / 2, time: 10, driveSpeed: 0, blackout: 1 });
  assert.equal(engines[0].rotation.z, 0, 'engines stop after sabotage');
  assert.equal(hall.rotation.y, Math.PI / 2);
  assert.ok(hall.userData.materials.every((m) => m instanceof T.Material));
  // All geometry and materials belong to the same boss cleanup path.
  const owner = new T.Group();
  owner.add(hall);
  owner.userData.materials = hall.userData.materials;
  disposeBoss(owner);
});

test('stage 4 developer encounter replaces tight corridors with the new hall without touching production saves', (t) => {
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.advance(2, 0.1);
  const snap = h.game.snapshot();
  assert.equal(snap.sector, 4);
  assert.equal(snap.developerSession, true);
  assert.equal(snap.sabotage.hall.radius, 240);
  assert.equal(snap.sabotage.hall.clearOrbitRadius, 190);
  assert.equal(snap.sabotage.hall.facilities, 4);
  assert.equal(snap.sabotage.hall.centralReactor, true);
  assert.equal(snap.sabotage.hall.active, true);
  assert.equal(
    snap.sabotage.hall.corridorsHidden,
    true,
    'old narrow walls cannot overlap 360 flight',
  );
  // Runtime snapshot comes from the real world state; renderers may
  // expose a later postprocessing scene instead of the gameplay scene.
  h.game.orbit(1);
  h.advance(1.2, 0.1);
  assert.ok(h.game.snapshot().bossTargets.some((part) => part.open));
  assert.equal(snap.sabotage.system, 'power');
});
