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
  assert.ok(europaDescentAt(12).iceMist > 0.95);
  assert.ok(europaDescentAt(16).iceMist > 0.9);
  assert.equal(europaDescentAt(25).iceMist, 0);
  assert.equal(europaDescentAt(25).combatReady, true);
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
      if (name.includes('entrance')) {
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
  assert.equal(cave.userData.visualOnly, true);
  const standard = createObstacle('tunnel', 'standard');
  assert.equal(standard.getObjectByName('europa-cathedral-ice-cavern'), undefined);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  world.setDestinationArrival(30);
  assert.equal(world.setEuropaTunnel(true), true);
  assert.equal(scene.getObjectByName('europa-frozen-surface')?.visible, false);
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
