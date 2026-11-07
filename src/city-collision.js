// Solid collision response for stage-1 objects. Damage alone does not make a
// collider physical: we must keep the ship's final position outside it.
//
// All coordinates are world space. The obstacle can move (e.g. falling/scrolling
// wreckage); segment intersection is solved in obstacle-relative coordinates.
// No Three.js allocation or mesh creation in the hot path.
export const CITY_SHIP_CLEARANCE = Object.freeze({ x: 5.4, y: 2.3, z: 3.2 });
export const CITY_ROAD_LIMIT = 36;

function sweepPointBox(sx, sy, sz, tx, ty, tz, hx, hy, hz) {
  let lo = 0;
  let hi = 1;
  for (let axis = 0; axis < 3; axis++) {
    const start = axis === 0 ? sx : axis === 1 ? sy : sz;
    const end = axis === 0 ? tx : axis === 1 ? ty : tz;
    const half = axis === 0 ? hx : axis === 1 ? hy : hz;
    const delta = end - start;
    if (Math.abs(delta) < 1e-9) {
      if (start < -half || start > half) return false;
    } else {
      let near = (-half - start) / delta;
      let far = (half - start) / delta;
      if (near > far) [near, far] = [far, near];
      lo = Math.max(lo, near);
      hi = Math.min(hi, far);
      if (lo > hi) return false;
    }
  }
  return true;
}

const inside = (x, y, z, hx, hy, hz) =>
  Math.abs(x) < hx && Math.abs(y) < hy && Math.abs(z) < hz;

/**
 * Mutates next only on impact; returns true for actual swept contact.
 * Solids are not teleported away or hidden. The ship is deflected onto a free
 * flank, or above/below the obstruction if no side exists within the road.
 * A start-inside ship can escape freely, avoiding sticky collision barriers.
 */
export function resolveCitySolidContact(previous, next, solid, {
  clearance = CITY_SHIP_CLEARANCE,
  laneLimit = CITY_ROAD_LIMIT,
  minY = -1,
  maxY = 46,
} = {}) {
  if (!solid?.active || !solid?.solid) return false;
  const c = solid.center;
  const sx = previous.x - (solid.previousX ?? c.x);
  const sy = previous.y - (solid.previousY ?? c.y);
  const sz = previous.z - (solid.previousZ ?? c.z);
  const tx = next.x - c.x;
  const ty = next.y - c.y;
  const tz = next.z - c.z;
  const hx = solid.half.x + clearance.x;
  const hy = solid.half.y + clearance.y;
  const hz = solid.half.z + clearance.z;
  const atStart = inside(sx, sy, sz, hx, hy, hz);
  const atEnd = inside(tx, ty, tz, hx, hy, hz);
  if (atStart && !atEnd) return false;
  if (!atEnd && !sweepPointBox(sx, sy, sz, tx, ty, tz, hx, hy, hz))
    return false;

  const epsilon = 0.08;
  const left = c.x - hx - epsilon;
  const right = c.x + hx + epsilon;
  // Keep the closest original side, not the new side a high-speed dash may
  // have crossed: this prevents teleporting through a thin collider.
  const preferLeft = sx < -0.01 || (Math.abs(sx) < 0.01 && tx < 0);
  const first = preferLeft ? left : right;
  const other = preferLeft ? right : left;
  const canUse = (x) => x >= -laneLimit && x <= laneLimit;
  let selected;
  if (canUse(first)) selected = first;
  else if (canUse(other)) selected = other;
  if (selected !== undefined) {
    next.x = selected;
    return true;
  }
  const up = c.y + hy + epsilon;
  const down = c.y - hy - epsilon;
  if (up <= maxY && (previous.y >= c.y || down < minY)) {
    next.y = up;
    return true;
  }
  if (down >= minY) {
    next.y = down;
    return true;
  }
  if (up <= maxY) {
    next.y = up;
    return true;
  }
  // A solid that covers the entire navigable cross-section must not allow
  // the player to pass through. Retreat to the approaching (near-camera) face.
  next.z = c.z + hz + epsilon;
  return true;
}

export function keepInsideCityRoad(position, limit = CITY_ROAD_LIMIT) {
  if (position.x < -limit) {
    position.x = -limit;
    return true;
  }
  if (position.x > limit) {
    position.x = limit;
    return true;
  }
  return false;
}
