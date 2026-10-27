// Alternative hangar loadout: a short-range cone with deterministic pellet paths.
// It is intentionally distinct from the existing multishot/arsenal upgrades.
export const SCATTER_PRICE = 420;
export const SCATTER_PELLETS = 5;
export const SCATTER_LIFETIME = 0.79;
export const SCATTER_CADENCE_FACTOR = 1.35;

export function scatterPellets() {
  return Array.from({ length: SCATTER_PELLETS }, (_, index) => {
    const t = index - (SCATTER_PELLETS - 1) / 2;
    return { offset: t * 0.55, drift: t * 12 };
  });
}

// Full-power volleys at close range; falloff rewards deliberate short-range
// attacks without multiplying boss damage fivefold across the entire arena.
export function scatterDamageFactor(distance) {
  if (!Number.isFinite(distance)) return 0.18;
  return Math.max(0.18, 0.46 - (Math.max(0, distance) / 170) * 0.28);
}

export function readScatterLoadout(saved) {
  const owned = saved?.scatterOwned === true;
  return {
    owned,
    mode: owned && saved?.fireMode === 'scatter' ? 'scatter' : 'pulse',
  };
}
