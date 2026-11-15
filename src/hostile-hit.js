import { crossesSolid } from './flight.js';

// Swept hostile hit volume. The old endpoint-only distance check allowed fast
// shots to travel from one side of the spacecraft to the other within a frame.
// Match the visible ship silhouette instead of using a giant invisible sphere.
const FIGHTER_HALF = Object.freeze({ x: 2.25, y: 1.55, z: 3.2 });
const MECHA_HALF = Object.freeze({ x: 2.65, y: 2.1, z: 2.7 });
export function hostileShotHitsShip(from, to, player, { scale = 1, robot = false } = {}) {
  if (!from || !to || !player || !Number.isFinite(scale)) return false;
  const radius = Math.max(0.35, Math.min(1.1, scale * 0.42));
  return crossesSolid(from, to, player, robot ? MECHA_HALF : FIGHTER_HALF, radius);
}
