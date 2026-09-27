import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { defeatBoss } from './combat-helper.mjs';
function setup(t, opts) {
  const h = harness(opts);
  t.after(() => h.close());
  return h;
}
test('menu does not unlock audio or start combat', (t) => {
  const h = setup(t);
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(h.calls.audio, 0);
  h.game.fire();
  h.game.bomb();
  assert.equal(h.game.snapshot().entities.shots, 0);
  assert.equal(h.game.snapshot().bombs, 3);
});
test('user starts a mission and unlocks audio once', (t) => {
  const h = setup(t);
  h.game.start();
  h.game.start();
  assert.equal(h.calls.audio, 1);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.elements.get('menu').hidden, true);
});
test('keyboard movement is bounded and diagonal input remains finite', (t) => {
  const h = setup(t);
  h.game.start();
  h.key('KeyD');
  h.key('KeyW');
  h.advance(4);
  const s = h.game.snapshot();
  assert.equal(s.player.x, 25);
  assert.equal(s.player.y, 23);
  h.key('KeyD', false);
  h.key('KeyW', false);
  h.advance(1);
  assert.deepEqual(h.game.snapshot().player, s.player);
});
test('pause stops mission time and blocks weapons', (t) => {
  const h = setup(t);
  h.game.start();
  h.advance(1);
  h.game.pause();
  const s = h.game.snapshot();
  h.advance(2);
  h.game.fire();
  h.game.bomb();
  assert.equal(h.game.snapshot().seconds, s.seconds);
  assert.equal(h.game.snapshot().bombs, 3);
  assert.equal(h.game.snapshot().entities.shots, 0);
  h.game.pause();
  h.advance(0.1);
  assert.ok(h.game.snapshot().seconds > s.seconds);
});
test('fire creates two shots and cadence prevents duplicate dispatch', (t) => {
  const h = setup(t);
  h.game.start();
  h.game.fire();
  h.game.fire();
  assert.equal(h.game.snapshot().entities.shots, 2);
  h.advance(0.15);
  h.game.fire();
  assert.equal(h.game.snapshot().entities.shots, 4);
});
test('spawn protection and barrel roll block damage', (t) => {
  const h = setup(t);
  h.game.start();
  h.game.damage(10);
  assert.equal(h.game.snapshot().shield, 100);
  h.advance(3.1);
  h.game.roll();
  h.game.damage(10);
  assert.equal(h.game.snapshot().shield, 100);
  h.advance(0.7);
  h.game.damage(10);
  assert.equal(h.game.snapshot().shield, 90);
});
test('invalid damage cannot heal or poison shield', (t) => {
  const h = setup(t);
  h.game.start();
  h.advance(3.1);
  for (const n of [-10, NaN, Infinity]) h.game.damage(n);
  assert.equal(h.game.snapshot().shield, 100);
});
test('three bombs cannot become negative and spent shots expire', (t) => {
  const h = setup(t);
  h.game.start();
  for (let i = 0; i < 5; i++) h.game.bomb();
  assert.equal(h.game.snapshot().bombs, 0);
  h.game.fire();
  h.advance(3);
  assert.equal(h.game.snapshot().entities.shots, 0);
  assert.equal(h.game.snapshot().entities.particles, 0);
});
test('boost consumes energy and release recovers it without overflow', (t) => {
  const h = setup(t);
  h.game.start();
  h.key('ShiftLeft');
  h.advance(2);
  assert.ok(h.game.snapshot().energy < 50);
  h.key('ShiftLeft', false);
  h.advance(10);
  assert.equal(h.game.snapshot().energy, 100);
});
test('blur clears held keys and pauses safely', (t) => {
  const h = setup(t);
  h.game.start();
  h.key('KeyD');
  h.advance(0.2);
  h.window.emit('blur');
  const s = h.game.snapshot();
  assert.equal(s.state, 'paused');
  h.game.pause();
  h.advance(0.2);
  assert.equal(h.game.snapshot().player.x, s.player.x);
});
test('touch input moves the same ship and cancellation releases movement', (t) => {
  const h = setup(t);
  h.game.start();
  const stick = h.elements.get('stick');
  stick.onpointerdown({ pointerId: 1, clientX: 85, clientY: 50 });
  h.advance(0.2);
  assert.ok(h.game.snapshot().player.x > 0);
  stick.emit('pointercancel');
  const x = h.game.snapshot().player.x;
  h.advance(0.2);
  assert.equal(h.game.snapshot().player.x, x);
});
test('boss generators protect the core and bombs cannot skip the defeat cinematic', (t) => {
  const h = setup(t);
  h.game.start();
  h.advance(65.05, 0.1);
  const hp = h.game.snapshot().bossHp;
  h.game.bomb();
  assert.equal(h.game.snapshot().bossHp, hp);
  defeatBoss(h, { untilHp: 10 });
  for (
    let i = 0;
    i < 80 && (!h.game.snapshot().coreOpen || h.game.snapshot().bossAge % 7 > 4.5);
    i++
  ) {
    h.game.roll();
    h.advance(0.1);
  }
  h.advance(0.3);
  h.game.bomb();
  assert.equal(h.game.snapshot().state, 'collapsing');
  assert.equal(h.elements.get('shop').hidden, true);
  h.advance(8.1, 0.1);
  assert.equal(h.game.snapshot().state, 'shop');
  assert.equal(h.game.snapshot().boss, false);
});
test('defeat and restart reset encounter and resource state', (t) => {
  const h = setup(t);
  h.game.start();
  for (let i = 0; i < 3; i++) {
    h.advance(3.1);
    h.game.damage(200);
    if (i < 2) h.advance(1.6);
  }
  assert.equal(h.game.snapshot().state, 'lost');
  h.game.start();
  const s = h.game.snapshot();
  assert.equal(s.state, 'playing');
  assert.equal(s.shield, 100);
  assert.equal(s.bombs, 3);
  assert.equal(s.seconds, 0);
  assert.equal(s.entities.shots, 0);
  assert.equal(h.elements.get('result').hidden, true);
});
test('encounters spawn actual entities and clean up on restart', (t) => {
  const h = setup(t, { spawnEncounters: true });
  h.game.start();
  h.advance(3);
  assert.ok(h.game.snapshot().entities.enemies > 0);
  h.game.start();
  assert.equal(h.game.snapshot().entities.enemies, 0);
});
test('frame-rate variation does not change movement distance', (t) => {
  const a = setup(t),
    b = setup(t);
  a.game.start();
  b.game.start();
  a.key('KeyD');
  b.key('KeyD');
  a.advance(0.5, 1 / 30);
  b.advance(0.5, 1 / 60);
  assert.ok(Math.abs(a.game.snapshot().player.x - b.game.snapshot().player.x) < 1e-6);
});
test('invalid simulation steps fail explicitly', (t) => {
  const h = setup(t);
  for (const dt of [-1, NaN, 2]) assert.throws(() => h.game.step(dt), RangeError);
});
