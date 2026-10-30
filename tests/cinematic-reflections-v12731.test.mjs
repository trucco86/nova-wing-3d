import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  getCinematicReflectionTexture,
  setCinematicReflectionQuality,
} from '../src/cinematic-reflections.js';
import { createWorld } from '../src/visuals.js';

test('premium reflection texture has finite deterministic colors and proper equirectangular setup', () => {
  const first = getCinematicReflectionTexture();
  assert.equal(first, getCinematicReflectionTexture(), 'reuse GPU texture across scene resets');
  assert.equal(first.name, 'nova-wing-cinematic-reflection-studio');
  assert.equal(first.mapping, T.EquirectangularReflectionMapping);
  assert.equal(first.colorSpace, T.SRGBColorSpace);
  assert.equal(first.image.width, 256);
  assert.equal(first.image.height, 128);
  assert.equal(first.image.data.length, 256 * 128 * 4);
  assert.ok(first.image.data.every(Number.isFinite));
  const pixelAt = (u, v) => {
    const x = Math.round(u * 255), y = Math.round(v * 127), offset = (y * 256 + x) * 4;
    return Array.from(first.image.data.subarray(offset, offset + 3));
  };
  const softbox = pixelAt(0.26, 0.25), dark = pixelAt(0.26, 0.78);
  assert.ok(softbox[2] > dark[2] * 2, 'the high-quality reflection should reveal edges and bends');
  assert.equal(pixelAt(0.26, 0.25).length, 3);
});

test('graphics quality controls reflections and maintains existing world topology', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  world.setGraphicsQuality('medium');
  assert.equal(scene.environment, null);
  assert.equal(scene.environmentIntensity, 1);
  world.setGraphicsQuality('high');
  assert.equal(scene.environment, getCinematicReflectionTexture());
  assert.equal(scene.environmentIntensity, 0.48);
  assert.ok(city.getObjectByName('city-high-details').visible);
  world.setGraphicsQuality('medium');
  assert.equal(scene.environment, null, 'medium must not keep costly environment reflections');
  assert.equal(city.getObjectByName('city-high-details').visible, false);
});

test('the new lighting change leaves the static collision and terrain world untouched', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5);
  const city = scene.getObjectByName('launch-city');
  const ground = scene.getObjectByName('launch-ground');
  const before = ground.position.toArray();
  world.setGraphicsQuality('high');
  world.update(0.1, 0.1, 48, true);
  world.setGraphicsQuality('medium');
  assert.equal(city.children.some(o => o.name === 'city-premium-cinematic-landmarks'), false);
  assert.deepEqual(ground.position.toArray(), before);
});
