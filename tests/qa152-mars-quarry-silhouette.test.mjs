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


test('QA152 visual follow-up: existing quarry pincers and stacks stand vertically without additional meshes', () => {
  const mars = createBossModel(SECTORS[1], 1, true);
  const phoenix = createBossModel(SECTORS[4], 4, true);
  try {
    const identity = mars.getObjectByName('boss-distinct-martian-dune-colossus');
    const crust = identity.getObjectByName('mars-armored-crust');
    const visor = identity.getObjectByName('mars-excavator-visor');
    assert.ok(crust.position.y >= 21, 'tall mining cab replaces flat manta profile');
    assert.ok(visor.position.y >= 24, 'operator visor is high and visible');
    const stacks = [];
    for (const side of [-1, 1]) {
      const pincer = mars.getObjectByName(
        side < 0 ? 'signature-stingray-scissor-left' : 'signature-stingray-scissor-right',
      );
      assert.ok(pincer);
      assert.equal(pincer.children.length, 2, 'reuse existing armor and energy parts');
      assert.ok(pincer.children[0].scale.y > pincer.children[0].scale.x);
      assert.ok(pincer.position.y < 0, 'pincers hang from the mining body');
      for (let i = 0; i < 3; i++)
        stacks.push(identity.getObjectByName('mars-thermal-vent-' + side + '-' + i));
    }
    assert.equal(stacks.length, 6);
    assert.ok(stacks.every((part) => part?.scale.y >= 20), 'six real exhaust stacks stand upright');
    assert.equal(mars.children.filter(isLegacyWing).length, 0);
    assert.equal(phoenix.children.filter(isLegacyWing).length, 20);
    const original = mars.userData.parts.map((part) => part.mesh.position.toArray());
    animateBossSignature(mars, 1, 4, 2, 'windup', 'stingray-scissor');
    animateBossSignature(mars, 1, 4.5, 2, 'attack', 'stingray-scissor');
    assert.deepEqual(mars.userData.parts.map((part) => part.mesh.position.toArray()), original);
  } finally {
    disposeBoss(mars);
    disposeBoss(phoenix);
  }
});
