import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { marsSandstormAt, MARS_STORM_START, MARS_STORM_END } from '../src/mars-sandstorm.js';
import { SECTORS } from '../src/campaign.js';
import { createBossModel } from '../src/bosses.js';

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
