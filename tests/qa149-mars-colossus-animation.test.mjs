import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { chooseBossIntent, bossMeleeHit } from '../src/boss-combat-ai.js';
import { BOSS_SHAPES, createBossVisualIdentity, animateBossVisualIdentity } from '../src/boss-visual-identity.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';

const materials = () => ({
  armor: new T.MeshStandardMaterial(),
  dark: new T.MeshStandardMaterial(),
  edge: new T.MeshBasicMaterial(),
  hot: new T.MeshBasicMaterial(),
});
const legState = (root) => [-1, 1].flatMap((side) =>
  [0, 1, 2].map((i) => {
    const leg = root.getObjectByName('mars-dune-walker-upper-leg-' + side + '-' + i);
    const foot = root.getObjectByName('mars-dune-walker-foot-' + side + '-' + i);
    return [leg.rotation.z, foot.position.x, foot.position.y, foot.rotation.z];
  }),
);

test('QA149: six existing Martian legs brace differently for two attacks without new draws', () => {
  const visual = createBossVisualIdentity(1, materials());
  assert.equal(BOSS_SHAPES[1], 'martian-dune-colossus');
  const original = legState(visual);
  const children = visual.children.length;
  animateBossVisualIdentity(visual, 1, 12, 2, 'maneuver');
  assert.notDeepEqual(legState(visual), original);
  animateBossVisualIdentity(visual, 1, 12, 2, 'windup', 'stingray-scissor');
  const crusher = legState(visual);
  animateBossVisualIdentity(visual, 1, 12, 2, 'windup', 'stingray-sting');
  const drilling = legState(visual);
  assert.notDeepEqual(crusher, drilling);
  assert.equal(visual.children.length, children);
  assert.equal(visual.getObjectByName('mars-excavator-visor').rotation.x, -0.12);
  animateBossVisualIdentity(visual, 1, 12, 2, 'windup', 'stingray-scissor');
  assert.deepEqual(legState(visual), crusher);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const foot = visual.getObjectByName('mars-dune-walker-foot-' + side + '-' + i);
      assert.ok(foot.position.y >= -37 - i * 5, 'feet never sink below rest');
    }
  }
  const copy = visual.clone(true);
  assert.doesNotThrow(() => animateBossVisualIdentity(copy, 1, 13, 3, 'attack', 'stingray-sting'));
  assert.notDeepEqual(legState(copy), legState(visual));
});

test('QA149: Colossus HUD tells use existing dodgeable physical footprints', () => {
  const low = chooseBossIntent({ sector: 1, cycle: 1, phase: 2, playerX: 3, playerY: 12 });
  const high = chooseBossIntent({ sector: 1, cycle: 1, phase: 2, playerX: 3, playerY: 34 });
  assert.equal(low.kind, 'stingray-scissor');
  assert.equal(high.kind, 'stingray-sting');
  assert.match(low.label, /COLOSSO DAS DUNAS/);
  assert.match(high.label, /PERFURADOR/);
  assert.doesNotMatch(low.label, /STINGRAY/);
  assert.equal(bossMeleeHit(low, { x: low.targetX, y: low.targetY }), true);
  assert.equal(bossMeleeHit(low, { x: 30, y: low.targetY }), false);
  assert.equal(bossMeleeHit(high, { x: high.targetX, y: high.targetY }), true);
  assert.equal(bossMeleeHit(high, { x: 30, y: high.targetY }), false);
});

test('QA149: boss generators remain fixed through tactical pause and phase changes', () => {
  const boss = createBossModel(SECTORS[1], 1, true);
  try {
    const before = boss.userData.parts.map((part) => part.mesh.position.toArray());
    animateBossSignature(boss, 1, 15, 2, 'windup', 'stingray-scissor');
    const root = boss.getObjectByName('boss-distinct-' + BOSS_SHAPES[1]);
    const windup = legState(root);
    animateBossSignature(boss, 1, 15, 2, 'windup', 'stingray-scissor');
    assert.deepEqual(legState(root), windup);
    animateBossSignature(boss, 1, 15.5, 2, 'attack', 'stingray-scissor');
    assert.notDeepEqual(legState(root), windup);
    animateBossSignature(boss, 1, 15.5, 3, 'attack', 'stingray-sting');
    assert.deepEqual(boss.userData.parts.map((part) => part.mesh.position.toArray()), before);
  } finally {
    disposeBoss(boss);
  }
});
