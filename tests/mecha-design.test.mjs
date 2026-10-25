import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createFlyingRobot, createShipModule, mechArmPitch } from '../src/visuals.js';

test('flight mech uses wide dorsal wings and a turbine at shoulder height', () => {
  const robot = createFlyingRobot();
  const leftWing = robot.getObjectByName('mech-wing-left');
  const rightWing = robot.getObjectByName('mech-wing-right');
  const turbine = robot.getObjectByName('mech-back-turbine');
  assert.ok(leftWing, 'the left wing must exist');
  assert.ok(rightWing, 'the right wing must exist');
  assert.ok(turbine, 'main back turbine must exist');
  assert.ok(turbine.position.y > 2.8, 'turbine must not be at waist height');
  assert.ok(turbine.position.z > 1.5, 'main turbine must be on the back');
  const span = new T.Box3().setFromObject(robot);
  assert.ok(span.max.x - span.min.x > 10, 'wings must create a broad fighter silhouette');
  assert.ok(leftWing.geometry.type === 'ExtrudeGeometry');
  assert.ok(rightWing.geometry.type === 'ExtrudeGeometry');
  assert.equal(robot.userData.mechRig.arms.length, 2);
  assert.equal(robot.userData.mechRig.armMuzzles.length, 2);
});

test('arm pitch raises weapons in firing pose without overrotation', () => {
  const idle = mechArmPitch(0, 0, 1, 0);
  const firing = mechArmPitch(0, 0, 1, 0.45);
  assert.ok(idle > 0.35, 'idle cannon aims forward, not downward');
  assert.ok(firing > idle, 'firing raises the cannon further');
  assert.ok(mechArmPitch(0, 0, 1, 2) <= 1.45, 'recoil is bounded');
});

test('all starfighter variants share mechanical silhouette while preserving variants', () => {
  const modules = ['nova7', 'specter', 'aegis'].map(createShipModule);
  for (const module of modules) {
    assert.ok(module.getObjectByName('ship-mechanical-keel'));
    const span = new T.Box3().setFromObject(module);
    assert.ok(span.max.x - span.min.x > 8, 'starfighter wings must remain wide');
  }
  const silhouettes = modules.map((module) =>
    module.children
      .map((part) => [part.geometry?.type, ...part.position.toArray()].join(':'))
      .join('|'),
  );
  assert.equal(new Set(silhouettes).size, 3, 'each starfighter retains a distinct chassis');
});
