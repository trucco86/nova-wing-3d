import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS, readSave } from '../src/campaign.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import { createMusic, TRACKS } from '../src/audio.js';
import { harness } from './harness.mjs';
import { defeatBoss } from './combat-helper.mjs';
function setup(t, options) {
  const h = harness(options);
  t.after(() => h.close());
  return h;
}
function beatBoss(h, index) {
  h.advance(SECTORS[index].duration + 0.05, 0.1);
  assert.equal(h.game.snapshot().boss, true);
  defeatBoss(h);
}
test('all ten sectors progress through hangars and only Marvin ends the campaign', (t) => {
  const h = setup(t);
  h.game.start();
  for (let i = 0; i < 10; i++) {
    assert.equal(h.game.snapshot().sector, i + 1);
    beatBoss(h, i);
    assert.equal(h.game.snapshot().boss, false);
    assert.equal(h.game.snapshot().state, i === 9 ? 'won' : 'shop');
    if (i < 9) h.game.nextSector();
  }
  h.game.nextSector();
  assert.equal(h.game.snapshot().sector, 10);
});
test('shop rejects invalid purchases and upgrades persist between sectors', (t) => {
  const h = setup(t);
  h.game.start();
  assert.equal(h.game.buy('weapon'), false);
  beatBoss(h, 0);
  const before = h.game.snapshot().credits;
  assert.equal(h.game.buy('weapon'), true);
  assert.equal(h.game.snapshot().credits, before - 180);
  assert.equal(h.game.buy('unknown'), false);
  assert.equal(h.game.buy('weapon'), false);
  h.game.nextSector();
  assert.equal(h.game.snapshot().weapon, 2);
  assert.equal(h.game.snapshot().sector, 2);
});
test('three pilots respawn in place with protection before final defeat', (t) => {
  const h = setup(t);
  h.game.start();
  h.key('KeyD');
  h.advance(0.2);
  h.key('KeyD', false);
  const position = h.game.snapshot().player;
  for (let i = 0; i < 3; i++) {
    h.advance(3.2);
    h.game.damage(500);
    assert.equal(h.game.snapshot().lives, 2 - i);
    if (i < 2) {
      assert.equal(h.game.snapshot().state, 'respawning');
      h.advance(1.6);
      assert.deepEqual(h.game.snapshot().player, position);
      h.game.damage(500);
      assert.ok(h.game.snapshot().shield > 0);
    }
  }
  assert.equal(h.game.snapshot().state, 'lost');
});
test('blue rings cap weapon and pods; held fire releases charged plasma', (t) => {
  const h = setup(t);
  h.game.start();
  for (let i = 0; i < 20; i++) h.game.collect('blue');
  assert.equal(h.game.snapshot().weapon, 6);
  assert.equal(h.game.snapshot().pods, 3);
  h.key('Space');
  h.advance(1);
  assert.ok(h.game.snapshot().charge >= 0.99);
  const before = h.game.snapshot().entities.shots;
  h.key('Space', false);
  h.advance(0.01);
  assert.equal(h.game.snapshot().charge, 0);
  assert.ok(h.game.snapshot().entities.shots > before);
});
test('checkpoint continues at the next sector; corrupt data is ignored', (t) => {
  const map = new Map(),
    storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) };
  const h = setup(t, { storage });
  h.game.start();
  beatBoss(h, 0);
  h.game.buy('weapon');
  const b = setup(t, { storage });
  b.game.start(true);
  assert.equal(b.game.snapshot().sector, 2);
  assert.equal(b.game.snapshot().weapon, 2);
  storage.setItem('nova-wing-3d-v1', '{"version":1,"sector":999}');
  assert.equal(readSave(storage), null);
  assert.equal(
    readSave({
      getItem() {
        throw Error('blocked');
      },
    }),
    null,
  );
});
test('every boss is colossal, finite and has two targetable generators', () => {
  const signatures = new Set();
  for (let i = 0; i < 10; i++) {
    const g = createBossModel(SECTORS[i], i);
    g.updateMatrixWorld(true);
    const size = new T.Box3().setFromObject(g).getSize(new T.Vector3());
    assert.ok(Math.max(size.x, size.y) > 65);
    assert.equal(g.userData.parts.length, 2);
    g.traverse((o) => {
      if (o.geometry?.attributes.position)
        assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));
    });
    signatures.add(g.children.length + ':' + size.x.toFixed(2) + ':' + size.y.toFixed(2));
    disposeBoss(g);
  }
  assert.equal(signatures.size, 10);
});
test('music has ten tracks, switches to boss, pauses and resumes without another context', () => {
  let notes = 0,
    stops = 0;
  const ctx = {
    currentTime: 0,
    destination: {},
    createGain: () => ({
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
    }),
    createOscillator: () => ({
      frequency: {},
      connect() {},
      disconnect() {},
      start() {
        notes++;
      },
      stop() {
        stops++;
      },
    }),
  };
  const m = createMusic(ctx);
  assert.equal(TRACKS.length, 10);
  m.start(3);
  m.update(0.3);
  assert.ok(notes > 0);
  const before = notes;
  m.pause();
  m.update(10);
  assert.equal(notes, before);
  m.resume();
  m.setEnabled(false);
  m.update(1);
  assert.equal(notes, before);
  m.setEnabled(true);
  m.start(9, true);
  m.update(0.3);
  assert.equal(m.snapshot().boss, true);
  assert.equal(m.snapshot().sector, 9);
  assert.ok(notes > before);
  m.destroy();
  assert.ok(stops >= notes);
});
