/**
 * Sector-one launch is a player-controlled sequence, not a timed cutscene.
 * The pilot must hold BOOST until its charge actually runs out. Exhaustion
 * unlocks a longer, frame-rate-independent atmospheric transition.
 */
export const ORBITAL_LAUNCH = Object.freeze({
  armAfterSeconds: 22,
  minimumBoostSeconds: 1.8,
  boostClimbSeconds: 3.4,
  atmosphericSeconds: 38,
  boostClimbFraction: 0.24,
});
const smooth = (x) => {
  const t = Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  return t * t * (3 - 2 * t);
};
export function createOrbitalLaunch() {
  let phase = 'city';
  let boostSeconds = 0;
  let atmosphereSeconds = 0;
  let amount = 0;
  let exhaustedAt = null;
  const snapshot = () => ({
    phase,
    amount,
    exhaustedAt,
    boostSeconds,
    atmosphereSeconds,
    complete: phase === 'orbit',
    prompted: phase !== 'city',
  });
  return {
    reset() {
      phase = 'city';
      boostSeconds = 0;
      atmosphereSeconds = 0;
      amount = 0;
      exhaustedAt = null;
      return snapshot();
    },
    snapshot,
    advance({ seconds, dt, boosting, chargeBefore, chargeAfter }) {
      if (!Number.isFinite(dt) || dt <= 0) return snapshot();
      if (phase === 'city' && seconds >= ORBITAL_LAUNCH.armAfterSeconds) phase = 'boost';
      if (phase === 'boost') {
        if (boosting) boostSeconds += dt;
        amount = ORBITAL_LAUNCH.boostClimbFraction *
          smooth(boostSeconds / ORBITAL_LAUNCH.boostClimbSeconds);
        // Only a real transition from charged boost to an exhausted charge
        // may unlock orbit. Tapping BOOST or waiting never advances it.
        if (
          boosting &&
          chargeBefore > 5 &&
          chargeAfter <= 5 &&
          boostSeconds >= ORBITAL_LAUNCH.minimumBoostSeconds
        ) {
          phase = 'atmosphere';
          exhaustedAt = chargeAfter;
          atmosphereSeconds = 0;
          amount = ORBITAL_LAUNCH.boostClimbFraction;
        }
      } else if (phase === 'atmosphere') {
        atmosphereSeconds = Math.min(
          ORBITAL_LAUNCH.atmosphericSeconds,
          atmosphereSeconds + dt,
        );
        amount = ORBITAL_LAUNCH.boostClimbFraction +
          (1 - ORBITAL_LAUNCH.boostClimbFraction) *
          smooth(atmosphereSeconds / ORBITAL_LAUNCH.atmosphericSeconds);
        if (atmosphereSeconds >= ORBITAL_LAUNCH.atmosphericSeconds) {
          phase = 'orbit';
          amount = 1;
        }
      }
      return snapshot();
    },
  };
}
