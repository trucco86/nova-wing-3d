import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhoenixAttackVfx, animatePhoenixAttackVfx } from '../src/phoenix-attack-vfx.js';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';

test('Phoenix telegraphs separate dive and wing sweep without introducing colliders', () => {
  const effect = createPhoenixAttackVfx();
  assert.equal(effect.userData.visualOnly, true);
  assert.equal(effect.children.length, 4);
  assert.ok(effect.children.every((mesh) => mesh.userData.visualOnly && !mesh.userData.collider));
  assert.ok(effect.userData.materials.every((material) => material.transparent && !material.depthWrite));
  animatePhoenixAttackVfx(effect, 2, 2, 'windup', 'plasma-dive');
  assert.ok(effect.userData.core.visible && effect.userData.dive.visible);
  assert.ok(effect.userData.swept.every((mesh) => !mesh.visible));
  const snapshot = [effect.userData.solar.opacity, effect.userData.core.rotation.z, effect.userData.dive.scale.y];
  animatePhoenixAttackVfx(effect, 2, 2, 'windup', 'plasma-dive');
  assert.deepEqual(
    [effect.userData.solar.opacity, effect.userData.core.rotation.z, effect.userData.dive.scale.y],
    snapshot,
    'pause/replay must be deterministic',
  );
  animatePhoenixAttackVfx(effect, 2.4, 2, 'attack', 'solar-sweep');
  assert.ok(effect.userData.swept.every((mesh) => mesh.visible));
  assert.ok(!effect.userData.dive.visible && !effect.userData.core.visible);
  assert.ok(effect.userData.wing.opacity > 0);
  animatePhoenixAttackVfx(effect, 3, 2, 'maneuver', 'solar-sweep');
  assert.ok(effect.children.every((mesh) => !mesh.visible));
  effect.traverse((node) => node.geometry?.dispose());
  effect.userData.materials.forEach((material) => material.dispose());
});

test('real Phoenix boss animates visual effects without moving generators or batteries', () => {
  const boss = createBossModel(SECTORS[4], 4, true);
  const effect = boss.getObjectByName('boss-phoenix-attack-vfx');
  assert.ok(effect);
  const weak = boss.userData.parts.map((part) => part.mesh.position.toArray());
  const batteries = boss.userData.batteries.map((part) => part.position.toArray());
  animateBossSignature(boss, 4, 18, 3, 'windup', 'plasma-dive');
  assert.equal(effect.userData.dive.visible, true);
  animateBossSignature(boss, 4, 19, 3, 'attack', 'solar-sweep');
  assert.ok(effect.userData.swept.every((mesh) => mesh.visible));
  assert.deepEqual(boss.userData.parts.map((part) => part.mesh.position.toArray()), weak);
  assert.deepEqual(boss.userData.batteries.map((part) => part.position.toArray()), batteries);
  disposeBoss(boss);
  const station = createBossModel(SECTORS[3], 3, true);
  assert.equal(station.getObjectByName('boss-phoenix-attack-vfx'), undefined);
  animateBossSignature(station, 3, 19, 3, 'windup', 'reactor-vent');
  disposeBoss(station);
});
