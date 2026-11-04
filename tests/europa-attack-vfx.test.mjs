import test from 'node:test';
import assert from 'node:assert/strict';
import { createEuropaAttackVfx, animateEuropaAttackVfx } from '../src/europa-attack-vfx.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';

test('Europa telegraphs are bounded, deterministic, mutually exclusive and cosmetic', () => {
  const effect = createEuropaAttackVfx();
  assert.equal(effect.children.length, 9, 'six readable ice spikes plus original three effects');
  assert.equal(effect.userData.shards.length, 6);
  assert.ok(effect.userData.shards.every((shard) => shard.name.startsWith('europa-ice-quake-spike-')));
  assert.equal(effect.userData.visualOnly, true);
  assert.ok(
    effect.children.every(
      (node) => node.userData.visualOnly && !node.userData.collider && !node.userData.damage,
    ),
  );
  animateEuropaAttackVfx(effect, 4, 2, 'windup', 'ice-quake');
  assert.equal(effect.userData.quake.visible, true);
  assert.ok(effect.userData.arms.every((arm) => !arm.visible));
  assert.ok(effect.userData.shards.every((shard) => shard.visible && shard.scale.y < 0.5));
  const before = [
    effect.userData.shock.opacity,
    effect.userData.quake.rotation.z,
    effect.userData.quake.scale.x,
  ];
  animateEuropaAttackVfx(effect, 4, 2, 'windup', 'ice-quake');
  assert.deepEqual(
    [
      effect.userData.shock.opacity,
      effect.userData.quake.rotation.z,
      effect.userData.quake.scale.x,
    ],
    before,
  );
  animateEuropaAttackVfx(effect, 6, 3, 'attack', 'cryo-pincer');
  assert.equal(effect.userData.quake.visible, false);
  assert.ok(effect.userData.arms.every((arm) => arm.visible && Math.abs(arm.position.x) === 23));
  animateEuropaAttackVfx(effect, 8, 3, 'maneuver', 'cryo-pincer');
  assert.ok(effect.children.every((node) => !node.visible));
  effect.traverse((node) => node.geometry?.dispose());
  effect.userData.materials.forEach((m) => m.dispose());
});

test('Colossus visual cues keep generator locations and battery muzzles unchanged', () => {
  const boss = createBossModel(SECTORS[5], 5, true);
  const fx = boss.getObjectByName('boss-europa-attack-vfx');
  assert.ok(fx);
  const weak = boss.userData.parts.map((p) => p.mesh.position.toArray());
  const batteries = boss.userData.batteries.map((p) => p.position.toArray());
  animateBossSignature(boss, 5, 12, 2, 'windup', 'ice-quake');
  assert.equal(fx.userData.quake.visible, true);
  animateBossSignature(boss, 5, 14, 3, 'attack', 'cryo-pincer');
  assert.ok(fx.userData.arms.every((arm) => arm.visible));
  assert.deepEqual(
    boss.userData.parts.map((p) => p.mesh.position.toArray()),
    weak,
  );
  assert.deepEqual(
    boss.userData.batteries.map((p) => p.position.toArray()),
    batteries,
  );
  disposeBoss(boss);
  const mission4 = createBossModel(SECTORS[3], 3, true);
  assert.equal(mission4.getObjectByName('boss-europa-attack-vfx'), undefined);
  disposeBoss(mission4);
});
