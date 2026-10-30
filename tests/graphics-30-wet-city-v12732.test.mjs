import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { createPremiumWetRoadFragment } from '../src/premium-wet-road.js';
import { createPremiumRoadDressing } from '../src/premium-road-dressing.js';

test('city wet-road shader preserves ocean rendering and isolates expensive cinematic floor', () => {
  const shader = createPremiumWetRoadFragment('float noise(vec3 p){return 0.5;}');
  assert.ok(shader.includes('uniform float cityWet;'));
  assert.ok(shader.includes('uniform float premiumWet;'));
  assert.ok(shader.includes('premiumWet > .5 && cityWet > .5'));
  assert.ok(shader.includes('metalTone'));
  assert.ok(shader.includes('cyanEdge'));
  assert.ok(shader.includes('warmWindow'));
  assert.ok(shader.includes('float wet = water *'));
  assert.ok(shader.includes('gl_FragColor'));
  assert.ok(!shader.includes('texture2D('), 'no screen-space render target cost');
});

test('GPU-batched road decor stays beneath the player and outside the side flight corridor', () => {
  const { group, steamTexture } = createPremiumRoadDressing();
  const specs = [
    ['premium-road-light-rails', 110],
    ['premium-road-amber-inlays', 110],
    ['premium-road-architectural-pillars', 52],
    ['premium-road-beacon-lights', 52],
    ['premium-road-steam', 44],
  ];
  assert.equal(group.name, 'premium-wet-road-dressing');
  assert.equal(group.visible, false);
  assert.equal(group.children.length, specs.length);
  assert.equal(steamTexture.image.width, 32);
  assert.equal(steamTexture.image.height, 32);
  assert.equal(steamTexture.image.data.length, 4096);
  const matrix = new T.Matrix4(), v = new T.Vector3();
  for (const [name, count] of specs) {
    const mesh = group.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.equal(mesh.count, count);
    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, matrix);
      v.setFromMatrixPosition(matrix);
      assert.ok([v.x, v.y, v.z].every(Number.isFinite));
      if (name.includes('rails') || name.includes('inlays')) {
        assert.ok(v.y < -6.5, 'embedded in roadway, not in flight space');
      } else {
        assert.ok(Math.abs(v.x) >= 80, 'vertical scenery remains outside flight corridor');
      }
    }
  }
});

test('High and Medium switch new ground reflection uniforms and street geometry together', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const ground = scene.getObjectByName('launch-ground');
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const street = city.getObjectByName('premium-wet-road-dressing');
  const farStreet = far.getObjectByName('premium-wet-road-dressing');
  assert.ok(street && farStreet);
  assert.equal(ground.material.uniforms.cityWet.value, 1);
  for (const quality of ['medium', 'high', 'medium', 'high']) {
    world.setGraphicsQuality(quality);
    const isHigh = quality === 'high';
    assert.equal(ground.material.uniforms.premiumWet.value, isHigh ? 1 : 0);
    assert.equal(street.visible, isHigh);
    assert.equal(farStreet.visible, false, 'distant city remains inexpensive');
  }
  world.update(1, 1, 48, true);
  assert.ok(Number.isFinite(street.getObjectByName('premium-road-steam').position.y));
  world.reset();
  world.setGraphicsQuality('medium');
  assert.equal(street.visible, false);
  assert.equal(ground.material.uniforms.premiumWet.value, 0);
});
