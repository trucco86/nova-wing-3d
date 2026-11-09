import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { postProcessor } from '../src/visuals.js';
import {
  createCityUrbanDrones,
  animateCityUrbanDrones,
  setCityUrbanDronesQuality,
} from '../src/city-urban-drones.js';

function rendererDouble(scene) {
  const record = [];
  const renderer = {
    extensions: { has: () => false },
    info: { render: { calls: 0, triangles: 0 } },
    setRenderTarget(value) {
      record.push({ operation: 'target', target: value });
    },
    getPixelRatio: () => 1,
    render(targetScene) {
      renderer.info.render.calls = targetScene === scene ? 109 : 1;
      renderer.info.render.triangles = targetScene === scene ? 42700 : 2;
      record.push({ operation: 'render', scene: targetScene === scene ? 'game' : 'post' });
    },
  };
  return { renderer, record };
}

test('touch High bypasses costly full-screen bloom but preserves real 3D scene draw', () => {
  const scene = new T.Scene();
  const { renderer, record } = rendererDouble(scene);
  const post = postProcessor(renderer, scene, new T.PerspectiveCamera(), { coarsePointer: true });
  post.setGraphicsQuality('high');
  post.resize(390, 844);
  const cost = post.render();
  assert.deepEqual(
    record.filter((x) => x.operation === 'render').map((x) => x.scene),
    ['game'],
  );
  assert.deepEqual(cost, { drawCalls: 109, triangles: 42700, postPasses: 0 });
  assert.deepEqual(post.getFrameCost(), cost);
  assert.ok(record.some((x) => x.operation === 'target' && x.target === null));
});

test('desktop High preserves cinematic bloom; desktop Medium uses direct path', () => {
  const scene = new T.Scene();
  const { renderer, record } = rendererDouble(scene);
  const post = postProcessor(renderer, scene, new T.PerspectiveCamera());
  post.setGraphicsQuality('high');
  post.resize(1280, 720);
  const expensive = post.render();
  assert.deepEqual(
    record.filter((x) => x.operation === 'render').map((x) => x.scene),
    ['game', 'post', 'post', 'post'],
  );
  assert.deepEqual(expensive, { drawCalls: 109, triangles: 42700, postPasses: 3 });
  record.length = 0;
  post.setGraphicsQuality('medium');
  post.resize(1280, 720);
  const lean = post.render();
  assert.deepEqual(
    record.filter((x) => x.operation === 'render').map((x) => x.scene),
    ['game'],
  );
  assert.equal(lean.postPasses, 0);
});

test('new city drone is a detailed aircraft mesh but still two instanced batches', () => {
  const group = createCityUrbanDrones();
  assert.equal(group.children.length, 2);
  const body = group.getObjectByName('city-moving-service-drones');
  const beacon = group.getObjectByName('city-moving-drone-beacons');
  assert.ok(body.isInstancedMesh && beacon.isInstancedMesh);
  assert.equal(body.material.vertexColors, true);
  assert.ok(
    body.geometry.attributes.color.count > 180,
    'wing, motors, cockpit and cargo make a 3D drone',
  );
  assert.ok(body.geometry.index?.count > 0, 'detail geometry has real triangulation');
  assert.ok(body.geometry.getAttribute('normal'));
  for (const value of body.geometry.attributes.position.array)
    assert.ok(Number.isFinite(value), 'GPU-bound vertex is valid');
  setCityUrbanDronesQuality(group, 'high');
  assert.equal(body.count, 12);
  const matrix = new T.Matrix4();
  body.getMatrixAt(0, matrix);
  const before = matrix.elements.slice();
  animateCityUrbanDrones(group, 540);
  body.getMatrixAt(0, matrix);
  assert.notDeepEqual(matrix.elements.slice(), before);
  animateCityUrbanDrones(group, 540);
  const frozen = matrix.elements.slice();
  body.getMatrixAt(0, matrix);
  assert.deepEqual(matrix.elements.slice(), frozen, 'pause keeps drones stationary');
  setCityUrbanDronesQuality(group, 'medium');
  assert.equal(beacon.count, 6);
});
