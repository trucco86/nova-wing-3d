/** Deterministic emergence path: mothership hangar (-680) -> tactical boss arena. */
export const BOSS_DEPARTURE_SECONDS = 4.6;

export function bossDepartureAt(age, tactics, approach) {
  const t = Math.max(0, Math.min(1, Number.isFinite(age) ? age / BOSS_DEPARTURE_SECONDS : 0));
  const eased = t * t * (3 - 2 * t);
  const p = Math.max(0, Math.min(1, Number.isFinite(approach) ? approach : 0));
  return {
    x: tactics.x * eased,
    y: 57 + (10 + (tactics.y - 10) * p - 57) * eased,
    z: -680 + (-230 + (tactics.z + 230) * p + 680) * eased,
    departing: t < 1,
  };
}
