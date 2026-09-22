import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { defeatBoss } from './combat-helper.mjs';
import { createPod, createPickup, PICKUP_COLORS } from '../src/equipment.js';
import { createCollapse, updateCollapse, disposeCollapse } from '../src/finale.js';
function setup(t, opts) {
  const h = harness(opts);
  t.after(() => h.close());
  h.game.start();
  return h;
}
test('boss armor sustains combat across three stages even against extreme damage', (t) => {
  const h = setup(t);
  h.advance(65.05, 0.1);
  h.game.damageBoss(1e6);
  assert.equal(h.game.snapshot().bossParts, 2, 'arrival shields active');
  const phases = new Set();
  let combatSeconds = 0;
  while (h.game.snapshot().state !== 'collapsing' && combatSeconds < 120) {
    h.game.roll();
    h.advance(0.1);
    h.game.damageBoss(1e6);
    combatSeconds += 0.1;
    phases.add(h.game.snapshot().bossPhase);
  }
  assert.equal(h.game.snapshot().state, 'collapsing');
  assert.ok(combatSeconds > 40 && combatSeconds < 90, 'bounded sustained encounter');
  assert.deepEqual([...phases], [1, 2, 3]);
});
test('subboss stays visible, blocks overlap and survives a single bomb', (t) => {
  const h = setup(t, { spawnEncounters: true });
  for (let i = 0; i < 36; i++) {
    h.game.collect('shield');
    h.advance(1);
  }
  const sub = h.game.snapshot().targets.find((e) => e.kind === 'subboss');
  assert.ok(sub && sub.z < -75 && sub.z > -100);
  assert.equal(h.game.snapshot().tunnel, false);
  assert.equal(h.elements.get('subHUD').hidden, false);
  h.game.bomb();
  assert.ok(h.game.snapshot().encounterKinds.includes('subboss'));
  h.game.bomb();
  h.advance(0.1);
  assert.ok(!h.game.snapshot().encounterKinds.includes('subboss'));
  assert.equal(h.elements.get('subHUD').hidden, true);
  assert.equal(h.game.snapshot().tunnel, true);
});
test('green health and blue upgrade rings retain distinct colors and effects', (t) => {
  const green = createPickup('shield'),
    blue = createPickup('blue');
  assert.equal(green.userData.color, PICKUP_COLORS.shield);
  assert.equal(blue.userData.color, PICKUP_COLORS.blue);
  assert.notEqual(green.children[0].material, blue.children[0].material);
  assert.ok(green.children[0].material.color.g > green.children[0].material.color.b * 3);
  assert.ok(blue.children[0].material.color.b > blue.children[0].material.color.g * 3);
  const h = setup(t, { spawnEncounters: true });
  h.advance(4.1);
  h.game.damage(40);
  const hp = h.game.snapshot().shield;
  h.game.collect('shield');
  assert.equal(h.game.snapshot().shield, hp + 25);
  assert.equal(h.game.snapshot().weapon, 1);
  h.game.collect('blue');
  assert.equal(h.game.snapshot().weapon, 2);
  assert.equal(h.game.snapshot().shield, hp + 25);
  assert.equal(h.game.snapshot().pickups[0].kind, 'blue');
  h.advance(6.1);
  assert.ok(h.game.snapshot().pickups.some((r) => r.kind === 'shield'));
});
test('pods evolve through three armored forms and reset formation on restart', (t) => {
  const counts = [];
  for (let i = 1; i <= 3; i++) {
    const p = createPod(i);
    let meshes = 0;
    p.traverse((o) => {
      if (o.isMesh) meshes++;
      for (const n of o.geometry?.attributes.position.array ?? []) assert.ok(Number.isFinite(n));
    });
    counts.push(meshes);
    assert.ok(new T.Box3().setFromObject(p).getSize(new T.Vector3()).z > 3);
  }
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
  const h = setup(t);
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < 3; i++) h.game.collect('blue');
    assert.deepEqual(h.game.snapshot().podLevels, Array(level).fill(level));
  }
  h.key('KeyV');
  assert.equal(h.game.snapshot().podsDetached, true);
  h.game.start();
  assert.equal(h.game.snapshot().podsDetached, false);
  assert.deepEqual(h.game.snapshot().podLevels, []);
});
test('reactor collapse freezes on blur, rejects damage and rewards only after eight seconds', (t) => {
  const h = setup(t);
  h.advance(65.05, 0.1);
  defeatBoss(h, { stopAtCollapse: true });
  const initial = h.game.snapshot();
  assert.equal(initial.state, 'collapsing');
  assert.equal(initial.music.mode, 'collapse');
  h.game.damage(9999);
  h.game.bomb();
  assert.equal(h.game.snapshot().shield, initial.shield);
  h.advance(2);
  h.window.emit('blur');
  const paused = h.game.snapshot();
  h.advance(3);
  assert.deepEqual(h.game.snapshot(), paused);
  h.game.pause();
  h.advance(3);
  assert.equal(h.game.snapshot().state, 'collapsing');
  assert.equal(h.game.snapshot().music.mode, 'victory');
  assert.equal(h.game.snapshot().credits, initial.credits);
  h.advance(3.1);
  assert.equal(h.game.snapshot().state, 'shop');
  const credits = h.game.snapshot().credits;
  h.advance(5);
  assert.equal(h.game.snapshot().credits, credits);
  h.game.start();
  assert.equal(h.game.snapshot().collapseTime, 0);
  assert.equal(h.game.snapshot().boss, false);
});
test('collapse geometry has expanding blast and dispersed debris then fades', () => {
  const g = createCollapse(new T.Vector3());
  updateCollapse(g, 3);
  assert.equal(g.getObjectByName('flash').visible, false);
  updateCollapse(g, 5.5);
  assert.ok(g.getObjectByName('wave').scale.x > 40);
  assert.ok(g.getObjectByName('debris').position.length() > 5);
  updateCollapse(g, 8);
  assert.equal(g.userData.hot.opacity, 0);
  disposeCollapse(g);
});
