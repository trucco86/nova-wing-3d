import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { readFileSync } from 'node:fs';
import { fighter, createFlyingRobot, scaleFighterVisual } from '../src/visuals.js';

test('NOVA-7 adds premium flush surface layers within the original combat silhouette', () => {
  const ship = fighter();
  const finish = ship.getObjectByName('nova7-premium-airframe');
  for (const [name, count] of [
    ['nova7-step-panel-finish', 14],
    ['nova7-machined-seams', 18],
    ['nova7-recessed-navigation-leds', 8],
  ]) {
    const layer = finish.getObjectByName(name);
    assert.ok(layer?.isInstancedMesh, 'micro-details must be a single GPU batch: ' + name);
    assert.equal(layer.count, count);
    assert.equal(layer.userData.visualOnly, true);
    for (const v of layer.geometry.attributes.position.array) assert.ok(Number.isFinite(v));
  }
  assert.equal(ship.getObjectByName('airframe-weapon-pod'), undefined);
  assert.equal(
    fighter(true).getObjectByName('nova7-step-panel-finish'),
    undefined,
    'enemy swarms should not inherit extra hero GPU batches',
  );
  const before = new T.Box3().setFromObject(ship).getSize(new T.Vector3()).x;
  scaleFighterVisual(ship, 1.11);
  assert.ok(new T.Box3().setFromObject(ship).getSize(new T.Vector3()).x > before * 1.109);
  assert.equal(ship.scale.x, 1, 'hero hitbox / gameplay root not scaled');
});

test('robot has neutral smaller visual scale and mechanical finishes following articulated wrists', () => {
  const robot = createFlyingRobot();
  assert.equal(robot.scale.x, 1.0);
  const detail = robot.getObjectByName('mech-premium-mechanics');
  for (const name of [
    'mech-chest-leg-armor-inserts',
    'mech-limb-service-seams',
    'mech-limb-emissive-indicators',
  ]) {
    assert.equal(detail.getObjectByName(name)?.isInstancedMesh, true);
  }
  for (const arm of robot.userData.mechRig.arms) {
    assert.equal(arm.getObjectByName('mech-articulated-forearm-panels')?.count, 3);
    assert.equal(arm.getObjectByName('mech-articulated-cannon-leds')?.count, 2);
  }
  assert.ok(robot.userData.mecha.arms.right.muzzle);
  assert.ok(robot.userData.mecha.arms.left.muzzle);
  assert.ok(robot.getObjectByName('mech-turbine-rotor'));
});

test('mobile layout keeps a physical seventh LOCK button, modest opacity, large hit targets', () => {
  const source = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(source, /Mobile Controls 3\.0/);
  assert.match(source, /#lockTouch:not\(\[hidden\]\)/);
  assert.match(source, /body\.in-mission #touch \.actions button \{/);
  assert.match(source, /min-width: 48px;/);
  assert.match(source, /min-height: 48px;/);
  assert.match(source, /opacity: 0\.55;/);
  assert.match(source, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(source, /touch-action: none;/);
});

test('QA183: rear heat shields retain three paint batches and stay within airframe limits', () => {
  const ship = fighter();
  const finish = ship.getObjectByName('nova7-premium-airframe');
  const batches = finish.children.filter((part) => part.isInstancedMesh);
  assert.equal(batches.length, 3);
  const matrix = new T.Matrix4();
  const position = new T.Vector3();
  for (const batch of batches) {
    for (let i = 0; i < batch.count; i++) {
      batch.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      assert.ok(Math.abs(position.x) <= 3.8);
      assert.ok(position.z <= 2.5);
    }
  }
  const plates = finish.getObjectByName('nova7-step-panel-finish');
  let rear = 0;
  for (let i = 0; i < plates.count; i++) {
    plates.getMatrixAt(i, matrix);
    if (position.setFromMatrixPosition(matrix).z >= 1.45) rear++;
  }
  assert.equal(rear, 6);
  assert.equal(ship.userData.flames.length, 2);
  assert.equal(fighter(true).getObjectByName('nova7-step-panel-finish'), undefined);
});
