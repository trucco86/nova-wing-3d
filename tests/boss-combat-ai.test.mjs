import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseBossIntent, bossMeleeHit, bossMeleePose, BOSS_MELEE } from '../src/boss-combat-ai.js';

test('four signature bosses select physical moves in response to pilot state and orbit', () => {
  assert.deepEqual(BOSS_MELEE, [2, 5, 6, 9]);
  const base = { cycle: 1, phase: 2, playerX: 10, playerY: 15, generators: [true, true] };
  assert.equal(chooseBossIntent({ ...base, sector: 9 }).kind, 'bite');
  assert.equal(chooseBossIntent({ ...base, sector: 9, orbit: 1.2 }).kind, 'claw-swipe');
  assert.equal(chooseBossIntent({ ...base, sector: 9, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, sector: 6 }).kind, 'tentacle-sweep');
  assert.equal(chooseBossIntent({ ...base, sector: 6, boosting: true }).kind, 'tentacle-grab');
  assert.equal(chooseBossIntent({ ...base, sector: 5, robot: true }).kind, 'hammer-slam');
  assert.equal(chooseBossIntent({ ...base, sector: 2 }).kind, 'drill-ram');
  assert.equal(chooseBossIntent({ ...base, sector: 9, cycle: 4 }).kind, 'barrage');
});

test('melee attacks can be avoided by leaving marked area, and do not trigger during windup', () => {
  const intent = chooseBossIntent({ sector: 9, cycle: 1, phase: 3, playerX: 10, playerY: 8 });
  assert.equal(bossMeleeHit(intent, { x: 10, y: 8 }), true);
  assert.equal(bossMeleeHit(intent, { x: 28, y: 8 }), false);
  assert.equal(bossMeleeHit(intent, { x: 10, y: 27 }), false);
  assert.equal(bossMeleePose(intent, 'windup', 1).lunge, 0);
  assert.equal(bossMeleePose(intent, 'attack', 0.7).lunge, 30);
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
