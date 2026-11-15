import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  ATMOSPHERIC_PARTS,
  createPremiumAtmosphericGeometry,
} from '../src/premium-atmospheric-geology.js';
import {
  createDestinationLandmarks,
  setDestinationLandmarkQuality,
  updateDestinationLandmarks,
} from '../src/destination-landmarks.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const atmosphericCases = [
  {
    sector: 4,
    cloud: 'venus-cloud-bank',
    formation: 'venus-volcanic-vent',
    cloudName: 'venus-sulfur-cloud-columns',
    formationName: 'venus-volcanic-ridge-masses',
    cloudCount: 38,
    formationCount: 26,
  },
  {
    sector: 6,
    cloud: 'neptune-storm-bank',
    formation: 'neptune-hive-tower',
    cloudName: 'neptune-turbulent-cloud-columns',
    formationName: 'neptune-organic-hive-towers',
    cloudCount: 34,
    formationCount: 28,
  },
];

test('QA121: four actual 3D atmospheric sculptures are merged into indexed PBR assets within mobile geometry budgets', () => {
  assert.deepEqual(Object.keys(ATMOSPHERIC_PARTS).sort(), [
    'neptune-hive-tower',
    'neptune-storm-bank',
    'venus-cloud-bank',
    'venus-volcanic-vent',
  ]);
  for (const [shape, expectedParts] of Object.entries(ATMOSPHERIC_PARTS)) {
    assert.ok(expectedParts >= 3 && expectedParts <= 9);
    const geometry = createPremiumAtmosphericGeometry(shape);
    assert.equal(geometry.userData.premiumAtmosphere, shape);
    assert.ok(geometry.index && geometry.index.count >= 50, shape + ': no billboard plane');
    assert.ok(geometry.getAttribute('position') && geometry.getAttribute('normal'));
    assert.ok(geometry.getAttribute('uv'), shape + ': shared PBR UVs');
    assert.ok(
      geometry.getAttribute('position').count < 550,
      shape + ': no hidden ultra-high-poly mesh',
    );
    assert.ok(geometry.boundingSphere.radius > 0 && geometry.boundingSphere.radius < 2);
    geometry.dispose();
  }
  assert.throws(() => createPremiumAtmosphericGeometry('saturn'), RangeError);
});

test('QA121: Venus and Neptune retain identical draw batches and count but replace placeholder spheres/cones', () => {
  for (const sector of atmosphericCases) {
    const root = createDestinationLandmarks(sector.sector);
    const clouds = root.getObjectByName(sector.cloudName);
    const formation = root.getObjectByName(sector.formationName);
    assert.ok(clouds?.isInstancedMesh && formation?.isInstancedMesh);
    assert.equal(clouds.count, sector.cloudCount);
    assert.equal(formation.count, sector.formationCount);
    assert.equal(clouds.geometry.userData.premiumAtmosphere, sector.cloud);
    assert.equal(formation.geometry.userData.premiumAtmosphere, sector.formation);
    assert.ok(clouds.material.isMeshStandardMaterial && formation.material.isMeshStandardMaterial);
    assert.ok(clouds.material.transparent && clouds.material.opacity < 0.35);
    assert.ok(
      formation.material.roughness >= 0.8,
      'biome silhouettes must read as geological material',
    );
    assert.equal(clouds.userData.visualOnly, true);
    assert.equal(formation.userData.highOnly, true);
    assert.equal(
      root.children.filter((node) => node.isInstancedMesh).length,
      3,
      'exact same three GPU batches as previous clouds + distant strata',
    );
    setDestinationLandmarkQuality(root, 'medium');
    assert.ok(clouds.visible);
    assert.equal(formation.visible, false);
    setDestinationLandmarkQuality(root, 'high');
    assert.equal(formation.visible, true);
    const matrix = new T.Matrix4();
    for (let i = 0; i < formation.count; i++) {
      formation.getMatrixAt(i, matrix);
      assert.ok(
        Math.abs(matrix.elements[12]) >= 120,
        'volcanic vents and hives stay away from pilot and target lanes',
      );
    }
    root.traverse((node) => {
      assert.notEqual(node.userData.collider, true);
      assert.notEqual(node.userData.hitbox, true);
    });
  }
});

test('QA121: weather motion is deterministic under pause/replay and retains authentic Venus lightning', () => {
  for (const sector of atmosphericCases) {
    const root = createDestinationLandmarks(sector.sector);
    const cloud = root.getObjectByName(sector.cloudName);
    updateDestinationLandmarks(root, 41.25);
    const before = {
      x: cloud.position.x,
      y: cloud.position.y,
      roll: cloud.rotation.z,
      opacity: cloud.material.opacity,
    };
    updateDestinationLandmarks(root, 41.25);
    assert.deepEqual(
      {
        x: cloud.position.x,
        y: cloud.position.y,
        roll: cloud.rotation.z,
        opacity: cloud.material.opacity,
      },
      before,
      'same mission time must never drift, including under pause',
    );
    updateDestinationLandmarks(root, 55.25);
    assert.notEqual(cloud.position.y, before.y);
    assert.notEqual(cloud.rotation.z, before.roll);
    updateDestinationLandmarks(root, 41.25);
    assert.deepEqual(
      {
        x: cloud.position.x,
        y: cloud.position.y,
        roll: cloud.rotation.z,
        opacity: cloud.material.opacity,
      },
      before,
      'replay must reproduce the exact same scene',
    );
    if (sector.sector === 4) {
      const lightning = root.getObjectByName('venus-lightning-at-cloud-horizon');
      assert.ok(lightning.isLineSegments && lightning.userData.visualOnly);
      assert.equal(lightning.userData.highOnly, true);
    }
  }
});

test('QA121: actual stage transitions preserve previous scenes, storm geometry and graphical quality', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  for (const sector of atmosphericCases) {
    world.setSector(SECTORS[sector.sector], sector.sector);
    const cloud = scene.getObjectByName(sector.cloudName);
    const formation = scene.getObjectByName(sector.formationName);
    assert.ok(cloud?.isInstancedMesh && formation?.isInstancedMesh);
    world.setDestinationArrival(31);
    assert.equal(cloud.geometry.userData.premiumAtmosphere, sector.cloud);
    world.setGraphicsQuality('medium');
    assert.equal(formation.visible, false);
    world.setGraphicsQuality('high');
    assert.equal(formation.visible, true);
    world.setDestinationArrival(31);
    assert.ok(scene.getObjectByName(sector.cloudName).visible);
  }
  world.setSector(SECTORS[0], 0);
  for (const sector of atmosphericCases) {
    assert.equal(scene.getObjectByName(sector.cloudName), undefined);
    assert.equal(scene.getObjectByName(sector.formationName), undefined);
  }
});
