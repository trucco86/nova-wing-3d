import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { createFlyingRobot } from '../src/visuals.js';
import { animatePremiumMecha } from '../src/mecha-premium.js';
import { createObstacle } from '../src/encounters.js';
import {
  MECHA_DASH,
  evasionDirection,
  dashOffset,
  shipBankAngle,
  destructibleObstacleHp,
  damageDestructibleObstacle,
} from '../src/flight-evasion-and-targets.js';

test('mobile dash stays inside flight corridor, travels exactly once and keeps independent cooldown', () => {
  assert.equal(evasionDirection(-0.8), -1);
  assert.equal(evasionDirection(0, -1), -1);
  const step = dashOffset(MECHA_DASH.duration, MECHA_DASH.duration, -1, { x: 0 });
  assert.equal(step.x, -MECHA_DASH.distance);
  assert.equal(step.remaining, 0);
  const clipped = dashOffset(1, MECHA_DASH.duration, 1, { x: 60, min: -67, max: 67 });
  assert.equal(clipped.x, 67);
  assert.equal(dashOffset(0, MECHA_DASH.duration, -1, { x: 12 }).x, 12);
  assert.equal(shipBankAngle(true, -1), -Math.PI / 2);
  assert.equal(shipBankAngle(true, 1), Math.PI / 2);
  assert.equal(shipBankAngle(false, 1, 1), -0.48);
});

test('robot dash replaces 360 roll, moves laterally and cooldown protects against spam', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  assert.equal(h.game.snapshot().mecha.active, true);
  assert.equal(h.elements.get('rollTouch').textContent, 'DASH');
  const before = h.game.snapshot();
  h.game.roll(-1);
  const started = h.game.snapshot();
  assert.equal(started.dash.active, true);
  assert.ok(started.energy < before.energy);
  h.advance(0.16, 0.02);
  const midway = h.game.snapshot();
  assert.ok(midway.player.x < before.player.x - 12, 'real position moves left');
  assert.ok(Math.abs(midway.playerBank) < Math.PI, 'no 360-degree acrobatics');
  const cost = midway.energy;
  h.game.roll(-1);
  assert.equal(h.game.snapshot().dash.cooldown > 0, true);
  assert.ok(h.game.snapshot().energy >= cost, 'second dash does not consume energy');
  h.advance(0.6, 0.02);
  assert.equal(h.game.snapshot().dash.active, false);
});

test('holding GIRO banks fighter fully sideways until pointer release, no accidental spin', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  const roll = h.elements.get('rollTouch');
  assert.equal(roll.textContent, 'GIRO');
  roll.onpointerdown({ pointerId: 14, type: 'pointerdown', preventDefault() {} });
  h.advance(0.6, 0.02);
  const held = h.game.snapshot();
  assert.ok(
    Math.abs(Math.abs(held.playerBank) - Math.PI / 2) < 0.07,
    'ship is completely vertical, at 90 degrees',
  );
  roll.emit('pointerup', { pointerId: 14, type: 'pointerup' });
  h.advance(0.35, 0.02);
  assert.ok(Math.abs(h.game.snapshot().playerBank) < 0.1, 'smooth neutral return');
  assert.equal(h.game.snapshot().rolling, false);
});

test('rear mecha boost has illuminated colored jets, hydropistons, and remains compact', () => {
  const mech = createFlyingRobot();
  const rig = mech.userData.premiumMecha;
  assert.ok(mech.getObjectByName('premium-back-thruster-armor'));
  assert.ok(mech.getObjectByName('premium-rear-knee-actuator--1'));
  assert.ok(rig.boostJets.length >= 2);
  animatePremiumMecha(mech, { progress: 1, level: 16, time: 1, boosting: false });
  const idle = rig.boostJets[0].jet.scale.y;
  animatePremiumMecha(mech, { progress: 1, level: 16, time: 2, boosting: true });
  assert.ok(rig.boostJets[0].jet.scale.y > idle * 1.5);
  assert.ok(rig.boostJets[0].jet.material.opacity > 0.9);
  assert.ok(mech.userData.mecha.baseScale < 0.9, 'runtime mecha slightly smaller');
});

test('hostile satellites and escort carriers have real health; scenery and debris stay undamageable', () => {
  for (const kind of ['satellite', 'carrier']) {
    const target = createObstacle(kind);
    assert.ok(target.userData.solids.length > 0, 'real geometry and hitboxes exist');
    const hp = destructibleObstacleHp(kind);
    assert.ok(hp > 20);
    const first = damageDestructibleObstacle(kind, hp, 10);
    assert.equal(first.destroyed, false);
    assert.equal(first.hp, hp - 10);
    assert.deepEqual(damageDestructibleObstacle(kind, first.hp, hp), { hp: 0, destroyed: true });
  }
  for (const kind of ['debris', 'tunnel', 'gantry', 'reactor']) {
    assert.equal(destructibleObstacleHp(kind), null);
    assert.equal(damageDestructibleObstacle(kind, 100, 500), null);
  }
});
