/** Boss weapons are real meshes, their associated generators are real hit targets.
 * All three emission points are local model coordinates. Keep this pure so
 * balance and dead-battery behavior are testable without WebGL.
 */
export const BOSS_BATTERY_SIDES = Object.freeze([-1, 1]);
export function bossBatteryPlan(generators = [true, true], requested = 3) {
  const alive = BOSS_BATTERY_SIDES.filter((side, i) => generators[i] !== false);
  if (!alive.length) return { sides: [0], cadenceMultiplier: 1.85, suppressMelee: true };
  const budget = Math.max(1, Math.min(10, Math.ceil(requested * alive.length / 2)));
  const sides = Array.from({ length: budget }, (_, i) => alive[i % alive.length]);
  return {
    sides,
    cadenceMultiplier: alive.length === 1 ? 1.35 : 1,
    suppressMelee: false,
  };
}
export function batteryForSignature(origin, generators = [true, true]) {
  const side = origin[0] < -0.01 ? -1 : origin[0] > 0.01 ? 1 : 0;
  const alive = BOSS_BATTERY_SIDES.filter((value, i) => generators[i] !== false);
  if (!alive.length) return 0;
  if (!side) return alive[0];
  return alive.includes(side) ? side : null;
}
export function sourceHardpointName(side) {
  return side === 0 ? 'boss-core-muzzle' : side < 0
    ? 'boss-battery-left-muzzle' : 'boss-battery-right-muzzle';
}
