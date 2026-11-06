/**
 * Deterministic swept sphere versus compound, axis-aligned scene colliders.
 *
 * Obstacle coordinates are sampled before/after scroll each frame. The solver
 * resolves *relative motion*, so fast boosts and low frame rates cannot skip
 * a thin piece of architecture merely because the final positions are clear.
 * Pure numeric coordinates keep this independent of Three.js/renderer state.
 */
const AXES = ['x', 'y', 'z'];
const EPSILON = 1e-9;
const SKIN = 1e-3;

export function sweepSphereAabb(from, to, center, half, radius = 0) {
  let enter = 0;
  let exit = 1;
  let axis = null;
  let sign = 0;
  let startedInside = true;
  for (const k of AXES) {
    const low = center[k] - half[k] - radius;
    const high = center[k] + half[k] + radius;
    if (from[k] < low || from[k] > high) startedInside = false;
    const delta = to[k] - from[k];
    if (Math.abs(delta) < EPSILON) {
      if (from[k] < low || from[k] > high) return null;
      continue;
    }
    const a = (low - from[k]) / delta;
    const b = (high - from[k]) / delta;
    const near = Math.min(a, b);
    const far = Math.max(a, b);
    if (near > enter) {
      enter = near;
      axis = k;
      sign = delta > 0 ? -1 : 1;
    }
    exit = Math.min(exit, far);
    if (enter > exit) return null;
  }
  if (exit < 0 || enter > 1) return null;
  return { time: Math.max(0, enter), axis, sign, startedInside };
}

function separate(point, center, half, radius) {
  let axis = null;
  let distance = Infinity;
  let correction = 0;
  for (const k of AXES) {
    const low = center[k] - half[k] - radius;
    const high = center[k] + half[k] + radius;
    if (point[k] < low || point[k] > high) return false;
    const towardLow = point[k] - low;
    const towardHigh = high - point[k];
    const offset = towardLow <= towardHigh ? -towardLow - SKIN : towardHigh + SKIN;
    if (Math.abs(offset) < distance) {
      distance = Math.abs(offset);
      axis = k;
      correction = offset;
    }
  }
  if (axis) point[axis] += correction;
  return !!axis;
}

/**
 * Resolve player/rig position against the obstacle's compound boxes.
 * 'before'/'after' are the obstacle's world positions, not its collider local
 * centers. Returns a new position without mutating either input.
 */
export function resolveMovingObstacle(from, to, solids, before, after, radius = 1.3) {
  const position = { x: to.x, y: to.y, z: to.z };
  if (!solids?.length) return { collided: false, position };
  const start = {};
  const end = {};
  for (const k of AXES) {
    start[k] = from[k] - before[k];
    end[k] = position[k] - after[k];
  }
  let collided = false;
  // Compound geometry: after a swept hit, settle any neighboring box contacts.
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const solid of solids) {
      const hit = pass === 0 ? sweepSphereAabb(start, end, solid.center, solid.half, radius) : null;
      if (hit && !hit.startedInside && hit.axis) {
        collided = true;
        const t = Math.max(0, hit.time - 1e-6);
        for (const k of AXES) end[k] = start[k] + (end[k] - start[k]) * t;
        end[hit.axis] += hit.sign * SKIN;
        moved = true;
      }
      if (separate(end, solid.center, solid.half, radius)) {
        collided = true;
        moved = true;
      }
      if (hit?.startedInside) collided = true;
    }
    if (!moved) break;
  }
  for (const k of AXES) position[k] = end[k] + after[k];
  return { collided, position };
}

/** A static surface test for props and scripted spawns. */
export function intersectsSolid(position, solids, origin, radius = 0) {
  return solids.some(({ center, half }) =>
    AXES.every((k) => Math.abs(position[k] - origin[k] - center[k]) <= half[k] + radius),
  );
}
