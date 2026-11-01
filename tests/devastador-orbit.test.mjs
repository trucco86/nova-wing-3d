import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  DEVASTADOR_ORBIT,
  reactorOrbitReady,
  reactorOrbitPosition,
  reactorOrbitCamera,
  reactorShotDirection,
} from '../src/devastador-orbit.js';
import { harness } from './harness.mjs';

test('real orbit places the ship around a fixed reactor without rotating the hall', () => {
  const center = new T.Vector3(0, 17, -164);
  const local = new T.Vector3(6, 13, 9);
  const a = reactorOrbitPosition(center, local, 0);
  const b = reactorOrbitPosition(center, local, Math.PI / 2);
  assert.equal(reactorOrbitReady(center), true);
  assert.equal(reactorOrbitReady(new T.Vector3(0, 0, -300)), false);
  assert.equal(a.x, 6);
  assert.ok(a.z > center.z);
  assert.ok(b.x > center.x + 150, 'the fighter physically moves to the reactor flank');
  assert.ok(Math.abs(b.z - center.z) > 1, 'steering is tangent to the orbit');
  assert.ok(Math.hypot(b.x - center.x, b.z - center.z) < DEVASTADOR_ORBIT.maxRadius + 15);
  const camera = reactorOrbitCamera(center, b, Math.PI / 2);
  assert.ok(camera.eye.x > b.x, 'camera follows behind ship at its actual orbit angle');
  assert.deepEqual(camera.aim.toArray(), [0, 20, -164]);
  const shot = reactorShotDirection(center, b, Math.PI / 2);
  assert.ok(shot.x < -100, 'laser flies toward stationary reactor from its flank');
});

test('stage 4 gameplay moves the actual pilot around the static chamber rather than spinning boss', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.advance(9, 0.1);
  const before = h.game.snapshot();
  assert.equal(before.sabotage.hall.pilotOrbitsReactor, true);
  assert.equal(before.sabotage.hall.reactorWorldYaw, 0);
  const position = before.sabotage.hall.playerWorldPosition;
  h.game.orbit(1);
  h.advance(1.4, 0.1);
  h.game.orbit(0);
  const after = h.game.snapshot();
  assert.equal(after.sabotage.hall.reactorWorldYaw, 0);
  assert.notDeepEqual(after.sabotage.hall.playerWorldPosition, position);
  assert.ok(after.strategy.orbitAngle > 0.5);
  assert.equal(after.sabotage.hall.corridorsHidden, true);
});
