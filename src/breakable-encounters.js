// Combatants use the same solid collision geometry as ordinary obstructions.
// Only hostile carrier escorts and satellites have health: rails and tunnel
// supports remain real obstacles, with no invisible "destroyed" hitbox.
export const BREAKABLE_HULL = Object.freeze({ satellite: 70, carrier: 180, 'ice-meteor': 85 });
export function breakableHullHealth(kind) {
  return Object.hasOwn(BREAKABLE_HULL, kind) ? BREAKABLE_HULL[kind] : null;
}
export function damageBreakableHull(health, amount) {
  if (!Number.isFinite(health) || health <= 0 || !Number.isFinite(amount) || amount <= 0)
    return { health, destroyed: false, dealt: 0 };
  const next = Math.max(0, health - amount);
  return { health: next, destroyed: next === 0, dealt: health - next };
}
