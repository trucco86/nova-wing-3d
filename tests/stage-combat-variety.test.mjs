import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { createFlightCamera } from '../src/flight.js';
import { stagePerspectiveAt } from '../src/stage-variety.js';
import { createGroundEnemy, animateGroundEnemy } from '../src/encounters.js';
import { harness } from './harness.mjs';

test('only the asteroid has a cracked moon; the frozen sector uses an uncracked ice globe', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const globe = scene.getObjectByName('world-orbital-globe');
  assert.ok(globe);
  const sky = scene.getObjectByName('launch-earth-horizon');
  for (let sector = 0; sector < 10; sector++) {
    world.setSector(SECTORS[sector], sector);
    assert.equal(globe.visible, sector === 2 || sector === 5);
    if (sector === 2) assert.equal(globe.material.uniforms.crackIntensity.value, 1);
    if (sector === 5) assert.equal(globe.material.uniforms.crackIntensity.value, 0);
    assert.equal(sky.visible, false, 'Earth horizon belongs to orbital launch only');
  }
  world.setSector(SECTORS[6], 6);
  assert.ok(scene.getObjectByName('bio-nebula-spire'));
  assert.equal(globe.visible, false);
  world.setSector(SECTORS[7], 7);
  assert.ok(scene.getObjectByName('fleet-destroyed-frigate'));
  world.setSector(SECTORS[8], 8);
  assert.ok(scene.getObjectByName('orion-gravitational-lens'));
  world.setSector(SECTORS[9], 9);
  assert.ok(scene.getObjectByName('marvin-fortress-gate'));
});

test('cinematic side and overhead cameras change real 3D perspective, manually selected view wins', () => {
  const camera = new T.PerspectiveCamera(60, 16 / 9, 0.1, 2500);
  const rig = createFlightCamera(camera, true);
  const pilot = new T.Vector3(0, 6, 9);
  rig.reset(pilot);
  rig.setShot('side');
  for (let i = 0; i < 80; i++) rig.update(1 / 60, pilot, 0, false);
  assert.equal(rig.getShot(), 'side');
  assert.ok(camera.position.x > 26, 'side angle must be visually different');
  rig.setShot('overhead');
  for (let i = 0; i < 80; i++) rig.update(1 / 60, pilot, 0, false);
  assert.ok(camera.position.y > pilot.y + 50, 'overhead angle reveals flight corridor');
  rig.setMode('combat');
  rig.setShot('side');
  for (let i = 0; i < 80; i++) rig.update(1 / 60, pilot, 0, false);
  assert.equal(rig.getShot(), 'combat');
  assert.ok(camera.position.z > 55);
  rig.reset(pilot);
  assert.equal(rig.getShot(), 'combat', 'manual selection belongs to pilot');
  assert.equal(stagePerspectiveAt(6, 0.3 * 92, 92), 'side');
});

test('giant robot walks and aims; stronger leg articulation is visible', () => {
  const walker = createGroundEnemy('walker', 2);
  walker.position.set(-17, -7, -100);
  const leg = walker.getObjectByName('leg1');
  animateGroundEnemy(walker, 0.75, new T.Vector3(8, 6, 9));
  assert.ok(Math.abs(leg.rotation.x) > 0.12);
  assert.ok(Math.abs(walker.userData.turret.rotation.x) > 0.01);
});

test('armored hull takes some damage yet weak points remain the decisive strategy', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(5, 'boss'), true);
  h.advance(4.2, 0.1);
  const before = h.game.snapshot();
  assert.equal(before.bossParts, 2);
  const dealt = h.game.damageBoss(5000, null, 'kinetic', false, 'hull');
  const after = h.game.snapshot();
  assert.ok(dealt > 0, 'ordinary armor is no longer completely immune');
  assert.ok(after.bossHp < before.bossHp);
  assert.ok(after.bossHp > before.bossHp * 0.7, 'hull may not skip generator objectives');
  assert.equal(after.bossParts, 2);
});
