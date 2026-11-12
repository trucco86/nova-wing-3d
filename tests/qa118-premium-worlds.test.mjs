import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { PREMIUM_WORLD_GRADES, premiumWorldGrade } from '../src/premium-world-grading.js';
import { createLivingWorldLayers, LIVING_WORLD_PROFILES, setLivingWorldQuality, updateLivingWorldLayers } from '../src/living-world-depth.js';

test('QA118: every mission uses a distinct physical ambient signature within two GPU batches', () => {
  assert.equal(SECTORS.length, 10);
  const signatures = new Set();
  for (const { theme } of SECTORS) {
    const world = createLivingWorldLayers(theme);
    assert.ok(world, theme + ' requires a dedicated premium asset');
    assert.equal(world.children.length, 2, theme + ' preserves near/far batch budget');
    const g = world.userData.geometry;
    assert.ok(g.index && g.getAttribute('normal') && g.getAttribute('color'), theme + ' requires genuine 3D PBR geometry');
    assert.ok(g.getAttribute('position').count > 55, theme + ' cannot be one featureless primitive');
    assert.ok(g.getAttribute('position').count < 400, theme + ' must stay mobile-budgeted');
    assert.ok(world.userData.layers.every(({ mesh }) => mesh.isInstancedMesh && mesh.material.vertexColors));
    assert.ok(world.userData.layers.every(({ mesh }) => mesh.material.roughness >= 0.3));
    signatures.add(theme + ':' + g.getAttribute('position').count + ':' + LIVING_WORLD_PROFILES[theme].shape);
    const original = Array.from(world.children[0].instanceMatrix.array);
    updateLivingWorldLayers(world, { time: 10, travel: 450 });
    assert.notDeepEqual(Array.from(world.children[0].instanceMatrix.array), original);
    const sameTime = Array.from(world.children[0].instanceMatrix.array);
    updateLivingWorldLayers(world, { time: 10, travel: 450 });
    assert.deepEqual(Array.from(world.children[0].instanceMatrix.array), sameTime, theme + ': deterministic animation');
    setLivingWorldQuality(world, 'medium');
    assert.deepEqual(world.userData.layers.map(({ mesh }) => mesh.count), [10, 14]);
    setLivingWorldQuality(world, 'high');
    assert.deepEqual(world.userData.layers.map(({ mesh }) => mesh.count), [18, 28]);
    assert.ok(world.children.every((child) => child.userData.visualOnly && !child.userData.collider));
    g.dispose();
    world.userData.materials.forEach((material) => material.dispose());
  }
  assert.equal(signatures.size, 10);
});

test('QA118: nine off-Earth sectors have distinct filmic sky, fog and light grading', () => {
  assert.equal(Object.keys(PREMIUM_WORLD_GRADES).length, 9);
  assert.equal(premiumWorldGrade('city'), null, 'approved city grade must remain untouched');
  assert.equal(premiumWorldGrade('unknown'), null);
  assert.equal(new Set(Object.values(PREMIUM_WORLD_GRADES).map((g) => g.fog)).size, 9);
  assert.equal(new Set(Object.values(PREMIUM_WORLD_GRADES).map((g) => g.sun)).size, 9);
  for (const grade of Object.values(PREMIUM_WORLD_GRADES)) {
    assert.ok(grade.haze > 0 && grade.haze < 0.0015);
    assert.ok(grade.key >= 2 && grade.key <= 4);
    assert.ok(grade.rimEnergy <= 2 && grade.fillEnergy < 0.6);
    for (const attribute of ['sky', 'ground', 'sun', 'rim', 'fill', 'fog'])
      assert.match(grade[attribute], /^#[\da-f]{6}$/i);
  }
});

test('QA118: actual stage transitions use ambient grading and one distant-field mesh instead of 60 draws', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.46, true);
  // createWorld groups all authored objects beneath a scene container.
  // Inspect the actual nested light nodes, not only scene.children.
  let hemisphere = null;
  let sun = null;
  scene.traverse((obj) => {
    if (obj instanceof T.HemisphereLight) hemisphere = obj;
    if (!sun && obj instanceof T.DirectionalLight) sun = obj;
  });
  assert.ok(hemisphere && sun, 'all stage grades must preserve real scene lighting');
  for (let sector = 0; sector < SECTORS.length; sector++) {
    const theme = SECTORS[sector].theme;
    world.setSector(SECTORS[sector], sector);
    const ambient = scene.getObjectByName('world-living-depth-' + theme);
    assert.ok(ambient && ambient.children.length === 2);
    const grade = premiumWorldGrade(theme);
    if (grade) {
      assert.ok(scene.fog.color.equals(new T.Color(grade.fog)), theme + ': grade actual fog');
      assert.ok(hemisphere.color.equals(new T.Color(grade.sky)), theme + ': grade actual skylight');
      assert.ok(sun.color.equals(new T.Color(grade.sun)), theme + ': grade key light');
    }
    if (['asteroids', 'ice', 'nebula', 'sun'].includes(theme)) {
      const field = scene.getObjectByName('premium-instanced-' + theme + '-far-field');
      assert.ok(field?.isInstancedMesh, theme + ': one instanced field');
      assert.equal(field.count, 60);
      assert.equal(field.userData.visualOnly, true);
      const m = new T.Matrix4();
      for (let i = 0; i < field.count; i++) {
        field.getMatrixAt(i, m);
        assert.ok(Math.abs(m.elements[12]) >= 125, 'field must not clip through player flight area');
      }
    }
    world.setGraphicsQuality('medium');
    assert.deepEqual(ambient.userData.layers.map(({ mesh }) => mesh.count), [10, 14]);
    world.setGraphicsQuality('high');
    assert.deepEqual(ambient.userData.layers.map(({ mesh }) => mesh.count), [18, 28]);
  }
  world.destroy?.();
});
