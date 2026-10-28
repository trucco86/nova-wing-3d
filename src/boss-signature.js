// Authored combat identities for the first Bosses 3.0 vertical slice.
// All values are local to the boss. World transforms belong to the runtime.
// The output is deterministic, bounded and has no DOM or Three.js dependencies.
const SIGNATURES = Object.freeze({
  2: 'BROCA HELICOIDAL',
  5: 'MARTELO GLACIAL',
  6: 'CABEÇAS DA COLMEIA',
  9: 'ECLIPSE DE MARVIN',
});
export const SIGNATURE_BOSSES = Object.freeze([2, 5, 6, 9]);

const clampPhase = (phase) => Math.max(1, Math.min(3, Math.trunc(phase) || 1));
const shot = (origin, target, element) => ({ origin, target, element });
const TAU = Math.PI * 2;

/** Named special attacks replace generic attack windows for four bosses.
 * Destroying a generator disables its battery without disabling the boss core.
 * Output is an array of projectile definitions, never more than ten.
 */
export function bossSignatureVolley(index, cycle = 0, phase = 1, generators = [true, true]) {
  if (!SIGNATURE_BOSSES.includes(index)) return null;
  const level = clampPhase(phase);
  const left = generators[0] !== false;
  const right = generators[1] !== false;
  const live = [left, right].filter(Boolean).length;
  const shots = [];
  if (index === 2) {
    // Drill: expanding helix requires reading a moving radial gap.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + cycle * 0.45;
      const radius = 19 + level * 4;
      shots.push(shot(
        [Math.cos(angle) * radius, Math.sin(angle) * radius, 22],
        [Math.sin(angle) * (9 + level * 3), Math.cos(angle) * (9 + level * 3), 0],
        'fire',
      ));
    }
  }
  if (index === 5) {
    // Glacial titan: alternating left and right arm batteries; breaking one arm
    // removes that side. At zero generators a small core cannon remains active.
    for (const [idx, enabled] of [left, right].entries()) {
      if (!enabled) continue;
      const side = idx === 0 ? -1 : 1;
      const count = level === 3 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        shots.push(shot(
          [side * 23, -10 + i * 2, 27],
          [side * (15 - i * 5), -5 + i * 4, 0],
          'arcane',
        ));
      }
    }
    if (live === 0)
      shots.push(shot([0, 17, 25], [0, 0, 0], 'fire'));
  }
  if (index === 6) {
    // The hydra fires from distinct animated heads, not one central origin.
    const count = 4 + level;
    for (let i = 0; i < count; i++) {
      const head = (i + Math.floor(cycle)) % 7;
      const angle = (head / 7) * TAU;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (live > 0 && !generators[side]) continue;
      shots.push(shot(
        [Math.cos(angle) * 44, Math.sin(angle) * 28, 15],
        [Math.cos(angle + cycle * 0.31) * (15 + level * 2),
          Math.sin(angle + cycle * 0.31) * 12, 0],
        'arcane',
      ));
    }
    if (!shots.length) shots.push(shot([0, 16, 25], [0, 0, 0], 'arcane'));
  }
  if (index === 9) {
    // Marvin: alternating eclipsing arcs that collapse to a central barrage.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + (cycle % 2) * 0.32;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (live > 0 && !generators[side]) continue;
      shots.push(shot(
        [Math.cos(angle) * 37, 15 + Math.sin(angle) * 24, 25],
        [Math.cos(angle + cycle * 0.12) * (12 + level * 4),
          Math.sin(angle + cycle * 0.12) * (11 + level * 3), 0],
        level === 3 ? 'arcane' : 'fire',
      ));
    }
    if (!shots.length) shots.push(shot([0, 25, 25], [0, 0, 0], 'arcane'));
  }
  return {
    name: SIGNATURES[index],
    index,
    cycle,
    phase: level,
    shots: shots.slice(0, 10),
  };
}

/** Visual choreography is sampled from game time, freezes automatically on pause.
 * The caller applies these poses to existing model joints, not hitboxes.
 */
export function bossSignaturePose(index, time, phase = 1, attackState = 'maneuver') {
  const t = Math.max(0, Number.isFinite(time) ? time : 0);
  const intensity = clampPhase(phase) / 3;
  const firing = attackState === 'attack';
  const charging = attackState === 'windup';
  if (index === 2)
    return { spin: t * (2.4 + intensity * 2.5), extension: charging ? 8 : firing ? 13 : 0 };
  if (index === 5)
    return {
      armLeft: Math.sin(t * 1.7) * 0.24 + (charging ? -0.38 : firing ? 0.3 : 0),
      armRight: Math.sin(t * 1.7 + Math.PI) * 0.24 + (charging ? 0.38 : firing ? -0.3 : 0),
      stomp: Math.max(0, Math.sin(t * (2 + intensity))) * (firing ? 0.24 : 0.07),
    };
  if (index === 6)
    return { headSwing: Math.sin(t * (1.2 + intensity)) * (charging ? 0.48 : 0.27), headPulse: firing ? 1.3 : 1 };
  if (index === 9)
    return { eclipse: (charging ? 1.18 : firing ? 1.3 : 1) + Math.sin(t * 2.5) * 0.04, twist: Math.sin(t * 0.8) * 0.3 };
  return null;
}
