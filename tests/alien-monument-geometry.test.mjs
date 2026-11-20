import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  ALIEN_MONUMENT_PARTS,
  createAlienMonumentGeometry,
  createEuropaSunkenVaultGeometry,
} from '../src/alien-monument-geometry.js';
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
    assert.equal(root.children.length, theme === 'ice' ? 7 : 6);
    const primary = root.getObjectByName(
      ANCIENT_WORLD_THEMES[theme].site + '-' + ANCIENT_WORLD_THEMES[theme].structure,
    );
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
  assert.equal(distant.count, 40);
  assert.equal(cliffs.count, 38);
  assert.equal(walls.count, 16);
  world.setSector(SECTORS[4], 4);
  assert.equal(scene.getObjectByName('europa-fractured-glacial-spires'), undefined);
});

test('Europa hero vault is a distinctive grounded portal, low-cost, outside the aiming lane and absent at boss', () => {
  const vaultGeometry = createEuropaSunkenVaultGeometry();
  assert.ok(vaultGeometry.index.count > 0);
  assert.ok(vaultGeometry.getAttribute('normal'));
  assert.ok(vaultGeometry.getAttribute('color'));
  assert.equal(vaultGeometry.userData.alienCivilisation, 'europa-hero-vault');
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const vault = scene.getObjectByName('europa-sunken-alien-vault-hero');
  assert.ok(vault?.isInstancedMesh);
  assert.equal(vault.count, 1);
  assert.equal(vault.userData.heroLandmark, true);
  assert.equal(vault.userData.visualOnly, true);
  assert.equal(vault.material.vertexColors, true);
  const matrix = new T.Matrix4();
  const pos = new T.Vector3();
  vault.getMatrixAt(0, matrix);
  pos.setFromMatrixPosition(matrix);
  assert.ok(pos.x <= -150, 'vault remains on the left scenic lane');
  const bounds = new T.Box3().setFromBufferAttribute(vault.geometry.getAttribute('position'));
  const rightmost = pos.x + bounds.max.x * 108;
  assert.ok(rightmost < -72, 'large vault must not intrude into the central flight corridor');
  const site = scene.getObjectByName('alien-architecture-ice');
  assert.equal(site.children.length, 7, 'one extra instanced draw, no duplicated monuments');
  world.setDestinationArrival(30);
  assert.equal(site.visible, true);
  world.setEuropaBossArena(true, -83);
  assert.equal(site.visible, false, 'frozen scenery clears the 360-degree boss arena');
  world.setSector(SECTORS[4], 4);
  assert.equal(scene.getObjectByName('europa-sunken-alien-vault-hero'), undefined);
  vaultGeometry.dispose();
});