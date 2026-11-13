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
  atmosphereSeconds = 0,
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
  // The atmospheric climb used to have almost forty seconds without combat.
  // Keep train, mandatory BOOST and the first ascent seconds free of hazards;
  // then allow a bounded aerial escort/ambush with no new obstacle colliders.
  const ascentCombat =
    active &&
    launchPhase === 'atmosphere' &&
    Number.isFinite(atmosphereSeconds) &&
    atmosphereSeconds >= 8 &&
    atmosphereSeconds < 35;
  const subbossIntro =
    active &&
    orbitAge !== null &&
    orbitAge >= STAGE_ONE_PACING.subbossAfterOrbitSeconds &&
    orbitAge <
      STAGE_ONE_PACING.subbossAfterOrbitSeconds + STAGE_ONE_PACING.subbossIntroductionSeconds;
  return {
    orbitAge,
    ascentCombat,
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
export function stageOneCombatDensity(
  mode = 'normal',
  orbit = false,
  activeFighters = 0,
  ascent = false,
) {
  const profiles = {
    easy: {
      city: 1,
      orbit: 2,
      ascent: 1,
      interval: 5.2,
      ascentInterval: 5.8,
      groundInterval: 5.2,
      maxActive: 4,
      ascentMax: 3,
    },
    normal: {
      city: 2,
      orbit: 3,
      ascent: 2,
      interval: 4.15,
      ascentInterval: 4.35,
      groundInterval: 4.3,
      maxActive: 6,
      ascentMax: 4,
    },
    hard: {
      city: 3,
      orbit: 4,
      ascent: 3,
      interval: 3.7,
      ascentInterval: 4.0,
      groundInterval: 4.0,
      maxActive: 8,
      ascentMax: 5,
    },
  };
  if (!Number.isInteger(activeFighters) || activeFighters < 0)
    throw new RangeError('Active fighter count must be non-negative');
  const profile = profiles[mode] ?? profiles.normal;
  const maxActive = ascent ? profile.ascentMax : profile.maxActive;
  return {
    count: Math.max(
      0,
      Math.min(
        ascent ? profile.ascent : orbit ? profile.orbit : profile.city,
        maxActive - activeFighters,
      ),
    ),
    interval: ascent ? profile.ascentInterval : profile.interval,
    groundInterval: profile.groundInterval,
    maxActive,
  };
}
