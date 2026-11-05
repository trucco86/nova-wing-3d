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
// The old z=-205 staging made the Colossus read as a tiny, distant target.
// Bring it 45 world units nearer (~22% of the old depth) without modifying
// model scale, hitboxes, destructible parts, muzzle anchors or the 360 orbit.
// The front of the giant model must still leave clear cockpit/aiming space.
// Slow bolts (38 units/s, 6 s) comfortably travel from z=-160 to pilot z≈9.
export const EUROPA_ARENA_BOSS_DEPTH = -160;
// Portrait 98° made the boss look especially far away. The tighter 88° lens
// increases on-screen presence while leaving the glacial arena unobstructed.
export const EUROPA_ARENA_PORTRAIT_FOV = 88;
export const EUROPA_ARENA_PORTRAIT_ASPECT_LIMIT = 0.72;

export function europaBossPortraitFov(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0) throw new RangeError('Invalid Europa camera aspect');
  return aspect < EUROPA_ARENA_PORTRAIT_ASPECT_LIMIT ? EUROPA_ARENA_PORTRAIT_FOV : null;
}

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
