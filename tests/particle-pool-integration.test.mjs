import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('consecutive bomb explosions reuse complete spark, flash and shockwave VFX', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.game.bomb();
  assert.ok(h.game.snapshot().entities.particles >= 52, 'original cinematic bomb burst is intact');
  const afterFirst = h.game.snapshot().particlePool;
  assert.ok(afterFirst.created.spark >= 50);
  assert.ok(afterFirst.created.flash >= 1);
  assert.ok(afterFirst.created.wave >= 1);
  h.advance(1.5, 0.1);
  assert.equal(h.game.snapshot().entities.particles, 0);
  h.game.bomb();
  const afterSecond = h.game.snapshot().particlePool;
  assert.ok(afterSecond.reused.spark >= 50);
  assert.ok(afterSecond.reused.flash >= 1);
  assert.ok(afterSecond.reused.wave >= 1);
  assert.equal(afterSecond.created.spark, afterFirst.created.spark, 'no new spark meshes');
  assert.equal(afterSecond.created.wave, afterFirst.created.wave, 'one reusable wave geometry');
  h.game.start();
  assert.equal(h.game.snapshot().entities.particles, 0, 'restart clears all active particles');
  assert.equal(h.game.snapshot().particlePool.active, 0);
});
