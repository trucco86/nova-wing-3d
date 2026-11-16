import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPetPickup } from '../src/pet-visuals.js';
import { PET_ITEMS } from '../src/pet-collectibles.js';

test('all six food and play pickups have stable independent cached 3D silhouettes', () => {
  const geometryByItem = [];
  for (const item of PET_ITEMS) {
    const first = createPetPickup(item.id);
    const second = createPetPickup(item.id);
    assert.ok(first && second && first !== second, item.id);
    assert.equal(first.userData.kind, item.id);
    assert.equal(first.children.length, second.children.length);
    assert.ok(first.children.length <= 9, 'draw-call budget for ' + item.id);
    assert.ok(first.children.every((mesh) => mesh.geometry || mesh.type === 'Group'));
    geometryByItem.push(first.children.length);
  }
  assert.ok(new Set(geometryByItem).size > 1);
  assert.equal(createPetPickup('litter'), null);
  assert.equal(createPetPickup('bone'), null);
});
