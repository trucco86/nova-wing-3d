import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';

test('ten campaign sectors use distinct sky and accent palettes without altering the campaign', () => {
  assert.equal(SECTORS.length, 10);
  const signatures = SECTORS.map(({ sky, accent, duration }) => {
    assert.match(sky, /^#[0-9a-f]{6}$/i);
    assert.match(accent, /^#[0-9a-f]{6}$/i);
    assert.notEqual(sky.toLowerCase(), accent.toLowerCase());
    assert.ok(duration >= 80, 'do not restore obsolete 65–90-second stage pacing');
    return sky + ':' + accent;
  });
  assert.equal(new Set(signatures).size, 10);
  assert.deepEqual(
    SECTORS.map(({ duration }) => duration),
    [145, 107, 82, 88, 88, 92, 92, 98, 98, 150],
    'preserve missions 1–9 exactly; the requested final Marvin chase is longer',
  );
});

test('sector lighting really changes background, not just the HUD color', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, false);
  for (const sector of SECTORS) {
    world.setSector(sector);
    assert.equal(scene.background.getHexString(), new T.Color(sector.sky).getHexString());
  }
});

test('city shows its fractured moon only before ascent, without leaking into Mars or Earth orbit', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const globe = scene.getObjectByName('world-orbital-globe');
  const city = scene.getObjectByName('launch-city');
  const cityFar = scene.getObjectByName('launch-city-far');
  const earth = scene.getObjectByName('launch-earth-horizon');
  assert.ok(globe && city && cityFar && earth);

  world.setSector(SECTORS[0]);
  assert.equal(globe.visible, true, 'opening city now has a deliberately fractured moon');
  assert.equal(globe.material.uniforms.crackIntensity.value, 1);
  assert.equal(city.visible, true, 'urban architecture is visible on Earth only');
  world.setAscent(0.4, true);
  assert.equal(globe.visible, true, 'generic ascent cannot bypass the authored city sky');

  world.setSector(SECTORS[1]);
  assert.equal(city.visible, false, 'no Earth metropolis on Mars');
  assert.equal(globe.visible, false, 'Mars has two authored moons, not a generic globe');
  assert.ok(scene.getObjectByName('mars-moon-phobos'));
  assert.ok(scene.getObjectByName('mars-moon-deimos'));
  assert.ok(scene.getObjectByName('mars-curiosity-rover'));
  assert.equal(
    scene.getObjectByName('launch-ground').visible,
    false,
    'the Mars surface replaces the generic ocean/avenue plane',
  );
  world.setSector(SECTORS[0]);
  world.setLaunchAscent(1, true);
  assert.equal(city.visible, false, 'city disappears during orbital exit');
  assert.equal(cityFar.visible, false);
  assert.equal(globe.visible, false, 'duplicate orbital globe stays off');
  assert.equal(earth.visible, true, 'first-sector Earth horizon replaces city');

  world.setSector(SECTORS[2]);
  world.setAscent(0.5, true);
  assert.equal(globe.visible, true, 'space sector may reveal the orbital globe');
  assert.equal(city.visible, false, 'urban blocks remain gone');
});
