import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { createFlyingRobot } from '../src/visuals.js';
import { animatePremiumMecha } from '../src/mecha-premium.js';
import { createMechaDashTrail } from '../src/mecha-dash-trail.js';
import { animateMechPower } from '../src/visuals.js';
import { updateMechaPose } from '../src/mecha-motion.js';
import { createObstacle } from '../src/encounters.js';
import { projectileHitsApproachingObstacle } from '../src/flight.js';
import {
  MECHA_DASH,
  heldBankAngle,
  dashDirection,
  dashFrame,
  heroVisualScale,
  shipCollisionMargin,
} from '../src/hero-dodge-controls.js';
import { breakableHullHealth, damageBreakableHull } from '../src/breakable-encounters.js';

test('hero size is capped for narrow halls, ship holds edge-on bank with actual clearance', () => {
  assert.ok(heroVisualScale(18) < 1.14);
  assert.ok(heroVisualScale(0) === 1);
  assert.equal(heldBankAngle({ held: true }), -Math.PI / 2);
  assert.equal(heldBankAngle({ robot: true, held: true }), 0);
  assert.equal(shipCollisionMargin(false, true), 0.92);
  assert.equal(shipCollisionMargin(true, true), 1.3);
  assert.equal(shipCollisionMargin(false, false), 1.3);
});

test('mecha dash lasts 240ms and never bypasses cooldown or frame-rate limits', () => {
  assert.equal(dashDirection(1, 5), 1);
  assert.equal(dashDirection(-1, -5), -1);
  assert.equal(dashDirection(0), 0, 'neutral must never dodge automatically');
  assert.equal(dashDirection(0.1), 0, 'ignore analog joystick drift');
  assert.equal(dashDirection(0.6), 1);
  assert.equal(dashDirection(-0.75), -1);
  assert.equal(dashDirection(Number.NaN), 0);
  const distanceAt = (fps) => {
    let remain = MECHA_DASH.duration;
    let move = 0;
    for (let i = 0; i < fps; i++) {
      const state = dashFrame(remain, 1 / fps, 1);
      remain = state.remaining;
      move += state.displacement;
    }
    assert.equal(remain, 0);
    return move;
  };
  for (const fps of [30, 60, 120])
    assert.ok(Math.abs(distanceAt(fps) - MECHA_DASH.distance) < 1e-8);
  assert.throws(() => dashFrame(0.3, -0.1, 1), RangeError);
  assert.equal(MECHA_DASH.energyCost, 18);
});

test('real touch hold turns ship vertical; mecha roll button becomes lateral dash', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.elements.get('rollTouch').textContent, 'GIRO');
  assert.ok(h.game.snapshot().shipScale <= 1.03);
  h.elements.get('rollTouch').onpointerdown({ pointerId: 7, preventDefault() {} });
  h.advance(0.45);
  assert.ok(Math.abs(h.game.snapshot().bankAngle + Math.PI / 2) < 0.04);
  h.elements.get('rollTouch').emit('pointercancel', { pointerId: 7, type: 'pointercancel' });
  h.advance(0.4);
  assert.ok(Math.abs(h.game.snapshot().bankAngle) < 0.02);
  h.key('KeyT');
  h.advance(1.35);
  assert.equal(h.elements.get('rollTouch').textContent, 'DASH');
  assert.ok(h.game.snapshot().robotScale <= 1);
  const initial = h.game.snapshot().player.x;
  h.key('KeyD');
  h.game.roll();
  assert.equal(h.game.snapshot().dash.active, true);
  h.advance(0.12);
  const during = h.game.snapshot();
  assert.ok(during.player.x > initial + 4, 'DASH moves the robot sideways');
  assert.ok(during.dash.cooldown > 0);
  h.game.roll();
  const same = h.game.snapshot().dash.remaining;
  assert.ok(same <= MECHA_DASH.duration, 'spam cannot restart the dash');
  h.advance(0.3);
  assert.equal(h.game.snapshot().dash.active, false);
  h.key('KeyD', false);
});

test('robot boosts with visible paired afterburners and layered back details', () => {
  const robot = createFlyingRobot();
  assert.ok(robot.getObjectByName('premium-dorsal-heat-sink--1-0'));
  assert.ok(robot.getObjectByName('premium-spinal-reactor-cover-1-2'));
  assert.ok(robot.getObjectByName('premium-back-vector-fin-1'));
  const normal = animatePremiumMecha(robot, { progress: 1, level: 0, time: 1, boosting: false });
  assert.equal(normal.phase, 'energize');
  assert.ok(robot.userData.premiumMecha.exhausts.every((o) => !o.visible));
  animatePremiumMecha(robot, { progress: 1, level: 18, time: 2, boosting: true });
  assert.equal(robot.userData.premiumMecha.exhausts.length, 2);
  assert.ok(robot.userData.premiumMecha.exhausts.every((o) => o.visible && o.scale.y > 3.5));
  assert.ok(robot.userData.premiumMecha.exhausts.every((o) => o.rotation.x === -Math.PI / 2));
  assert.ok(robot.userData.premiumMecha.afterburnerCores.every((o) => o.visible && o.scale.y > 4));
});

test('only hostile satellites and carriers can be destroyed by real projectile geometry', () => {
  for (const kind of ['satellite', 'carrier']) {
    const obstacle = createObstacle(kind);
    assert.ok(obstacle.userData.solids.length > 0);
    const collision = obstacle.userData.solids[0];
    const from = collision.center.clone().add(new T.Vector3(0, 0, 65));
    const to = collision.center.clone().add(new T.Vector3(0, 0, -65));
    assert.equal(projectileHitsApproachingObstacle(from, to, obstacle, 0), true, kind);
    let hp = breakableHullHealth(kind);
    assert.ok(hp > 0);
    const early = damageBreakableHull(hp, 30);
    assert.equal(early.destroyed, false);
    hp = early.health;
    const terminal = damageBreakableHull(hp, hp);
    assert.equal(terminal.destroyed, true);
    assert.equal(terminal.health, 0);
  }
  for (const kind of ['tunnel', 'debris', 'gantry', 'reactor']) {
    assert.equal(breakableHullHealth(kind), null);
    assert.ok(createObstacle(kind).userData.solids.length > 0);
  }
  assert.equal(damageBreakableHull(70, Number.NaN).health, 70);
});

test('mecha dash never clips outside asteroid cavern, even for a single frame', (t) => {
  const h = harness({ hostname: 'localhost', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(2, 'stage'), true);
  h.advance(17, 0.1);
  assert.equal(h.game.snapshot().asteroidInterior.phase, 'transition');
  h.key('KeyT');
  h.advance(1.35);
  assert.equal(h.game.snapshot().mecha.active, true);

  // Start the dash against the right cavern wall; the regular steering and
  // dash displacement must be resolved before the radial collision clamp.
  h.key('KeyD');
  h.advance(1.1);
  const before = h.game.snapshot();
  assert.ok(Math.hypot(before.player.x, before.player.y - 10) <= 27.001);
  h.game.roll();
  h.advance(0.05);
  const during = h.game.snapshot();
  assert.equal(during.dash.active, true);
  assert.ok(
    Math.hypot(during.player.x, during.player.y - 10) <= 27.001,
    'dash collision must be resolved in the same frame, not after visual clipping',
  );
  h.key('KeyD', false);
});

test('keyboard Q/E/Z hold banks fighter edge-on, short tap spins, robot dash pays energy', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();

  h.key('KeyQ');
  h.advance(0.45);
  assert.ok(Math.abs(h.game.snapshot().bankAngle + Math.PI / 2) < 0.04);
  h.key('KeyQ', false);
  h.advance(0.4);
  assert.equal(h.game.snapshot().rolling, false, 'releasing a long hold must not trigger 360');
  assert.ok(Math.abs(h.game.snapshot().bankAngle) < 0.03);

  h.key('KeyE');
  h.advance(0.05);
  h.key('KeyE', false);
  assert.equal(h.game.snapshot().rolling, true, 'short keyboard tap retains the 360 roll');

  h.advance(0.7);
  h.key('KeyT');
  h.advance(1.4);
  assert.equal(h.game.snapshot().mecha.active, true);
  const energy = h.game.snapshot().energy;
  h.key('KeyD');
  h.key('KeyZ');
  assert.equal(h.game.snapshot().dash.active, true);
  assert.ok(Math.abs(h.game.snapshot().energy - (energy - MECHA_DASH.energyCost)) < 0.001);
  h.key('KeyZ', false);
  h.key('KeyD', false);
});

test('robot dodge uses opposite-side lateral jet and retains hot boost cores', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.premiumMecha;
  assert.equal(rig.afterburnerCores.length, 2);
  assert.equal(rig.dashJets.length, 2);
  animatePremiumMecha(robot, { progress: 1, boosting: true, time: 1 });
  assert.ok(rig.afterburnerCores.every((mesh) => mesh.visible));
  assert.ok(rig.dashJets.every(({ jet }) => !jet.visible));

  animatePremiumMecha(robot, {
    progress: 1,
    boosting: false,
    time: 1.2,
    dash: { active: true, direction: 1, progress: 0.5 },
  });
  assert.equal(rig.dashJets.find(({ side }) => side === -1).jet.visible, true);
  assert.equal(rig.dashJets.find(({ side }) => side === 1).jet.visible, false);
  assert.ok(rig.spine.rotation.z < 0, 'mecha braces against lateral impulse');
  assert.ok(rig.afterburnerCores.every((mesh) => !mesh.visible));

  animatePremiumMecha(robot, { progress: 1, boosting: false, time: 2 });
  assert.ok(rig.dashJets.every(({ jet }) => !jet.visible));
  assert.equal(rig.spine.rotation.z, 0);
});

test('a depleted mecha cannot repeatedly dash without enough energy', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  h.advance(1.35);
  h.key('ShiftLeft');
  h.advance(4.0);
  h.key('ShiftLeft', false);
  assert.ok(h.game.snapshot().energy < MECHA_DASH.energyCost);
  const energy = h.game.snapshot().energy;
  h.key('KeyZ');
  assert.equal(h.game.snapshot().dash.active, false);
  assert.equal(h.game.snapshot().energy, energy);
  h.key('KeyZ', false);
});

test('neutral robot DASH repeats the last side and live stick overrides it', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  h.advance(1.4);

  // The approved mobile contract uses the previously chosen direction,
  // defaulting to right on a fresh robot session.
  const before = h.game.snapshot();
  h.game.roll();
  const neutral = h.game.snapshot();
  assert.equal(neutral.dash.active, true);
  assert.equal(neutral.dash.direction, 1);
  assert.equal(neutral.energy, before.energy - MECHA_DASH.energyCost);

  // Vertical-only input does not change the last horizontal direction.
  h.advance(1.55);
  h.key('KeyW');
  const beforeVertical = h.game.snapshot();
  h.game.roll();
  const vertical = h.game.snapshot();
  assert.equal(vertical.dash.active, true);
  assert.equal(vertical.dash.direction, 1);
  assert.equal(vertical.energy, beforeVertical.energy - MECHA_DASH.energyCost);
  h.key('KeyW', false);
  h.advance(1.55);

  // Live touch joystick explicitly points left and takes priority.
  const beforeTouch = h.game.snapshot();
  const stick = h.elements.get('stick');
  stick.onpointerdown({
    pointerId: 22,
    clientX: 12,
    clientY: 50,
    preventDefault() {},
  });
  h.elements.get('rollTouch').onpointerdown({
    pointerId: 23,
    preventDefault() {},
  });
  const dash = h.game.snapshot();
  assert.equal(dash.dash.active, true);
  assert.equal(dash.dash.direction, -1);
  assert.equal(dash.energy, beforeTouch.energy - MECHA_DASH.energyCost);
  stick.emit('pointercancel', { pointerId: 22 });
  h.elements.get('rollTouch').emit('pointerup', { pointerId: 23, type: 'pointerup' });
  h.advance(0.1);
  assert.ok(h.game.snapshot().player.x < beforeTouch.player.x - 3);
  assert.ok(h.game.snapshot().dash.trail.visible > 0);
  h.advance(0.55);
  assert.equal(h.game.snapshot().dash.trail.visible, 0);
});

test('world-space dash streak pool remains behind as mecha moves and fades completely', () => {
  const scene = new T.Scene();
  const trail = createMechaDashTrail(scene);
  assert.equal(scene.children.length, 16);
  assert.equal(trail.snapshot().visible, 0);
  trail.emit(new T.Vector3(-5, 7, 9), new T.Vector3(0, 7, 9));
  assert.equal(trail.snapshot().visible, 2);
  const line = scene.children.find((mesh) => mesh.visible);
  assert.ok(line.scale.x >= 6);
  const x = line.position.x;
  trail.emit(new T.Vector3(0, 7, 9), new T.Vector3(5, 7, 9));
  assert.equal(line.position.x, x, 'older trail segment must remain in world coordinates');
  trail.update(0.16);
  assert.ok(line.visible && line.material.opacity < 0.83);
  trail.update(0.17);
  assert.equal(trail.snapshot().visible, 0);
  trail.reset();
  trail.destroy();
  assert.equal(scene.children.length, 0);
});

test('robot boost stretches the real three thruster assemblies, not just a glow', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.mechRig;
  for (let frame = 0; frame < 12; frame++) animateMechPower(robot, frame / 20, false, 8, {}, 0.05);
  const idle = rig.turbineFlame.scale.y;
  for (let frame = 0; frame < 12; frame++)
    animateMechPower(robot, 1 + frame / 20, true, 8, {}, 0.05);
  assert.ok(rig.turbineFlame.scale.y > idle * 2.5);
  assert.ok(rig.sidePlumes.every((o) => o.scale.y > 2.8));
  updateMechaPose(robot, { dt: 0.3, time: 2, boosting: true });
  assert.ok(robot.userData.mecha.thrusters.every(({ plume }) => plume.scale.y > 4));
  assert.ok(robot.userData.mecha.thrusters.every(({ plume }) => plume.rotation.x === -Math.PI / 2));
  animatePremiumMecha(robot, { progress: 1, boosting: true, level: 8, time: 2 });
  assert.ok(robot.userData.premiumMecha.exhausts.every((plume) => plume.scale.y > 3.5));
});
