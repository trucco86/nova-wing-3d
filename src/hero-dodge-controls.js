// Deterministic, frame-rate-independent control contracts.
// The ship holds a vertical 90-degree bank; the robot has a single lateral
// dash with a short collision protection window and genuine cooldown.
export const MECHA_DASH = Object.freeze({
  duration: 0.24,
  distance: 16,
  cooldown: 1.55,
  protection: 0.19,
  energyCost: 18,
});
export function heldBankAngle({ robot = false, held = false, steer = 0 } = {}) {
  if (robot) return steer === 0 ? 0 : Math.max(-0.16, Math.min(0.16, -steer * 0.12));
  return held ? -Math.PI / 2 : Math.max(-0.48, Math.min(0.48, -steer * 0.48));
}
// Dash is a deliberate dodge: neutral sticks and vertical-only input
// cannot silently choose a side. The player's last position never decides.
export function dashDirection(steer = 0) {
  return Number.isFinite(steer) && Math.abs(steer) >= 0.2 ? Math.sign(steer) : 0;
}
export function dashFrame(remaining, dt, direction) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dash frame dt');
  const time = Math.max(0, Math.min(MECHA_DASH.duration, remaining));
  const frame = Math.min(dt, time);
  return {
    remaining: Math.max(0, time - frame),
    displacement: (frame / MECHA_DASH.duration) * MECHA_DASH.distance * (direction === -1 ? -1 : 1),
    protected: time > MECHA_DASH.duration - MECHA_DASH.protection,
  };
}
export function heroVisualScale(level = 0) {
  return 1 + Math.min(18, Math.max(0, level)) * 0.007;
}

// Narrower collision clearance is granted only while the physical ship is
// held edge-on, not during a tap or while in robot mode.
export function shipCollisionMargin(robot = false, held = false) {
  return !robot && held ? 0.92 : 1.3;
}
