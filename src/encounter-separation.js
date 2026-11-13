// Keep the mid-stage encounter and final boss in separate cinematic beats.
// A timer reaching the boss deadline never overrides an active or unresolved subboss.
export const SUBBOSS_BOSS_RECOVERY_SECONDS = 8;

export function bossEncounterGate({
  elapsed,
  subbossStarted,
  subbossClearedAt,
  activeSubboss,
  blocked = false,
  recoverySeconds = SUBBOSS_BOSS_RECOVERY_SECONDS,
}) {
  if (!Number.isFinite(elapsed) || elapsed < 0) return false;
  if (!subbossStarted || activeSubboss || blocked) return false;
  if (!Number.isFinite(subbossClearedAt) || subbossClearedAt > elapsed) return false;
  return elapsed - subbossClearedAt >= recoverySeconds;
}
