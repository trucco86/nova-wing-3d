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
    assert.ok(duration >= 120, 'keep the approved longer mission pacing');
    return sky + ':' + accent;
  });
  assert.equal(new Set(signatures).size, 10);
});

test('sector lighting really changes background, not just the HUD color', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, false);
  for (const sector of SECTORS) {
    world.setSector(sector);
    assert.equal(scene.background.getHexString(), new T.Color(sector.sky).getHexString());
  }
});

test('city, harbor and planetary globes are mutually exclusive', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const globe = scene.getObjectByName('world-orbital-globe');
  const city = scene.getObjectByName('launch-city');
  const cityFar = scene.getObjectByName('launch-city-far');
  const earth = scene.getObjectByName('launch-earth-horizon');
  assert.ok(globe && city && cityFar && earth);

  for (const sector of [SECTORS[0], SECTORS[1]]) {
    world.setSector(sector);
    assert.equal(globe.visible, false, 'globe must be hidden during city or port sectors');
    assert.equal(city.visible, true, 'urban architecture is visible');
    world.setAscent(0.4, true);
    assert.equal(globe.visible, false, 'generic ascent cannot bypass the urban lockout');
  }
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
