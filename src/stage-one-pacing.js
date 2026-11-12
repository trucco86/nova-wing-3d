// Stage-one scripted pacing. Keep launch physics untouched: this policy only
// decides when unrelated enemies may enter the authored city/train corridor
// and when orbital combat can start AFTER the player completed Super Boost.
export const STAGE_ONE_PACING = Object.freeze({
  trainWarningAt: 13,
  orbitRecoverySeconds: 5,
  subbossAfterOrbitSeconds: 14,
  subbossIntroductionSeconds: 8,
  baseAfterOrbitSeconds: 23,
});

export function stageOneEncounterWindows(
  seconds,
  launchPhase = 'city',
  orbitReachedAt = null,
  scripted = true,
) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('Invalid stage-one elapsed seconds');
  if (!['city', 'boost', 'atmosphere', 'orbit'].includes(launchPhase))
    throw new RangeError('Invalid stage-one launch phase');
  const active = Boolean(scripted);
  const ready =
    active &&
    launchPhase === 'orbit' &&
    Number.isFinite(orbitReachedAt) &&
    orbitReachedAt >= 0 &&
    orbitReachedAt <= seconds;
  const orbitAge = ready ? Math.max(0, seconds - orbitReachedAt) : null;
  const cooldown =
    active &&
    seconds >= STAGE_ONE_PACING.trainWarningAt &&
    (orbitAge === null || orbitAge < STAGE_ONE_PACING.orbitRecoverySeconds);
  const subbossIntro =
    active &&
    orbitAge !== null &&
    orbitAge >= STAGE_ONE_PACING.subbossAfterOrbitSeconds &&
    orbitAge <
      STAGE_ONE_PACING.subbossAfterOrbitSeconds + STAGE_ONE_PACING.subbossIntroductionSeconds;
  return {
    orbitAge,
    // The hanging maglev is the ONLY authored obstacle during the ground
    // climax. Keep any later atmospheric climb free of random collisions.
    exclusiveTransit: cooldown,
    subbossIntroQuiet: subbossIntro,
    canSpawnGround:
      !active || (seconds < STAGE_ONE_PACING.trainWarningAt && launchPhase === 'city'),
    canSpawnSubboss:
      !active || (orbitAge !== null && orbitAge >= STAGE_ONE_PACING.subbossAfterOrbitSeconds),
    canSpawnBase:
      !active || (orbitAge !== null && orbitAge >= STAGE_ONE_PACING.baseAfterOrbitSeconds),
  };
}

/**
 * Stage-one combat only. The train, BOOST and subboss gates remain owned by
 * stageOneEncounterWindows; denser formations are never permission to spawn
 * inside a scripted transit. Cap active fighters for WebGL/mobile performance.
 */
export function stageOneCombatDensity(mode = 'normal', orbit = false, activeFighters = 0) {
  const profiles = {
    easy: { city: 1, orbit: 2, interval: 5.2, groundInterval: 5.2, maxActive: 4 },
    normal: { city: 2, orbit: 3, interval: 4.15, groundInterval: 4.3, maxActive: 6 },
    hard: { city: 3, orbit: 4, interval: 3.7, groundInterval: 4.0, maxActive: 8 },
  };
  if (!Number.isInteger(activeFighters) || activeFighters < 0)
    throw new RangeError('Active fighter count must be non-negative');
  const profile = profiles[mode] ?? profiles.normal;
  return {
    count: Math.max(
      0,
      Math.min(orbit ? profile.orbit : profile.city, profile.maxActive - activeFighters),
    ),
    interval: profile.interval,
    groundInterval: profile.groundInterval,
    maxActive: profile.maxActive,
  };
}
