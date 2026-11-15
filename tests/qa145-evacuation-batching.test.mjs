import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCityEvacuationFleet,
  syncCityEvacuationFleet,
} from '../src/city-evacuation-batching.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

function inspectFleet(life) {
  const renderer = life.getObjectByName('city-evacuation-instanced-fleet');
  const proxies = life.children.filter((o) => o.userData.role === 'evacuation');
  const batches = renderer.children.filter((o) => o.isInstancedMesh);
  return { renderer, proxies, batches };
}
function matrixAt(mesh, i) {
  const matrix = new T.Matrix4();
  mesh.getMatrixAt(i, matrix);
  return matrix.elements.slice();
}

test('QA145: 7 real authored shuttle silhouettes use 3 material draws, no data loss', () => {
  const materials = {
    hull: new T.MeshStandardMaterial({ color: '#86b8bc' }),
    glazing: new T.MeshBasicMaterial({ color: '#93eaff' }),
    engines: new T.MeshBasicMaterial({ color: '#ffd59b' }),
  };
  const fleet = createCityEvacuationFleet(materials);
  assert.equal(fleet.children.length, 3);
  assert.equal(fleet.userData.visualOnly, true);
  assert.equal(fleet.userData.role, 'evacuation-renderer');
  assert.deepEqual(
    fleet.children.map((mesh) => mesh.name),
    [
      'city-evacuation-batched-hull',
      'city-evacuation-batched-glazing',
      'city-evacuation-batched-engines',
    ],
  );
  assert.deepEqual(
    fleet.children.map((mesh) => mesh.geometry.index.count / 3),
    [24, 36, 24],
  );
  const palette = [materials.hull, materials.glazing, materials.engines];
  for (let i = 0; i < 3; i++) {
    const batch = fleet.children[i];
    assert.equal(batch.material, palette[i]);
    assert.equal(batch.count, 3);
    assert.equal(batch.frustumCulled, false);
    assert.equal(batch.geometry.getAttribute('normal').count, [48, 72, 48][i]);
    assert.equal(batch.userData.visualOnly, true);
    assert.equal(batch.userData.collider, undefined);
  }
  const glazingBounds =
    fleet.children[1].geometry.boundingBox ??
    (() => {
      fleet.children[1].geometry.computeBoundingBox();
      return fleet.children[1].geometry.boundingBox;
    })();
  assert.ok(glazingBounds.min.x < -4 && glazingBounds.max.x > 4);
  assert.equal(fleet.getObjectByName('city-evacuation-craft-0'), undefined);
});

test('QA145: phase 1 near/far use independent buffer transforms, High/Medium updates all indexes', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.48, true);
  world.setSector(SECTORS[0], 0);
  const near = inspectFleet(
    scene.getObjectByName('launch-city').getObjectByName('city-urban-life'),
  );
  const far = inspectFleet(
    scene.getObjectByName('launch-city-far').getObjectByName('city-urban-life'),
  );
  assert.equal(near.proxies.length, 7);
  assert.equal(far.proxies.length, 7);
  assert.equal(near.batches.length, 3);
  assert.equal(far.batches.length, 3);
  assert.notEqual(near.batches[0].instanceMatrix, far.batches[0].instanceMatrix);
  assert.equal(near.batches[0].geometry, far.batches[0].geometry);
  assert.equal(near.batches[0].count, 3);
  world.setGraphicsQuality('high');
  assert.equal(near.batches[0].count, 7);
  assert.equal(far.batches[0].count, 7);
  const before = matrixAt(near.batches[0], 6);
  world.update(1, 1, 48, true);
  assert.notDeepEqual(matrixAt(near.batches[0], 6), before);
  assert.deepEqual(
    matrixAt(near.batches[0], 0),
    Array.from(
      (() => {
        near.proxies[0].updateMatrix();
        return new Float32Array(near.proxies[0].matrix.elements);
      })(),
    ),
  );
  const paused = matrixAt(near.batches[0], 3);
  world.update(1, 2, 48, false);
  assert.deepEqual(matrixAt(near.batches[0], 3), paused);
  world.setGraphicsQuality('medium');
  assert.equal(near.batches[0].count, 3);
  assert.equal(near.proxies[6].visible, false);
  world.setGraphicsQuality('high');
  assert.equal(near.batches[0].count, 7);
  assert.equal(near.proxies[6].visible, true);
  assert.deepEqual(
    matrixAt(near.batches[0], 6),
    Array.from(
      (() => {
        near.proxies[6].updateMatrix();
        return new Float32Array(near.proxies[6].matrix.elements);
      })(),
    ),
  );
  // No physics/collision metadata on either fleet or proxies.
  for (const { renderer, proxies } of [near, far]) {
    renderer.traverse((o) => {
      assert.equal(o.userData.hitbox, undefined);
      assert.equal(o.userData.collider, undefined);
    });
    for (const proxy of proxies) assert.equal(proxy.children.length, 0);
  }
});

test('QA145: clone cache does not borrow instances or corrupt other city ship paths', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.48, true);
  world.setSector(SECTORS[0], 0);
  world.setGraphicsQuality('high');
  const nearLife = scene.getObjectByName('launch-city').getObjectByName('city-urban-life');
  const farLife = scene.getObjectByName('launch-city-far').getObjectByName('city-urban-life');
  const near = inspectFleet(nearLife);
  const far = inspectFleet(farLife);
  const saved = matrixAt(near.batches[0], 0);
  far.proxies[0].position.x += 10;
  syncCityEvacuationFleet(farLife);
  assert.deepEqual(matrixAt(near.batches[0], 0), saved);
  assert.notDeepEqual(matrixAt(near.batches[0], 0), matrixAt(far.batches[0], 0));
  nearLife.getObjectByName = () => {
    throw new Error('unexpected per-frame traverse');
  };
  farLife.getObjectByName = () => {
    throw new Error('unexpected per-frame traverse');
  };
  assert.doesNotThrow(() => syncCityEvacuationFleet(nearLife));
  assert.doesNotThrow(() => syncCityEvacuationFleet(farLife));
});
