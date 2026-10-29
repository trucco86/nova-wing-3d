import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseBossIntent, bossMeleeHit } from '../src/boss-combat-ai.js';
import { bossRadarPlan } from '../src/boss-radar.js';

test('radar warning uses the exact latched collision area, not the legacy angle sector', () => {
  for (const sector of [0, 2, 5, 6, 9]) {
    const intent = chooseBossIntent({ sector, cycle: 1, playerX: 0, playerY: 10 });
    const plan = bossRadarPlan(intent, { x: 0, y: 10, originX: 12, originY: 24 });
    assert.equal(plan.threatened, bossMeleeHit(intent, { x: 0, y: 10 }));
    assert.ok(plan.dangerActive);
    assert.equal(plan.shape.center.x >= 0 && plan.shape.center.x <= 100, true);
    assert.equal(plan.origin.x > plan.player.x, true);
    assert.match(plan.guide, /ZONA SEGURA/);
    assert.ok(plan.exit);
    // The indicated green safe spot must pass the real hit predicate.
    const bounds = { left: Math.max(-72, Math.min(72 - 80, intent.targetX - 40)), maxY: 46 };
    const x = bounds.left + ((plan.exit.x - 6) / 88) * 80;
    const y = bounds.maxY - ((plan.exit.y - 6) / 88) * 47;
    assert.equal(bossMeleeHit(intent, { x, y }), false);
  }
});

test('Marvin claw becomes safe after moving into a protected orbital flank', () => {
  const intent = chooseBossIntent({ sector: 9, cycle: 2, playerX: 5, playerY: 10, orbit: 1.2 });
  assert.equal(intent.kind, 'claw-swipe');
  const danger = bossRadarPlan(intent, { x: 5, y: 10, orbit: 1.2, originX: 3, originY: 14 });
  assert.equal(danger.threatened, true);
  assert.equal(danger.dangerActive, true);
  const safe = bossRadarPlan(intent, { x: 5, y: 10, orbit: 0, originX: 3, originY: 14 });
  assert.equal(safe.threatened, false);
  assert.equal(safe.dangerActive, false);
  assert.equal(safe.guide, 'SEGURO · MANTENHA');
});

test('radar has no phantom safe-zone for ranged barrages or missing intent', () => {
  assert.equal(bossRadarPlan(null, { x: 0, y: 10 }), null);
  assert.equal(bossRadarPlan(chooseBossIntent({ sector: 9, cycle: 4 }), { x: 0, y: 10 }), null);
});

test('a distant player is shown safe even if the boss aims at the original location', () => {
  const intent = chooseBossIntent({ sector: 9, cycle: 1, playerX: 10, playerY: 8 });
  const plan = bossRadarPlan(intent, { x: 40, y: 28, originX: 0, originY: 12 });
  assert.equal(plan.threatened, false);
  assert.equal(plan.guide, 'SEGURO · MANTENHA');
});
