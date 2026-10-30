import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createPremiumCityLandmarks } from '../src/premium-city-landmarks.js';
import { createWorld } from '../src/visuals.js';

test('cinematic city introduces architecturally varied landmarks without flight corridor collisions', () => {
  const { group } = createPremiumCityLandmarks();
  const required = [
    ['premium-hero-tower-shell', 12],
    ['premium-hero-tower-crown', 12],
    ['premium-hero-tower-halo', 12],
    ['premium-hero-tower-fins', 48],
    ['premium-hero-tower-neon', 48],
    ['premium-elevated-skyrail', 28],
    ['premium-skyrail-light-strip', 28],
    ['premium-skyrail-support', 28],
    ['premium-animated-commuter-craft', 8],
    ['premium-commuter-window', 8],
  ];
  assert.equal(group.name, 'city-premium-cinematic-landmarks');
  assert.equal(
    group.children.length,
    required.length,
    'batched 3D geometry avoids per-building draws',
  );
  const matrix = new T.Matrix4();
  const translation = new T.Vector3(),
    quaternion = new T.Quaternion(),
    scale = new T.Vector3();
  for (const [name, count] of required) {
    const mesh = group.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.equal(mesh.count, count);
    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, matrix);
      matrix.decompose(translation, quaternion, scale);
      assert.ok(
        Math.abs(translation.x) >= 70,
        'decorative object must never overlap central route',
      );
      assert.ok([translation.x, translation.y, translation.z].every(Number.isFinite));
    }
  }
});

test('commuter craft move independently of player progression and reset deterministically', () => {
  const env = createPremiumCityLandmarks();
  const train = env.group.getObjectByName('premium-animated-commuter-craft');
  const matrix = new T.Matrix4(),
    start = new T.Vector3(),
    end = new T.Vector3();
  train.getMatrixAt(0, matrix);
  start.setFromMatrixPosition(matrix);
  env.update(12.5);
  train.getMatrixAt(0, matrix);
  end.setFromMatrixPosition(matrix);
  assert.notEqual(end.z, start.z, 'the city needs visible traffic in motion');
  assert.equal(end.x, start.x);
  assert.equal(end.y, start.y);
  env.update(0);
  train.getMatrixAt(0, matrix);
  assert.ok(start.distanceTo(new T.Vector3().setFromMatrixPosition(matrix)) < 0.001);
});

test('high-only cinematic city survives wrap, sector reset and medium fallback', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const visual = city.getObjectByName('city-premium-cinematic-landmarks');
  const farVisual = far.getObjectByName('city-premium-cinematic-landmarks');
  assert.ok(visual && farVisual);
  world.setGraphicsQuality('medium');
  assert.equal(visual.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(visual.visible, true);
  assert.equal(farVisual.visible, false, 'distant tile does not double cinematic draw cost');
  world.update(39, 39, 48, true);
  assert.ok(Number.isFinite(city.position.z));
  world.reset();
  world.update(0.1, 0.1, 48, true);
  world.setGraphicsQuality('medium');
  assert.equal(visual.visible, false);
});
