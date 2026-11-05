import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createEuropaAttackVfx, animateEuropaAttackVfx } from '../src/europa-attack-vfx.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';

test('Colossus uses real visible segmented forearms and claws instead of crossing ghost bars', () => {
  const effect = createEuropaAttackVfx();
  try {
    assert.equal(effect.children.length, 9, 'one shock + two arms + six ice spikes');
    assert.equal(effect.userData.strikers.length, 2);
    assert.equal(effect.userData.shards.length, 6);
    assert.equal(effect.userData.visualOnly, true);
    assert.ok(effect.children.every((node) => node.userData.visualOnly));
    for (const arm of effect.userData.strikers) {
      assert.ok(arm.upper.isMesh && arm.forearm.isMesh && arm.hand.isGroup);
      assert.equal(arm.talons.length, 3, 'each claw has three real visible talons');
      assert.ok(arm.hand.getObjectByName('europa-claw-contact-flash'));
      assert.ok(arm.node.children.every((node) => node.userData.visualOnly));
    }

    const aim = new T.Vector3(12, 29, 183);
    animateEuropaAttackVfx(effect, 8.4, 2, 'windup', 'cryo-pincer', { claw: 0.24 }, aim);
    assert.ok(effect.userData.arms.every((arm) => arm.visible));
    assert.ok(effect.userData.arms.every((arm) => !arm.userData.collider));
    assert.ok(effect.userData.shards.every((shard) => !shard.visible));
    const ready = effect.userData.strikers.map((arm) => arm.hand.position.clone());

    animateEuropaAttackVfx(effect, 10.8, 3, 'attack', 'cryo-pincer', { claw: 0.85 }, aim);
    for (const [i, arm] of effect.userData.strikers.entries()) {
      assert.ok(arm.node.visible);
      assert.ok(arm.hand.position.z > ready[i].z + 55, 'appendage reaches toward the ship');
      assert.ok(Math.abs(arm.hand.position.x - (aim.x + arm.side * 6.5)) < 0.01);
      assert.ok(Math.abs(arm.hand.position.y - aim.y) < 0.01);
      assert.ok(Math.abs(arm.hand.position.z - (aim.z - 8)) < 0.01);
      assert.ok(arm.forearm.scale.z > 35);
      assert.equal(arm.impact.visible, true, 'visible flash attaches to claw tip');
    }
    // Telegraph and strike use the same point; any new dodge moves *pilot*,
    // not the arm's already committed target.
    animateEuropaAttackVfx(effect, 10.8, 3, 'attack', 'cryo-pincer', { claw: 0.85 }, aim);
    assert.ok(effect.userData.strikers[0].hand.position.distanceTo(
      new T.Vector3(aim.x - 6.5, aim.y, aim.z - 8),
    ) < 0.01);
    animateEuropaAttackVfx(effect, 12, 3, 'maneuver', 'cryo-pincer');
    assert.ok(effect.children.every((node) => !node.visible));
  } finally {
    effect.traverse((node) => node.geometry?.dispose());
    effect.userData.materials.forEach((material) => material.dispose());
  }
});

test('ice-quake is a distinct single-arm overhead hammer, while pincer closes with both claws', () => {
  const effect = createEuropaAttackVfx();
  const aim = new T.Vector3(-5, 20, 171);
  try {
    animateEuropaAttackVfx(effect, 8.4, 2, 'windup', 'ice-quake', { claw: 0.22 }, aim, [true, true], 1);
    const hammer = effect.userData.strikers[1];
    assert.equal(effect.userData.strikers[0].node.visible, false);
    assert.equal(hammer.node.visible, true);
    assert.ok(hammer.hand.position.y > aim.y + 35, 'hammer visibly raises overhead');
    assert.ok(effect.userData.quake.visible);
    assert.ok(effect.userData.shards.every((shard) => shard.visible && shard.scale.y < 0.5));
    animateEuropaAttackVfx(effect, 10.8, 2, 'attack', 'ice-quake', { claw: 0.85 }, aim, [true, true], 1);
    assert.ok(hammer.hand.position.y < aim.y);
    assert.ok(hammer.hand.position.z > aim.z - 9, 'hammer reaches the targeted lane');
    assert.equal(hammer.impact.visible, true);
    assert.equal(effect.userData.strikers[0].node.visible, false);
    assert.ok(effect.userData.shards.every((shard) => shard.visible && shard.scale.y > 1));

    animateEuropaAttackVfx(effect, 11, 3, 'attack', 'cryo-pincer', { claw: 0.85 }, aim, [false, true], 1);
    assert.equal(effect.userData.strikers[0].node.visible, false, 'destroyed left module cannot strike');
    assert.equal(effect.userData.strikers[1].node.visible, true, 'surviving arm still attacks');
    assert.equal(effect.userData.quake.visible, false);
    assert.ok(effect.userData.shards.every((shard) => !shard.visible));
  } finally {
    effect.traverse((node) => node.geometry?.dispose());
    effect.userData.materials.forEach((material) => material.dispose());
  }
});

test('physical Colossus strike honors rotated world target without moving actual weakpoints', () => {
  const boss = createBossModel(SECTORS[5], 5, true);
  try {
    const fx = boss.getObjectByName('boss-europa-attack-vfx');
    assert.ok(fx);
    const weak = boss.userData.parts.map((p) => p.mesh.position.toArray());
    const batteries = boss.userData.batteries.map((p) => p.position.toArray());
    boss.position.set(6, 12, -160);
    boss.rotation.y = 0.45;
    boss.updateWorldMatrix(true, false);
    const worldAim = new T.Vector3(12, 30, 2);
    const localAim = boss.worldToLocal(worldAim.clone());

    animateBossSignature(boss, 5, 9, 2, 'windup', 'ice-quake',
      { claw: 0.28 }, { cycle: 0 }, localAim);
    assert.equal(fx.userData.strikers[0].node.visible, true);
    assert.equal(fx.userData.strikers[1].node.visible, false);
    animateBossSignature(boss, 5, 10.7, 3, 'attack', 'cryo-pincer',
      { claw: 0.85 }, { cycle: 0 }, localAim);
    boss.updateMatrixWorld(true);
    for (const arm of fx.userData.strikers) {
      const tip = arm.hand.getWorldPosition(new T.Vector3());
      assert.ok(Math.abs(tip.x - (worldAim.x + arm.side * 6.5 * boss.scale.x * Math.cos(boss.rotation.y))) < 4.5,
        'each physical appendage must converge near the same world-space target');
      assert.ok(Math.abs(tip.y - worldAim.y) < 1);
      assert.ok(Math.abs(tip.z - worldAim.z) < 10);
    }
    assert.deepEqual(boss.userData.parts.map((p) => p.mesh.position.toArray()), weak);
    assert.deepEqual(boss.userData.batteries.map((p) => p.position.toArray()), batteries);
    const other = createBossModel(SECTORS[3], 3, true);
    assert.equal(other.getObjectByName('boss-europa-attack-vfx'), undefined);
    disposeBoss(other);
  } finally {
    disposeBoss(boss);
  }
});
