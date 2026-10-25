/**
 * Independent gameplay difficulty. Defaults to Normal at every app launch.
 * Normal keeps combat readable; early sector-one encounters use a gentler
 * introduction without weakening later boss mechanics.
 */
const PROFILES = Object.freeze({
  easy: Object.freeze({ damage: 0.7, fighterDelay: 1.35, obstacleDelay: 1.35, shotDelay: 1.3 }),
  normal: Object.freeze({ damage: 1, fighterDelay: 1, obstacleDelay: 1, shotDelay: 1 }),
  hard: Object.freeze({ damage: 1.25, fighterDelay: 0.82, obstacleDelay: 0.82, shotDelay: 0.82 }),
});

export function difficultyProfile(mode = 'normal') {
  return PROFILES[mode] ?? PROFILES.normal;
}

export function fighterInterval(sector, mode = 'normal') {
  const base = sector === 0 ? 5.4 : 4.2 - Math.min(9, Math.max(0, sector)) * 0.08;
  return base * difficultyProfile(mode).fighterDelay;
}

export function obstacleInterval(sector, mode = 'normal') {
  return (sector === 0 ? 13 : 10) * difficultyProfile(mode).obstacleDelay;
}

/** Preserve a readable arrival: no new waves six seconds before and nine after entry. */
export function firstSubbossQuiet(sector, seconds, duration) {
  if (sector !== 0 || !Number.isFinite(duration) || duration <= 0) return false;
  const arrival = duration * 0.22;
  return seconds >= arrival - 6 && seconds <= arrival + 9;
}

export function firstSubbossWarmup(sector, age) {
  return sector === 0 && age < 9;
}
