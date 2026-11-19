import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCity32Living, setCity32Quality, updateCity32Living } from '../src/city-32-living.js';

const anchors = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (110 + (i % 8) * 13),
  z: -35 - Math.floor(i / 2) * 19,
  h: 45 + (i % 8) * 10,
  w: 12 + (i % 5),
  depth: 14,
}));

function searchlightLamps(root) {
  return root
    .getObjectByName('city32-sky-searchlights')
    .children.filter((node) => node.isGroup)
    .map((tower) => tower.getObjectByName('city32-searchlight-lamp'));
}

test('QA159: searchlights reuse a single immutable GPU sphere across separate city builds and clones', () => {
  const near = createCity32Living(anchors);
  const rebuilt = createCity32Living(anchors);
  const far = near.clone(true);
  const groups = [near, rebuilt, far].map(searchlightLamps);
  for (const lamps of groups) {
    assert.equal(lamps.length, 6);
    assert.ok(lamps.every((lamp) => lamp?.isMesh));
    assert.equal(new Set(lamps.map((lamp) => lamp.geometry)).size, 1);
    assert.equal(new Set(lamps.map((lamp) => lamp.material)).size, 6);
  }
  const all = groups.flat();
  assert.equal(new Set(all.map((lamp) => lamp.geometry)).size, 1);
  assert.equal(new Set(all.map((lamp) => lamp.material)).size, 6);
  for (let i = 0; i < 6; i++) {
    const lamp = groups[0][i];
    assert.strictEqual(lamp.material, groups[1][i].material);
    assert.strictEqual(lamp.material, groups[2][i].material);
    assert.equal(lamp.geometry.parameters.radius, 2.2);
    assert.equal(lamp.geometry.parameters.widthSegments, 9);
    assert.equal(lamp.geometry.parameters.heightSegments, 7);
    assert.equal(lamp.material.type, 'MeshBasicMaterial');
    assert.equal(lamp.material.toneMapped, false);
    assert.equal(lamp.userData.hitbox, undefined);
  }
  assert.deepEqual(
    groups[0].map((lamp) => lamp.material.color.getHexString()),
    ['c4c9b8', 'e1b786', 'd8d2c2', '9fb9b4', 'c4b4a2', 'e8d7a5'],
    'all six original individual lamp colors remain unchanged',
  );
});

test('QA159: sharing lamp resources preserves six animated pivots and Medium/High LOD', () => {
  const root = createCity32Living(anchors);
  const towers = root
    .getObjectByName('city32-sky-searchlights')
    .children.filter((node) => node.isGroup);
  const pivots = towers.map((tower) => tower.getObjectByName('city32-searchlight-pivot'));
  setCity32Quality(root, 'high');
  assert.equal(towers.filter((tower) => tower.visible).length, 6);
  const positions = towers.map((tower) => tower.position.clone());
  updateCity32Living(root, 500);
  assert.ok(pivots.every((pivot) => pivot?.children.length === 2));
  assert.ok(pivots.some((pivot) => pivot.rotation.x !== 0));
  towers.forEach((tower, i) => assert.ok(tower.position.equals(positions[i])));
  setCity32Quality(root, 'medium');
  assert.equal(towers.filter((tower) => tower.visible).length, 3);
  setCity32Quality(root, 'high');
  assert.equal(towers.filter((tower) => tower.visible).length, 6);
  assert.ok(pivots.every((pivot) => pivot.children.some((node) => node.name === 'city32-searchlight-beam')));
});
