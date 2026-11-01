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
