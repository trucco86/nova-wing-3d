import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';

test('ten campaign sectors have distinct, nonempty sky and accent palettes', () => {
  assert.equal(SECTORS.length, 10);
  const signatures = SECTORS.map(({ sky, accent }) => {
    assert.match(sky, /^#[0-9a-f]{6}$/i);
    assert.match(accent, /^#[0-9a-f]{6}$/i);
    assert.notEqual(sky.toLowerCase(), accent.toLowerCase());
    return sky + ':' + accent;
  });
  assert.equal(new Set(signatures).size, SECTORS.length);
});

test('sector transitions update the actual scene background, not just HUD accents', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, false);
  for (const sector of SECTORS) {
    world.setSector(sector);
    const expected = new T.Color(sector.sky);
    assert.equal(scene.background.getHexString(), expected.getHexString(), sector.name);
  }
});

test('urban districts and orbital globe never render together during ascent', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const globe = scene.getObjectByName('world-orbital-globe');
  const city = scene.getObjectByName('world-urban-city');
  const cityFar = scene.getObjectByName('world-urban-city-far');
  assert.ok(globe);
  assert.ok(city);
  assert.ok(cityFar);
  for (const sector of [SECTORS[0], SECTORS[1]]) {
    world.setSector(sector);
    assert.equal(globe.visible, false, 'globe is hidden during urban gameplay');
    assert.equal(city.visible, true, 'urban scenery remains visible');
  }
  world.setSector(SECTORS[2]);
  world.setAscent(0.5, true);
  assert.equal(city.visible, false);
  assert.equal(cityFar.visible, false);
  assert.equal(globe.visible, true, 'orbit reveals the globe after the city is gone');
});
