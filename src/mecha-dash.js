const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export const MECHA_DASH = Object.freeze({
  duration: 0.24,
  distance: 13,
  cooldown: 1.45,
  energy: 12,
});

/**
 * Direction comes from the live joystick / held movement first. Q and E are
 * explicit left/right fallbacks when steering is neutral; Z/touch use the last
 * selected side. This makes the existing GIRO control directional in robot mode.
 */
export function mechaDashDirection({
  stickX = 0,
  left = false,
  right = false,
  key = '',
  previous = 1,
} = {}) {
  const steer =
    clamp(Number.isFinite(stickX) ? stickX : 0, -1, 1) + (right ? 1 : 0) - (left ? 1 : 0);
  if (Math.abs(steer) >= 0.2) return Math.sign(steer);
  if (key === 'KeyQ') return -1;
  if (key === 'KeyE') return 1;
  return previous < 0 ? -1 : 1;
}

const dashCurve = (t) => t * t * (3 - 2 * t);

/** Fixed-distance lateral displacement, frame-rate-independent and clamped. */
export function createMechaDash() {
  let remaining = 0;
  let cooldown = 0;
  let direction = 1;
  let lastDirection = 1;

  function begin(side, x, limit) {
    if (
      remaining > 0 ||
      cooldown > 0 ||
      !Number.isFinite(x) ||
      !Number.isFinite(limit) ||
      limit <= 0
    )
      return false;
    const requested = side < 0 ? -1 : 1;
    if ((requested < 0 && x <= -limit + 0.1) || (requested > 0 && x >= limit - 0.1)) return false;
    direction = lastDirection = requested;
    remaining = MECHA_DASH.duration;
    cooldown = MECHA_DASH.cooldown;
    return true;
  }

  function advance(dt, x, limit) {
    if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(x) || !Number.isFinite(limit)) return x;
    const elapsed = Math.min(dt, remaining);
    if (elapsed > 0) {
      const start = 1 - remaining / MECHA_DASH.duration;
      remaining = Math.max(0, remaining - elapsed);
      const end = 1 - remaining / MECHA_DASH.duration;
      x = clamp(
        x + direction * MECHA_DASH.distance * (dashCurve(end) - dashCurve(start)),
        -limit,
        limit,
      );
    }
    cooldown = Math.max(0, cooldown - dt);
    return x;
  }

  function reset() {
    remaining = 0;
    cooldown = 0;
    direction = 1;
    lastDirection = 1;
  }
  return {
    begin,
    advance,
    reset,
    get active() {
      return remaining > 0;
    },
    get direction() {
      return direction;
    },
    get lastDirection() {
      return lastDirection;
    },
    snapshot: () => ({
      active: remaining > 0,
      remaining,
      cooldown,
      direction,
      lastDirection,
      progress: remaining > 0 ? 1 - remaining / MECHA_DASH.duration : 0,
    }),
  };
}
