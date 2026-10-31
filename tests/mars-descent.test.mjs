import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMarsPremium } from '../src/mars-premium.js';
import { marsDescentAt, MARS_TOUCHDOWN_SECONDS } from '../src/mars-descent.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { STAGE_JOURNEYS } from '../src/stage-journey.js';

test('stage two is the exact reverse of Earth: space then orbit, entry, descent, surface', () => {
  const phases = [0, 6, 13, 20, 27].map((sec) => marsDescentAt(sec));
  assert.deepEqual(
    phases.map((x) => x.phase),
    ['space', 'orbit', 'entry', 'descent', 'surface'],
  );
  assert.equal(MARS_TOUCHDOWN_SECONDS, 27);
  assert.equal(SECTORS[1].duration, 107, 'preserve 80 seconds of desert action after descent');
  assert.equal(STAGE_JOURNEYS[1].destination, 'mars-descent');
  assert.equal(phases[0].terrainVisible, false);
  assert.equal(phases[0].skyMix, 0);
  assert.equal(phases[4].terrainVisible, true);
  assert.equal(phases[4].skyMix, 1);
  assert.equal(phases[4].combatReady, true);
  assert.equal(phases[0].combatReady, false);
  assert.ok(phases[2].planetScale > phases[1].planetScale);
  assert.ok(phases[3].atmosphere > 0);
  assert.equal(phases[4].planetOpacity, 0);
  assert.throws(() => marsDescentAt(-0.1), RangeError);
  assert.throws(() => marsDescentAt(Number.NaN), RangeError);
});

test('Mars starts in visible deep space; entry haze reveals ground without cutting to another scene', () => {
  const planet = createMarsPremium();
  const globe = planet.getObjectByName('mars-orbit-visible-planet');
  const surface = planet.getObjectByName('mars-surface-scene');
  const heat = planet.getObjectByName('mars-atmosphere-bow-shock');
  const phobos = planet.getObjectByName('mars-moon-phobos');
  const deimos = planet.getObjectByName('mars-moon-deimos');
  assert.ok(globe.visible, 'planet visible from space at mission start');
  assert.equal(surface.visible, false);
  assert.equal(heat.visible, false);
  assert.equal(planet.getObjectByName('mars-atmosphere-ionized-trails'), undefined,
    'the distracting re-entry scratch meshes have been removed');
  assert.ok(phobos.visible && deimos.visible);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[1]);
  const root = scene.getObjectByName('mars-premium-desert');
  assert.equal(root.userData.arrivalPhase, 'space');
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.marsGlow.value, 0);
  assert.equal(root.getObjectByName('mars-surface-scene').visible, false);
  assert.ok(scene.getObjectByName('launch-sky-dome'));
  assert.equal(scene.getObjectByName('launch-city').visible, false);
  world.setMarsDescent(15);
  assert.equal(root.userData.arrivalPhase, 'entry');
  assert.equal(root.getObjectByName('mars-atmosphere-bow-shock').visible, true);
  assert.equal(root.getObjectByName('mars-surface-scene').visible, false);
  world.setMarsDescent(23);
  assert.equal(root.userData.arrivalPhase, 'descent');
  assert.ok(root.getObjectByName('mars-surface-scene').visible);
  assert.ok(root.getObjectByName('mars-surface-scene').position.y < 0);
  const done = world.setMarsDescent(27);
  assert.equal(done.combatReady, true);
  assert.equal(root.getObjectByName('mars-surface-scene').position.y, 0);
  assert.equal(root.getObjectByName('mars-orbit-visible-planet').visible, false);
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.marsGlow.value, 1);
});

test('Mars arrival respects pause, reset, asteroid transition and Earth isolation', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.4, true);
  world.setSector(SECTORS[1]);
  world.setMarsDescent(18);
  const root = scene.getObjectByName('mars-premium-desert');
  const planet = root.getObjectByName('mars-orbit-visible-planet');
  const scale = planet.scale.x;
  world.setMarsDescent(18);
  assert.equal(planet.scale.x, scale);
  world.reset();
  assert.equal(root.userData.arrivalPhase, 'space');
  assert.equal(root.getObjectByName('mars-surface-scene').visible, false);
  world.setSector(SECTORS[2]);
  assert.equal(scene.getObjectByName('mars-premium-desert'), undefined);
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.marsGlow.value, 0);
  world.setSector(SECTORS[0]);
  assert.equal(scene.getObjectByName('launch-city').visible, true);
  assert.equal(world.setMarsDescent(27), null);
});
