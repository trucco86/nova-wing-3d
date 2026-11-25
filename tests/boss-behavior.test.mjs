import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MELEE_ARCHETYPES, bossMeleeDecision, bossMeleeMotion, bossMeleeConnect } from '../src/boss-behavior.js';

test('bosses have drill, claw, tentacle, and bite attacks, not only random bullets', () => {
  assert.deepEqual(Object.values(MELEE_ARCHETYPES).map((x) => x.kind), ['drill','claw','tentacle','bite']);
  for (const index of [2,5,6,9]) {
    assert.equal(bossMeleeDecision(index, { playerDistance: 25, cycle: 0 }).engage, true);
    assert.equal(bossMeleeDecision(index, { playerDistance: 70, cycle: 0 }).engage, false);
    assert.equal(bossMeleeDecision(index, { playerDistance: 25, cycle: 1, flank: true, phase: 1 }).engage, false);
    assert.ok(bossMeleeDecision(index, { phase: 3, cycle: 0, playerDistance: 25, flank: true }).engage);
  }
  assert.equal(bossMeleeDecision(1, { playerDistance: 10 }), null);
});
test('physical strikes have explicit windup, limited contact window, and retreat', () => {
  const warn = bossMeleeMotion('windup', 0);
  assert.equal(warn.telegraph, true);
  assert.equal(warn.striking, false);
  assert.equal(bossMeleeMotion('attack', 0.2).striking, false);
  assert.equal(bossMeleeMotion('attack', 0.55).striking, true);
  assert.ok(bossMeleeMotion('attack', 0.55).lunge > 0.9);
  assert.equal(bossMeleeMotion('attack', 0.9).striking, false);
  assert.equal(bossMeleeMotion('recovery', 1).lunge, 0);
});
test('dodging laterally or vertically avoids physical contact', () => {
  const boss = { x: 0, y: 10, z: -94 }, player = { x: 10, y: 12, z: 9 };
  assert.equal(bossMeleeConnect({ player, boss, reach: 28, lunge: 1 }), true);
  assert.equal(bossMeleeConnect({ player: { ...player, x: 45 }, boss, reach: 28, lunge: 1 }), false);
  assert.equal(bossMeleeConnect({ player: { ...player, y: 55 }, boss, reach: 28, lunge: 1 }), false);
  assert.equal(bossMeleeConnect({ player, boss, reach: 28, lunge: 0 }), false);
});
