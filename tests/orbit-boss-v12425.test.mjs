import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createOrbitalSatellite, createWorld } from '../src/visuals.js';
import { BOSS_DEPARTURE_SECONDS, bossDepartureAt } from '../src/boss-departure.js';
import { SECTORS } from '../src/campaign.js';

test('the Earth orbit includes a permanent recognizable satellite independent from obstacles', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const satellite = scene.getObjectByName('orbital-earth-communications-satellite');
  assert.ok(satellite, 'permanent satellite must exist in the Web world');
  assert.equal(satellite.visible, false, 'no satellite inside city');
  assert.ok(satellite.getObjectByName('orbital-satellite-antenna'));
  assert.ok(satellite.getObjectByName('orbital-satellite-beacon'));
  const box = new T.Box3().setFromObject(satellite);
  assert.ok(box.getSize(new T.Vector3()).x >= 50, 'readable solar-panel silhouette');
  world.setSector(SECTORS[0]);
  world.setLaunchAscent(0.4, true);
  assert.equal(satellite.visible, false);
  world.setLaunchAscent(0.93, true);
  assert.equal(satellite.visible, true, 'satellite appears next to Earth during orbital ascent');
  assert.equal(scene.getObjectByName('launch-earth-horizon').visible, true);
  world.setSector(SECTORS[1]);
  assert.equal(satellite.visible, false, 'landmark must not leak into other sectors');
});

test('mothership has a readable launch bay in background', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const flagship = scene.getObjectByName('distant-orbital-flagship');
  assert.ok(flagship);
  assert.ok(flagship.getObjectByName('flagship-boss-launch-hangar'));
  world.setSector(SECTORS[0]);
  world.showCarrierForBoss();
  assert.equal(flagship.visible, true, 'visible ship must precede the boss spawn');
});

test('boss departs from carrier hangar, has finite path and ends in existing arena', () => {
  const tactic = { x: 17, y: 6, z: -105 };
  const start = bossDepartureAt(0, tactic, 0);
  assert.deepEqual(start, { x: 0, y: 57, z: -680, departing: true });
  const halfway = bossDepartureAt(BOSS_DEPARTURE_SECONDS / 2, tactic, 0.5);
  assert.ok(halfway.z > -680 && halfway.z < -105);
  const arrived = bossDepartureAt(BOSS_DEPARTURE_SECONDS, tactic, 1);
  assert.deepEqual(arrived, { x: 17, y: 6, z: -105, departing: false });
  for (const age of [0, 0.1, 1, 2, BOSS_DEPARTURE_SECONDS, 100]) {
    const pose = bossDepartureAt(age, tactic, 1);
    assert.ok([pose.x, pose.y, pose.z].every(Number.isFinite));
  }
});
