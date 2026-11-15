import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  BOSS_SHAPES,
  animateBossVisualIdentity,
  createBossVisualIdentity,
} from '../src/boss-visual-identity.js';

function identity(sector) {
  return createBossVisualIdentity(sector, {
    armor: new T.MeshStandardMaterial(),
    dark: new T.MeshStandardMaterial(),
    edge: new T.MeshBasicMaterial(),
    hot: new T.MeshBasicMaterial(),
  });
}

const animated = [
  'station-reactor-shield-spoke-0',
  'solar-phoenix-feather-0',
  'glacial-artillery-forearm',
  'hydra-head-eye-0',
  'omega-armored-battery-emplacement',
  'orion-lensing-iris-0',
  'marvin-imperial-crown-spire-0',
];

test('bosses 4–10 have distinct visual-only mechanisms that animate during attacks', () => {
  for (let sector = 3; sector <= 9; sector++) {
    const root = identity(sector);
    assert.equal(root.name, 'boss-distinct-' + BOSS_SHAPES[sector]);
    assert.equal(root.userData.visualOnly, true);
    const object = root.getObjectByName(animated[sector - 3]);
    assert.ok(object, 'missing articulation in sector ' + sector);
    animateBossVisualIdentity(root, sector, 0, 1, 'maneuver');
    const first = [
      object.rotation.z,
      object.position.x,
      object.position.y,
      object.position.z,
      object.scale.x,
    ];
    animateBossVisualIdentity(root, sector, 2, 3, 'attack');
    const next = [
      object.rotation.z,
      object.position.x,
      object.position.y,
      object.position.z,
      object.scale.x,
    ];
    assert.notDeepEqual(next, first, 'boss is static in sector ' + sector);
  }
});

test('last three bosses have monumental silhouette without resizing their gameplay root', () => {
  for (let sector = 7; sector <= 9; sector++) {
    const root = identity(sector);
    const box = new T.Box3().setFromObject(root);
    assert.ok(box.max.x - box.min.x > 145, 'final bosses must have large authored structures');
    assert.deepEqual(root.scale.toArray(), [1, 1, 1]);
  }
});

test('Rok and Carbide stay unchanged while Mars moves only approved visual legs', () => {
  for (let sector = 0; sector <= 2; sector++) {
    const root = identity(sector);
    const before = root.children.map((object) => [
      object.position.toArray(),
      object.rotation.toArray(),
      object.scale.toArray(),
    ]);
    const count = root.children.length;
    animateBossVisualIdentity(root, sector, 18, 3, 'attack', 'stingray-sting');
    const after = root.children.map((object) => [
      object.position.toArray(),
      object.rotation.toArray(),
      object.scale.toArray(),
    ]);
    assert.equal(root.children.length, count, 'do not add draw objects');
    if (sector === 1) {
      assert.notDeepEqual(after, before, 'Martian mechanical limbs now articulate');
      const legs = root.children.filter((part) => part.name.startsWith('mars-dune-walker-upper-leg-'));
      assert.equal(legs.length, 6);
      assert.ok(legs.some((leg) => Math.abs(leg.rotation.z) > 0.2));
    } else {
      assert.deepEqual(after, before, 'legacy boss silhouette remains stable');
    }
  }
});
