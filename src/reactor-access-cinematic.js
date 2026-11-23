// Stage-04 Devastador reactor: a short, physically grounded view of the
// same enclosed carrier corridor at docking and after unlocking the gate.
// This drives only the exploration camera and selected ship representation;
// it neither grants quest progress nor teleports the combat player.
export const REACTOR_ARRIVAL_SECONDS = 3.1;
export const REACTOR_DEPARTURE_SECONDS = 3.0;
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
    text: count === REACTOR_GATE_MODULES
      ? 'PORTÃO LIBERADO · RETORNE À NAVE · TÚNEL DO REATOR'
      : 'PORTÃO BLOQUEADO · ATIVE OS 3 MÓDULOS (' + count + '/3)',
  };
}

export function reactorCinematicPose(phase, seconds = 0) {
  const departure = phase === 'departure';
  const duration = departure ? REACTOR_DEPARTURE_SECONDS : REACTOR_ARRIVAL_SECONDS;
  const progress = clamp01(seconds / duration);
  const t = smoothstep(progress);
  // Both camera rails remain INSIDE the Devastador physical corridor.
  // No space skybox, portal flash or unbuilt station exterior is visible.
  const z = departure ? lerp(29, -11, t) : lerp(38, 21, t);
  const shipZ = departure ? lerp(14, -25, t) : lerp(18, 13, t);
  return {
    phase: departure ? 'departure' : 'arrival',
    progress,
    complete: progress >= 1,
    eye: { x: lerp(0.9, 0, t), y: departure ? 8.1 : lerp(9.3, 8.2, t), z },
    aim: { x: 0, y: departure ? 8.6 : 10.8, z: departure ? shipZ - 16 : -32.1 },
    ship: { x: 0, y: departure ? lerp(3.9, 5.5, t) : lerp(5.1, 3.3, t), z: shipZ },
    fov: departure ? lerp(55, 48, t) : lerp(50, 54, t),
  };
}
