// Tactical tracking for the Omega dreadnought in the Saturn ring battle.
// State is retained on the actual boss mesh; never re-targets latched hitboxes.
// Integrating a bounded angular turn instead of snapping to the pilot allows
// flank/rear weakpoints to remain exposed long enough for counterplay.
const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
export function chaseOmegaHeading(current, desired, dt, phase = 1, state = 'maneuver') {
  if (![current, desired, dt].every(Number.isFinite) || dt < 0)
    throw new RangeError('Invalid Omega turn');
  const skill = Math.max(1, Math.min(3, phase));
  const rate =
    (state === 'attack' ? 0.22 : state === 'windup' ? 0.4 : state === 'recovery' ? 1.05 : 0.9) *
    (1 + (skill - 1) * 0.13);
  const delta = wrap(desired - current);
  const maxStep = Math.min(dt, 0.08) * rate;
  return wrap(current + Math.sign(delta) * Math.min(Math.abs(delta), maxStep));
}

// Animation-only amplitudes: the real intent, hitbox and radar stay in
// boss-combat-ai.js. A common pose prevents fake bites before the warning.
export function omegaAppendageAmplitude(kind, state, pose = {}) {
  const live = state === 'windup' || state === 'attack';
  if (!live) return { jaw: 0, claw: 0, arm: 0, tentacle: 0 };
  return {
    jaw: kind === 'bite' ? Math.max(0, pose.jaw ?? 0) : 0,
    claw: kind === 'claw-swipe' ? Math.max(0, pose.claw ?? 0) : 0,
    arm: kind === 'hammer-slam' ? Math.max(0, pose.claw ?? 0) : 0,
    tentacle: kind?.startsWith('tentacle') ? Math.max(0, pose.tentacle ?? 0) : 0,
  };
}

// The boss also follows lateral/vertical pilot displacement with bounded
// velocity. Keep the authored departure and stage center; offsets are small
// and slow, never instant lunges or extra untelegraphed damage.
export function chaseOmegaOffset(
  previous = { x: 0, y: 0 },
  pilot = { x: 0, y: 18 },
  dt,
  state = 'maneuver',
) {
  if (![previous.x, previous.y, pilot.x, pilot.y, dt].every(Number.isFinite) || dt < 0)
    throw new RangeError('Invalid Omega pursuit');
  const speed = state === 'attack' ? 2 : state === 'windup' ? 4 : 10;
  const step = Math.min(dt, 0.08) * speed;
  const targetX = Math.max(-20, Math.min(20, pilot.x * 0.35));
  const targetY = Math.max(-9, Math.min(9, (pilot.y - 18) * 0.26));
  const chase = (current, target) =>
    current + Math.sign(target - current) * Math.min(step, Math.abs(target - current));
  return { x: chase(previous.x, targetX), y: chase(previous.y, targetY) };
}


// Omega reacts to a pilot holding position behind its stern, not to every
// orbital input. The rear must remain exposed before the boss notices it;
// once alerted, it turns its own hull until it faces the pilot again.
export const OMEGA_REAR_LOCK_SECONDS = 1.8;
export function advanceOmegaRearResponse(
  previous = { heading: 0, rearSeconds: 0, tracking: false },
  desired,
  dt,
  phase = 1,
  state = 'maneuver',
) {
  const heading = previous.heading ?? 0;
  const rearSeconds = previous.rearSeconds ?? 0;
  if (![heading, rearSeconds, desired, dt].every(Number.isFinite) || dt < 0 || rearSeconds < 0)
    throw new RangeError('Invalid Omega rear response');
  const angularGap = Math.abs(wrap(desired - heading));
  const behind = angularGap >= (Math.PI * 2) / 3;
  const observed = behind ? Math.min(OMEGA_REAR_LOCK_SECONDS, rearSeconds + dt) : 0;
  const alerted = Boolean(previous.tracking) || observed >= OMEGA_REAR_LOCK_SECONDS;
  if (!alerted) return { heading, rearSeconds: observed, tracking: false };
  const nextHeading = chaseOmegaHeading(heading, desired, dt, phase, state);
  const facingPilot = Math.abs(wrap(desired - nextHeading)) < 0.1;
  return {
    heading: nextHeading,
    rearSeconds: facingPilot ? 0 : observed,
    tracking: !facingPilot,
  };
}
