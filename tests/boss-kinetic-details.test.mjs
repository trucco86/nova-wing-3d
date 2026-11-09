import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createBossKineticDetails,
  animateBossKineticDetails,
  BOSS_DETAIL_GRAMMAR,
} from '../src/boss-kinetic-details.js';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';

test('each boss has authored moving premium mechanisms without new hitboxes', () => {
  assert.equal(BOSS_DETAIL_GRAMMAR.length, 10);
  assert.equal(new Set(BOSS_DETAIL_GRAMMAR).size, 10);
  for (const [index, sector] of SECTORS.entries()) {
    const model = createBossModel(sector, index, true);
    const g = model.getObjectByName('boss-premium-kinetic-' + index);
    assert.ok(g, 'boss ' + index + ' premium detail');
    assert.equal(g.userData.grammar, BOSS_DETAIL_GRAMMAR[index]);
    assert.equal(g.userData.mechanisms.length, 2);
    assert.ok(g.getObjectByName('boss-industrial-rivets-instanced').isInstancedMesh);
    assert.ok(g.getObjectByName('boss-jointed-armor-fin'));
    assert.ok(g.getObjectByName('boss-live-energy-conduit'));
    assert.ok(g.userData.mechanisms.every((node) => node.userData.visualOnly === undefined));
    const originalWeak = model.userData.parts.map((p) => p.mesh.position.toArray());
    animateBossSignature(model, index, 8, 3, 'attack');
    assert.ok(g.userData.mechanisms.some((node) => Math.abs(node.rotation.y) > 0.01));
    assert.deepEqual(
      model.userData.parts.map((p) => p.mesh.position.toArray()),
      originalWeak,
    );
    assert.equal(model.userData.parts.length >= 2, true);
    disposeBoss(model);
  }
});

test('procedural movement uses simulation time and safely ignores an absent rig', () => {
  const materials = ['#405060', '#131a27', '#52e0ee', '#ee765c'].map(
    (c) => new T.MeshStandardMaterial({ color: c }),
  );
  const g = createBossKineticDetails(2, {
    armor: materials[0],
    dark: materials[1],
    edge: materials[2],
    hot: materials[3],
  });
  animateBossKineticDetails(g, 2, 4.3, 1, 'windup');
  const first = g.userData.mechanisms.map((m) => [m.rotation.y, m.rotation.z]);
  animateBossKineticDetails(g, 2, 4.3, 1, 'windup');
  assert.deepEqual(
    g.userData.mechanisms.map((m) => [m.rotation.y, m.rotation.z]),
    first,
  );
  animateBossKineticDetails(null, 2, 3.2);
  g.traverse((o) => o.geometry?.dispose());
  materials.forEach((m) => m.dispose());
});
