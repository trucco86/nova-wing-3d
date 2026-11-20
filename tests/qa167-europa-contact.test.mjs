import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  animateEuropaAttackVfx,
  createEuropaAttackVfx,
  europaClawContactHit,
} from '../src/europa-attack-vfx.js';

// Regression anchor: every direct hit requires the displayed appendage, not just the radar area.
const pilot = Object.freeze({ x: 0, y: 12, z: 9 });

function fixture() {
  const boss = new T.Group();
  boss.position.set(0, 12, -160);
  const root = createEuropaAttackVfx();
  boss.add(root);
  boss.updateMatrixWorld(true);
  // Match the live game: the windup freezes a point just in front of the ship
  // and the VFX target is transformed from world into boss-local coordinates.
  const aim = boss.worldToLocal(new T.Vector3(pilot.x, pilot.y, pilot.z - 7));
  return { boss, root, aim };
}

test('Europa cryo pincer reaches player through its real animated tip, not a body zoom', () => {
  const { root, aim } = fixture();
  animateEuropaAttackVfx(root, 10, 2, 'windup', 'cryo-pincer', { claw: 0.3 }, aim);
  assert.equal(europaClawContactHit(root, pilot), false, 'warning must not cause contact');
  animateEuropaAttackVfx(root, 10.7, 2, 'attack', 'cryo-pincer', { claw: 0.85 }, aim);
  assert.equal(europaClawContactHit(root, pilot), true, 'animated claw must reach ship');
  assert.equal(europaClawContactHit(root, { x: 60, y: 12, z: 9 }), false);
  assert.equal(europaClawContactHit(root, { x: 0, y: 60, z: 9 }), false);
  assert.equal(europaClawContactHit(root, { x: 0, y: 12, z: 200 }), false);
  assert.equal(europaClawContactHit(root, { x: NaN, y: 12, z: 9 }), false);
  animateEuropaAttackVfx(root, 11.6, 2, 'recovery', 'cryo-pincer', { claw: 0 }, aim);
  assert.equal(europaClawContactHit(root, pilot), false, 'recovery cannot make contact');
});

test('damaged generators remove their contact flashes and active striking arms', () => {
  const { root, aim } = fixture();
  animateEuropaAttackVfx(root, 12.7, 3, 'attack', 'cryo-pincer', { claw: 0.85 }, aim, [
    false,
    false,
  ]);
  assert.equal(europaClawContactHit(root, pilot), false);
  assert.ok(root.userData.strikers.every((striker) => !striker.node.visible));
  animateEuropaAttackVfx(root, 12.7, 3, 'attack', 'cryo-pincer', { claw: 0.85 }, aim, [
    true,
    false,
  ]);
  assert.equal(europaClawContactHit(root, pilot), true);
  assert.equal(root.userData.strikers[1].node.visible, false);
});

test('geometry remains stable across dodge, with no homing after locked windup', () => {
  const { root, aim } = fixture();
  animateEuropaAttackVfx(root, 11, 2, 'attack', 'cryo-pincer', { claw: 0.85 }, aim);
  const tip = root.userData.strikers[0].impact.getWorldPosition(new T.Vector3());
  const missed = { x: pilot.x + 90, y: pilot.y, z: pilot.z };
  assert.equal(europaClawContactHit(root, missed), false);
  animateEuropaAttackVfx(root, 11.05, 2, 'attack', 'cryo-pincer', { claw: 0.85 }, aim);
  root.updateWorldMatrix(true, true);
  assert.ok(
    root.userData.strikers[0].impact.getWorldPosition(new T.Vector3()).distanceTo(tip) < 0.001,
  );
});
