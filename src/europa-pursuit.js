// Three genuine enemy fighters pursue the craft in Europa's six-second
// automatic super boost. Pure mission-time trajectories preserve deterministic
// pause, replay and frame-rate-independent movement on mobile and desktop.
export const EUROPA_PURSUIT_START_SECONDS = 0.85;
export const EUROPA_PURSUIT_END_SECONDS = 6.15;
export const EUROPA_PURSUIT_SLOTS = 3;

const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
const smooth = (v) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

export function europaPursuitAt(seconds, slot, pilotX = 0, pilotY = 6) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    !Number.isFinite(pilotX) ||
    !Number.isFinite(pilotY)
  )
    throw new RangeError('Invalid Europa pursuit time or player position');
  if (!Number.isInteger(slot) || slot < 0 || slot >= EUROPA_PURSUIT_SLOTS)
    throw new RangeError('Invalid Europa interceptor slot');

  const side = slot === 1 ? 1 : -1;
  const enter = smooth((seconds - EUROPA_PURSUIT_START_SECONDS) / 2);
  const retreat = smooth((seconds - 5.2) / 0.95);
  const tracking = Math.sin(seconds * 2.2 + slot * 1.8) * 3.5;
  const lateral = slot === 2 ? 28 : 22;
  return Object.freeze({
    active: seconds >= EUROPA_PURSUIT_START_SECONDS && seconds < EUROPA_PURSUIT_END_SECONDS,
    fire: seconds >= 1.6 && seconds < 5.55,
    x: clamp(side * lateral + tracking + pilotX * 0.3, -47, 47),
    y: clamp(13 + slot * 3 + Math.sin(seconds * 1.5 + slot) * 2 + pilotY * 0.22, 7, 36),
    z: -130 + enter * 64 - retreat * 70,
    bank: side * 0.16 + Math.cos(seconds * 2.2 + slot) * 0.08,
  });
}
