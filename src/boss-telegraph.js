/** One-time, pre-boss warning window in simulation seconds. */
export function shouldWarnBoss({
  elapsed,
  duration,
  warned = false,
  boss = false,
  blocked = false,
}) {
  return (
    !warned &&
    !boss &&
    !blocked &&
    Number.isFinite(elapsed) &&
    Number.isFinite(duration) &&
    duration >= 10 &&
    elapsed >= duration - 9 &&
    elapsed < duration
  );
}
