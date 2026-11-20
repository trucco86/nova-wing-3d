import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  ASTEROID_BOSS_PORTRAIT_ASPECT_LIMIT,
  ASTEROID_BOSS_PORTRAIT_FOV,
  asteroidBossPortraitFov,
} from '../src/asteroid-boss-framing.js';
import { createFlightCamera } from '../src/flight.js';

test('QA166: the real portrait combat lens widens only for the boss view', () => {
  assert.equal(asteroidBossPortraitFov(390 / 844), ASTEROID_BOSS_PORTRAIT_FOV);
  assert.equal(asteroidBossPortraitFov(320 / 568), ASTEROID_BOSS_PORTRAIT_FOV);
  assert.equal(asteroidBossPortraitFov(844 / 390), null);
  assert.equal(asteroidBossPortraitFov(1366 / 768), null);
  assert.equal(asteroidBossPortraitFov(ASTEROID_BOSS_PORTRAIT_ASPECT_LIMIT), null);
  for (const aspect of [0, -0.2, NaN, Infinity])
    assert.throws(() => asteroidBossPortraitFov(aspect), RangeError);
});

test('QA166: combat camera transitions smoothly without moving the fighter or modifying aiming targets', () => {
  const camera = new T.PerspectiveCamera(60, 390 / 844, 0.1, 2500);
  const rig = createFlightCamera(camera, true);
  const player = new T.Vector3(0, 10, 9);
  rig.reset(player);
  rig.update(1.5, player, 0, false, { bank: 0, ascent: 0 }, null);
  const normal = camera.fov;
  const previousPosition = camera.position.clone();
  rig.update(0.25, player, 0, false, { bank: 0, ascent: 0 }, ASTEROID_BOSS_PORTRAIT_FOV);
  assert.ok(camera.fov > normal);
  assert.ok(camera.fov < ASTEROID_BOSS_PORTRAIT_FOV);
  assert.ok(camera.position.distanceTo(previousPosition) < 20);
  for (let i = 0; i < 20; i++)
    rig.update(0.1, player, 0, false, { bank: 0, ascent: 0 }, ASTEROID_BOSS_PORTRAIT_FOV);
  assert.ok(camera.fov > ASTEROID_BOSS_PORTRAIT_FOV - 0.2);
  rig.setMode('cockpit');
  rig.update(2, player, 0, false, { bank: 0, ascent: 0 }, ASTEROID_BOSS_PORTRAIT_FOV);
  assert.ok(camera.fov >= 73 && camera.fov <= 75, 'cockpit keeps its original lens');
  assert.deepEqual(player.toArray(), [0, 10, 9]);
});
