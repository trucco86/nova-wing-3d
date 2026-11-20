import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { ALIEN_MONUMENT_PARTS, createAlienMonumentGeometry } from '../src/alien-monument-geometry.js';
import { ANCIENT_WORLD_THEMES, createAlienArchitecture } from '../src/alien-architecture.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const themes = ['sun', 'ice', 'nebula', 'void', 'throne'];

test('five authored alien monuments use indexed vertex-coloured PBR silhouettes without extra draw batches', () => {
  assert.deepEqual(Object.keys(ALIEN_MONUMENT_PARTS), themes);
  const fingerprints = new Set();
  for (const theme of themes) {
    const geometry = createAlienMonumentGeometry(theme);
    assert.ok(geometry.index?.count > 0);
    assert.ok(geometry.getAttribute('normal'));
    assert.ok(geometry.getAttribute('color'));
    assert.equal(geometry.userData.alienCivilisation, theme);
    const colors = geometry.getAttribute('color');
    assert.equal(colors.count, geometry.getAttribute('position').count);
    const fingerprint = geometry.index.count + ':' + colors.count;
    fingerprints.add(fingerprint);
    const root = createAlienArchitecture(theme);
    assert.equal(root.children.length, 6);
    const primary = root.getObjectByName(ANCIENT_WORLD_THEMES[theme].site + '-' + ANCIENT_WORLD_THEMES[theme].structure);
    assert.ok(primary?.isInstancedMesh);
    assert.equal(primary.count, 10);
    assert.equal(primary.material.vertexColors, true);
    assert.equal(primary.geometry.userData.alienCivilisation, theme);
    assert.ok(primary.material.isMeshStandardMaterial);
    geometry.dispose();
    root.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
  }
  assert.equal(fingerprints.size, 5, 'each alien civilisation must differ in modeled topology');
  assert.throws(() => createAlienMonumentGeometry('unknown'), RangeError);
});

test('Europa replaces placeholder cones with blue ridged glacial rock geometry across the active mission', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const distant = scene.getObjectByName('premium-instanced-ice-far-field');
  const cliffs = scene.getObjectByName('europa-fractured-glacial-spires');
  const walls = scene.getObjectByName('europa-glacier-fault-walls');
  for (const field of [distant, cliffs, walls]) {
    assert.ok(field?.isInstancedMesh, 'ice sculpture must be batched: ' + field?.name);
    assert.equal(field.material.vertexColors, true);
    assert.ok(field.geometry.getAttribute('color')?.count > 30);
    assert.equal(field.userData.hitbox, undefined);
  }
  assert.equal(distant.count, 60);
  assert.equal(cliffs.count, 54);
  assert.equal(walls.count, 24);
  world.setSector(SECTORS[4], 4);
  assert.equal(scene.getObjectByName('europa-fractured-glacial-spires'), undefined);
});
