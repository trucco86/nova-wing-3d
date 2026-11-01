import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import {
  SABOTAGE_SYSTEMS,
  sabotagedSystem,
  sabotageTargetOpen,
  createDevastadorSabotageCore,
  updateDevastadorSabotageCore,
} from '../src/devastador-sabotage.js';
import { disposeBoss } from '../src/bosses.js';

test('Devastador is an eight-component systems puzzle, not the generic two-eye boss', () => {
  const model = createDevastadorSabotageCore();
  assert.equal(model.userData.sabotage, true);
  assert.equal(model.userData.parts.length, 8);
  assert.deepEqual(
    SABOTAGE_SYSTEMS.map((s) => s.count),
    [4, 2, 2, 1],
  );
  assert.ok(model.getObjectByName('devastador-destroyable-central-reactor'));
  assert.ok(model.getObjectByName('reactor-induction-circuit-2'));
  assert.ok(model.userData.parts.some((part) => part.angle < -2.3));
  assert.ok(model.userData.parts.some((part) => part.angle > 2.3));
  assert.equal(
    model.userData.parts.some((part) => part.type === 'eye'),
    false,
  );
  assert.equal(model.userData.batteries.length, 0);
  disposeBoss(model);
});

test('power circuits unlock coolant then drives; core is sealed until all eight are destroyed', () => {
  const model = createDevastadorSabotageCore();
  const parts = model.userData.parts;
  assert.equal(sabotagedSystem(parts).system, 'power');
  assert.equal(sabotageTargetOpen(parts, 4, parts[4].angle), false);
  assert.equal(sabotageTargetOpen(parts, 0, parts[0].angle), true);
  assert.equal(sabotageTargetOpen(parts, 0, 0), false);
  for (const part of parts.filter((p) => p.type === 'power')) part.hp = 0;
  assert.deepEqual(sabotagedSystem(parts), {
    system: 'coolant',
    label: 'REFRIGERAÇÃO',
    remaining: 2,
  });
  assert.equal(sabotageTargetOpen(parts, 4, parts[4].angle), true);
  assert.equal(sabotageTargetOpen(parts, 6, parts[6].angle), false);
  for (const part of parts.filter((p) => p.type === 'coolant')) part.hp = 0;
  assert.equal(sabotagedSystem(parts).system, 'drive');
  for (const part of parts.filter((p) => p.type === 'drive')) part.hp = 0;
  assert.equal(sabotagedSystem(parts).system, 'core');
  const stage = updateDevastadorSabotageCore(model, { time: 8, orbit: 0 });
  assert.equal(stage.system, 'core');
  assert.equal(model.userData.core.visible, true);
  assert.equal(model.userData.coreMarker.visible, true);
  assert.ok(parts.every((p) => !p.marker.visible));
  disposeBoss(model);
});

test('rotating 360 degrees reveals rear systems, with deterministic and bounded visual geometry', () => {
  const model = createDevastadorSabotageCore();
  const entry = model.userData.parts[0];
  assert.equal(sabotageTargetOpen(model.userData.parts, 0, entry.angle), true);
  assert.equal(sabotageTargetOpen(model.userData.parts, 0, entry.angle + Math.PI), false);
  updateDevastadorSabotageCore(model, { orbit: entry.angle, time: 10 });
  assert.equal(entry.marker.visible, true);
  updateDevastadorSabotageCore(model, { orbit: 0, time: 10 });
  assert.equal(entry.marker.visible, false);
  assert.ok(model.getObjectByName('devastador-reactor-chamber-housing'));
  disposeBoss(model);
});

test('QA stage 4 spawns a real sabotage scene, preserving campaign and sandbox restrictions', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  const snap = h.game.snapshot();
  assert.equal(snap.sector, 4);
  assert.equal(snap.developerSession, true);
  assert.equal(snap.boss, true);
  assert.equal(snap.bossParts, 8);
  assert.equal(snap.sabotage.system, 'power');
  assert.ok(snap.bossTargets.filter((p) => p.open).length >= 1);
  assert.ok(snap.bossTargets.some((p) => Math.abs(p.angle) > 2));
  assert.equal(snap.bossDriveShock.length, 0);
});

test('sabotaged rooms show progressive blackout, electrical arcs and stopped motors', () => {
  const model = createDevastadorSabotageCore();
  const parts = model.userData.parts;
  const initial = updateDevastadorSabotageCore(model, { orbit: parts[0].angle, time: 1 });
  assert.equal(initial.system, 'power');
  assert.deepEqual(model.userData.reactorVisual, {
    powerOnline: 4,
    coolantOnline: 2,
    drivesOnline: 2,
    blackout: 0,
    alarm: false,
    driveSpeed: 1,
  });
  assert.equal(parts[0].shortCircuit.visible, false);
  const healthyRotation = parts[6].fan.rotation.z;
  assert.ok(healthyRotation > 0);
  parts[0].hp = 0;
  updateDevastadorSabotageCore(model, { time: 3, orbit: parts[0].angle });
  assert.equal(model.userData.reactorVisual.blackout, 0.125);
  assert.equal(model.userData.reactorVisual.alarm, true);
  assert.equal(parts[0].mesh.visible, false);
  assert.equal(parts[0].marker.visible, false);
  assert.ok(parts[0].shortCircuit.name.includes('failed'));
  for (const p of parts) p.hp = 0;
  updateDevastadorSabotageCore(model, { time: 12, orbit: 0 });
  assert.equal(model.userData.reactorVisual.powerOnline, 0);
  assert.equal(model.userData.reactorVisual.coolantOnline, 0);
  assert.equal(model.userData.reactorVisual.driveSpeed, 0);
  assert.equal(model.userData.reactorVisual.blackout, 1);
  assert.equal(parts[6].fan.rotation.z, 0, 'main engine turbine must stop');
  assert.equal(model.userData.core.visible, true, 'reactor only activates after sabotage');
  disposeBoss(model);
});

test('destroying a system in the QA chamber persists without moving it as a generic boss', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.advance(1.5, 0.1);
  const s = h.game.snapshot();
  assert.equal(s.sector, 4);
  assert.ok(s.bossZ < -100, 'the reactor must stay within the industrial chamber');
  assert.equal(s.bossIntent, null, 'generic boss AI remains disabled');
  assert.equal(s.sabotage.visual.blackout, 0);
});
