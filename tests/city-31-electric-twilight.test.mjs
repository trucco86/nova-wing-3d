import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('city has lighter atmosphere, glossy road plates and chromatic LEDs in Medium', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  world.setGraphicsQuality('medium');
  const sky = scene.getObjectByName('launch-sky-dome').material;
  assert.equal(sky.uniforms.cityGlow.value, 1);
  assert.ok(sky.fragmentShader.includes('citySky'), 'city has an independent bright sky');
  assert.ok(scene.fog.density <= 0.0006, 'far towers must stay readable');
  const hemi = scene.children.find((node) => node.isHemisphereLight);
  assert.ok(hemi.intensity >= 2.5, 'metals receive enough indirect light');
  assert.equal(scene.getObjectByName('launch-ground').material.uniforms.urban.value, 1);

  const near = scene.getObjectByName('launch-city');
  const street = near.getObjectByName('city-premium-road-plates');
  const streetNeon = near.getObjectByName('city-premium-road-lights');
  const districtNeon = near.getObjectByName('city-district-wayfinding-lights');
  assert.ok(street.isInstancedMesh && street.material.color.getHex() !== 0);
  for (const mesh of [streetNeon, districtNeon]) {
    assert.ok(mesh.isInstancedMesh);
    assert.ok(mesh.instanceColor, 'multiple hues retain the same draw call');
    assert.ok(mesh.count > 3);
    const colors = new Set();
    for (let i = 0; i < 6; i++) {
      const tint = new T.Color();
      mesh.getColorAt(i, tint);
      colors.add(tint.getHexString());
    }
    assert.ok(colors.size > 1, 'first six facade/street accents must vary in color');
  }
  world.setGraphicsQuality('high');
  assert.equal(sky.uniforms.cityGlow.value, 1, 'neither preset dims the metropolis');
});

test('electric city palette fades on orbital launch and never leaks to other sectors', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const sky = scene.getObjectByName('launch-sky-dome').material;
  world.setLaunchAscent(0.75, true);
  assert.equal(sky.uniforms.cityGlow.value, 0);
  world.setSector(SECTORS[1]);
  assert.equal(sky.uniforms.cityGlow.value, 0);
  assert.equal(scene.fog.density, 0.0014, 'ocean keeps authored fog');
  assert.equal(scene.getObjectByName('launch-ground').material.uniforms.urban.value, 0);
  world.setSector(SECTORS[0]);
  world.reset();
  assert.equal(sky.uniforms.cityGlow.value, 1, 'restarting city restores vivid palette');
});
