import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createShipModule, createWorld } from '../src/visuals.js';
import { createBrushedMetalNormalMap } from '../src/premium-materials.js';

test('brushed PBR micro-normal is compact, stable and reused across ship variants', () => {
  const texture = createBrushedMetalNormalMap();
  assert.equal(texture.name, 'premium-brushed-metal-normal');
  assert.equal(texture, createBrushedMetalNormalMap());
  assert.equal(texture.image.width, 32);
  assert.equal(texture.image.height, 32);
  assert.equal(texture.image.data.length, 32 * 32 * 4);
  assert.ok(texture.image.data.every(Number.isFinite));
  assert.equal(texture.wrapS, T.RepeatWrapping);
  for (const chassis of ['nova7', 'aegis', 'specter']) {
    const ship = createShipModule(chassis);
    const premium = ship.getObjectByName('ship-premium-details');
    const armoring = premium.getObjectByName('ship-premium-wing-armor');
    assert.equal(armoring.material.normalMap, texture);
    assert.ok(armoring.material.normalScale.x > 0);
    assert.equal(premium.getObjectByName('ship-premium-carbon-inlay').material.normalMap, texture);
  }
});

test('HIGH renders near micro-details while distant skyline uses cheaper LOD', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearLod = city.getObjectByName('city-premium-near-lod');
  const farLod = far.getObjectByName('city-premium-near-lod');
  assert.ok(nearLod && farLod);
  assert.equal(nearLod.children.length, 4);
  assert.deepEqual(
    nearLod.children.map((x) => x.count),
    [24, 96, 24, 32],
  );
  for (const mode of ['medium', 'high', 'medium']) {
    world.setGraphicsQuality(mode);
    assert.equal(nearLod.visible, mode === 'high');
    assert.equal(farLod.visible, false);
  }
  const traffic = nearLod.getObjectByName('city-near-airborne-traffic');
  const matrix = new T.Matrix4(),
    pos = new T.Vector3(),
    q = new T.Quaternion(),
    scale = new T.Vector3();
  for (let i = 0; i < traffic.count; i++) {
    traffic.getMatrixAt(i, matrix);
    matrix.decompose(pos, q, scale);
    assert.ok(Math.abs(pos.x) >= 70, 'traffic stays outside the flight corridor');
    assert.ok(pos.y >= 24);
  }
  world.reset();
  world.update(0.1, 0.1, 48, true);
});
