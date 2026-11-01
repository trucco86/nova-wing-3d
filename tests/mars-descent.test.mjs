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
  const haze = planet.getObjectByName('mars-atmospheric-sand-haze');
  const phobos = planet.getObjectByName('mars-moon-phobos');
  const deimos = planet.getObjectByName('mars-moon-deimos');
  assert.ok(globe.visible, 'planet visible from space at mission start');
  assert.equal(surface.visible, false);
  assert.equal(haze.visible, false);
  assert.equal(planet.getObjectByName('mars-atmosphere-bow-shock'), undefined);
  assert.equal(
    haze.children.filter((child) => child.name.startsWith('mars-sand-haze-curtain-')).length,
    4,
    'four broad sand curtains replace the circular entry ring',
  );
  assert.ok(haze.getObjectByName('mars-entry-floating-sand').isPoints);
  haze.traverse((part) => {
    assert.notEqual(part.geometry?.type, 'TorusGeometry', 'no circular meshes in entry effect');
    assert.notEqual(part.userData.hitbox, true, 'sand haze cannot collide with the player');
  });
  assert.equal(
    planet.getObjectByName('mars-atmosphere-ionized-trails'),
    undefined,
    'the distracting re-entry scratch meshes have been removed',
  );
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
  assert.equal(root.getObjectByName('mars-atmospheric-sand-haze').visible, true);
  assert.ok(scene.fog.density > 0.001, 'entry fog becomes visible before the surface');
  const entryFogColor = scene.fog.color.clone();
  assert.ok(entryFogColor.r > entryFogColor.b, 'dust fog is sand/ochre, not space purple');
  assert.equal(root.getObjectByName('mars-surface-scene').visible, false);
  world.setMarsDescent(23);
  assert.equal(root.userData.arrivalPhase, 'descent');
  assert.ok(root.getObjectByName('mars-surface-scene').visible);
  assert.ok(root.getObjectByName('mars-surface-scene').position.y < 0);
  const done = world.setMarsDescent(27);
  assert.equal(done.combatReady, true);
  assert.equal(root.getObjectByName('mars-surface-scene').position.y, 0);
  assert.equal(root.getObjectByName('mars-orbit-visible-planet').visible, false);
  assert.ok(root.getObjectByName('mars-atmospheric-sand-haze').visible);
  world.setMarsDescent(32);
  assert.equal(root.getObjectByName('mars-atmospheric-sand-haze').visible, false);
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

test('sand fog follows mission time smoothly and is stable under pause or replay', () => {
  assert.equal(marsDescentAt(0).sandHaze, 0);
  assert.equal(marsDescentAt(12).sandHaze, 0);
  assert.ok(marsDescentAt(15).sandHaze > 0.9);
  assert.ok(marsDescentAt(23).sandHaze > 0.9);
  assert.ok(marsDescentAt(27).sandHaze > 0);
  assert.equal(marsDescentAt(32).sandHaze, 0);

  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[1]);
  world.setMarsDescent(18);
  const haze = scene.getObjectByName('mars-atmospheric-sand-haze');
  const first = haze.getObjectByName('mars-sand-haze-curtain-0');
  const x = first.position.x;
  const opacity = first.material.uniforms.alpha.value;
  world.setMarsDescent(18);
  assert.equal(first.position.x, x, 're-render at the same mission time cannot cause fog drift');
  assert.equal(first.material.uniforms.alpha.value, opacity);
  world.setMarsDescent(32);
  assert.equal(haze.visible, false, 'entry sand clears before regular surface gameplay');
  world.reset();
  assert.equal(haze.visible, false, 'reset returns to clear deep-space approach');
  world.setMarsDescent(18);
  assert.equal(first.position.x, x, 'replay reproduces the same atmospheric animation');
});
