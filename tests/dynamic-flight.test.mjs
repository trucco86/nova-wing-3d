import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { routeAt } from '../src/route.js';
import { createArcade } from '../src/arcade.js';
import { readCosmetics, skinPurchase } from '../src/customization.js';
import { readSave } from '../src/campaign.js';
import { defeatBoss } from './combat-helper.mjs';

function storageFor(sector = 2) {
  const map = new Map([
    [
      'nova-wing-3d-v1',
      JSON.stringify({ version: 1, sector, credits: 300, weapon: 0, armor: 0, pods: 0 }),
    ],
  ]);
  return { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) };
}
test('route starts and ends straight, turns both ways and ascends in orbit', () => {
  for (let sector = 0; sector < 10; sector++) {
    assert.equal(routeAt(sector, 0, 70).turn, 0);
    assert.equal(Math.abs(routeAt(sector, 70, 70).turn), 0);
    assert.equal(routeAt(sector, 22, 70, true).ascent, 0);
  }
  assert.ok(routeAt(0, 12, 65).turn > 0.5);
  assert.ok(routeAt(0, 40, 65).turn < -0.5);
  assert.ok(routeAt(2, 30, 70).ascent > 0.8);
});
test('bonus is bounded, pays for actual hits and cannot accumulate after completion', () => {
  const a = createArcade(3);
  for (let i = 0; i < 720; i++) a.update(0.025, { x: 0, y: 0, fire: true });
  assert.ok(a.snapshot().hits > 0);
  a.update(0.1, { x: 0, y: 0, fire: false });
  const completed = a.snapshot();
  assert.equal(completed.done, true);
  a.update(1, { x: 1, y: 1, fire: true });
  assert.deepEqual(a.snapshot(), completed);
});
test('2D interruption freezes campaign, pauses on blur, accepts touch and returns once', (t) => {
  const h = harness({ storage: storageFor(), spawnEncounters: true });
  t.after(() => h.close());
  h.game.start(true);
  h.advance(8.1);
  const entry = h.game.snapshot();
  assert.equal(entry.state, 'arcade');
  h.elements
    .get('stick')
    .onpointerdown({ pointerId: 1, clientX: 75, clientY: 30, preventDefault() {} });
  h.elements.get('fireTouch').onpointerdown({ pointerId: 2, preventDefault() {} });
  h.advance(0.5);
  assert.ok(h.game.snapshot().arcade.player.x > 170);
  assert.ok(h.game.snapshot().arcade.shots.length > 0);
  h.window.emit('blur');
  const paused = h.game.snapshot();
  h.advance(2);
  assert.equal(paused.state, 'paused');
  assert.deepEqual(h.game.snapshot().arcade, paused.arcade);
  h.game.pause();
  h.key('Space');
  h.advance(18);
  const back = h.game.snapshot();
  assert.equal(back.state, 'playing');
  assert.equal(back.arcade, null);
  assert.ok(back.seconds < entry.seconds + 2);
  assert.ok(back.credits >= entry.credits);
  h.advance(0.2);
  assert.equal(h.game.snapshot().state, 'playing');
  h.game.start();
  assert.equal(h.game.snapshot().arcade, null);
});
test('native sessions do not enter the web bonus or turn the route', (t) => {
  const h = harness({ storage: storageFor(), spawnEncounters: true, nativeLifecycle: true });
  t.after(() => h.close());
  h.game.start(true);
  h.advance(9);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().route.turn, 0);
});
test('cosmetic purchases reject missing balance, score and unknown ids; owned equip is free', () => {
  const profile = readCosmetics(null);
  assert.equal(skinPurchase(profile, 'solar', 1000, 20), null);
  assert.equal(skinPurchase(profile, 'ember', 119, 200), null);
  assert.equal(skinPurchase(profile, 'invalid', 1000, 200), null);
  const purchase = skinPurchase(profile, 'ember', 120, 0);
  assert.equal(purchase.credits, 0);
  assert.equal(skinPurchase(purchase, 'ember', 0, 0).credits, 0);
});
test('hangar paint purchases persist ownership, score and selected paint across reload', (t) => {
  const storage = storageFor(0);
  const h = harness({ storage });
  t.after(() => h.close());
  h.game.start(true);
  assert.equal(h.game.buySkin('ember'), false);
  h.advance(65.1);
  defeatBoss(h);
  const before = h.game.snapshot();
  assert.equal(h.game.buySkin('ember'), true);
  assert.equal(h.game.snapshot().credits, before.credits - 120);
  assert.equal(h.game.buySkin('ember'), true);
  assert.equal(h.game.snapshot().credits, before.credits - 120);
  const saved = readSave(storage);
  assert.equal(saved.cosmetics.skin, 'ember');
  assert.ok(saved.score >= 50);
  const reload = harness({ storage });
  t.after(() => reload.close());
  reload.game.start(true);
  assert.equal(reload.game.snapshot().cosmetics.skin, 'ember');
  assert.equal(reload.game.snapshot().hits, saved.score);
});

test('curved rendering preserves finale fade and mesh-driven particle opacity', async () => {
  const T = await import('three');
  const { createRouteRenderer } = await import('../src/route.js');
  const { createCollapse, updateCollapse, disposeCollapse } = await import('../src/finale.js');
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera();
  const collapse = createCollapse(new T.Vector3());
  scene.add(collapse);
  const route = createRouteRenderer(scene, camera);
  route.prepare();
  const wave = collapse.getObjectByName('wave');
  updateCollapse(collapse, 6.1);
  assert.ok(Math.abs(wave.material.opacity - 0.5) < 1e-9);
  updateCollapse(collapse, 8);
  assert.equal(wave.material.opacity, 0);
  wave.material.opacity = 0.3;
  assert.equal(collapse.userData.hot.opacity, 0.3);
  route.destroy();
  disposeCollapse(collapse);
});
