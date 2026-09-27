import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { createSubboss, createBossModel, disposeBoss, encounterPattern } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';
function setup(t, options) {
  const h = harness(options);
  t.after(() => h.close());
  h.game.start();
  return h;
}
test('boost visibly changes exhaust and stops on release, pause and restart', (t) => {
  const h = setup(t);
  h.advance(0.1);
  const base = h.game.snapshot().boostVisual;
  h.key('ShiftLeft');
  h.advance(0.3);
  const fast = h.game.snapshot().boostVisual;
  assert.notEqual(base.color, fast.color);
  assert.ok(fast.length > base.length * 2);
  assert.ok(h.document.body.classList.contains('boosting'));
  h.game.pause();
  assert.equal(h.document.body.classList.contains('boosting'), false);
  h.game.pause();
  h.advance(0.2);
  assert.equal(h.game.snapshot().boostVisual.color, base.color);
  h.key('ShiftLeft');
  h.advance(0.1);
  h.game.start();
  h.advance(0.1);
  assert.equal(h.game.snapshot().boostVisual.color, base.color);
});
test('rings stay reachable after portrait resize and can be collected at boost speed', (t) => {
  const h = setup(t, { spawnEncounters: true });
  h.advance(4.1);
  h.window.innerWidth = 390;
  h.window.innerHeight = 844;
  h.window.emit('resize');
  h.advance(0.1);
  const ring = h.game.snapshot().pickups[0];
  assert.ok(Math.abs(ring.x) <= (390 / 844) * 20 - 2);
  const steer = (code, seconds) => {
    h.key(code);
    h.advance(seconds);
    h.key(code, false);
  };
  steer(ring.x < 0 ? 'KeyA' : 'KeyD', Math.abs(ring.x) / 24);
  const y = h.game.snapshot().player.y;
  steer(ring.y < y ? 'KeyS' : 'KeyW', Math.abs(ring.y - y) / 20);
  const before = h.game.snapshot().weapon;
  h.key('ShiftLeft');
  h.advance(3);
  assert.ok(h.game.snapshot().weapon > before, 'actual crossing collects blue upgrade');
});
test('Force launches continuously, holds world position, pauses and returns to moving ship', (t) => {
  const h = setup(t);
  for (let i = 0; i < 3; i++) h.game.collect('blue');
  h.advance(0.5);
  const start = h.game.snapshot().podPositions[0];
  h.key('KeyV');
  h.advance(0.05);
  const moving = h.game.snapshot().podPositions[0];
  assert.ok(start.z - moving.z < 4);
  h.advance(1);
  assert.equal(h.game.snapshot().podMode, 'deployed');
  const anchor = h.game.snapshot().podPositions;
  h.key('KeyD');
  h.advance(0.5);
  h.key('KeyD', false);
  assert.deepEqual(h.game.snapshot().podPositions, anchor);
  h.game.pause();
  h.key('KeyV');
  assert.equal(h.game.snapshot().podMode, 'deployed');
  h.advance(2);
  assert.deepEqual(h.game.snapshot().podPositions, anchor);
  h.game.pause();
  h.key('KeyV');
  h.advance(0.05);
  assert.equal(h.game.snapshot().podMode, 'returning');
  h.advance(1);
  assert.equal(h.game.snapshot().podMode, 'docked');
  assert.ok(Math.abs(h.game.snapshot().podPositions[0].x - h.game.snapshot().player.x) < 0.1);
});
test('all ten encounter pairs have distinct geometry and tactical signatures', () => {
  const bosses = new Set(),
    subs = new Set(),
    patterns = new Set();
  const signature = (g) => {
    const parts = [];
    g.traverse((o) => {
      if (o.geometry) {
        for (const n of o.geometry.attributes.position.array) assert.ok(Number.isFinite(n));
        parts.push([o.geometry.type, o.position.toArray(), o.scale.toArray(), o.visible]);
      }
    });
    return JSON.stringify(parts);
  };
  for (let i = 0; i < 10; i++) {
    const boss = createBossModel(SECTORS[i], i);
    bosses.add(signature(boss));
    disposeBoss(boss);
    subs.add(signature(createSubboss(i)));
    patterns.add(JSON.stringify(encounterPattern(i, 2, new T.Vector3(0, 8, 9), 2)));
  }
  assert.equal(bosses.size, 10);
  assert.equal(subs.size, 10);
  assert.equal(patterns.size, 10);
});

test('docked Force intercepts real incoming enemy projectiles without global immunity', (t) => {
  const h = setup(t, { spawnEncounters: true });
  for (let i = 0; i < 3; i++) h.game.collect('blue');
  for (let i = 0; i < 35; i++) {
    h.game.collect('shield');
    h.advance(1);
  }
  assert.ok(h.game.snapshot().podBlocks > 0, 'projectiles actually crossed the Force');
  const before = h.game.snapshot().shield;
  h.game.damage(10);
  assert.ok(h.game.snapshot().shield < before, 'contact damage still applies');
});
