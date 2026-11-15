import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { chooseBossIntent, bossMeleeHit } from '../src/boss-combat-ai.js';

const isLegacyWing = (part) =>
  part.isMesh &&
  ((part.scale.x === 15 && part.scale.y === 3 && part.scale.z === 26) ||
    (part.scale.x === 15 && part.scale.y === 0.6 && part.scale.z === 28));

test('QA152: Martian boss keeps six quarry legs but no longer has generic Phoenix wings', () => {
  const mars = createBossModel(SECTORS[1], 1, true);
  const phoenix = createBossModel(SECTORS[4], 4, true);
  try {
    assert.equal(
      mars.children.filter(isLegacyWing).length,
      0,
      'Mars must not inherit feather wings',
    );
    assert.equal(
      phoenix.children.filter(isLegacyWing).length,
      20,
      'Phoenix wings remain untouched',
    );
    assert.ok(mars.getObjectByName('mars-quarry-heavy-body'));
    assert.ok(mars.getObjectByName('mars-quarry-front-excavator'));
    assert.ok(mars.getObjectByName('mars-quarry-boring-jaw'));
    assert.ok(mars.getObjectByName('mars-quarry-port-brace'));
    assert.ok(mars.getObjectByName('mars-quarry-starboard-brace'));
    const visual = mars.getObjectByName('boss-distinct-martian-dune-colossus');
    assert.ok(visual);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        assert.ok(visual.getObjectByName('mars-dune-walker-upper-leg-' + side + '-' + i));
    }
    assert.equal(mars.userData.parts.length, 2);
    const box = new T.Box3().setFromObject(mars);
    assert.ok(box.max.x - box.min.x > 90, 'walker retains a monumental lateral silhouette');
    assert.ok(box.max.y - box.min.y > 50, 'vertical leg silhouette remains readable');
  } finally {
    disposeBoss(mars);
    disposeBoss(phoenix);
  }
});

test('QA152: destruction targets, two attacks and freeze remain independent of cosmetic shell', () => {
  const boss = createBossModel(SECTORS[1], 1, true);
  try {
    const original = boss.userData.parts.map((part) => part.mesh.position.toArray());
    for (const [y, attack] of [
      [12, 'stingray-scissor'],
      [34, 'stingray-sting'],
    ]) {
      const intent = chooseBossIntent({ sector: 1, cycle: 1, phase: 2, playerX: 5, playerY: y });
      assert.equal(intent.kind, attack);
      assert.equal(bossMeleeHit(intent, { x: intent.targetX, y: intent.targetY }), true);
      assert.equal(bossMeleeHit(intent, { x: intent.targetX + 35, y: intent.targetY }), false);
      animateBossSignature(boss, 1, 12, 2, 'windup', attack);
      const leg = boss.getObjectByName('mars-dune-walker-upper-leg--1-0');
      const before = leg.rotation.z;
      animateBossSignature(boss, 1, 12, 2, 'windup', attack);
      assert.equal(leg.rotation.z, before, 'pause locks the gait');
      animateBossSignature(boss, 1, 12.5, 2, 'attack', attack);
      assert.notEqual(leg.rotation.z, before);
    }
    assert.deepEqual(
      boss.userData.parts.map((part) => part.mesh.position.toArray()),
      original,
    );
  } finally {
    disposeBoss(boss);
  }
});
