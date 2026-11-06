import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { prewarmSceneShaders } from '../src/scene-prewarm.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';

test('hidden boss weak-point meshes are included in asynchronous compilation without being revealed', async () => {
  const root = createBossModel(SECTORS[1], 1, true);
  const markers = [...root.userData.parts.map((part) => part.marker), root.userData.coreMarker];
  assert.ok(markers.every((marker) => !marker.visible));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  let compiled = 0;
  const renderer = {
    compileAsync(object, view, target) {
      assert.equal(object, root);
      assert.equal(view, camera);
      assert.equal(target, scene);
      assert.ok(
        markers.every((marker) => marker.visible),
        'compiler must see future weak points',
      );
      compiled++;
      return Promise.resolve();
    },
  };
  const pending = prewarmSceneShaders(renderer, root, camera, scene);
  assert.ok(
    markers.every((marker) => !marker.visible),
    'nothing flashes during prewarm',
  );
  assert.equal(await pending, true);
  assert.equal(compiled, 1);
  disposeBoss(root);
});

test('unsupported or failed shader compilation does not alter visibility or crash gameplay', async () => {
  const root = new T.Group();
  const hidden = new T.Group();
  hidden.visible = false;
  const mesh = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial());
  mesh.visible = false;
  hidden.add(mesh);
  root.add(hidden);
  assert.equal(await prewarmSceneShaders({}, root, new T.Camera(), new T.Scene()), false);
  assert.equal(hidden.visible, false);
  assert.equal(mesh.visible, false);
  const rejected = {
    compileAsync() {
      throw new Error('unsupported GPU extension');
    },
  };
  assert.equal(await prewarmSceneShaders(rejected, root, new T.Camera(), new T.Scene()), false);
  assert.equal(hidden.visible, false);
  assert.equal(mesh.visible, false);
  const asynchronousError = {
    compileAsync() {
      return Promise.reject(Error('WebGL context lost'));
    },
  };
  assert.equal(
    await prewarmSceneShaders(asynchronousError, root, new T.Camera(), new T.Scene()),
    false,
  );
  assert.equal(hidden.visible, false);
  assert.equal(mesh.visible, false);
  mesh.geometry.dispose();
  mesh.material.dispose();
});

test('boss procedural armor shares buffer geometry without changing visible size', () => {
  const mars = createBossModel(SECTORS[1], 1, true);
  const saturn = createBossModel(SECTORS[7], 7, true);
  const cubes = [];
  for (const model of [mars, saturn]) {
    model.traverse((object) => {
      if (object.geometry?.type === 'BoxGeometry') cubes.push(object);
    });
  }
  assert.ok(cubes.length > 60, 'detailed armor is retained');
  const unique = new Set(cubes.map((mesh) => mesh.geometry));
  assert.ok(unique.size < cubes.length / 2, 'unit-cube buffers are reused');
  assert.ok(new T.Box3().setFromObject(mars).getSize(new T.Vector3()).length() > 50);
  disposeBoss(mars);
  assert.equal(saturn.children[0].parent, saturn);
  disposeBoss(saturn);
});
