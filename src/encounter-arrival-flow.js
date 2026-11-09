// A single arrival gate for actual fighter combat.
// The first three established missions retain their authored entry rules.
// Late-sector enemies can be seen approaching BEFORE the generic 25s transit
// is complete, avoiding the artificial pause and synchronized pop-in.
export const LATE_ARRIVAL_WAVE_SECONDS = 18;

export function fighterAllowedDuringArrival(sectorIndex, elapsed, arrivalTransit) {
  if (!arrivalTransit) return true;
  return sectorIndex >= 3 && elapsed >= LATE_ARRIVAL_WAVE_SECONDS;
}

export function arrivalFighterDepth(sectorIndex, slotIndex = 0) {
  if (sectorIndex < 3) return -200;
  return -365 - Math.max(0, slotIndex) * 36;
}

export function shouldKeepArrivalCooldown(sectorIndex, elapsed, arrivalTransit) {
  return arrivalTransit && !fighterAllowedDuringArrival(sectorIndex, elapsed, arrivalTransit);
}

/** Explicitly stagger late-stage formations, not just their start distance.
 * Their authored wing order remains visible instead of collapsing into one Z
 * position after the first 3.2 seconds of fighterAdvance().
 */
export function fighterArrivalAge(sectorIndex, elapsed, arrivalIndex = 0) {
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  if (sectorIndex < 3) return elapsed;
  return Math.max(0, elapsed - Math.min(3, Math.max(0, arrivalIndex)) * 0.75);
}

export function fighterMayFireAtDepth(sectorIndex, z) {
  return Number.isFinite(z) && z < -15 && (sectorIndex < 3 || z > -155);
}
