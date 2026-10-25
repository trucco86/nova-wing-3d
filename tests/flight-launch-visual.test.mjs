import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import { routeAt } from '../src/route.js';

test('sector 1 moves city and terrain away as Earth-to-orbit horizon comes into view', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const city = scene.getObjectByName('launch-city');
  const ground = scene.getObjectByName('launch-ground');
  const earth = scene.getObjectByName('launch-earth-horizon');
  assert.ok(city);
  assert.ok(ground);
  assert.ok(earth);
  assert.equal(city.position.y, 0);
  assert.equal(ground.position.y, -7);
  assert.equal(earth.visible, false);
  world.setLaunchAscent(0.8, true);
  assert.ok(city.position.y < -150, 'buildings retreat beneath the player');
  assert.ok(ground.position.y < -150, 'terrain retreats with city');
  assert.equal(city.visible, false, 'city should no longer occlude the orbital horizon');
  assert.equal(ground.visible, false, 'flat ground must not extend into space');
  assert.ok(scene.fog.density < 0.0006, 'launch reduces atmosphere fog');
  assert.equal(earth.visible, true, 'planetary horizon becomes visible in orbit');
  assert.equal(ground.visible, false, 'planet cannot coexist with city terrain');
  world.setLaunchAscent(0.45, true);
  assert.equal(earth.visible, false, 'no planet during the city ascent');
  assert.equal(city.visible, true);
  world.setLaunchAscent(0.8, true);
  assert.ok(earth.material.uniforms.fade.value > 0.3);
  world.setSector(SECTORS[1]);
  assert.equal(city.position.y, 0, 'new sector resets city displacement');
  assert.equal(ground.position.y, -7);
  assert.equal(ground.visible, true, 'new ocean sector restores its ground');
  assert.equal(earth.visible, false, 'the launch horizon is exclusive to sector 1');
  assert.equal(earth.material.uniforms.fade.value, 0);
});

test('all ten flight sectors maintain finite bends, level boss arenas and smooth route endpoints', () => {
  for (let sector = 0; sector < SECTORS.length; sector++) {
    const duration = SECTORS[sector].duration;
    for (const progress of [0, 0.01, 0.17, 0.35, 0.6, 0.9, 1]) {
      const result = routeAt(sector, progress * duration, duration, false);
      assert.ok(Number.isFinite(result.turn));
      assert.ok(Number.isFinite(result.ascent));
      assert.ok(Number.isFinite(result.bank));
      assert.ok(Math.abs(result.turn) <= 0.7);
      const boss = routeAt(sector, progress * duration, duration, true);
      assert.equal(boss.turn, 0);
      assert.equal(boss.ascent, 0);
      assert.equal(boss.bank, 0);
    }
    assert.equal(routeAt(sector, 0, duration).turn, 0);
    assert.equal(routeAt(sector, duration, duration).turn, 0);
  }
  assert.equal(routeAt(0, SECTORS[0].duration * 0.9, SECTORS[0].duration).ascent, 0);
  assert.ok(routeAt(0, SECTORS[0].duration * 0.9, SECTORS[0].duration, false, 0.95).ascent > 1);
  for (const sector of [2, 4, 7, 9]) {
    for (const progress of [0.1, 0.4, 0.7]) {
      assert.equal(
        routeAt(sector, progress * SECTORS[sector].duration, SECTORS[sector].duration).turn,
        0,
      );
    }
  }
});
