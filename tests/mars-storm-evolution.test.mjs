import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { marsSandstormAt, MARS_STORM_START, MARS_STORM_END } from '../src/mars-sandstorm.js';
import { SECTORS } from '../src/campaign.js';
import { createBossModel } from '../src/bosses.js';
import { marsBossAltitudeConstraint } from '../src/mars-boss-ground.js';
import { createMarsDustCoating, setMarsDustCoating } from '../src/mars-sandstorm.js';
import { harness } from './harness.mjs';

test('Mars storm warning, actual hazardous gusts and clearance are deterministic', () => {
  assert.equal(marsSandstormAt(MARS_STORM_START - 2).warning, true);
  assert.equal(marsSandstormAt(MARS_STORM_START - 2).hazard, false);
  const hazardous = Array.from({ length: MARS_STORM_END - MARS_STORM_START }, (_, i) =>
    marsSandstormAt(MARS_STORM_START + i),
  ).filter((storm) => storm.hazard);
  assert.ok(hazardous.length >= 3, 'severe gusts must be a real risk');
  assert.ok(hazardous.some((storm) => Math.abs(storm.windX) >= 8));
  assert.equal(marsSandstormAt(MARS_STORM_END + 1).active, false);
  assert.deepEqual(marsSandstormAt(71), marsSandstormAt(71), 'replay is identical');
});

test('Mars boss uses planetary iron-oxide tones, not blue generic armor', () => {
  const mars = createBossModel(SECTORS[1], 1, true);
  const main = mars.children.find((mesh) => mesh.isMesh && mesh.material?.metalness > 0.5);
  assert.ok(main);
  const color = main.material.color;
  assert.ok(color.r > color.g && color.g > color.b, 'warm rusty Martian armor');
  mars.updateMatrixWorld(true);
  assert.ok(new T.Box3().setFromObject(mars).getSize(new T.Vector3()).y > 10);
});

test('Martian colossus stays above terrain at varied banking and headings', () => {
  const boss = createBossModel(SECTORS[1], 1, true);
  const altitude = marsBossAltitudeConstraint(boss, { groundY: -8, clearance: 5 });
  for (const [bank, heading] of [[0, 0], [0.35, 1.1], [-0.6, -1.5], [0.52, 2.2]]) {
    boss.rotation.z = bank;
    boss.rotation.y = heading;
    boss.position.set(12, altitude(10, bank), -65);
    boss.updateMatrixWorld(true);
    const actual = new T.Box3().setFromObject(boss);
    assert.ok(actual.min.y >= -3 - 0.01, 'all visible extremities clear Mars terrain');
  }
});

test('the sand coating clears progressively and has no full-screen overlay', () => {
  const dust = createMarsDustCoating();
  assert.equal(dust.visible, false);
  setMarsDustCoating(dust, 0.85, 0);
  assert.equal(dust.visible, true);
  const stormOpacity = dust.material.opacity;
  setMarsDustCoating(dust, 0, 3);
  assert.ok(dust.material.opacity > stormOpacity);
  setMarsDustCoating(dust, 0, 1);
  assert.ok(dust.material.opacity < stormOpacity);
  setMarsDustCoating(dust, 0, 0);
  assert.equal(dust.visible, false);
  dust.geometry.dispose();
  dust.material.dispose();
});

test('Mars dust jams direct fire until three completed rolls; pause cannot advance cleanup', (t) => {
  const h = harness({ spawnEncounters: false, hostname: 'localhost' });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'stage'), true);
  h.advance(84.4, 0.1);
  let snapshot = h.game.snapshot();
  assert.equal(snapshot.state, 'playing');
  assert.equal(snapshot.sector, 2);
  assert.equal(snapshot.marsCleanse, 3);
  const beforeShots = snapshot.entities.shots;
  h.game.fire();
  assert.equal(h.game.snapshot().entities.shots, beforeShots, 'jam applies to direct API too');
  for (let expected = 2; expected >= 0; expected--) {
    h.game.roll();
    h.advance(0.22, 0.02);
    assert.equal(h.game.snapshot().marsCleanse, expected + 1, 'starting a roll is not enough');
    if (expected === 2) {
      h.game.pause();
      const pauseState = h.game.snapshot();
      h.advance(1.2, 0.1);
      assert.deepEqual(h.game.snapshot(), pauseState, 'pause freezes cleanup progress');
      h.game.pause();
    }
    h.advance(0.52, 0.02);
    assert.equal(h.game.snapshot().marsCleanse, expected);
    assert.equal(h.game.snapshot().marsPendingRoll, false);
  }
  h.game.fire();
  assert.ok(h.game.snapshot().entities.shots > beforeShots, 'weapons recover after third full spin');
});
