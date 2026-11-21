import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { europaDescentAt } from '../src/europa-descent.js';
import {
  EUROPA_CAVE_BUDGET,
  EUROPA_CAVE_LENGTH,
  createEuropaIceCavern,
} from '../src/europa-ice-cavern.js';
import { addEuropaEnemyIceSkin } from '../src/europa-enemy-ice-skin.js';
import { createObstacle } from '../src/encounters.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('Europa moon disappears exactly at orbit handoff behind a dense ice mist curtain', () => {
  for (let t = 0; t <= 6; t += 0.5) assert.equal(europaDescentAt(t).planetOpacity, 1);
  assert.ok(europaDescentAt(7).planetOpacity > 0);
  assert.ok(europaDescentAt(7).planetOpacity < 1);
  for (let t = 8; t <= 25; t += 0.25) {
    assert.equal(
      europaDescentAt(t).planetOpacity,
      0,
      'no planet persists after orbital entry: ' + t,
    );
  }
  assert.ok(europaDescentAt(7.6).iceMist > 0.95, 'brief glacial curtain in orbit');
  assert.ok(europaDescentAt(12).iceMist < 0.01, 'no prolonged empty fog');
  assert.equal(europaDescentAt(16).iceMist, 0, 'crisp canyon after reveal');
  assert.equal(europaDescentAt(25).iceMist, 0);
  assert.equal(europaDescentAt(25).combatReady, true);
  // Cinematic boost is automatic during the approach and ends at orbit.
  assert.equal(europaDescentAt(0).approachBoost, true);
  assert.equal(europaDescentAt(5.99).approachBoost, true);
  for (const second of [6, 8, 12, 25, 45])
    assert.equal(europaDescentAt(second).approachBoost, false);
});

test('Europa cavern is a long readable frozen passage with geometry outside collision route', () => {
  const cavern = createEuropaIceCavern();
  assert.equal(cavern.name, 'europa-cathedral-ice-cavern');
  assert.equal(cavern.userData.visualOnly, true);
  assert.equal(EUROPA_CAVE_LENGTH, 520);
  const expected = [
    ['europa-cave-sculpted-wall', EUROPA_CAVE_BUDGET.wallRocks],
    ['europa-cave-vaulted-ceiling', EUROPA_CAVE_BUDGET.ceilingSpires],
    ['europa-cave-hanging-ice-stalactites', EUROPA_CAVE_BUDGET.crystalSpikes],
    ['europa-cave-monumental-entrance', EUROPA_CAVE_BUDGET.entranceRocks],
    ['europa-cave-natural-ice-arch', EUROPA_CAVE_BUDGET.archstones],
    ['europa-cave-exterior-glacial-cliffs', EUROPA_CAVE_BUDGET.exteriorCliffs],
    ['europa-cave-faceted-gate-skin', EUROPA_CAVE_BUDGET.gateFacets],
  ];
  assert.equal(cavern.children.length, expected.length);
  const matrix = new T.Matrix4();
  const position = new T.Vector3();
  const scale = new T.Vector3();
  const rotation = new T.Quaternion();
  for (const [name, count] of expected) {
    const mesh = cavern.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name + ' must remain a single draw');
    assert.equal(mesh.count, count);
    assert.equal(mesh.userData.visualOnly, true);
    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);
      if (name.includes('exterior-glacial-cliffs')) {
        assert.ok(Math.abs(position.x) - scale.x > 55, 'fjord stays outside flight');
        assert.ok(position.z >= -260 && position.z <= -28, 'fjord remains behind cave mouth');
      } else if (name.includes('natural-ice-arch')) {
        assert.ok(position.z <= 0 && position.z >= -12, 'arch frames cave mouth');
        assert.ok(
          position.y - scale.y >= 33 && position.y - scale.y < 39,
          'natural arch conceals the flat collider without closing the 64-unit flight lane',
        );
        assert.ok(Math.abs(position.x) < 33, 'arch has organic span over entrance');
      } else if (name.includes('entrance')) {
        assert.ok(position.z <= 7 && position.z >= -10, 'cave entrance frames the opening');
        assert.ok(
          Math.abs(position.x) - scale.x > 30,
          'entrance must remain outside the safe passage',
        );
      } else {
        assert.ok(position.z < 0 && position.z >= -550);
      }
      if (name.includes('wall'))
        assert.ok(Math.abs(position.x) - scale.x > 30, 'wall must not hide tunnel opening');
      if (name.includes('ceiling'))
        assert.ok(position.y - scale.y >= 38, 'roof must not hang into traversable volume');
      if (name.includes('stalactites'))
        assert.ok(Math.abs(position.x) - scale.x > 30, 'spikes must avoid flight corridor');
    }
  }
});

test('Europa reuses existing 520-unit collision tunnel, including the breakable ice wall', () => {
  const tunnel = createObstacle('tunnel', 'europa');
  const cave = tunnel.getObjectByName('europa-cathedral-ice-cavern');
  assert.ok(cave?.isGroup);
  assert.ok(tunnel.userData.solids.length > 6);
  assert.equal(tunnel.userData.length, 520);
  assert.equal(tunnel.userData.europaBreach, true);
  assert.ok(tunnel.getObjectByName('europa-tunnel-breach-panel'));
  assert.ok(tunnel.getObjectByName('europa-tunnel-falling-debris'));
  const roof = tunnel.getObjectByName('europa-cavern-physical-roof-hidden-under-ice');
  assert.ok(roof?.isMesh, 'same physical ceiling has an authored visual cover');
  assert.equal(roof.visible, false, 'no rectangle across cave mouth');
  for (let gate = 0; gate < 3; gate++) {
    for (const side of ['left', 'right']) {
      const panel = tunnel.getObjectByName('europa-cave-hidden-' + side + '-gate-' + gate);
      assert.ok(panel?.isMesh, 'all six real gate colliders remain');
      assert.equal(panel.visible, false, 'squared gate facade becomes irregular crystal skin');
    }
  }
  for (const name of [
    'europa-cave-hidden-left-wall-collider',
    'europa-cave-hidden-right-near-collider',
    'europa-cave-hidden-right-far-collider',
  ]) {
    const wall = tunnel.getObjectByName(name);
    assert.ok(wall?.isMesh, 'physical wall must remain: ' + name);
    assert.equal(wall.visible, false, 'side wall slab must be replaced by rock skin');
  }
  assert.ok(
    tunnel.userData.solids.some(
      (solid) =>
        solid.center.y === 38.5 &&
        solid.center.z === -260 &&
        solid.half.x === 36 &&
        solid.half.y === 1.5 &&
        solid.half.z === 260,
    ),
    'full-size original roof collider remains intact',
  );
  assert.equal(cave.userData.visualOnly, true);
  const standard = createObstacle('tunnel', 'standard');
  assert.equal(standard.getObjectByName('europa-cathedral-ice-cavern'), undefined);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  world.setDestinationArrival(30);
  assert.equal(world.setEuropaTunnel(true), true);
  assert.equal(scene.getObjectByName('launch-ground')?.visible, false);
  assert.equal(
    scene.getObjectByName('europa-frozen-surface')?.visible,
    true,
    'distant canyon remains visible outside the physical ice corridor',
  );
  world.setEuropaTunnel(false);
  assert.equal(scene.getObjectByName('europa-frozen-surface')?.visible, true);
});

test('Europa fighters and ground patrols receive white armor and crystalline spikes only as visual skins', () => {
  for (const ground of [false, true]) {
    const enemy = new T.Group();
    const originalPosition = enemy.position.clone();
    const originalScale = enemy.scale.clone();
    const skin = addEuropaEnemyIceSkin(enemy, { ground });
    assert.equal(skin.name, 'europa-white-ice-enemy-skin');
    assert.equal(skin.userData.visualOnly, true);
    assert.equal(skin.children.length, 2);
    assert.equal(skin.getObjectByName('europa-white-ice-armor').count, 5);
    assert.equal(skin.getObjectByName('europa-crystal-ice-spines').count, 10);
    assert.deepEqual(enemy.position, originalPosition);
    assert.deepEqual(enemy.scale, originalScale);
    assert.equal(enemy.userData.solids, undefined);
    assert.equal(
      skin.getObjectByName('europa-white-ice-armor').material.color.getHexString(),
      'f4fbff',
    );
  }
  assert.equal(addEuropaEnemyIceSkin(null), null);
});
