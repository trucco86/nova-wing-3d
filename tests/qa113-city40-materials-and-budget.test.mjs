import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

// Architectural detail should be visible without reverting to one mesh
// (and therefore one GPU draw call) per small window, louver or sign.
test('QA113: cinematic civic and industrial detail stays in four merged batches per district', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  const families = [];
  for (const name of ['launch-city', 'launch-city-far']) {
    const tile = scene.getObjectByName(name);
    const root = tile.getObjectByName('city40-hero-architecture');
    const stats = root.userData.metrics;
    assert.equal(stats.drawUnits, 4, 'no extra draw calls per sculpted detail');
    assert.ok(stats.triangles >= 1400, 'facades should contain visible geometry, not a flat decal');
    assert.ok(stats.triangles < 45000, 'reclaim geometry budget before making the whole city richer');
    assert.ok(stats.bytes > 0 && stats.bytes < 3 * 1024 * 1024,
      'merged facade geometry stays below 3 MB per 285m city tile');
    const materialGroups = ['city40-sculpted-masonry','city40-deep-bay-glazing',
      'city40-occlusion-recesses','city40-precision-mullions'];
    assert.deepEqual(root.children.flatMap(g => g.children.map(mesh => mesh.name)).sort(),
      materialGroups.sort());
    for (const material of root.children.flatMap(g => g.children.map(m => m.material)))
      assert.equal(material.isMeshPhysicalMaterial || material.isMeshStandardMaterial, true);
    for (const mesh of root.children.flatMap(g => g.children)) {
      assert.equal(mesh.frustumCulled, true, 'tile is culled when outside camera frustum');
      assert.ok(mesh.geometry.boundingSphere?.radius > 0);
      assert.ok(mesh.geometry.boundingBox?.min && mesh.geometry.boundingBox?.max);
      assert.ok([...mesh.geometry.getAttribute('normal').array].every(Number.isFinite));
    }
    const noNewColliders = [];
    root.traverse(node => {
      if (node.userData.solid || node.userData.hitbox || node.userData.gameplayCollider)
        noNewColliders.push(node.name);
    });
    assert.deepEqual(noNewColliders, []);
    families.push({ style: root.userData.variant, triangles: stats.triangles, bytes: stats.bytes });
  }
  assert.deepEqual(families.map(g => g.style), ['civic','industrial']);
  assert.ok(families.some(x => x.triangles > 1800),
    'at least one of the two district styles has detailed recessed bays');
});

test('QA113: reflection resources are shared and fallback rendering needs no document or assets', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.4, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city').getObjectByName('city40-hero-architecture');
  const far = scene.getObjectByName('launch-city-far').getObjectByName('city40-hero-architecture');
  const building = node => node.getObjectByName('city40-sculpted-masonry').material;
  const window = node => node.getObjectByName('city40-deep-bay-glazing').material;
  assert.equal(building(near), building(far), 'physical masonry materials are shared across city tiles');
  assert.equal(window(near), window(far), 'glass is shared; no material per window');
  assert.ok(building(near).roughnessMap?.isTexture && building(near).normalMap?.isTexture);
  assert.ok(building(near).envMapIntensity > 0 && window(near).envMapIntensity > 0);
  assert.ok(window(near).clearcoat >= 0.85);
  assert.equal(building(near).envMap, null,
    'Node/no DOM rendering uses safe no-reflection fallback');
  world.setGraphicsQuality('medium');
  assert.equal(near.getObjectByName('city40-precision-high').visible, false);
  world.setGraphicsQuality('high');
  assert.equal(near.getObjectByName('city40-precision-high').visible, true);
});
