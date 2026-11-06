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
