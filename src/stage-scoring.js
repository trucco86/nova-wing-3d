// Deterministic stage scoring: game clock, combo, real near miss and clean clear.
export const SCORE_RULES = Object.freeze({
  comboWindowSeconds: 4.5,
  maxComboMultiplier: 8,
  nearMissCooldownSeconds: 0.65,
  nearMissPoints: 25,
  noDamagePoints: 400,
  speedMaxPoints: 600,
  speedDecayPerSecond: 8,
});

export function stageClock(seconds) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
}

export function comboBonus(streak) {
  if (!Number.isFinite(streak)) return 0;
  return Math.min(SCORE_RULES.maxComboMultiplier, Math.max(0, Math.floor(streak) - 1)) * 10;
}

export function scoreStageClear({ seconds, baselineSeconds, damageTaken } = {}) {
  const valid = Number.isFinite(seconds) && seconds >= 0 &&
    Number.isFinite(baselineSeconds) && baselineSeconds > 0;
  const speed = valid
    ? Math.max(0, Math.round(SCORE_RULES.speedMaxPoints -
        Math.max(0, seconds - baselineSeconds) * SCORE_RULES.speedDecayPerSecond))
    : 0;
  const pristine = damageTaken === false ? SCORE_RULES.noDamagePoints : 0;
  return Object.freeze({ speed, pristine, total: speed + pristine });
}

// A near miss must cross the player's actual flight plane, not merely be
// somewhere on the screen. Call after the swept hit test has failed.
export function nearMissCrossing(from, to, ship, { minRadius = 4, maxRadius = 10 } = {}) {
  if (!from || !to || !ship) return false;
  const values = [from.x, from.y, from.z, to.x, to.y, to.z, ship.x, ship.y, ship.z];
  if (!values.every(Number.isFinite)) return false;
  const dz = to.z - from.z;
  if (Math.abs(dz) < 0.0001) return false;
  const progress = (ship.z - from.z) / dz;
  if (progress < 0 || progress > 1) return false;
  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;
  const distance = Math.hypot(x - ship.x, y - ship.y);
  return distance >= minRadius && distance <= maxRadius;
}
