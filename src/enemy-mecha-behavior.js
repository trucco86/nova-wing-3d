// One aerial sentry substitutes for an existing walker every fourth ground wave
// in later ground sectors. The orbital launch remains deliberately gentle.
export function groundMechaKind(sector, wave) {
  if (!Number.isInteger(sector) || !Number.isInteger(wave) || wave < 1)
    throw new RangeError('Invalid ground-wave inputs');
  return sector > 0 && wave % 4 === 0 ? 'hover-walker' : wave % 2 ? 'tank' : 'walker';
}

// Pure bounded pursuit, predictable at every frame rate.
export function hoverMechaMotion(age, originX, originY, playerX, playerY, phase = 0) {
  const follow = Math.min(1, Math.max(0, (age - 1.5) / 4));
  const lateral = Math.max(-22, Math.min(22, playerX - originX));
  const vertical = Math.max(-8, Math.min(15, playerY - originY));
  return {
    x: originX + lateral * follow * 0.7 + Math.sin(age * 1.6 + phase) * 3,
    y:
      originY +
      8 * Math.min(1, age / 3) +
      vertical * follow * 0.35 +
      Math.sin(age * 2.4 + phase) * 1.5,
    bank: Math.sin(age * 1.3 + phase) * 0.19,
  };
}
