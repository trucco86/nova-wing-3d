// Read-only, deterministic third-person orbit camera for the QA station.
// Pure geometry keeps inputs and browser frame timing outside this contract.
import { ORBIT9_OBSTACLES } from './orbit9-free-roam.js';

export const ORBIT9_CAMERA_MODES = Object.freeze(['follow', 'survey']);
export function orbit9CameraState({ yaw = 0, mode = 'follow' } = {}) {
  return {
    yaw: Number.isFinite(yaw) ? Math.atan2(Math.sin(yaw), Math.cos(yaw)) : 0,
    mode: ORBIT9_CAMERA_MODES.includes(mode) ? mode : 'follow',
  };
}
export function orbit9RotateCamera(state, radians) {
  const safe = orbit9CameraState(state);
  return orbit9CameraState({ ...safe, yaw: safe.yaw + (Number.isFinite(radians) ? radians : 0) });
}
export function orbit9ToggleCameraMode(state) {
  const safe = orbit9CameraState(state);
  return { ...safe, mode: safe.mode === 'follow' ? 'survey' : 'follow' };
}

function segmentEntry(x0, z0, dx, dz, block, expand = 1.1) {
  const ranges = [
    [x0, dx, block.x - block.halfX - expand, block.x + block.halfX + expand],
    [z0, dz, block.z - block.halfZ - expand, block.z + block.halfZ + expand],
  ];
  let near = 0;
  let far = 1;
  for (const [start, delta, min, max] of ranges) {
    if (Math.abs(delta) < 0.00001) {
      if (start < min || start > max) return null;
      continue;
    }
    const first = (min - start) / delta;
    const second = (max - start) / delta;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (far < near) return null;
  }
  return near;
}

export function orbit9CameraPose(x, z, state, blocks = ORBIT9_OBSTACLES) {
  const safe = orbit9CameraState(state);
  const survey = safe.mode === 'survey';
  // Keep the follow camera closer than the panoramic view: the previous 19m
  // distance made nearby reactor pylons fill the screen and the pilot tiny.
  const distance = survey ? 30 : 15;
  const shoulder = survey ? 0 : 2.4;
  const cos = Math.cos(safe.yaw);
  const sin = Math.sin(safe.yaw);
  const aim = { x, y: survey ? 3.5 : 3.6, z };
  const desiredX = x + sin * distance + cos * shoulder;
  const desiredZ = z + cos * distance - sin * shoulder;
  let fraction = 1;
  const dx = desiredX - x;
  const dz = desiredZ - z;
  for (const block of blocks) {
    const entry = segmentEntry(x, z, dx, dz, block);
    // Never allow walls to entirely squeeze the camera into the player.
    if (entry !== null) fraction = Math.min(fraction, Math.max(0.2, entry - 0.035));
  }
  return {
    eye: {
      x: x + dx * fraction,
      y: (survey ? 25 : 10.5) * (0.5 + 0.5 * fraction),
      z: z + dz * fraction,
    },
    aim,
    fov: survey ? 68 : 59,
    clipped: fraction < 0.99,
  };
}
