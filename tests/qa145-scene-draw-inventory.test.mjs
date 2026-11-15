import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

// Diagnostic high-mode asset inventory. This counts potentially drawable
// visible meshes, NOT measured WebGL draw calls; frustum and camera vary.
// It establishes which subtrees deserve instrumented on-device profiling.
function audit(node, parentVisible = true) {
  let meshCount = 0;
  let individualMeshes = 0;
  let instanceDraws = 0;
  let instanceCount = 0;
  let tris = 0;
  const walk = (current, visible) => {
    const shown = visible && current.visible;
    if (!shown) return;
    if (current.isMesh && !(current.isInstancedMesh && current.count === 0)) {
      meshCount++;
      if (current.isInstancedMesh) {
        instanceDraws++;
        instanceCount += current.count;
      } else individualMeshes++;
      const geo = current.geometry;
      const triangleCount = geo?.index
        ? geo.index.count / 3
        : geo?.attributes?.position?.count
          ? geo.attributes.position.count / 3
          : 0;
      tris += Math.round(triangleCount) * (current.isInstancedMesh ? current.count : 1);
    }
    for (const child of current.children) walk(child, shown);
  };
  walk(node, parentVisible);
  return { meshCount, individualMeshes, instanceDraws, instanceCount, tris };
}

test('QA145 diagnostic: catalogue stage 1 scene cost by category on High', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0], 0);
  world.setGraphicsQuality('high');
  const categoryRoots = [
    'launch-city',
    'launch-city-far',
    'city-distant-horizon',
    'city-scripted-destruction',
    'city-catastrophe',
    'city-reactive-damage',
  ];
  const categories = {};
  for (const name of categoryRoots) {
    const node = scene.getObjectByName(name);
    if (node) categories[name] = audit(node);
  }
  const city = scene.getObjectByName('launch-city');
  const details = Object.fromEntries(
    city.children
      .filter((x) => x.children.length || x.isMesh)
      .map((x) => [x.name || ('unnamed-' + x.id), audit(x)]),
  );
  const sorted = Object.entries(details)
    .sort((a, b) => b[1].meshCount - a[1].meshCount)
    .slice(0, 25);
  console.log('QA145-BASELINE-SCENE:', JSON.stringify({
    categories,
    cityHotspots: sorted,
    scene: audit(scene),
  }));
  assert.ok(categories['launch-city'].meshCount >= 50);
  assert.ok(categories['launch-city-far'].meshCount >= 50);
  assert.ok(details['city-urban-life'].individualMeshes > 0);
  assert.equal(details['city-urban-life'].individualMeshes, 19);
  assert.equal(
    details['city-urban-life'].meshCount,
    40,
    '7 evacuation shuttles preserve all geometry with 3 batched draws instead of 49 meshes',
  );
  world.setGraphicsQuality('medium');
  const medium = audit(scene);
  world.setGraphicsQuality('high');
  assert.ok(audit(scene).meshCount > medium.meshCount);
});
