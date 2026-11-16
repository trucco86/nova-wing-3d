// Per-sector competitive scoring. Deterministic, bounded and independent of network/ranking.
// The corridor is scripted: only time after the designed sector runway is contestable.
export const MAX_COMBO = 30;
export const COMBO_WINDOW_SECONDS = 4.5;
export const SPEED_GRACE_SECONDS = 75;

const safeTime = (value) => (Number.isFinite(value) && value >= 0 ? value : 0);

export function formatMissionTime(seconds = 0) {
  const total = Math.floor(safeTime(seconds));
  return String(Math.floor(total / 60)).padStart(2, '0') +
    ':' + String(total % 60).padStart(2, '0');
}

export function createMissionScoring(plannedSeconds = 90) {
  const runway = Number.isFinite(plannedSeconds) && plannedSeconds > 0 ? plannedSeconds : 90;
  let combo = 0;
  let window = 0;
  let bestCombo = 0;
  let hits = 0;
  let dodges = 0;
  let pickups = 0;
  let settled = null;
  return {
    advance(dt) {
      if (!Number.isFinite(dt) || dt <= 0 || settled) return;
      window = Math.max(0, window - dt);
      if (window === 0) combo = 0;
    },
    hit(dealt) {
      if (settled || !Number.isFinite(dealt) || dealt <= 0) return 0;
      combo = Math.min(MAX_COMBO, window > 0 ? combo + 1 : 1);
      window = COMBO_WINDOW_SECONDS;
      hits++;
      bestCombo = Math.max(bestCombo, combo);
      return 2 + Math.floor((combo - 1) / 5) * 3;
    },
    dodge() {
      if (settled || dodges >= 80) return 0;
      dodges++;
      return 12;
    },
    pickup() {
      if (!settled) pickups++;
    },
    damage() {
      combo = 0;
      window = 0;
    },
    finish({ durationSeconds, cleared, noDamage } = {}) {
      if (settled) return { ...settled };
      const t = safeTime(durationSeconds);
      // Credit the player for how quickly they eliminate the boss and exit after
      // the mandatory scripted journey. Waiting through the runway is not a penalty.
      const timeBonus = cleared
        ? Math.min(600, Math.max(0, Math.round((runway + SPEED_GRACE_SECONDS - t) * 9)))
        : 0;
      const cleanBonus = cleared && noDamage === true ? 175 : 0;
      settled = Object.freeze({
        timeBonus,
        cleanBonus,
        totalBonus: timeBonus + cleanBonus,
        maxCombo: bestCombo,
        hits,
        dodges,
        pickups,
        seconds: t,
      });
      return { ...settled };
    },
    snapshot() {
      return { combo, maxCombo: bestCombo, hits, dodges, pickups };
    },
  };
}
