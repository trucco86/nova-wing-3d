import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { reachSectorBoss, waitForArmoredFront, aimAtFirstGenerator } from './mission-scenarios.mjs';
import { bossTacticsAt, inDanger, chargeTactics, impactPoint } from '../src/tactics.js';

test('boss profiles telegraph before attacking, move and expose a recovery window', () => {
  const signatures = new Set();
  for (let i = 0; i < 10; i++) {
    const windup = bossTacticsAt(i, 9);
    const attack = bossTacticsAt(i, 10.5);
    const recovery = bossTacticsAt(i, 12);
    assert.equal(windup.state, 'windup');
    assert.equal(attack.state, 'attack');
    assert.equal(recovery.vulnerable, true);
    assert.ok(inDanger(attack.dangerAngle, attack));
    assert.equal(inDanger(attack.dangerAngle + Math.PI, attack), false);
    assert.notEqual(bossTacticsAt(i, 20).heading, 0);
    signatures.add(JSON.stringify([attack.x, attack.y, attack.z, attack.arc, attack.name]));
  }
  assert.equal(signatures.size, 10);
});
test('action reserve has a real movement cost, stays bounded and is delta independent', () => {
  assert.ok(chargeTactics(0, 5, false) > chargeTactics(0, 5, true));
  assert.equal(chargeTactics(2, 100, false), 3);
  let v = 0;
  for (let i = 0; i < 100; i++) v = chargeTactics(v, 0.05, false);
  assert.ok(Math.abs(v - chargeTactics(0, 5, false)) < 1e-8);
});
test('surface impact remains on the entry face even when a shot crosses an entire enemy', () => {
  const hit = impactPoint(
    new T.Vector3(2, 1, 20),
    new T.Vector3(2, 1, -20),
    new T.Vector3(),
    new T.Vector3(4, 4, 4),
  );
  assert.deepEqual(hit.toArray(), [2, 1, 4]);
});
test('scanner, reserve actions, pause and restart respect actual game state', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.game.tacticalAction('precision'), false);
  h.advance(20);
  assert.equal(h.game.tacticalAction('barrage'), true);
  assert.equal(h.game.snapshot().tactics.energy, 0);
  assert.ok(h.game.snapshot().entities.shots >= 7);
  reachSectorBoss(h, { bossAge: 20 });
  assert.equal(h.game.scanBoss(), true);
  assert.equal(h.game.scanBoss(), false);
  assert.equal(h.game.snapshot().strategy.arcana, 90);
  h.game.pause();
  const before = h.game.snapshot();
  h.advance(3);
  assert.deepEqual(h.game.snapshot(), before);
  assert.equal(h.game.tacticalAction('precision'), false);
  h.game.start();
  assert.equal(h.game.snapshot().tactics.energy, 0);
  assert.equal(h.game.snapshot().tactics.scanTime, 0);
});
test('moving boss weak points follow its orientation and native keeps its original behavior', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  reachSectorBoss(h, { bossAge: 33 });
  const s = h.game.snapshot();
  assert.ok(Math.abs(s.coreAngle) > 0.1);
  assert.ok(Math.abs(s.bossTargets[0].angle + Math.PI / 3) > 0.1);
  assert.equal(h.game.damageBoss(100, new T.Vector3(900, 900, 900)), 0);
  const n = harness({ nativeLifecycle: true });
  t.after(() => n.close());
  n.game.start();
  n.advance(20);
  assert.equal(n.game.tacticalAction('barrage'), false);
  assert.equal(n.game.snapshot().tactics.energy, 0);
});

test('real precision collision shows confirmed damage; armored hull shows blocked feedback', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  reachSectorBoss(h, { bossAge: 5 });
  waitForArmoredFront(h);
  assert.equal(
    h.game.snapshot().bossTargets.some((part) => part.open),
    false,
  );
  assert.equal(h.game.tacticalAction('precision'), true);
  h.advance(0.65);
  assert.equal(h.elements.get('hitFeedback').textContent, 'SEM DANO · AJUSTE O ÂNGULO');
  assert.equal(h.game.snapshot().bossTargets[0].hp, 180);
  aimAtFirstGenerator(h);
  assert.equal(h.game.tacticalAction('precision'), true);
  for (let i = 0; i < 15 && h.game.snapshot().bossTargets[0].hp === 180; i++) h.advance(0.1);
  assert.ok(h.game.snapshot().bossTargets[0].hp < 180);
  assert.match(h.elements.get('hitFeedback').textContent, /^(ACERTO|PONTO FRACO) \+\d+$/);
});

test('barrage keeps confirmed feedback when later projectiles are blocked', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  reachSectorBoss(h, { bossAge: 5 });
  aimAtFirstGenerator(h);
  assert.equal(h.game.tacticalAction('barrage'), true);
  for (let i = 0; i < 20 && h.game.snapshot().bossTargets[0].hp === 180; i++) h.advance(0.1);
  assert.ok(h.game.snapshot().bossTargets[0].hp < 180);
  assert.match(h.elements.get('hitFeedback').textContent, /^(ACERTO|PONTO FRACO) \+\d+$/);
});

test('checkpoint weapon label is restored before the first simulation frame', (t) => {
  const h = harness({
    storage: {
      getItem: () =>
        JSON.stringify({ version: 1, sector: 9, credits: 500, weapon: 3, armor: 1, pods: 2 }),
      setItem() {},
    },
  });
  t.after(() => h.close());
  h.game.start(true);
  assert.match(h.elements.get('weaponLabel').textContent, /PLASMA VÓRTICE/);
});
