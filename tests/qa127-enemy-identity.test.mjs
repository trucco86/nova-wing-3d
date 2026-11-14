import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter } from '../src/visuals.js';
import { createGroundEnemy } from '../src/encounters.js';
import { createEnemyIdentityDetail, enemyIdentityPlates } from '../src/enemy-premium-identity.js';

const kinds = ['fighter', 'tank', 'walker'];

test('every role has a distinct premium silhouette without extra gameplay colliders', () => {
  for (const kind of kinds) {
    const variants = [0, 1, 2].map((variant) => enemyIdentityPlates(kind, variant));
    assert.notDeepEqual(variants[0], variants[1]);
    assert.notDeepEqual(variants[1], variants[2]);
    for (const [variant, parts] of variants.entries()) {
      assert.ok(parts.length >= 8 && parts.length <= 12, kind + ' render budget');
      assert.ok(
        parts.every((part) =>
          Object.values(part).every((v) => typeof v === 'string' || Number.isFinite(v)),
        ),
      );
      const batch = createEnemyIdentityDetail(kind, variant);
      assert.ok(batch instanceof T.InstancedMesh);
      assert.equal(batch.count, parts.length);
      assert.equal(batch.userData.visualOnly, true);
      assert.equal(batch.userData.enemyIdentity.kind, kind);
      assert.equal(batch.userData.enemyIdentity.variant, variant);
      assert.ok(batch.instanceColor, 'variant-specific armor has instance colors');
      for (let i = 0; i < batch.count; i++) {
        const matrix = new T.Matrix4();
        batch.getMatrixAt(i, matrix);
        assert.ok(matrix.elements.every(Number.isFinite));
      }
    }
  }
});

test('all enemy roles keep one cosmetic batch while hero silhouette remains unchanged', () => {
  const hero = fighter(false);
  assert.equal(hero.getObjectByName('premium-fighter-identity-variant-0'), undefined);
  for (const variant of [0, 1, 2]) {
    const model = fighter(true, variant);
    const batches = [];
    model.traverse((part) => {
      if (part.userData?.enemyIdentity) batches.push(part);
    });
    assert.equal(batches.length, 1, 'one instanced armor batch per fighter');
    assert.equal(batches[0].userData.enemyIdentity.variant, variant);
    assert.ok(batches[0] instanceof T.InstancedMesh);
    assert.ok(model.getObjectByName('enemy-premium-airframe'));
    for (const side of [-1, 1]) {
      assert.ok(
        model.getObjectByName(side < 0 ? 'fighter-underwing-missile' : 'fighter-underwing-missile'),
      );
    }
  }
});

test('tanks and walkers expose premium identities without changing turret or emitters', () => {
  for (const kind of ['tank', 'walker']) {
    for (const variant of [0, 1, 2]) {
      const model = createGroundEnemy(kind, variant);
      const identities = [];
      model.traverse((part) => {
        if (part.userData?.enemyIdentity) identities.push(part);
      });
      assert.equal(identities.length, 1);
      assert.equal(identities[0].userData.enemyIdentity.variant, variant);
      assert.ok(model.getObjectByName('turret'));
      if (kind === 'walker') {
        assert.ok(model.getObjectByName('enemy-robot-eye-left'));
        assert.ok(model.getObjectByName('enemy-robot-eye-right'));
      }
    }
    assert.ok(
      !createGroundEnemy(kind, -1).getObjectByName('premium-' + kind + '-identity-variant-0'),
      'native/legacy path preserves original silhouette',
    );
  }
});
