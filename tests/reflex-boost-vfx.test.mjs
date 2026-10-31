import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { REFLEX_BOOST, nearbyHostileThreats, createReflexBoost } from '../src/reflex-boost.js';
import { createHeroWeaponEffects } from '../src/hero-weapon-vfx.js';
import { fighter, createFlyingRobot } from '../src/visuals.js';

const pilot = new T.Vector3(0, 8, 9);
const shot = (x, z, vx = 0, vz = 58) => ({
  life: 5,
  o: { position: new T.Vector3(x, 8, z) },
  v: new T.Vector3(vx, 0, vz),
});
const clusteredShots = () => [shot(-6, -40), shot(3, -55), shot(-2, -80), shot(8, -24)];

test('Reflex Boost only considers four or more nearby, approaching hostile projectiles', () => {
  assert.equal(nearbyHostileThreats(clusteredShots(), pilot), 4);
  assert.equal(nearbyHostileThreats([shot(-2, -50, 0, -58)], pilot), 0, 'departing shots ignored');
  assert.equal(nearbyHostileThreats([shot(100, -50)], pilot), 0, 'offscreen attacks ignored');
  assert.equal(nearbyHostileThreats([shot(0, -400)], pilot), 0, 'distant attacks ignored');
  assert.equal(nearbyHostileThreats([shot(0, -15)], pilot), 1);
  assert.equal(nearbyHostileThreats([{ ...shot(0, -15), life: 0 }], pilot), 0);
});

test('Reflex Boost consumes fuel once, extends evasion speed and slows hostile time only', () => {
  const controller = createReflexBoost();
  let result = controller.update(0.016, { boosting: true, energy: 100, threats: 3 });
  assert.equal(result.activated, false);
  result = controller.update(0.016, { boosting: false, energy: 100, threats: 6 });
  assert.equal(result.activated, false);
  result = controller.update(0.016, { boosting: true, energy: 40, threats: 6 });
  assert.equal(result.activated, false);
  result = controller.update(0.016, { boosting: true, energy: 100, threats: 4 });
  assert.equal(result.activated, true);
  assert.equal(result.energyCost, REFLEX_BOOST.activationCost);
  assert.equal(result.hostileTimeScale, 0.38);
  assert.equal(result.dodgeMultiplier, 1.4);
  assert.equal(result.triggerCount, 1);
  result = controller.update(0.016, { boosting: true, energy: 90, threats: 5 });
  assert.equal(result.activated, false);
  assert.equal(result.energyCost, 0);
  for (let i = 0; i < 25; i++)
    result = controller.update(0.1, { boosting: true, energy: 90, threats: 5 });
  assert.equal(result.active, false);
  assert.ok(result.cooldown > 0);
  assert.equal(result.hostileTimeScale, 1);
  assert.equal(result.dodgeMultiplier, 1);
  for (let i = 0; i < 68; i++)
    result = controller.update(0.1, { boosting: false, energy: 100, threats: 4 });
  assert.equal(result.cooldown, 0);
  result = controller.update(0.01, { boosting: true, energy: 60, threats: 4 });
  assert.equal(result.triggerCount, 2, 'must wait cooldown and new qualifying boost');
});

test('Reflex Boost does not run when first orbital launch still requires full boost', () => {
  const controller = createReflexBoost();
  const disabled = controller.update(0.016, {
    boosting: true, energy: 100, threats: 10, enabled: false,
  });
  assert.equal(disabled.activated, false);
  assert.equal(disabled.hostileTimeScale, 1);
  assert.deepEqual(controller.reset(), {
    active: false, seconds: 0, cooldown: 0, triggerCount: 0,
    hostileTimeScale: 1, dodgeMultiplier: 1,
  });
  assert.throws(() => controller.update(-0.1), RangeError);
});

test('local weapon light flashes on ship wings and real mecha wrists even without bloom', () => {
  const ship = fighter();
  const robot = createFlyingRobot();
  ship.add(robot);
  const fx = createHeroWeaponEffects(ship, robot);
  fx.setQuality('high', true);
  fx.pulse({ robot: false, color: '#ffbb66' });
  fx.tick(0.02, true);
  assert.ok(fx.snapshot().activeMeshes >= 4);
  assert.equal(ship.getObjectByName('hero-wing-shot-reflection').material.blending,
    T.AdditiveBlending);
  assert.equal(ship.getObjectByName('hero-shot-local-light').visible, false,
    'touch must never add costly dynamic scene light');
  fx.pulse({ robot: true, precisionShot: true });
  fx.tick(0.02, true);
  assert.equal(robot.userData.mecha.arms.left.muzzle.getObjectByName('mecha-arm-flash').visible,
    true);
  assert.equal(robot.userData.mecha.arms.right.muzzle.getObjectByName('mecha-arm-flash').visible,
    false);
  fx.pulse({ robot: false, charged: true });
  fx.setQuality('high', false);
  fx.tick(0.02, true);
  assert.equal(ship.getObjectByName('hero-shot-local-light').visible, true,
    'desktop high can use one short-lived point light');
  fx.reset();
  assert.equal(fx.snapshot().activeMeshes, 0);
  assert.equal(ship.getObjectByName('hero-shot-local-light').visible, false);
});

test('weapon glow never adds damage colliders or global time scaling', () => {
  const ship = fighter();
  const robot = createFlyingRobot();
  const fx = createHeroWeaponEffects(ship, robot);
  const group = ship.getObjectByName('hero-weapon-glow');
  group.traverse((object) => {
    assert.notEqual(object.userData.hitbox, true);
    if (object.isMesh) {
      assert.equal(object.userData.visualOnly, true);
      assert.ok(object.geometry.attributes.position.count > 0);
    }
  });
  fx.pulse({ robot: false });
  fx.tick(0.18, true);
  assert.equal(fx.snapshot().remaining, 0);
  assert.equal(fx.snapshot().activeMeshes, 0);
});
