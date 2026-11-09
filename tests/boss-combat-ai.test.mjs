import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseBossIntent,
  bossMeleeHit,
  bossMeleePose,
  BOSS_MELEE,
} from '../src/boss-combat-ai.js';

test('four signature bosses select physical moves in response to pilot state and orbit', () => {
  assert.deepEqual(BOSS_MELEE, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const base = { cycle: 1, phase: 2, playerX: 10, playerY: 15, generators: [true, true] };
  assert.equal(chooseBossIntent({ ...base, sector: 9 }).kind, 'bite');
  assert.equal(chooseBossIntent({ ...base, sector: 9, orbit: 1.2 }).kind, 'claw-swipe');
  assert.equal(chooseBossIntent({ ...base, sector: 9, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, sector: 6 }).kind, 'tentacle-sweep');
  assert.equal(chooseBossIntent({ ...base, sector: 6, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, sector: 5, robot: true }).kind, 'ice-quake');
  assert.equal(chooseBossIntent({ ...base, sector: 2 }).kind, 'drill-ram');
  assert.equal(chooseBossIntent({ ...base, sector: 9, cycle: 4 }).kind, 'barrage');
});

test('melee attacks can be avoided by leaving marked area, and do not trigger during windup', () => {
  const intent = chooseBossIntent({ sector: 9, cycle: 1, phase: 3, playerX: 10, playerY: 8 });
  assert.equal(bossMeleeHit(intent, { x: 10, y: 8 }), true);
  assert.equal(bossMeleeHit(intent, { x: 28, y: 8 }), false);
  assert.equal(bossMeleeHit(intent, { x: 10, y: 27 }), false);
  assert.equal(bossMeleePose(intent, 'windup', 1).lunge, 0);
  assert.equal(bossMeleePose(intent, 'attack', 0.7).lunge, 72);
  assert.ok(bossMeleePose(intent, 'windup', 1).jaw > 0);
  assert.ok(bossMeleePose(intent, 'attack', 0.7).jaw > 0);
  assert.equal(bossMeleePose(null, 'attack', 1).lunge, 0);
});
test('tentacle sweeps demand vertical dodge, claws demand flanking dodge', () => {
  const sweep = chooseBossIntent({ sector: 6, cycle: 1, playerX: 4, playerY: 13 });
  assert.equal(bossMeleeHit(sweep, { x: 4, y: 13 }), true);
  assert.equal(bossMeleeHit(sweep, { x: 4, y: 28 }), false);
  const claw = chooseBossIntent({ sector: 9, cycle: 2, orbit: 1.2, playerX: 4, playerY: 13 });
  assert.equal(bossMeleeHit(claw, { x: 4, y: 13, orbit: 1.2 }), true);
  assert.equal(bossMeleeHit(claw, { x: 4, y: 13, orbit: 0 }), false);
});

test('Marvin and Hydra counter player altitude without invisible retargeting', () => {
  const neutral = { cycle: 1, phase: 2, playerX: 8, playerY: 12, orbit: 0 };
  for (const sector of [6, 9]) {
    const low = chooseBossIntent({ ...neutral, sector });
    const high = chooseBossIntent({ ...neutral, sector, playerY: 35 });
    assert.equal(high.kind, 'tentacle-grab');
    assert.equal(high.counter, 'altitude');
    assert.notEqual(low.kind, high.kind);
    assert.equal(high.targetY, 35);
    assert.equal(bossMeleeHit(high, { x: 8, y: 35 }), true);
    assert.equal(bossMeleeHit(high, { x: 34, y: 35 }), false);
    assert.equal(bossMeleeHit(high, { x: 8, y: 12 }), false);
    assert.ok(Object.isFrozen(high), 'attack location must latch at windup');
    const boost = chooseBossIntent({ ...neutral, sector, boosting: true });
    assert.equal(boost.kind, 'tentacle-grab');
    assert.equal(boost.counter, 'boost');
  }
});

test('Marvin escalates aggression in final phase while keeping ranged counterplay and mecha reaction', () => {
  const base = { sector: 9, phase: 3, playerX: 0, playerY: 12, orbit: 0 };
  assert.equal(chooseBossIntent({ ...base, cycle: 3 }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, cycle: 2 }).kind, 'bite');
  assert.equal(chooseBossIntent({ ...base, cycle: 4 }).kind, 'barrage');
  const flank = chooseBossIntent({ ...base, cycle: 1, orbit: 1.2 });
  assert.equal(flank.kind, 'claw-swipe');
  assert.equal(flank.counter, 'flank');
  const mech = chooseBossIntent({ ...base, cycle: 1, robot: true });
  assert.equal(mech.kind, 'claw-swipe');
  assert.equal(mech.counter, 'mecha');
  assert.equal(bossMeleePose(flank, 'windup', 1).lunge, 0);
  assert.ok(bossMeleePose(flank, 'attack', 0.7).claw > 0.7);
});

test('Venus Phoenix dive follows the pilot position only when windup begins', () => {
  const start = chooseBossIntent({ sector: 4, cycle: 2, phase: 2, playerX: 14, playerY: 35 });
  assert.equal(start.kind, 'plasma-dive');
  assert.equal(start.origin, 'phoenix-solar-core');
  assert.equal(start.targetX, 14);
  assert.equal(start.targetY, 35);
  assert.equal(bossMeleeHit(start, { x: 14, y: 35 }), true);
  assert.equal(bossMeleeHit(start, { x: 35, y: 35 }), false);
  assert.equal(bossMeleeHit(start, { x: 14, y: 49 }), false);
  assert.ok(Object.isFrozen(start), 'new aim cannot overwrite the original danger zone');
  assert.equal(bossMeleePose(start, 'windup', 1).lunge, 0);
  assert.equal(bossMeleePose(start, 'attack', 0.7).lunge, 72);
  assert.ok(bossMeleePose(start, 'attack', 0.7).exhaust > 0);
  assert.equal(chooseBossIntent({ sector: 4, cycle: 1, boosting: true }).kind, 'plasma-dive');
});

test('Venus Phoenix wing sweep rewards vertical evasion and retains a ranged recovery', () => {
  const sweep = chooseBossIntent({ sector: 4, cycle: 1, phase: 1, playerX: 6, playerY: 10 });
  assert.equal(sweep.kind, 'solar-sweep');
  assert.equal(sweep.origin, 'phoenix-wings');
  assert.equal(bossMeleeHit(sweep, { x: 6, y: 10 }), true);
  assert.equal(bossMeleeHit(sweep, { x: 6, y: 20 }), false);
  assert.equal(bossMeleeHit(sweep, { x: 38, y: 10 }), false);
  assert.ok(bossMeleePose(sweep, 'attack', 0.7).claw > 0);
  assert.equal(chooseBossIntent({ sector: 4, cycle: 4 }).kind, 'barrage');
  // The approved Devastador encounter is explicitly outside this change.
  assert.equal(chooseBossIntent({ sector: 3, cycle: 1 }).kind, 'hammer-slam');
});

test('Europa Colossus alternates physical dodge axes and commits its target at windup', () => {
  const low = chooseBossIntent({ sector: 5, cycle: 1, phase: 2, playerX: 6, playerY: 10 });
  assert.equal(low.kind, 'ice-quake');
  assert.equal(low.origin, 'colossus-impact-plates');
  assert.equal(
    low.originMesh,
    'europa-right-claw-tip',
    'cycle 1 hammer comes from actual right claw',
  );
  assert.match(low.label, /MUDE DE ALTURA/);
  assert.equal(bossMeleeHit(low, { x: 6, y: 10 }), true);
  assert.equal(bossMeleeHit(low, { x: 6, y: 19 }), false);
  assert.equal(bossMeleeHit(low, { x: 26, y: 10 }), true);
  assert.equal(bossMeleePose(low, 'windup', 1).lunge, 0);
  assert.ok(bossMeleePose(low, 'attack', 0.7).claw > 0.7);
  const high = chooseBossIntent({ sector: 5, cycle: 2, phase: 3, playerX: 5, playerY: 30 });
  assert.equal(high.kind, 'cryo-pincer');
  assert.equal(high.origin, 'colossus-piston-arms');
  assert.equal(
    high.originMesh,
    'europa-left-claw-tip',
    'cycle 2 pincer radar follows real left claw',
  );
  assert.equal(
    chooseBossIntent({ sector: 5, cycle: 1, playerY: 10, generators: [true, false] }).originMesh,
    'europa-left-claw-tip',
    'destroyed right arm must not remain the warning origin',
  );
  assert.match(high.label, /DESVIE PARA O LADO/);
  assert.equal(bossMeleeHit(high, { x: 5, y: 30 }), true);
  assert.equal(bossMeleeHit(high, { x: 15, y: 30 }), false);
  assert.equal(bossMeleeHit(high, { x: 5, y: 9 }), false);
  assert.equal(bossMeleePose(high, 'windup', 1).lunge, 0);
  assert.ok(Object.isFrozen(high));
  assert.deepEqual([high.targetX, high.targetY], [5, 30]);
  assert.equal(chooseBossIntent({ sector: 5, cycle: 4 }).kind, 'barrage');
  assert.equal(chooseBossIntent({ sector: 5, cycle: 1, robot: true }).kind, 'ice-quake');
  assert.equal(chooseBossIntent({ sector: 3, cycle: 1 }).kind, 'hammer-slam');
});
