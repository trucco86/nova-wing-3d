import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createLaunchCelestials } from '../src/launch-celestials.js';
import { createWorld } from '../src/visuals.js';

test('city and orbital Moon share one premium crater and fracture treatment', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const cityMoon = scene.getObjectByName('world-orbital-globe');
  const orbitMoon = scene.getObjectByName('launch-orbit-moon');

  assert.ok(cityMoon?.isMesh && orbitMoon?.isMesh);
  assert.notStrictEqual(cityMoon, orbitMoon, 'opening and orbit remain independent objects');
  assert.equal(
    cityMoon.material.fragmentShader,
    orbitMoon.material.fragmentShader,
    'orbital reveal must preserve the same fractured lunar identity',
  );
  assert.ok(cityMoon.material.fragmentShader.includes('craterBowl'));
  assert.ok(cityMoon.material.fragmentShader.includes('branchC'));
  assert.equal(cityMoon.material.uniforms.crackIntensity.value, 1);
  assert.equal(orbitMoon.material.uniforms.crackIntensity.value, 1);
  assert.equal(cityMoon.material.uniforms.fade.value, 1);
  assert.equal(orbitMoon.material.uniforms.fade.value, 0);
  assert.ok(cityMoon.position.z < -1500, 'the moon remains behind the urban skyline');
  assert.equal(cityMoon.material.uniforms.backgroundDepth.value, 1);
  assert.equal(cityMoon.userData.hitbox, undefined);
});

test('premium lunar relief does not require additional draw meshes or costly per-fragment fbm layers', () => {
  const sky = createLaunchCelestials(new T.Scene());
  const moon = sky.moon;
  const shader = moon.material.fragmentShader;
  // Declaration + one use. The former shader evaluated three fbm calls for
  // almost every pixel; detail is now built from one fbm and two noise calls.
  assert.equal([...shader.matchAll(/\\bfbm\\s*\\(/g)].length, 2);
  assert.equal(moon.children.length, 0, 'fracture glow is part of the existing surface pass');
  assert.equal(moon.material.uniforms.bodyTint.value.getHexString(), 'ffffff');
  sky.setGraphicsQuality('medium');
  sky.update(0.6);
  assert.equal(moon.visible, false);
  sky.update(0.99);
  assert.equal(moon.visible, true);
  assert.ok(moon.material.uniforms.fade.value > 0);
  sky.reset();
  assert.equal(moon.visible, false);
  assert.equal(moon.material.uniforms.fade.value, 0);
});

test('fracture uniforms preserve normal and ice sector appearances', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const globe = scene.getObjectByName('world-orbital-globe');
  world.setSector(SECTORS[0]);
  assert.equal(globe.material.uniforms.crackIntensity.value, 1);
  world.setSector(SECTORS[1]);
  assert.equal(globe.material.uniforms.crackIntensity.value, 0);
  world.setSector(SECTORS[0]);
  assert.equal(globe.material.uniforms.crackIntensity.value, 1);
});
