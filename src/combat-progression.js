// Auditable RPG progression balance. No unlocked gear leaks into campaign saves.
export const ADVANCED_WEAPON_TIERS = Object.freeze([
  { stage: 0, color: null, label: 'BASE' },
  { stage: 4, color: '#52ecff', label: 'TURBO' },
  { stage: 8, color: '#ffd15e', label: 'SOBRECARGA' },
  { stage: 12, color: '#df85ff', label: 'NOVA' },
  { stage: 16, color: '#f8ffff', label: 'HIPERPLASMA' },
]);
const tier = (level) => ADVANCED_WEAPON_TIERS.reduce((current, t) => level >= t.stage ? t : current, ADVANCED_WEAPON_TIERS[0]);

export function evolvedShotColor(level = 0, originalColor = '#62ffe0') {
  if (!Number.isFinite(level)) return originalColor;
  return tier(level).color ?? originalColor;
}
export function evolvedShotTier(level = 0) {
  return Number.isFinite(level) ? tier(level).label : 'BASE';
}
export function dockedPodPower(pods = 0, stage = 0, detached = false) {
  if (detached || pods <= 0) return 1;
  // Three maxed pods provide the requested double cannon power, while
  // lower levels still receive the previously approved incremental benefit.
  return pods >= 3 && stage >= 9 ? 2 + Math.min(0.3, (stage - 9) * 0.025) : 1 + Math.min(pods, 3) * 0.3;
}
export function podLaserMultiplier(pods = 0, stage = 0) {
  return 1 + Math.min(3, Math.max(0, pods)) * 0.16 + Math.min(18, Math.max(0, stage)) * 0.03;
}
export function lockLaserCount(stage = 0) {
  return 1 + (stage >= 6 ? 1 : 0) + (stage >= 12 ? 1 : 0) + (stage >= 18 ? 1 : 0);
}
export function progressionSpeed(level = 0) {
  // Limited mobility growth, preserving difficulty and collision tuning.
  return 1 + Math.min(18, Math.max(0, Number.isFinite(level) ? level : 0)) * 0.008;
}
export function boostTrailLength(level = 0, boosting = false) {
  return (boosting ? 1.8 : 0.85) * (1 + Math.max(0, Math.min(18, level)) * 0.065);
}
