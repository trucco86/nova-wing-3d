import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  reactorOrbitalPosition,
  withReactorOrbitPresentation,
} from '../src/reactor-orbit-presentation.js';

test('the player and camera physically orbit a stationary Devastador chamber in presentation coordinates', () => {
  const scene = new T.Scene();
  const core = new T.Group();
  const hall = new T.Group();
  const background = new T.Group();
  const pilot = new T.Group();
  const camera = new T.PerspectiveCamera();
  const center = new T.Vector3(0, 17, -164);
  const turn = Math.PI / 2;
  core.position.copy(center);
  core.rotation.y = -turn;
  core.add(hall);
  background.position
    .copy(center)
    .sub(center.clone().applyAxisAngle(new T.Vector3(0, 1, 0), -turn));
  background.rotation.y = -turn;
  background.add(new T.Object3D());
  pilot.position.set(0, 12, 9);
  camera.position.set(0, 15, 36);
  scene.add(core, background, pilot, camera);
  const oldPilot = pilot.position.clone();
  const oldCamera = camera.position.clone();
  let seen = false;
  const value = withReactorOrbitPresentation(scene, center, turn, () => {
    scene.updateMatrixWorld(true);
    const observedPilot = pilot.getWorldPosition(new T.Vector3());
    const expected = reactorOrbitalPosition(oldPilot, center, turn);
    assert.ok(observedPilot.distanceTo(expected) < 0.001);
    assert.ok(
      camera
        .getWorldPosition(new T.Vector3())
        .distanceTo(reactorOrbitalPosition(oldCamera, center, turn)) < 0.001,
    );
    // Reactor and room orientation is constant in the fixed world frame.
    assert.ok(Math.abs(core.getWorldQuaternion(new T.Quaternion()).y) < 0.001);
    assert.ok(Math.abs(hall.getWorldQuaternion(new T.Quaternion()).y) < 0.001);
    assert.ok(Math.abs(background.getWorldQuaternion(new T.Quaternion()).y) < 0.001);
    assert.ok(core.getWorldPosition(new T.Vector3()).distanceTo(center) < 0.001);
    seen = true;
    return 23;
  });
  assert.equal(seen, true);
  assert.equal(value, 23);
  assert.ok(scene.position.length() < 0.001);
  assert.ok(scene.quaternion.angleTo(new T.Quaternion()) < 0.001);
  assert.ok(pilot.position.distanceTo(oldPilot) < 0.001);
  assert.ok(camera.position.distanceTo(oldCamera) < 0.001);
});

test('presentation always restores state on renderer error and never mutates collision coordinates', () => {
  const scene = new T.Scene();
  scene.position.set(6, 0, 2);
  const before = scene.position.clone();
  const child = new T.Group();
  child.position.set(3, 4, 5);
  scene.add(child);
  assert.throws(
    () =>
      withReactorOrbitPresentation(scene, new T.Vector3(0, 0, -100), 0.8, () => {
        throw new Error('render failure');
      }),
    /render failure/,
  );
  assert.deepEqual(scene.position.toArray(), before.toArray());
  assert.deepEqual(child.position.toArray(), [3, 4, 5]);
  assert.equal(
    withReactorOrbitPresentation(null, null, 0, () => 8),
    8,
  );
  assert.throws(() => withReactorOrbitPresentation(scene, before, 0, null), TypeError);
});
