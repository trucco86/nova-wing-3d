import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import {
  chooseBossIntent,
  bossMeleeHit,
  bossExclusiveFootprint,
  bossMeleePose,
} from '../src/boss-combat-ai.js';
import { bossRadarPlan } from '../src/boss-radar.js';
import { bossSignaturePose } from '../src/boss-signature.js';

const base = { cycle: 1, phase: 2, playerX: 4, playerY: 13, orbit: 0 };

test('Rok, Stingray, Carbide and Orion select distinct physical attacks for real pilot inputs', () => {
  const scenarios = [
    [0, { cycle: 3 }, 'rok-ram'],
    [0, { orbit: 1.4 }, 'rok-pincer'],
    [1, {}, 'stingray-scissor'],
    [1, { playerY: 34 }, 'stingray-sting'],
    [1, { boosting: true }, 'stingray-sting'],
    [2, {}, 'drill-ram'],
    [2, { orbit: -1.5 }, 'drill-crosscut'],
    [8, {}, 'orion-gravity-pulse'],
    [8, { playerY: 34 }, 'orion-iris-shear'],
    [8, { orbit: 1.1 }, 'orion-iris-shear'],
  ];
  const kinds = new Set();
  for (const [sector, overrides, expected] of scenarios) {
    const intent = chooseBossIntent({ ...base, sector, ...overrides });
    assert.equal(intent.kind, expected, 'sector ' + sector);
    assert.ok(intent.origin.startsWith('signature-'), 'attack belongs to named physical mesh');
    assert.ok(Object.isFrozen(intent), 'attack is latched at windup');
    assert.ok(bossMeleeHit(intent, { x: intent.targetX, y: intent.targetY }));
    assert.ok(bossExclusiveFootprint(intent.kind), 'unique footprint is authored');
    assert.ok(intent.label.length >= 20, 'warns player how to evade');
    kinds.add(intent.kind);
  }
  assert.equal(kinds.size, 8);
  for (const sector of [0, 1, 2, 8])
    assert.equal(chooseBossIntent({ ...base, sector, cycle: 4 }).kind, 'barrage');
});

test('exclusive danger shapes exactly match radar and expose a reachable safe direction', () => {
  const shapes = [
    [0, { orbit: 1.4 }, 'rect', [0, 25]],
    [0, { cycle: 3 }, 'ellipse', [28, 13]],
    [1, {}, 'rect', [23, 13]],
    [1, { playerY: 34 }, 'ellipse', [25, 34]],
    [2, { orbit: 1.4 }, 'rect', [4, 30]],
    [8, {}, 'ellipse', [28, 13]],
    [8, { playerY: 34 }, 'rect', [20, 34]],
  ];
  for (const [sector, overrides, shape, safe] of shapes) {
    const intent = chooseBossIntent({ ...base, sector, ...overrides });
    const danger = bossRadarPlan(intent, {
      x: intent.targetX,
      y: intent.targetY,
      originX: 15,
      originY: 16,
      orbit: overrides.orbit ?? 0,
    });
    assert.equal(danger.shape.type, shape, intent.kind);
    assert.equal(danger.threatened, true, intent.kind);
    assert.equal(danger.dangerActive, true, intent.kind);
    assert.ok(danger.exit, 'safe route must exist for ' + intent.kind);
    const escaped = bossRadarPlan(intent, {
      x: safe[0],
      y: safe[1],
      orbit: overrides.orbit ?? 0,
    });
    assert.equal(bossMeleeHit(intent, { x: safe[0], y: safe[1] }), false, intent.kind);
    assert.equal(escaped.threatened, false, intent.kind);
    assert.equal(escaped.guide, 'SEGURO · MANTENHA');
    assert.equal(bossMeleeHit(intent, { x: intent.targetX, y: intent.targetY }), true);
    assert.ok(bossMeleePose(intent, 'windup', 1).lunge === 0, 'no hidden lunge');
  }
});

test('four boss visual identities telegraph on their own real articulations', () => {
  const actions = [
    [0, 'rok-pincer', 'signature-rok-left'],
    [1, 'stingray-scissor', 'signature-stingray-scissor-left'],
    [2, 'drill-crosscut', 'signature-drill-bit'],
    [8, 'orion-iris-shear', 'signature-orion-lens'],
  ];
  for (const [sector, attack, meshName] of actions) {
    const boss = createBossModel(SECTORS[sector], sector, true);
    try {
      const part = boss.getObjectByName(meshName);
      assert.ok(part, 'visible articulated mesh for ' + attack);
      const originalGenerators = boss.userData.parts.map((p) => p.mesh.position.clone());
      const windup = bossSignaturePose(sector, 5, 2, 'windup', attack);
      const strike = bossSignaturePose(sector, 5.3, 2, 'attack', attack);
      assert.notDeepEqual(windup, strike, attack);
      animateBossSignature(boss, sector, 5, 2, 'windup', attack);
      const readyAngle = part.rotation.clone();
      animateBossSignature(boss, sector, 5.3, 2, 'attack', attack);
      const fireAngle = part.rotation.clone();
      assert.ok(
        Math.abs(readyAngle.x - fireAngle.x) +
          Math.abs(readyAngle.y - fireAngle.y) +
          Math.abs(readyAngle.z - fireAngle.z) >
          0.1,
        attack + ' has an observable physical windup',
      );
      boss.userData.parts.forEach((p, i) =>
        assert.ok(p.mesh.position.equals(originalGenerators[i]), 'real hitboxes must never move'),
      );
    } finally {
      disposeBoss(boss);
    }
  }
});
