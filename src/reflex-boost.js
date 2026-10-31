/**
 * Reflex Boost: one short tactical slow-motion dodge window when the pilot
 * presses BOOST near a real cluster of incoming projectiles.
 *
 * Only hostile projectile movement / new attack cadence is slowed; movement,
 * controls, player fire rate and boost fuel continue in wall-time. No global
 * timescale: boss telegraphs/mission clocks remain accurate and deterministic.
 */
export const REFLEX_BOOST = Object.freeze({
  minThreats: 4,
  minEnergy: 45,
  activationCost: 14,
  duration: 1.55,
  cooldown: 9,
  hostileTimeScale: 0.38,
  dodgeMultiplier: 1.4,
});
export function nearbyHostileThreats(hostile, position, { radiusX = 29, radiusY = 23, ahead = 145 } = {}) {
  if (!Array.isArray(hostile) || !position) return 0;
  let threats = 0;
  for (const shot of hostile) {
    if (shot.life <= 0 || !shot.o?.position || !shot.v) continue;
    const p = shot.o.position;
    const relZ = p.z - position.z;
    if (relZ < -ahead || relZ > 16) continue;
    const x = p.x - position.x;
    const y = p.y - position.y;
    // Relative velocity points towards the pilot; exclude shots already
    // travelling away even if their absolute distance is small.
    const approach = -x * shot.v.x - y * shot.v.y - relZ * shot.v.z;
    if (approach <= 0) continue;
    if (Math.abs(x) <= radiusX && Math.abs(y) <= radiusY) threats++;
  }
  return threats;
}
export function createReflexBoost() {
  let seconds = 0;
  let cooldown = 0;
  let triggerCount = 0;
  const snapshot = () => ({
    active: seconds > 0,
    seconds: Number(seconds.toFixed(3)),
    cooldown: Number(cooldown.toFixed(3)),
    triggerCount,
    hostileTimeScale: seconds > 0 ? REFLEX_BOOST.hostileTimeScale : 1,
    dodgeMultiplier: seconds > 0 ? REFLEX_BOOST.dodgeMultiplier : 1,
  });
  function reset() {
    seconds = 0;
    cooldown = 0;
    triggerCount = 0;
    return snapshot();
  }
  function update(dt, { boosting = false, energy = 0, threats = 0, enabled = true } = {}) {
    if (!Number.isFinite(dt) || dt < 0 || dt > 1) throw new RangeError('invalid reflex dt');
    seconds = Math.max(0, seconds - dt);
    cooldown = Math.max(0, cooldown - dt);
    let activated = false;
    if (
      enabled && seconds === 0 && cooldown === 0 && boosting &&
      energy >= REFLEX_BOOST.minEnergy && threats >= REFLEX_BOOST.minThreats
    ) {
      seconds = REFLEX_BOOST.duration;
      cooldown = REFLEX_BOOST.cooldown;
      triggerCount++;
      activated = true;
    }
    return { ...snapshot(), activated, energyCost: activated ? REFLEX_BOOST.activationCost : 0 };
  }
  return { update, reset, snapshot };
}
