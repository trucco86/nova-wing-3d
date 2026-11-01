import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlyingRobot } from '../src/visuals.js';
import { animatePremiumMecha } from '../src/mecha-premium.js';
import {
  evolvedShotColor,
  evolvedShotTier,
  dockedPodPower,
  podLaserMultiplier,
  lockLaserCount,
  progressionSpeed,
  boostTrailLength,
} from '../src/combat-progression.js';
import {
  bossWeakPointPlan,
  bossWeakPointOpen,
  bossWeakPointAngle,
} from '../src/boss-weakpoint-layout.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import { createMothershipInterior, updateMothershipInterior } from '../src/mothership-interior.js';
import { SECTORS } from '../src/campaign.js';

test('mecha gets longer articulated limbs and distinct transforming stages without touching lock-on wrists', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.premiumMecha;
  assert.ok(rig);
  for (const part of [
    'premium-extended-forearm',
    'premium-long-greave',
    'premium-articulated-foot--1',
    'premium-knee-axis',
    'premium-visor-laser',
    'premium-hydraulic-piston',
  ])
    assert.ok(robot.getObjectByName(part), part);
  const originalMuzzle = robot.userData.mecha.arms.left.muzzle;
  const folded = animatePremiumMecha(robot, { progress: 0, level: 0 });
  const calfY = rig.calves[0].calf.position.y;
  const extending = animatePremiumMecha(robot, { progress: 0.52, level: 9 });
  const active = animatePremiumMecha(robot, { progress: 1, level: 18, time: 1.8, boosting: true });
  assert.deepEqual(
    [folded.phase, extending.phase, active.phase],
    ['release', 'extend', 'energize'],
  );
  assert.ok(rig.calves[0].calf.position.y < calfY);
  assert.equal(robot.userData.mecha.arms.left.muzzle, originalMuzzle);
  assert.equal(active.stage, 18);
  assert.ok(rig.vents.every((part) => part.visible));
});

test('weapon color tiers, boosted trails, four lock lasers and attached pod power are monotonic', () => {
  assert.equal(evolvedShotColor(0, '#123456'), '#123456');
  assert.deepEqual([0, 4, 8, 12, 16].map(evolvedShotTier), [
    'BASE',
    'TURBO',
    'SOBRECARGA',
    'NOVA',
    'HIPERPLASMA',
  ]);
  assert.equal(new Set([0, 4, 8, 12, 16].map((x) => evolvedShotColor(x, '#123456'))).size, 5);
  assert.deepEqual([0, 6, 12, 18].map(lockLaserCount), [1, 2, 3, 4]);
  assert.equal(dockedPodPower(3, 9, false), 2);
  assert.equal(dockedPodPower(3, 9, true), 1);
  assert.equal(dockedPodPower(0, 18), 1);
  assert.ok(dockedPodPower(3, 18) > dockedPodPower(3, 9));
  assert.ok(podLaserMultiplier(3, 18) > podLaserMultiplier(1, 0));
  assert.ok(progressionSpeed(18) > progressionSpeed(3));
  assert.ok(boostTrailLength(18, true) > boostTrailLength(3, true));
});

test('Devastador stage 4 has side / rear REAL breakable engine valves and rear orbit arcs', () => {
  const plan = bossWeakPointPlan(3);
  assert.equal(plan.length, 2);
  assert.ok(
    plan.every((p) => p.z < 0),
    'both target surfaces must be behind front eyes',
  );
  assert.ok(plan[0].x < -30 && plan[1].x > 30);
  assert.equal(bossWeakPointOpen(3, bossWeakPointAngle(3, 0), 0), true);
  assert.equal(bossWeakPointOpen(3, 0, 0), false);
  assert.equal(bossWeakPointOpen(3, bossWeakPointAngle(3, 1), 1), true);
  assert.equal(bossWeakPointOpen(3, 0, 1), false);
  const boss = createBossModel(SECTORS[3], 3, true);
  assert.ok(boss.userData.parts[0].mesh.position.z < 0);
  assert.ok(boss.userData.parts[1].mesh.position.z < 0);
  assert.ok(boss.userData.parts.every((p) => p.type.includes('drive-valve')));
  assert.ok(boss.getObjectByName('boss-valve-side-armor-port-drive-valve'));
  disposeBoss(boss);
  const cyborg = bossWeakPointPlan(5);
  assert.ok(cyborg[0].y !== cyborg[1].y, 'cyborg vulnerable joints are asymmetric');
});

test('carrier traversal has six distinct corridor districts with moving cranes, foundries and drives', () => {
  const interior = createMothershipInterior();
  assert.deepEqual(interior.userData.corridorKinds, [
    'hangar-landing',
    'maintenance-bays',
    'rail-foundry',
    'armory-forge',
    'reactor-cooling',
    'drive-core',
  ]);
  assert.equal(new Set(interior.userData.sections.map((s) => s.userData.kind)).size, 6);
  assert.ok(interior.getObjectByName('devastador-main-drive-engine'));
  assert.ok(interior.getObjectByName('carrier-foundry-press-1'));
  assert.ok(interior.getObjectByName('carrier-maintenance-shuttle-hull'));
  assert.ok(interior.userData.animatedMachines.length > 10);
  updateMothershipInterior(interior, 53);
  const state = interior.userData.animatedMachines.map(
    (m) => m.mesh.position.y + m.mesh.rotation.z,
  );
  updateMothershipInterior(interior, 53);
  assert.deepEqual(
    interior.userData.animatedMachines.map((m) => m.mesh.position.y + m.mesh.rotation.z),
    state,
  );
  updateMothershipInterior(interior, 56);
  assert.notDeepEqual(
    interior.userData.animatedMachines.map((m) => m.mesh.position.y + m.mesh.rotation.z),
    state,
  );
  // Decorative drive geometry must not introduce the previously rejected
  // generic tunnel-rings obstacle style or any gameplay collision.
  interior.traverse((object) => assert.equal(object.geometry?.type === 'TorusGeometry', false));
});
