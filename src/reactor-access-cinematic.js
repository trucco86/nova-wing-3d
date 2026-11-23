// Stage-04 Devastador reactor: a short, physically grounded view of the
// same enclosed carrier corridor at docking and after unlocking the gate.
// This drives only the exploration camera and selected ship representation;
// it neither grants quest progress nor teleports the combat player.
export const REACTOR_ARRIVAL_SECONDS = 4.7;
export const REACTOR_DEPARTURE_SECONDS = 4.6;
export const REACTOR_GATE_MODULES = 3;

const clamp01 = (t) => Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
const smoothstep = (t) => {
  const p = clamp01(t);
  return p * p * (3 - 2 * p);
};
const lerp = (a, b, t) => a + (b - a) * t;

export function reactorGateStatus(activated = 0) {
  const count = Math.max(0, Math.min(REACTOR_GATE_MODULES, Math.trunc(activated) || 0));
  return {
    activated: count,
    locked: count !== REACTOR_GATE_MODULES,
    text:
      count === REACTOR_GATE_MODULES
        ? 'PORTÃO LIBERADO · RETORNE À NAVE · TÚNEL DO REATOR'
        : 'PORTÃO BLOQUEADO · ATIVE OS 3 MÓDULOS (' + count + '/3)',
  };
}

const vector = (a, b, t) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});
const rail = (a, b, c, t) => {
  const split = 0.55;
  return t <= split
    ? vector(a, b, smoothstep(t / split))
    : vector(b, c, smoothstep((t - split) / (1 - split)));
};

// The first departure frame can begin at the actual live follow-camera pose.
// Reboarding is gated to the same physical hangar, so no far-away cut/teleport.
export function reactorCinematicPose(phase, seconds = 0, departureFrom = null) {
  const departure = phase === 'departure';
  const duration = departure ? REACTOR_DEPARTURE_SECONDS : REACTOR_ARRIVAL_SECONDS;
  const progress = clamp01(seconds / duration);
  // 3 continuous camera keys: establish the service tunnel, reveal the
  // selected fighter in the landing bay, then match the player's walk camera.
  // The final arrival eye/aim match orbit9CameraPose(0, 12) exactly, so
  // changing to locomotion does not jerk the image.
  const entry = {
    eye: { x: 0.9, y: 9.3, z: 38 },
    aim: { x: 0, y: 10.8, z: -32.1 },
    ship: { x: 0, y: 5.1, z: 18 },
    fov: 50,
  };
  const reveal = {
    eye: { x: 11, y: 8, z: 30 },
    aim: { x: 16, y: 5.8, z: 11 },
    ship: { x: 10, y: 4.1, z: 20 },
    fov: 56,
  };
  const dock = {
    eye: { x: 1.1, y: 6.1, z: 23.8 },
    aim: { x: 0, y: 3.35, z: 4.5 },
    ship: { x: 17, y: 3.3, z: 20 },
    fov: 52,
  };
  const takeoff = {
    eye: departureFrom?.eye ?? { x: 12, y: 7.8, z: 34 },
    aim: departureFrom?.aim ?? { x: 13, y: 8, z: 7 },
    ship: { x: 17, y: 3.3, z: 20 },
    fov: Number.isFinite(departureFrom?.fov) ? departureFrom.fov : 52,
  };
  const tunnel = {
    eye: { x: 4, y: 7.6, z: 19 },
    aim: { x: 3, y: 7.8, z: -19 },
    ship: { x: 7, y: 4.7, z: -3 },
    fov: 56,
  };
  const launch = {
    eye: { x: 0, y: 8.1, z: -10 },
    aim: { x: 0, y: 8.6, z: -43 },
    ship: { x: 0, y: 5.5, z: -25 },
    fov: 48,
  };
  const [a, b, c] = departure ? [takeoff, tunnel, launch] : [entry, reveal, dock];
  const eye = rail(a.eye, b.eye, c.eye, progress);
  const aim = rail(a.aim, b.aim, c.aim, progress);
  const ship = rail(a.ship, b.ship, c.ship, progress);
  const fov = progress <= 0.55
    ? lerp(a.fov, b.fov, smoothstep(progress / 0.55))
    : lerp(b.fov, c.fov, smoothstep((progress - 0.55) / 0.45));
  return {
    phase: departure ? 'departure' : 'arrival',
    progress,
    complete: progress >= 1,
    eye,
    aim,
    ship,
    fov,
  };
}
