import * as T from 'three';

// Europa's Colossus extends far below its own origin. Raising the entire
// boss to avoid the original y=-7 floor moved its head out of the camera.
// The arena therefore opens into a deep ice basin: lower only its ground
// surface, while keeping the boss near the flight/reticle center. Compute
// its bounding box once, never every frame on mobile.
export const EUROPA_ARENA_FLOOR_Y = -7;
export const EUROPA_ARENA_FLOOR_GAP = 18;
export const EUROPA_ARENA_BACKDROP_DEPTH = -280;
// Keep low tactical poses, attacks and facial weak points inside the reticle.
// The glacial floor is lowered to fit the actual Colossus silhouette instead.
export const EUROPA_ARENA_MIN_CENTER_TARGET = 7;
// The boss is enormous. Keep it behind the aim corridor, not overlapping the
// player's cockpit. At z=-205, 6-second slow enemy bolts (38 units/s)
// can still reach the pilot at z≈9: 214 < 228 units.
export const EUROPA_ARENA_BOSS_DEPTH = -205;

export function europaBossArenaDepth(requestedZ) {
  if (!Number.isFinite(requestedZ)) throw new RangeError('Invalid Europa boss depth');
  return Math.min(requestedZ, EUROPA_ARENA_BOSS_DEPTH);
}

export function europaBossFloorY(boss) {
  const originalMinimum = europaBossMinimumCenterHeight(boss);
  return EUROPA_ARENA_FLOOR_Y - Math.max(0, originalMinimum - EUROPA_ARENA_MIN_CENTER_TARGET);
}

export function europaBossMinimumCenterHeight(
  boss,
  floorY = EUROPA_ARENA_FLOOR_Y,
  gap = EUROPA_ARENA_FLOOR_GAP,
) {
  if (!boss?.isObject3D || !Number.isFinite(floorY) || !Number.isFinite(gap) || gap < 0)
    throw new RangeError('Invalid Europa boss floor clearance');
  const bounds = new T.Box3().setFromObject(boss);
  if (bounds.isEmpty()) throw new RangeError('Europa boss has no visible bounds');
  // The bounds already include the current world transform. Express the
  // lower extremity relative to the root origin so any requested y can be
  // clamped without changing the model, weakpoints or damage positions.
  return floorY + gap - (bounds.min.y - boss.position.y);
}

export function europaBossArenaHeight(requestedY, minimumCenterY) {
  if (!Number.isFinite(requestedY) || !Number.isFinite(minimumCenterY))
    throw new RangeError('Invalid Europa boss altitude');
  return Math.max(requestedY, minimumCenterY);
}
