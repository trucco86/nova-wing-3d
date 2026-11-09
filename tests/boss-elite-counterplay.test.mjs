import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import {
  chooseBossIntent,
  bossExclusiveFootprint,
  bossMeleeHit,
  bossMeleePose,
} from '../src/boss-combat-ai.js';
import { bossRadarPlan } from '../src/boss-radar.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';

test('Hydra uses two intact heads to deny a flank; breaking one generator removes the crossfire', () => {
  const data = { sector: 6, phase: 3, cycle: 3, orbit: 1.5, playerX: 4, playerY: 13 };
  const crossfire = chooseBossIntent({ ...data, generators: [true, true] });
  assert.equal(crossfire.kind, 'hydra-two-head-crossfire');
  assert.equal(crossfire.origin, 'hydra-crossfire-muzzle-0');
  assert.equal(crossfire.counter, 'flank');
  assert.equal(bossExclusiveFootprint(crossfire.kind).type, 'rect');
  assert.ok(Object.isFrozen(crossfire));
  const danger = bossRadarPlan(crossfire, { x: 4, y: 13, orbit: 1.5 });
  assert.equal(danger.threatened, true);
  assert.equal(danger.shape.type, 'rect');
  assert.ok(danger.shape.rx > danger.shape.ry);
  assert.ok(danger.exit);
  assert.equal(bossMeleeHit(crossfire, { x: 4, y: 29 }), false);
  assert.equal(bossRadarPlan(crossfire, { x: 4, y: 29, orbit: 1.5 }).threatened, false);
  assert.equal(bossMeleePose(crossfire, 'windup', 1.3).lunge, 0);
  const missing = chooseBossIntent({ ...data, generators: [false, true] });
  assert.equal(missing.kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...data, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...data, playerY: 32 }).kind, 'tentacle-grab');
});

test('Hydra heads have two visible muzzle assemblies, signal actual attack, and do not move generators', () => {
  const boss = createBossModel(SECTORS[6], 6, true);
  try {
    const weak = boss.userData.parts.map((p) => p.mesh.position.clone());
    for (const index of [0, 3]) {
      assert.ok(boss.getObjectByName('hydra-crossfire-muzzle-' + index));
      assert.ok(boss.getObjectByName('hydra-crossfire-beam-' + index));
    }
    animateBossSignature(boss, 6, 12, 3, 'windup', 'hydra-two-head-crossfire');
    const pre = [0, 3].map((i) => boss.getObjectByName('hydra-crossfire-beam-' + i));
    assert.ok(pre.every((beam) => beam.visible && beam.scale.z < 0.2));
    animateBossSignature(boss, 6, 14.4, 3, 'attack', 'hydra-two-head-crossfire');
    assert.ok(pre.every((beam) => beam.visible && beam.scale.z > 1));
    boss.userData.parts[1].hp = 0;
    animateBossSignature(boss, 6, 14.7, 3, 'attack', 'hydra-two-head-crossfire');
    assert.equal(pre[0].visible, false);
    assert.equal(pre[1].visible, true);
    animateBossSignature(boss, 6, 17, 3, 'recovery', 'hydra-two-head-crossfire');
    assert.ok(pre.every((beam) => !beam.visible));
    boss.userData.parts.forEach((p, i) => assert.ok(p.mesh.position.equals(weak[i])));
  } finally {
    disposeBoss(boss);
  }
});

test('Omega uses the surviving appendage or emergency gun rather than hitting from a broken claw', () => {
  const base = { sector: 7, phase: 2, cycle: 1, orbit: 1.45, playerY: 15 };
  const both = chooseBossIntent({ ...base, generators: [true, true] });
  const damaged = chooseBossIntent({ ...base, generators: [true, false] });
  const core = chooseBossIntent({ ...base, generators: [false, false] });
  assert.equal(both.kind, 'claw-swipe');
  assert.equal(both.originMesh, 'omega-starboard-talon');
  assert.equal(damaged.kind, 'tentacle-sweep');
  assert.equal(damaged.originMesh, 'omega-port-tentacle');
  assert.equal(core.kind, 'barrage');
  assert.equal(bossRadarPlan(core, { x: 0, y: 15, orbit: 1.45 }), null);
  const front = chooseBossIntent({ sector: 7, cycle: 0, orbit: 0 });
  assert.equal(front.kind, 'bite');
  assert.equal(front.originMesh, 'omega-mouth-cavity');
  const rear = chooseBossIntent({ sector: 7, cycle: 0, orbit: -2.8 });
  assert.equal(rear.originMesh, 'omega-port-tentacle');
});

test('Marvin protects his rear with a different horizontal engine sweep but stays dodgeable', () => {
  const base = { sector: 9, phase: 2, cycle: 1, orbit: 2.65, playerY: 14, playerX: -3 };
  const sweep = chooseBossIntent(base);
  assert.equal(sweep.kind, 'marvin-rear-thruster-sweep');
  assert.equal(sweep.origin, 'marvin-rear-thruster-sweeper');
  assert.equal(sweep.counter, 'rear');
  assert.equal(bossExclusiveFootprint(sweep.kind).type, 'rect');
  const plan = bossRadarPlan(sweep, { x: -3, y: 14, orbit: 2.65 });
  assert.ok(plan.threatened && plan.exit && plan.shape.rx > plan.shape.ry);
  assert.equal(bossMeleeHit(sweep, { x: -3, y: 28 }), false);
  assert.equal(bossRadarPlan(sweep, { x: -3, y: 28, orbit: 2.65 }).threatened, false);
  assert.equal(bossMeleePose(sweep, 'windup', 1).lunge, 0);
  assert.ok(bossMeleePose(sweep, 'attack', 0.7).exhaust > 0);
  assert.equal(chooseBossIntent({ ...base, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, robot: true }).kind, 'claw-swipe');
  assert.equal(chooseBossIntent({ ...base, phase: 1 }).kind, 'claw-swipe');
});

test('Marvin has a real visual aft-thruster whose windup and release preserve boss hitboxes', () => {
  const boss = createBossModel(SECTORS[9], 9, true);
  try {
    const mount = boss.getObjectByName('marvin-rear-thruster-sweeper');
    const plume = boss.getObjectByName('marvin-rear-thruster-plume');
    assert.ok(mount && plume && plume.isMesh);
    const weak = boss.userData.parts.map((p) => p.mesh.position.clone());
    animateBossSignature(boss, 9, 9, 2, 'maneuver');
    assert.equal(plume.visible, false);
    animateBossSignature(boss, 9, 10, 2, 'windup', 'marvin-rear-thruster-sweep');
    assert.equal(plume.visible, true);
    assert.ok(plume.scale.z < 0.3 && mount.rotation.z < 0);
    animateBossSignature(boss, 9, 12.5, 2, 'attack', 'marvin-rear-thruster-sweep');
    assert.ok(plume.visible && plume.scale.z > 1.5 && mount.rotation.z > 0);
    animateBossSignature(boss, 9, 13.5, 2, 'recovery', 'marvin-rear-thruster-sweep');
    assert.equal(plume.visible, false);
    boss.userData.parts.forEach((p, i) => assert.ok(p.mesh.position.equals(weak[i])));
  } finally {
    disposeBoss(boss);
  }
});
