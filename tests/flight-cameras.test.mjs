import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createFlightCamera } from '../src/flight.js';
import { harness } from './harness.mjs';

test('web ship moves across the screen while camera follows beyond the framing zone', () => {
  for (const aspect of [16 / 9, 390 / 844]) {
    const camera = new T.PerspectiveCamera(60, aspect, 0.1, 2500);
    const rig = createFlightCamera(camera, true);
    const player = new T.Vector3(0, 6, 9);
    rig.reset(player);
    const initial = player.clone().project(camera).x;
    for (let i = 0; i < 180; i++) {
      player.x = Math.min(72, ((i + 1) * 24) / 60);
      rig.update(1 / 60, player, 1, false);
      camera.updateMatrixWorld();
      const point = player.clone().project(camera);
      assert.ok(Math.abs(point.x) < 0.9, `ship left viewport: ${point.x}`);
    }
    assert.ok(camera.position.x > 40);
    assert.ok(player.clone().project(camera).x > initial + 0.2);
  }
});

test('web camera selection preserves combat and pause, resets on restart, and is gated on native', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(0.1);
  const shield = h.game.snapshot().shield;
  h.key('KeyC');
  h.key('KeyC', false);
  h.advance(2);
  assert.equal(h.game.snapshot().cameraMode, 'cockpit');
  assert.equal(h.game.snapshot().playerVisible, false);
  h.game.fire();
  assert.equal(h.game.snapshot().entities.shots, 2);
  assert.equal(h.game.snapshot().shield, shield);
  h.game.pause();
  const camera = h.game.snapshot().camera;
  h.game.cycleCamera();
  h.advance(1);
  assert.equal(h.game.snapshot().cameraMode, 'cockpit');
  assert.deepEqual(h.game.snapshot().camera, camera);
  h.game.pause();
  h.elements.get('cameraView').onclick();
  h.advance(2);
  assert.equal(h.game.snapshot().cameraMode, 'combat');
  assert.ok(h.game.snapshot().camera.z > 55);
  h.game.start();
  assert.equal(h.game.snapshot().cameraMode, 'chase');
  const native = harness({ nativeLifecycle: true });
  t.after(() => native.close());
  native.game.start();
  native.game.cycleCamera();
  native.key('KeyD');
  native.key('KeyW');
  native.advance(4);
  assert.equal(native.game.snapshot().cameraMode, 'chase');
  assert.equal(native.game.snapshot().player.x, 25);
  assert.equal(native.game.snapshot().player.y, 23);
});

test('pausing a 2D rift keeps the cockpit hidden and restores it only on return to flight', (t) => {
  const storage = {
    getItem: () =>
      JSON.stringify({ version: 1, sector: 2, credits: 0, weapon: 0, armor: 0, pods: 0 }),
    setItem() {},
  };
  const h = harness({ storage, spawnEncounters: true });
  t.after(() => h.close());
  h.game.start(true);
  h.game.cycleCamera();
  h.advance(0.1);
  assert.equal(h.elements.get('cockpitPanel').hidden, false);
  h.advance(8);
  assert.equal(h.game.snapshot().state, 'arcade');
  h.game.pause();
  h.advance(0.1);
  assert.equal(h.elements.get('cockpitPanel').hidden, true);
  h.game.pause();
  h.advance(19);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.elements.get('cockpitPanel').hidden, false);
});
