import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShowroomPilot } from '../src/showroom-models.js';
import {
  createOrbit9WalkRig,
  orbit9StickAxes,
  orbit9CameraRelativeAxes,
} from '../src/orbit9-locomotion.js';

test('Orbit-9 reuses the exact pilot identity and articulates legs on actual travel', () => {
  for (const id of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    const pilot = createShowroomPilot(id);
    const rig = createOrbit9WalkRig(pilot);
    assert.equal(pilot.userData.artIdentity, id);
    assert.ok(pilot.getObjectByName('orbit9-left-hip'));
    assert.ok(pilot.getObjectByName('orbit9-right-knee'));
    assert.equal(pilot.getObjectByName('leg')?.parent.name, 'orbit9-left-hip');
    const before = rig.snapshot();
    for (let i = 0; i < 16; i++) rig.update({ dt: 1 / 60, distanceTravelled: 11 / 60 });
    const walking = rig.snapshot();
    assert.ok(walking.distance > 2);
    assert.ok(walking.blend > 0.8);
    assert.ok(Math.abs(walking.leftHip) > 0.05 || Math.abs(walking.rightHip) > 0.05);
    assert.notEqual(walking.phase, before.phase);
    for (let i = 0; i < 60; i++) rig.update({ dt: 1 / 60 });
    const resting = rig.snapshot();
    assert.ok(resting.blend < 0.01);
    assert.ok(Math.abs(resting.leftHip) < 0.01);
    assert.ok(Math.abs(resting.rightHip) < 0.01);
  }
});

test('Orbit-9 thumb stick preserves main game directions, deadzone and diagonal range', () => {
  assert.deepEqual(orbit9StickAxes(0, 0, 40), { x: 0, z: 0 });
  assert.deepEqual(orbit9StickAxes(5, -4, 40), { x: 0, z: 0 });
  assert.deepEqual(orbit9StickAxes(0, -60, 40), { x: Math.cos(-Math.PI / 2), z: -1 });
  const diagonal = orbit9StickAxes(40, 40, 40);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 1e-10);
  assert.deepEqual(orbit9StickAxes(NaN, 0, 40), { x: 0, z: 0 });
});

test('Orbit-9 analog/keyboard directions follow camera yaw instead of fixed world axes', () => {
  const almost = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10);
  const forward = orbit9StickAxes(0, -40, 40);
  // Default camera looks into -Z; up means forward (away from viewer).
  const zero = orbit9CameraRelativeAxes(forward.x, forward.z, 0);
  almost(zero.x, 0);
  almost(zero.z, -1);
  // After a 90 degree right orbit, screen-up travels toward world -X.
  const quarter = orbit9CameraRelativeAxes(forward.x, forward.z, Math.PI / 2);
  almost(quarter.x, -1);
  almost(quarter.z, 0);
  const right = orbit9CameraRelativeAxes(1, 0, Math.PI / 2);
  almost(right.x, 0);
  almost(right.z, -1);
  // After looking at the cat from the opposite side, forward flips world Z.
  const reverse = orbit9CameraRelativeAxes(forward.x, forward.z, Math.PI);
  almost(reverse.x, 0);
  almost(reverse.z, 1);
  const diagonal = orbit9CameraRelativeAxes(0.6, -0.8, 1.2);
  almost(Math.hypot(diagonal.x, diagonal.z), 1);
  assert.deepEqual(orbit9CameraRelativeAxes(1, 0, NaN), { x: 0, z: 0 });
});
