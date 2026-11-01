/**
 * Combat trade-off shared by runtime and tests.
 * Fighter = mobility and sustained fire. Mecha = slower, heavier cannon.
 * These values scale damage only; boss armor/weak point rules stay authoritative.
 */
export const MECHA_HEAVY_FIRE = Object.freeze({
  pulseDamage: 2.35,
  chargedDamage: 2.1,
  precisionDamage: 7,
  cadenceFactor: 1.2,
  projectileScale: 1.6,
});

export function mechaShotDamage(base, { robot = false, kind = 'pulse' } = {}) {
  if (!Number.isFinite(base) || base < 0) return 0;
  if (!robot) return base;
  const multiplier =
    kind === 'precision'
      ? MECHA_HEAVY_FIRE.precisionDamage
      : kind === 'charged'
        ? MECHA_HEAVY_FIRE.chargedDamage
        : MECHA_HEAVY_FIRE.pulseDamage;
  return base * multiplier;
}

export function mechaShotCooldown(base, robot = false) {
  if (!Number.isFinite(base) || base < 0) return 0;
  return base * (robot ? MECHA_HEAVY_FIRE.cadenceFactor : 1);
}

export function mechaShotScale(base, robot = false) {
  return base * (robot ? MECHA_HEAVY_FIRE.projectileScale : 1);
}
