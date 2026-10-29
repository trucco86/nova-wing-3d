import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { groundMechaKind, hoverMechaMotion } from '../src/enemy-mecha-behavior.js';
import { createGroundEnemy, animateGroundEnemy } from '../src/encounters.js';
import { createFlyingRobot } from '../src/visuals.js';
import { updateMechaPose } from '../src/mecha-motion.js';

test('every fourth ground wave in later ground sectors becomes a single flying pursuer', () => {
  for (let wave = 1; wave <= 12; wave++) {
    assert.equal(groundMechaKind(0, wave), wave % 2 ? 'tank' : 'walker');
    assert.equal(
      groundMechaKind(1, wave),
      wave % 4 === 0 ? 'hover-walker' : wave % 2 ? 'tank' : 'walker',
    );
  }
  assert.throws(() => groundMechaKind(1, 0), RangeError);
});

test('flying sentry pursues and climbs without teleporting across the pilot', () => {
  const early = hoverMechaMotion(0, -17, 11, 32, 39);
  const late = hoverMechaMotion(6, -17, 11, 32, 39);
  assert.ok(late.x > early.x + 6);
  assert.ok(late.y > early.y + 8);
  assert.ok(Number.isFinite(late.bank));
  assert.ok(Math.abs(late.x) < 65 && late.y < 50);
});

test('walkers have independent articulated cannon arms and physical hand muzzles', () => {
  for (const variant of [-1, 0, 1, 2]) {
    const robot = createGroundEnemy('walker', variant);
    const left = robot.getObjectByName('walker-arm-left');
    const right = robot.getObjectByName('walker-arm-right');
    assert.ok(left && right);
    const leftMuzzle = robot.getObjectByName('walker-muzzle-left');
    const rightMuzzle = robot.getObjectByName('walker-muzzle-right');
    assert.ok(leftMuzzle && rightMuzzle);
    robot.position.set(0, -7, -80);
    animateGroundEnemy(robot, 2, new T.Vector3(20, 15, 9), {
      dt: 0.3,
      charging: true,
    });
    assert.ok(Math.abs(left.rotation.x - right.rotation.x) > 0.05);
    robot.updateMatrixWorld(true);
    assert.ok(leftMuzzle.getWorldPosition(new T.Vector3()).x < 0);
    assert.ok(rightMuzzle.getWorldPosition(new T.Vector3()).x > 0);
    assert.ok(leftMuzzle.scale.x > 1);
  }
});

test('hero mech has six wing LEDs and softer independent leg articulation', () => {
  const robot = createFlyingRobot();
  const wings = robot.userData.mechRig.wingLeds;
  assert.equal(wings.length, 6);
  assert.ok(wings.every((mesh) => mesh.name.startsWith('mech-wing-led-')));
  assert.equal(
    robot.getObjectByName('mech-wing-left').userData.sharedWingProfile,
    'fighter-v1',
  );
  for (let i = 0; i < 80; i++) {
    updateMechaPose(robot, {
      dt: 0.04,
      time: i * 0.04,
      strafe: 0.8,
      vertical: 0.6,
      boosting: i >= 40,
    });
  }
  const legs = robot.userData.mechRig.legs;
  assert.equal(legs.length, 2);
  assert.notEqual(legs[0].rotation.x, legs[1].rotation.x);
  assert.ok(legs.every((leg) => Number.isFinite(leg.rotation.x) && Math.abs(leg.rotation.x) < 0.7));
});
