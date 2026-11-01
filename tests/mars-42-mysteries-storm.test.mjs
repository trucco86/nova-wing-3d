import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMarsMysteries } from '../src/mars-mysteries.js';
import {
  MARS_STORM_START,
  MARS_STORM_END,
  marsSandstormAt,
  createMarsSandstorm,
  setMarsSandstormQuality,
  updateMarsSandstorm,
} from '../src/mars-sandstorm.js';
import { createMarsPremium, updateMarsArrival } from '../src/mars-premium.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('Olympus Mons has a shield silhouette with summit caldera and rock face formations', () => {
  const landmarks = createMarsMysteries();
  const mons = landmarks.getObjectByName('mars-olympus-mons-horizon');
  assert.ok(mons);
  assert.ok(mons.getObjectByName('mars-olympus-shield-volcano').isMesh);
  assert.ok(mons.getObjectByName('mars-olympus-summit-caldera').isMesh);
  assert.ok(mons.getObjectByName('mars-olympus-caldera-rim').isMesh);
  assert.equal(mons.userData.fixedSky, true);
  const face = landmarks.getObjectByName('mars-cydonia-pareidolia-0');
  assert.ok(face && face.userData.marsChunk);
  assert.equal(face.children.filter((m) => m.name === 'mars-face-shadowed-eye-cavity').length, 2);
  assert.ok(face.getObjectByName('mars-face-mouth-erosion'));
  assert.equal(landmarks.children.filter((m) => m.name.startsWith('mars-cydonia-')).length, 3);
  const ruins = landmarks.children.filter((m) => m.name.startsWith('mars-fictional-alien-ruins-'));
  assert.equal(ruins.length, 2);
  assert.ok(
    ruins.every(
      (site) => site.getObjectByName('mars-ancient-alien-half-arch') && site.userData.visualOnly,
    ),
  );
  landmarks.traverse((part) => assert.notEqual(part.userData.hitbox, true));
});

test('storm is centered in second half of the surface run with advance warning and steerable gusts', () => {
  assert.ok(MARS_STORM_START > 27 && MARS_STORM_END < SECTORS[1].duration);
  assert.ok(MARS_STORM_START < 27 + 80 / 2 && MARS_STORM_END > 27 + 80 / 2);
  const safe = marsSandstormAt(40);
  assert.equal(safe.active, false);
  assert.equal(safe.windX, 0);
  const warning = marsSandstormAt(MARS_STORM_START - 2);
  assert.equal(warning.phase, 'warning');
  assert.match(warning.label, /TEMPESTADE/);
  const high = marsSandstormAt(70);
  assert.equal(high.phase, 'active');
  assert.ok(high.intensity > 0.9);
  assert.ok(high.visibility < 0.6, 'sand affects visibility');
  assert.ok(Math.abs(high.windX) <= 12, 'side gust stays counter-steerable');
  const peak = [64, 67, 70, 74, 78].map((t) => marsSandstormAt(t));
  assert.ok(peak.some((v) => v.windX > 0));
  assert.ok(
    peak.some((v) => v.windX < 0),
    'wind direction changes',
  );
  assert.equal(marsSandstormAt(86).active, false);
  assert.equal(marsSandstormAt(86).windX, 0);
  assert.throws(() => marsSandstormAt(-1), RangeError);
});

test('storm visuals use batched sand particles and soft haze, not invisible hitboxes', () => {
  const root = createMarsSandstorm();
  assert.equal(root.visible, false);
  const cloud = root.getObjectByName('mars-sandstorm-particle-field');
  assert.ok(cloud.isPoints);
  assert.equal(cloud.geometry.getAttribute('position').count, 240);
  assert.equal(
    root.children.filter((m) => m.name.startsWith('mars-rolling-sand-haze-bank')).length,
    3,
  );
  updateMarsSandstorm(root, 71);
  assert.equal(root.visible, true);
  assert.ok(cloud.material.opacity > 0);
  const position = cloud.position.x;
  updateMarsSandstorm(root, 71);
  assert.equal(cloud.position.x, position, 'same game clock gives same wind state');
  updateMarsSandstorm(root, 90);
  assert.equal(root.visible, false);
  root.traverse((part) => assert.notEqual(part.userData.hitbox, true));
});

test('Mars world transitions from quiet orbit to dust storm and back; previous sectors stay untouched', () => {
  const root = createMarsPremium();
  assert.ok(root.getObjectByName('mars-mysteries-and-olympus'));
  assert.equal(root.getObjectByName('mars-sandstorm').visible, false);
  updateMarsArrival(root, 70);
  assert.equal(root.getObjectByName('mars-sandstorm').visible, true);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[1]);
  const dust = world.setMarsDescent(70);
  assert.ok(dust.storm.intensity > 0.9);
  assert.ok(scene.fog.density > 0.003, 'dust affects real game fog');
  const stormScene = scene.getObjectByName('mars-sandstorm');
  assert.equal(stormScene.visible, true);
  world.setMarsDescent(92);
  assert.equal(stormScene.visible, false);
  assert.ok(scene.fog.density < 0.001, 'vision returns to the normal desert');
  world.reset();
  assert.equal(stormScene.visible, false);
  world.setSector(SECTORS[0]);
  assert.equal(scene.getObjectByName('mars-sandstorm'), undefined);
  assert.equal(world.setMarsDescent(70), null);
});

test('Mars Medium trims only transparent storm overdraw, preserving High and physical wind', () => {
  const storm = createMarsSandstorm();
  const particles = storm.getObjectByName('mars-sandstorm-particle-field');
  const originalGeometry = particles.geometry;
  const originalMaterial = particles.material;
  const banks = storm.children.filter((part) =>
    part.name.startsWith('mars-rolling-sand-haze-bank'),
  );
  const peak = updateMarsSandstorm(storm, 71);
  assert.equal(particles.geometry.drawRange.count, Infinity);
  setMarsSandstormQuality(storm, 'medium');
  assert.equal(storm.userData.graphicsQuality, 'medium');
  assert.equal(
    particles.geometry.drawRange.count,
    144,
    'Medium cuts particles without deleting the field',
  );
  assert.equal(banks.filter((bank) => bank.visible).length, 2, 'two readable haze layers remain');
  const mediumWind = updateMarsSandstorm(storm, 71);
  assert.deepEqual(mediumWind, peak, 'difficulty, wind and warning remain unchanged');
  assert.equal(storm.visible, true, 'storm stays visible during the encounter');
  setMarsSandstormQuality(storm, 'high');
  assert.equal(particles.geometry.drawRange.count, 240, 'High restores premium density');
  assert.equal(banks.filter((bank) => bank.visible).length, 3);
  assert.equal(particles.geometry, originalGeometry, 'no new geometry allocated');
  assert.equal(particles.material, originalMaterial, 'no material churn on settings changes');
  updateMarsSandstorm(storm, 90);
  assert.equal(storm.visible, false, 'storm still ends normally');
  storm.traverse((part) => assert.notEqual(part.userData.hitbox, true));
});

test('world applies Mars quality on sector entry and live changes, without touching Earth', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setGraphicsQuality('medium');
  world.setSector(SECTORS[1]);
  const particles = scene.getObjectByName('mars-sandstorm-particle-field');
  assert.ok(particles);
  assert.equal(particles.geometry.drawRange.count, 144);
  world.setMarsDescent(70);
  assert.equal(scene.getObjectByName('mars-sandstorm').visible, true);
  world.setGraphicsQuality('high');
  assert.equal(particles.geometry.drawRange.count, 240);
  world.setGraphicsQuality('medium');
  assert.equal(particles.geometry.drawRange.count, 144);
  world.setSector(SECTORS[0]);
  assert.equal(scene.getObjectByName('mars-sandstorm'), undefined);
});
