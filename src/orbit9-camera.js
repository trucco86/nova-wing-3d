// Read-only, deterministic third-person orbit camera for the QA station.
// Pure geometry keeps inputs and browser frame timing outside this contract.
import { ORBIT9_BOUNDS, ORBIT9_OBSTACLES } from './orbit9-free-roam.js';

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
  const portrait = Number.isFinite(state?.aspect) && state.aspect < 0.78;
  // The original 15m, 10.5m-high follow camera looked down at the deck:
  // portrait and landscape screenshots showed mostly empty floor and hid
  // the carrier architecture. Follow from shoulder height and look 7.5m
  // ahead of the cat. Survey mode deliberately keeps the bird's-eye view.
  // Portrait has less horizontal field of view and the cat otherwise fills
  // most of the screen. Extend the camera back along the landing deck only
  // for that layout, leaving the approved landscape framing unchanged.
  const distance = survey ? 30 : portrait ? 17 : 11.8;
  const shoulder = survey ? 0 : portrait ? 0.8 : 1.1;
  const cos = Math.cos(safe.yaw);
  const sin = Math.sin(safe.yaw);
  const lookAhead = survey ? 0 : 7.5;
  const aim = {
    x: x - sin * lookAhead,
    y: survey ? 3.5 : 3.35,
    z: z - cos * lookAhead,
  };
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
  // Never put the camera behind the built station when the pilot begins
  // near its south entrance. The deck only extends to z=22; unbounded
  // camera z=27 used to show a dark void occupying half the viewport.
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  return {
    eye: {
      x: clamp(x + dx * fraction, ORBIT9_BOUNDS.minX - 2, ORBIT9_BOUNDS.maxX + 2),
      y: survey
        ? 25 * (0.5 + 0.5 * fraction)
        : (portrait ? 7.1 : 6.1) * (0.7 + 0.3 * fraction),
      z: clamp(
        z + dz * fraction,
        ORBIT9_BOUNDS.minZ - 2,
        ORBIT9_BOUNDS.maxZ + (portrait && !survey ? 16 : 3),
      ),
    },
    aim,
    fov: survey ? 68 : portrait ? 59 : 52,
    clipped: fraction < 0.99,
  };
}
