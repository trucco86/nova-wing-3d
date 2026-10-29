const TAU = Math.PI * 2;
export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const BOSS_TACTICS = [
  { name: 'BATERIA FRONTAL', motion: 'strafe', angle: 0, arc: 0.8, period: 10, color: '#ff8850' },
  {
    name: 'PINÇA LATERAL',
    motion: 'dive',
    angle: Math.PI / 2,
    arc: 1,
    period: 9,
    color: '#52dfff',
  },
  { name: 'INVESTIDA', motion: 'charge', angle: 0, arc: 0.65, period: 8, color: '#ffca50' },
  { name: 'VARREDURA', motion: 'spin', angle: Math.PI, arc: 1.25, period: 11, color: '#7e80ff' },
  { name: 'MERGULHO SOLAR', motion: 'dive', angle: -0.7, arc: 0.9, period: 8.5, color: '#ff603a' },
  {
    name: 'MARTELO GRAVÍTICO',
    motion: 'charge',
    angle: Math.PI,
    arc: 1.15,
    period: 12,
    color: '#a888ff',
  },
  {
    name: 'CAÇADA TRIPLA',
    motion: 'strafe',
    angle: -Math.PI / 2,
    arc: 1.4,
    period: 9.5,
    color: '#66ffa0',
  },
  { name: 'CERCO', motion: 'strafe', angle: Math.PI / 2, arc: 1.2, period: 10.5, color: '#ff5d87' },
  { name: 'PULSO DO VAZIO', motion: 'spin', angle: Math.PI, arc: 1.5, period: 8, color: '#cd70ff' },
  { name: 'ECLIPSE', motion: 'spin', angle: 0, arc: 1.65, period: 9, color: '#ffce70' },
];
export function bossTacticsAt(index, age, phase = 1) {
  const profile = BOSS_TACTICS[index % BOSS_TACTICS.length];
  const time = Math.max(0, age - 8),
    cycle = Math.floor(time / profile.period);
  const beat = time % profile.period;
  const state =
    age < 8
      ? 'approach'
      : beat < 2.2
        ? 'windup'
        : beat < 3.6
          ? 'attack'
          : beat < 6
            ? 'recovery'
            : 'maneuver';
  // Bosses choose a flank, telegraph it, then HOLD their facing during the
  // strike. Continuous aimless spinning made every fight feel identical.
  const committedHeading =
    Math.sin((cycle + 1) * (0.52 + index * 0.041)) * (index === 0 ? 0.55 : 0.95);
  const heading = ['windup', 'attack', 'recovery'].includes(state)
    ? committedHeading
    : Math.sin(time * (0.065 + index * 0.003)) * 0.4;
  const dangerAngle = wrapAngle(profile.angle + (cycle * Math.PI) / 2 + heading);
  const pulse = state === 'attack' ? Math.sin(((beat - 2.2) / 1.4) * Math.PI) : 0;
  const amplitude = 9 + (index % 3) * 3;
  return {
    ...profile,
    state,
    cycle,
    heading,
    dangerAngle,
    phase,
    x: Math.sin(age * (0.35 + index * 0.015)) * amplitude,
    y: 12 + Math.sin(age * 0.55 + index) * (profile.motion === 'dive' ? 10 : 4),
    z: -94 + (profile.motion === 'charge' ? pulse * 24 : Math.sin(age * 0.4) * 7),
    bank: Math.sin(age * 0.5 + index) * (profile.motion === 'spin' ? 0.25 : 0.09),
    vulnerable: state === 'recovery',
  };
}
export const inDanger = (angle, tactics) =>
  Math.abs(wrapAngle(angle - tactics.dangerAngle)) < tactics.arc;
export function chargeTactics(value, dt, moving, rank = 0) {
  return Math.min(3, value + dt * (moving ? 0.04 : 0.18) * (1 + Math.min(30, rank) * 0.015));
}
// Entry point on an axis-aligned hit volume, before a fast shot advances past it.
export function impactPoint(from, to, center, half) {
  let enter = 0,
    leave = 1;
  for (const axis of ['x', 'y', 'z']) {
    const d = to[axis] - from[axis];
    if (Math.abs(d) < 1e-9) continue;
    const a = (center[axis] - half[axis] - from[axis]) / d;
    const b = (center[axis] + half[axis] - from[axis]) / d;
    enter = Math.max(enter, Math.min(a, b));
    leave = Math.min(leave, Math.max(a, b));
  }
  return from.clone().lerp(to, Math.max(0, Math.min(1, enter <= leave ? enter : 0)));
}
export const radarGradient = (t) => {
  const angle = ((t.dangerAngle / TAU) * 360 + 360) % 360;
  return `conic-gradient(from ${angle - (t.arc * 180) / Math.PI}deg, #ed594caa ${(t.arc * 360) / Math.PI}deg, #238b7955 0deg)`;
};
