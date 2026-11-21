import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orbit9CameraState,
  orbit9RotateCamera,
  orbit9ToggleCameraMode,
  orbit9CameraPose,
} from '../src/orbit9-camera.js';
import {
  ORBIT9_SURVIVOR_DIALOGUE,
  orbit9DialogueBeat,
  orbit9NextDialogue,
} from '../src/orbit9-dialogue.js';

test('Orbit-9 orbit camera wraps rotations, toggles survey and resets invalid inputs', () => {
  const follow = orbit9CameraState();
  assert.deepEqual(follow, { yaw: 0, mode: 'follow' });
  const rotated = orbit9RotateCamera(follow, Math.PI * 2.25);
  assert.ok(Math.abs(rotated.yaw - Math.PI / 4) < 1e-8);
  const survey = orbit9ToggleCameraMode(rotated);
  assert.equal(survey.mode, 'survey');
  assert.equal(orbit9ToggleCameraMode(survey).mode, 'follow');
  assert.deepEqual(orbit9CameraState({ yaw: NaN, mode: 'not-a-mode' }), follow);
  assert.deepEqual(orbit9RotateCamera(follow, NaN), follow);
});

test('Orbit-9 camera adapts to reactor walls and keeps the cat visible', () => {
  const clear = orbit9CameraPose(0, -25, orbit9CameraState());
  assert.equal(clear.clipped, false);
  const blocked = orbit9CameraPose(0, -25, { yaw: Math.PI, mode: 'follow' });
  assert.equal(blocked.clipped, true);
  assert.ok(blocked.eye.z > -34, 'camera must not pass through the solid central core');
  // The new low-angle follow camera looks ahead in its orbit direction.
  // sin(PI) has floating-point noise: compare geometry with a tolerance.
  assert.ok(Math.abs(blocked.aim.x) < 1e-8);
  assert.ok(blocked.aim.z > -25, 'reverse orbit looks beyond the cat, not at its feet');
  assert.ok(clear.aim.z < -25, 'forward orbit looks into the Devastador hangar');
  assert.ok(blocked.eye.y > blocked.aim.y);
  const survey = orbit9CameraPose(-38, -18, { yaw: 0, mode: 'survey' });
  assert.ok(survey.eye.y > clear.eye.y);
  assert.ok(survey.fov > clear.fov);
});

test('Orbit-9 survivor tells exactly three beats before the irreversible choice', () => {
  assert.equal(ORBIT9_SURVIVOR_DIALOGUE.length, 3);
  assert.equal(orbit9DialogueBeat(-1), null);
  assert.equal(orbit9DialogueBeat(3), null);
  assert.equal(orbit9DialogueBeat(0).speaker, 'SOBREVIVENTE');
  assert.equal(orbit9NextDialogue(0), 1);
  assert.equal(orbit9NextDialogue(1), 2);
  assert.equal(orbit9NextDialogue(2), null);
  assert.equal(orbit9NextDialogue(NaN), 0);
});
