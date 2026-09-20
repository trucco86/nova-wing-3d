import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter, bossModel, createWorld } from '../src/visuals.js';
test('ship and boss meshes contain finite coordinates and valid indices', () => {
  for (const model of [fighter(), fighter(true), bossModel()]) {
    let vertices = 0;
    model.traverse((o) => {
      const p = o.geometry?.attributes.position;
      if (!p) return;
      vertices += p.count;
      for (const value of p.array) assert.ok(Number.isFinite(value));
      for (const i of o.geometry.index?.array ?? []) assert.ok(i >= 0 && i < p.count);
    });
    assert.ok(vertices > 100);
  }
});
test('fighters reuse geometry but have independent transforms', () => {
  const a = fighter(),
    b = fighter();
  assert.notEqual(a, b);
  assert.equal(a.children[0].geometry, b.children[0].geometry);
  a.position.x = 9;
  assert.equal(b.position.x, 0);
  assert.equal(a.userData.flames.length, 2);
});
test('city remains present after one full scenery wrap and reset', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5);
  world.update(40, 40, 48, true);
  let count = 0;
  scene.traverse((o) => {
    if (o.isInstancedMesh) count++;
    assert.ok(Number.isFinite(o.position.z));
  });
  assert.equal(count, 8);
  world.reset();
  world.update(0.1, 0.1, 48, true);
});
