// Collision uses both projectile and pilot swept paths in the same frame.
// The previous endpoint-only version missed shots that crossed the ship
// between ticks, and a static-ship sweep missed a fast sidestep into a bolt.
// Relative motion avoids allocations and never changes the existing damage,
// invulnerability, shield, pod interception or obstacle rules.
const FIGHTER_HALF = Object.freeze({ x: 2.25, y: 1.55, z: 3.2 });
const MECHA_HALF = Object.freeze({ x: 2.65, y: 2.1, z: 2.7 });
const AXES = Object.freeze(['x', 'y', 'z']);

export function hostileShotHitsShip(
  from,
  to,
  player,
  scale = 1,
  robot = false,
  previousPlayer = player,
) {
  if (
    !from ||
    !to ||
    !player ||
    !previousPlayer ||
    !Number.isFinite(scale) ||
    scale <= 0
  )
    return false;
  const half = robot ? MECHA_HALF : FIGHTER_HALF;
  const radius = Math.max(0.35, Math.min(1.1, scale * 0.42));
  let enter = 0;
  let leave = 1;
  for (const axis of AXES) {
    // Both the projectile and the ship advance on the same simulation clock.
    const begin = from[axis] - previousPlayer[axis];
    const finish = to[axis] - player[axis];
    if (!Number.isFinite(begin) || !Number.isFinite(finish)) return false;
    const delta = finish - begin;
    const lower = -half[axis] - radius;
    const upper = half[axis] + radius;
    if (Math.abs(delta) < 1e-9) {
      if (begin < lower || begin > upper) return false;
      continue;
    }
    let near = (lower - begin) / delta;
    let far = (upper - begin) / delta;
    if (near > far) [near, far] = [far, near];
    enter = Math.max(enter, near);
    leave = Math.min(leave, far);
    if (enter > leave) return false;
  }
  return true;
}
