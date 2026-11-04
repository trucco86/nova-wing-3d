import * as T from 'three';

// Europa's fight has a visible ice floor at y=-7. The Colossus is a tall
// articulated mecha: centering it at the ordinary airborne boss height sends
// its legs, weapon chassis and lower armor straight through the terrain.
// Compute its bound only once on spawn, never every frame on mobile.
export const EUROPA_ARENA_FLOOR_Y = -7;
export const EUROPA_ARENA_FLOOR_GAP = 18;
export const EUROPA_ARENA_BACKDROP_DEPTH = -280;

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
