import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { readStrategy, elementalDamage, stageAt } from '../src/strategy.js';
import { createGroundEnemy } from '../src/encounters.js';
import { createEvolution } from '../src/evolution.js';
import { fighter } from '../src/visuals.js';
import { defeatBoss } from './combat-helper.mjs';
function setup(t, options = {}) {
  const h = harness(options);
  t.after(() => h.close());
  h.game.start(!!options.storage);
  return h;
}
const save = (strategy) => ({
  getItem: () =>
    JSON.stringify({ version: 1, sector: 0, credits: 0, weapon: 0, armor: 0, pods: 0, strategy }),
  setItem() {},
});
test('web XP unlocks gradually, rejects corrupt selections, and restart clears progression', (t) => {
  const h = setup(t);
  h.game.collect('blue');
  assert.equal(h.game.snapshot().weapon, 1);
  assert.equal(h.game.snapshot().strategy.stage, 0);
  for (let i = 0; i < 5; i++) h.game.collect('blue');
  assert.equal(h.game.snapshot().strategy.stage, 2);
  h.game.cycleArsenal();
  assert.equal(h.game.snapshot().strategy.arsenal, 1);
  h.game.cycleArsenal();
  assert.equal(h.game.snapshot().strategy.arsenal, 0);
  for (let i = 0; i < 179; i++) h.game.collect('blue');
  assert.equal(h.game.snapshot().strategy.stage, 9);
  assert.equal(stageAt(160), 5);
  assert.deepEqual(readStrategy({ xp: -1, arsenal: 4, special: 2 }), {
    xp: 0,
    arsenal: 0,
    special: 0,
    specialty: 'attack',
  });
  h.game.start();
  assert.equal(h.game.snapshot().strategy.xp, 0);
  const n = setup(t, { nativeLifecycle: true });
  n.game.collect('blue');
  assert.equal(n.game.snapshot().weapon, 2);
  assert.equal(n.game.snapshot().strategy.xp, 0);
});
test('checkpoint persists RPG progress and equipped choices through actual hangar save', (t) => {
  const map = new Map();
  const storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) };
  const h = setup(t, { storage });
  for (let i = 0; i < 24; i++) h.game.collect('blue');
  h.game.cycleArsenal();
  h.game.cycleSpecial();
  h.advance(65.1);
  defeatBoss(h);
  assert.equal(h.game.snapshot().state, 'shop');
  const next = setup(t, { storage });
  assert.equal(next.game.snapshot().strategy.xp, h.game.snapshot().strategy.xp);
  assert.equal(next.game.snapshot().strategy.arsenal, 1);
  assert.equal(next.game.snapshot().strategy.special, 1);
});
test('barrier consumes arcana, blocks real damage, pauses and expires; nova creates projectiles', (t) => {
  const h = setup(t, { storage: save({ xp: 160, arsenal: 0, special: 0 }) });
  h.advance(3.1);
  assert.equal(h.game.castSpecial(), true);
  assert.equal(h.game.snapshot().strategy.arcana, 70);
  const shield = h.game.snapshot().shield;
  h.game.damage(30);
  assert.equal(h.game.snapshot().shield, shield);
  assert.equal(h.game.castSpecial(), false);
  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(4);
  assert.deepEqual(h.game.snapshot(), paused);
  assert.equal(h.game.castSpecial(), false);
  h.game.pause();
  h.advance(4.6);
  h.game.damage(30);
  assert.ok(h.game.snapshot().shield < shield);
  h.advance(4);
  h.game.cycleSpecial();
  assert.equal(h.game.castSpecial(), true);
  assert.equal(h.game.snapshot().entities.shots, 9);
  const directions = h.game.snapshot().shotDirections;
  assert.equal(directions.length, 9);
  assert.ok(directions.some((v) => v[2] > 100) && directions.some((v) => v[2] < -100));
  assert.ok(directions.some((v) => v[0] > 100) && directions.some((v) => v[0] < -100));
  assert.ok(directions.every((v) => Math.abs(Math.hypot(...v) - 130) < 1e-8));
  h.advance(8);
  h.game.cycleSpecial();
  assert.equal(h.game.castSpecial(), true);
  assert.equal(h.game.snapshot().strategy.stasis, 5);
});
test('docked pods amplify actual shots and deployed pods pursue moving targets', (t) => {
  const a = setup(t, { storage: save({ xp: 24, arsenal: 0, special: 0 }) });
  const b = setup(t, {
    storage: {
      getItem: () =>
        JSON.stringify({
          version: 1,
          sector: 0,
          credits: 0,
          weapon: 0,
          armor: 0,
          pods: 1,
          strategy: { xp: 24 },
        }),
      setItem() {},
    },
  });
  a.game.fire();
  b.game.fire();
  assert.ok(b.game.snapshot().shotPower >= a.game.snapshot().shotPower * 1.29);
  const h = setup(t, { spawnEncounters: true });
  for (let i = 0; i < 6; i++) h.game.collect('blue');
  h.advance(5);
  h.key('KeyV');
  h.key('KeyV', false);
  h.advance(0.2);
  const before = h.game.snapshot().podPositions[0];
  h.advance(0.4);
  const after = h.game.snapshot().podPositions[0];
  assert.ok(Math.hypot(after.x - before.x, after.z - before.z) > 2);
  assert.ok(after.z < before.z);
  h.game.pause();
  const fixed = h.game.snapshot().podPositions;
  h.advance(1);
  assert.deepEqual(h.game.snapshot().podPositions, fixed);
});
test('orbital flanks reject frontal damage, accept exposed generator hits and remain time based', (t) => {
  for (const dt of [1 / 30, 1 / 60]) {
    const h = setup(t);
    h.advance(68.1);
    const initial = h.game.snapshot().bossTargets.map((p) => p.hp);
    h.game.damageBoss(10000);
    assert.deepEqual(
      h.game.snapshot().bossTargets.map((p) => p.hp),
      initial,
    );
    h.game.orbit(-1);
    h.advance(Math.PI / 3 / 0.8, dt);
    h.game.orbit(0);
    assert.ok(Math.abs(h.game.snapshot().strategy.orbitAngle + Math.PI / 3) < 1e-6);
    const targets = h.game.snapshot().bossTargets;
    assert.equal(targets[0].open, true);
    assert.equal(targets[1].open, false);
    h.game.damageBoss(10000, new T.Vector3(...targets[0].position));
    assert.ok(h.game.snapshot().bossTargets[0].hp < initial[0]);
    h.game.pause();
    const before = h.game.snapshot();
    h.game.orbit(1);
    h.advance(2);
    assert.deepEqual(h.game.snapshot(), before);
  }
});
test('web subboss survives two bombs, changes phases, and native retains prior balance', (t) => {
  const h = setup(t, { spawnEncounters: true });
  for (let i = 0; i < 22; i++) {
    h.game.collect('shield');
    h.advance(1);
  }
  const before = h.game.snapshot().targets.find((e) => e.kind === 'subboss');
  assert.ok(before.life >= 360 && before.life < 620);
  h.game.bomb();
  h.game.bomb();
  h.advance(0.1);
  const after = h.game.snapshot().targets.find((e) => e.kind === 'subboss');
  assert.ok(after && after.life > 0 && after.life < before.life);
  assert.equal(h.game.snapshot().tunnel, false);
  assert.equal(elementalDamage(10, 'ice', 'ice'), 15);
  assert.equal(elementalDamage(10, 'fire', 'ice'), 10);
});
test('model variants and evolution have finite geometry and distinct silhouettes', () => {
  const counts = [];
  for (const stage of [0, 3, 6, 9]) {
    const g = createEvolution(stage);
    counts.push(g.children.length);
  }
  assert.ok(counts.every((n, i) => i === 0 || n > counts[i - 1]));
  for (const kind of ['tank', 'walker', 'fighter']) {
    const sizes = [];
    for (let i = 0; i < 3; i++) {
      const g = kind === 'fighter' ? fighter(true, i) : createGroundEnemy(kind, i);
      let count = 0;
      g.traverse((o) => {
        if (o.isMesh) count++;
        for (const n of o.geometry?.attributes.position.array ?? []) assert.ok(Number.isFinite(n));
      });
      sizes.push(count);
      assert.ok(new T.Box3().setFromObject(g).getSize(new T.Vector3()).length() > 5);
    }
    assert.ok(new Set(sizes).size > 1);
  }
});

test('progression continues beyond ten, specialties accelerate their branch and visuals stay bounded', async () => {
  const { xpForStage, specialtyRank } = await import('../src/strategy.js');
  for (const level of [10, 30, 100, 10000]) {
    const xp = xpForStage(level);
    assert.equal(stageAt(xp), level);
    assert.equal(stageAt(xp - 1), level - 1);
  }
  assert.ok(specialtyRank(10000, 'spirit', 'spirit') > specialtyRank(10000, 'attack', 'spirit'));
  assert.equal(readStrategy({ xp: 10000000, specialty: 'spirit' }).specialty, 'spirit');
  assert.equal(createEvolution(10000).children.length, createEvolution(18).children.length);
});
test('specialty choice applies on new game and charge scales with progression and arsenal', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.elements.get('specialty').value = 'defense';
  h.game.start();
  assert.equal(h.game.snapshot().strategy.specialty, 'defense');
  assert.equal(h.game.snapshot().shield, 125);
  const powers = [];
  for (const xp of [0, 10000]) {
    const g = setup(t, { storage: save({ xp, arsenal: xp ? 4 : 0 }) });
    g.key('Space');
    g.advance(1.5);
    g.key('Space', false);
    g.advance(0.05);
    powers.push(g.game.snapshot().chargedPower);
  }
  assert.ok(powers[0] >= 40);
  assert.ok(powers[1] > powers[0] * 3);
});

test('charged boss hits retain their own reserve under sustained normal fire', async () => {
  const { createBossCombat } = await import('../src/combat.js');
  const boss = createBossCombat(0, 1);
  for (let i = 0; i < 80; i++) {
    boss.update(0.05);
    boss.spend(1000);
  }
  assert.equal(boss.spend(10), 0);
  assert.ok(boss.spend(120, true) >= 50);
  assert.equal(boss.spend(120, true), 0);
});
