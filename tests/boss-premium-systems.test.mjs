import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBossPremiumSystems,
  animateBossPremiumSystems,
} from '../src/boss-premium-systems.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';

test('each of the ten bosses has unique moving mechanical surface detail without hitboxes', () => {
  const names = new Set();
  for (let i = 0; i < 10; i++) {
    const g = createBossPremiumSystems(i);
    assert.ok(!names.has(g.name), 'the same decorative identity cannot repeat');
    names.add(g.name);
    assert.equal(g.userData.visualOnly, true);
    assert.equal(g.userData.actuators.length, 6);
    assert.ok(g.getObjectByName('boss-premium-hull-fasteners').isInstancedMesh);
    const angles = g.userData.actuators.map((a) => a.rotation.y);
    animateBossPremiumSystems(g, 6.2, 3, 'attack');
    assert.ok(g.userData.actuators.some((a, n) => a.rotation.y !== angles[n]));
    const values = g.userData.actuators.map((a) => a.rotation.y);
    animateBossPremiumSystems(g, 6.2, 3, 'attack');
    assert.deepEqual(
      g.userData.actuators.map((a) => a.rotation.y),
      values,
      'pause must freeze pose',
    );
    g.userData.materials.forEach((m) => m.dispose());
    g.userData.geometries.forEach((geo) => geo.dispose());
  }
});

test('boss premium features remain visible and independent of physical weak-point geometry', () => {
  const boss = createBossModel(SECTORS[9], 9, true);
  const details = boss.getObjectByName('boss-premium-systems-marvin-thruster-armatures');
  assert.ok(details && details.visible);
  assert.equal(details.userData.visualOnly, true);
  const targets = boss.userData.parts.map((p) => p.mesh.position.toArray());
  animateBossSignature(boss, 9, 7, 3, 'windup');
  assert.deepEqual(
    boss.userData.parts.map((p) => p.mesh.position.toArray()),
    targets,
  );
  disposeBoss(boss);
});
