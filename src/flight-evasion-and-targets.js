// Shared deterministic flight evasions for iPhone + keyboard.
// Camera presentation and collision immunity use the SAME active dash clock.
export const MECHA_DASH = Object.freeze({ duration: 0.26, cooldown: 1.15, distance: 27, cost: 8 });
export function evasionDirection(input = 0, last = 1) {
  const x = Number.isFinite(input) ? input : 0;
  return Math.abs(x) > 0.12 ? Math.sign(x) : last < 0 ? -1 : 1;
}
export function dashOffset(dt, remaining, direction, { min = -67, max = 67, x = 0 } = {}) {
  if (!(dt > 0) || !(remaining > 0)) return { x, remaining: Math.max(0, remaining), moved: 0 };
  const active = Math.min(dt, remaining);
  const movement =
    ((MECHA_DASH.distance * active) / MECHA_DASH.duration) * evasionDirection(direction);
  const next = Math.max(min, Math.min(max, x + movement));
  return { x: next, remaining: Math.max(0, remaining - active), moved: next - x };
}
export function shipBankAngle(held, direction = -1, steering = 0) {
  return held ? (direction < 0 ? -Math.PI / 2 : Math.PI / 2) : -steering * 0.48;
}
export function destructibleObstacleHp(kind) {
  return kind === 'satellite' ? 42 : kind === 'carrier' ? 125 : null;
}
export function damageDestructibleObstacle(kind, hp, damage) {
  const ceiling = destructibleObstacleHp(kind);
  if (ceiling === null || !Number.isFinite(damage) || damage <= 0) return null;
  const next = Math.max(0, Math.min(ceiling, hp) - damage);
  return { hp: next, destroyed: next === 0 };
}
