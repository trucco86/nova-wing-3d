import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import {
  ANCIENT_WORLD_THEMES,
  createAlienArchitecture,
  setAlienArchitectureQuality,
  updateAlienArchitecture,
} from '../src/alien-architecture.js';
import { destinationArrivalAt } from '../src/destination-arrival.js';
import { createDestinationVista, updateDestinationVista } from '../src/destination-vista.js';

test('Venus, Europa, Neptune and Titan establish a planet without placing it inside the level', () => {
  for (const index of [4, 5, 6, 9]) {
    const vista = createDestinationVista(index);
    const globe = vista.getObjectByName('destination-celestial-body');
    assert.equal(destinationArrivalAt(index, 0).globeOpacity, 1);
    updateDestinationVista(vista, index, 14);
    if (index === 5) {
      assert.equal(globe.visible, false, 'Europa moon must vanish at orbital transition');
      assert.ok(globe.position.x > -150 && globe.position.x < 0, 'moon stays within camera');
      assert.ok(globe.scale.x > 1, 'Europa approaches before leaving the scene');
      const crossing = updateDestinationVista(vista, index, 20);
      assert.equal(crossing.globeOpacity, 0);
      assert.equal(crossing.reveal, 1, 'Europa glacier must already be revealed at 20s');
      assert.equal(crossing.haze, 0, 'Europa mist clears before 12s');
    } else {
      assert.equal(
        globe.visible,
        false,
        'planet must be gone during atmosphere entry in sector ' + index,
      );
      assert.equal(
        globe.position.x,
        -205,
        'approach planet must not obscure the central aiming lane',
      );
      assert.equal(globe.position.y, 170);
      assert.ok(globe.scale.x <= 0.91, 'the planetary approach is not a wall-sized backdrop');
    }
    updateDestinationVista(vista, index, 30);
    assert.equal(globe.visible, false);
  }
  const saturn = createDestinationVista(7);
  updateDestinationVista(saturn, 7, 30);
  assert.equal(saturn.getObjectByName('destination-celestial-body').visible, true);
  assert.ok(saturn.getObjectByName('saturn-planetary-ring-system'));
  const orion = createDestinationVista(8);
  updateDestinationVista(orion, 8, 30);
  assert.equal(orion.getObjectByName('destination-celestial-body').visible, false);
});

test('five distinct alien sites contain grounded instanced silhouettes, terraces and obelisks outside the flight lane', () => {
  assert.deepEqual(Object.keys(ANCIENT_WORLD_THEMES), ['sun', 'ice', 'nebula', 'void', 'throne']);
  for (const [theme, index] of [
    ['sun', 4],
    ['ice', 5],
    ['nebula', 6],
    ['void', 8],
    ['throne', 9],
  ]) {
    const root = createAlienArchitecture(theme);
    assert.equal(root.name, 'alien-architecture-' + theme);
    assert.ok(root.userData.visualOnly);
    assert.equal(root.children.length, theme === 'ice' ? 7 : 6);
    assert.ok(root.children.every((child) => child.isInstancedMesh && child.userData.visualOnly));
    assert.ok(
      root.children.some((child) => child.name.includes(ANCIENT_WORLD_THEMES[theme].structure)),
    );
    assert.ok(root.children.some((child) => child.name.includes('-terraces')));
    assert.equal(
      new Set(Object.values(ANCIENT_WORLD_THEMES).map((item) => item.structure)).size,
      5,
    );
    const position = new T.Vector3();
    const matrix = new T.Matrix4();
    for (const mesh of root.children) {
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        assert.ok(Math.abs(position.x) > 100, 'all structures leave the flight lane clear');
      }
    }
    const scene = new T.Scene();
    const world = createWorld(scene, () => 0.5, true);
    world.setSector(SECTORS[index], index);
    const installed = scene.getObjectByName('alien-architecture-' + theme);
    assert.ok(installed, 'site must be included in the real mission scene');
    const runes = installed.children.find((child) => child.userData.highOnly);
    assert.ok(runes);
    world.setGraphicsQuality('medium');
    assert.equal(runes.visible, false);
    world.setGraphicsQuality('high');
    assert.equal(runes.visible, true);
    world.setSector(SECTORS[0], 0);
    assert.equal(scene.getObjectByName('alien-architecture-' + theme), undefined);
  }
});

test('the scenery keeps gameplay physics unchanged and does not leak decorations into unrelated sectors', () => {
  const nullWorld = createAlienArchitecture('city');
  assert.equal(nullWorld, null);
  assert.doesNotThrow(() => setAlienArchitectureQuality(null, 'medium'));
  const root = createAlienArchitecture('throne', 'medium');
  const runes = root.children.find((child) => child.userData.highOnly);
  assert.equal(runes.visible, false);
  setAlienArchitectureQuality(root, 'high');
  assert.equal(runes.visible, true);
  root.traverse((node) => {
    assert.notEqual(node.userData.hitbox, true);
    assert.notEqual(node.userData.solids?.length > 0, true);
  });
});

test('alien architecture flies past slowly and wraps only behind the horizon without extra geometry', () => {
  const root = createAlienArchitecture('sun');
  const mesh = root.children.find((child) => child.name.includes('-terraces'));
  const matrix = new T.Matrix4();
  mesh.getMatrixAt(0, matrix);
  const initial = new T.Vector3().setFromMatrixPosition(matrix);
  assert.equal(initial.z, -245);
  const originalGeometry = mesh.geometry;
  const count = mesh.count;
  updateAlienArchitecture(root, 100);
  mesh.getMatrixAt(0, matrix);
  const moved = new T.Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(moved.z - (initial.z + 22)) < 0.01);
  assert.equal(moved.x, initial.x);
  assert.equal(moved.y, initial.y);
  updateAlienArchitecture(root, 100);
  mesh.getMatrixAt(0, matrix);
  assert.ok(Math.abs(new T.Vector3().setFromMatrixPosition(matrix).z - moved.z) < 0.01);
  updateAlienArchitecture(root, 10000);
  for (const batch of root.children) {
    assert.equal(batch.userData.visualOnly, true);
    assert.equal(batch.count, batch.userData.authoredDepth.length);
    for (let i = 0; i < batch.count; i++) {
      batch.getMatrixAt(i, matrix);
      const z = new T.Vector3().setFromMatrixPosition(matrix).z;
      assert.ok(z >= -1700 && z < 125, 'world object wraps outside the near field');
    }
  }
  assert.equal(mesh.geometry, originalGeometry);
  assert.equal(mesh.count, count);
  assert.doesNotThrow(() => updateAlienArchitecture(root, Number.NaN));
});

test('Europa unique tower approaches the ship, passes once, and never loops back onscreen', () => {
  const root = createAlienArchitecture('ice');
  const vault = root.getObjectByName('europa-sunken-alien-vault-hero');
  assert.ok(vault?.userData.heroLandmark);
  const matrix = new T.Matrix4();
  const where = () => {
    vault.getMatrixAt(0, matrix);
    return new T.Vector3().setFromMatrixPosition(matrix);
  };
  const initial = where();
  assert.equal(initial.z, -980);
  updateAlienArchitecture(root, 400);
  const approaching = where();
  assert.ok(approaching.z > initial.z && approaching.z < -750);
  assert.equal(approaching.x, initial.x);
  assert.equal(approaching.y, initial.y);
  updateAlienArchitecture(root, 1200);
  assert.ok(where().z > approaching.z, 'tower approaches camera with world travel');
  updateAlienArchitecture(root, 3000);
  assert.equal(where().z, 160, 'unique tower passes behind the camera, not frozen in view');
  updateAlienArchitecture(root, 48000);
  assert.equal(where().z, 160, 'tower never loops or reappears in the same stage');
  updateAlienArchitecture(root, 0);
  assert.equal(where().z, -980, 'replay restores the original distant approach');
  assert.equal(vault.count, 1);
  assert.equal(vault.userData.visualOnly, true);
});
