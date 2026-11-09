import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter } from '../src/visuals.js';
import { createCity30DistrictLife } from '../src/city-30-district-life.js';

test('NOVA-7 keeps a glossy PhysicalMaterial independent of enemy paint', () => {
  const hero = fighter(false);
  const enemy = fighter(true);
  const fuselage = hero.getObjectByName('ship-fuselage');
  const enemyHull = enemy.getObjectByName('ship-fuselage');
  assert.equal(fuselage.material.type, 'MeshPhysicalMaterial');
  assert.ok(fuselage.material.metalness >= 0.75);
  assert.ok(fuselage.material.roughness <= 0.2);
  assert.ok(fuselage.material.clearcoat >= 0.9);
  assert.notStrictEqual(fuselage.material, enemyHull.material);
});

test('one instanced neon batch contains multi-color building-bound signage', () => {
  const anchors = Array.from({ length: 22 }, (_, i) => ({
    x: i % 2 ? -125 : 125,
    h: 55 + (i % 4) * 12,
    z: -80 - i * 35,
    w: 18,
    depth: 20,
  }));
  const city = createCity30DistrictLife(anchors);
  const strips = city.getObjectByName('city-matrix-green-walkway-neon');
  assert.ok(strips.isInstancedMesh);
  assert.ok(strips.count >= 3);
  assert.ok(strips.instanceColor, 'multiple hues reuse the original draw call');
  const first = new T.Color();
  const second = new T.Color();
  strips.getColorAt(0, first);
  strips.getColorAt(1, second);
  assert.notEqual(first.getHex(), second.getHex());
  assert.equal(city.userData.visualOnly, true);
});
