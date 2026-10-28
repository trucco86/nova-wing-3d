// Authored combat identities for the first Bosses 3.0 vertical slice.
// All values are local to the boss. World transforms belong to the runtime.
// The output is deterministic, bounded and has no DOM or Three.js dependencies.
const SIGNATURES = Object.freeze({
  0: 'PINÇA DE ROK',
  1: 'FERRÃO EM TESOURA',
  2: 'BROCA HELICOIDAL',
  3: 'TRAVA DO REATOR',
  4: 'ASAS INCANDESCENTES',
  5: 'MARTELO GLACIAL',
  6: 'CABEÇAS DA COLMEIA',
  7: 'BATERIAS DE ÔMEGA',
  8: 'LENTES DE ÓRION',
  9: 'ECLIPSE DE MARVIN',
});
export const SIGNATURE_BOSSES = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

const clampPhase = (phase) => Math.max(1, Math.min(3, Math.trunc(phase) || 1));
const shot = (origin, target, element) => ({ origin, target, element });
const TAU = Math.PI * 2;

/** Named special attacks replace generic attack windows for ten bosses.
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

  // Rok's twin-wing pincer: convergence reverses after each tactical cycle.
  if (index === 0) {
    for (const side of [-1, 1]) {
      if (live && !(side < 0 ? left : right)) continue;
      for (let i = 0; i < 3 + (level === 3 ? 1 : 0); i++) {
        shots.push(shot([side * (30 + i * 5), 7, 22],
          [side * ((cycle % 2 ? -1 : 1) * (16 - i * 6)), -8 + i * 7, 0], 'fire'));
      }
    }
  }
  // Stingray: alternating high-low scissor sweeps, not a circular spray.
  if (index === 1) {
    for (let i = 0; i < 4 + level; i++) {
      const side = i % 2 ? 1 : -1;
      if (live && !(side < 0 ? left : right)) continue;
      shots.push(shot([side * 28, -16 + (i % 3) * 7, 27],
        [side * (20 - i * 3), (cycle % 2 ? 1 : -1) * (15 - i * 4), 0], 'arcane'));
    }
  }
  // Station: closing reactor spokes, each generator protects half the iris.
  if (index === 3) {
    const count = 4 + level;
    for (let i = 0; i < count; i++) {
      const angle = i / count * TAU + cycle * 0.36;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (live && !generators[side]) continue;
      shots.push(shot([Math.cos(angle) * 36, Math.sin(angle) * 25, 26],
        [Math.cos(angle + Math.PI / 4) * 21, Math.sin(angle + Math.PI / 4) * 14, 0], 'arcane'));
    }
  }
  // Phoenix: alternating fire wings and descending feather trajectories.
  if (index === 4) {
    for (let i = 0; i < 4 + level; i++) {
      const side = i % 2 ? 1 : -1;
      if (live && !(side < 0 ? left : right)) continue;
      shots.push(shot([side * (28 + i * 4), 12 + i * 3, 23],
        [side * (8 + i * 3), (cycle % 2 ? 1 : -1) * 18 + (i - 3) * 7, 0], 'fire'));
    }
  }
  if (index === 2) {
    // Drill: expanding helix requires reading a moving radial gap.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + cycle * 0.45;
      const radius = 19 + level * 4;
      shots.push(
        shot(
          [Math.cos(angle) * radius, Math.sin(angle) * radius, 22],
          [Math.sin(angle) * (9 + level * 3), Math.cos(angle) * (9 + level * 3), 0],
          'fire',
        ),
      );
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
        shots.push(
          shot([side * 23, -10 + i * 2, 27], [side * (15 - i * 5), -5 + i * 4, 0], 'arcane'),
        );
      }
    }
    if (live === 0) shots.push(shot([0, 17, 25], [0, 0, 0], 'fire'));
  }
  if (index === 6) {
    // The hydra fires from distinct animated heads, not one central origin.
    const count = 4 + level;
    for (let i = 0; i < count; i++) {
      const head = (i + Math.floor(cycle)) % 7;
      const angle = (head / 7) * TAU;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (live > 0 && !generators[side]) continue;
      shots.push(
        shot(
          [Math.cos(angle) * 44, Math.sin(angle) * 28, 15],
          [
            Math.cos(angle + cycle * 0.31) * (15 + level * 2),
            Math.sin(angle + cycle * 0.31) * 12,
            0,
          ],
          'arcane',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, 16, 25], [0, 0, 0], 'arcane'));
  }

  // Omega: flanking artillery loses entire side salvos when its generator fails.
  if (index === 7) {
    for (const side of [-1, 1]) {
      if (live && !(side < 0 ? left : right)) continue;
      for (let i = 0; i < 3 + (level === 3 ? 1 : 0); i++) {
        shots.push(shot([side * 45, 17 + i * 3, 29],
          [side * (28 - i * 6), (i - 2) * 9, 0], 'fire'));
      }
    }
  }
  // Orion: gravitational lenses focus at alternating heights.
  if (index === 8) {
    const count = 4 + level;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      if (live && !(side < 0 ? left : right)) continue;
      const angle = i / count * Math.PI + cycle * 0.28;
      shots.push(shot([side * (18 + i * 5), Math.sin(angle) * 28, 25],
        [side * (8 + level * 3), Math.cos(angle) * (20 + level * 5), 0], 'arcane'));
    }
  }
  if (index === 9) {
    // Marvin: alternating eclipsing arcs that collapse to a central barrage.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + (cycle % 2) * 0.32;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (live > 0 && !generators[side]) continue;
      shots.push(
        shot(
          [Math.cos(angle) * 37, 15 + Math.sin(angle) * 24, 25],
          [
            Math.cos(angle + cycle * 0.12) * (12 + level * 4),
            Math.sin(angle + cycle * 0.12) * (11 + level * 3),
            0,
          ],
          level === 3 ? 'arcane' : 'fire',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, 25, 25], [0, 0, 0], 'arcane'));
  }

  // Destroyed generators leave a weak central weapon, never a dead boss.
  if (!shots.length) shots.push(shot([0, 12, 27], [0, 0, 0], 'arcane'));
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

  if (index === 0)
    return { pincer: (charging ? 0.28 : firing ? -0.24 : 0) + Math.sin(t * 1.4) * 0.08 };
  if (index === 1)
    return { tail: Math.sin(t * (2 + intensity)) * 0.28 + (charging ? 0.45 : firing ? -0.5 : 0) };
  if (index === 3)
    return { iris: t * (0.8 + intensity) + (charging ? 0.4 : 0),
      aperture: firing ? 1.3 : charging ? 0.75 : 1 };
  if (index === 4)
    return { wingLeft: Math.sin(t * 2.1) * 0.2 + (charging ? 0.42 : firing ? -0.3 : 0),
      wingRight: Math.sin(t * 2.1 + Math.PI) * 0.2 + (charging ? -0.42 : firing ? 0.3 : 0) };
  if (index === 2)
    return { spin: t * (2.4 + intensity * 2.5), extension: charging ? 8 : firing ? 13 : 0 };
  if (index === 5)
    return {
      armLeft: Math.sin(t * 1.7) * 0.24 + (charging ? -0.38 : firing ? 0.3 : 0),
      armRight: Math.sin(t * 1.7 + Math.PI) * 0.24 + (charging ? 0.38 : firing ? -0.3 : 0),
      stomp: Math.max(0, Math.sin(t * (2 + intensity))) * (firing ? 0.24 : 0.07),
    };
  if (index === 6)
    return {
      headSwing: Math.sin(t * (1.2 + intensity)) * (charging ? 0.48 : 0.27),
      headPulse: firing ? 1.3 : 1,
    };
  if (index === 7)
    return { broadside: (charging ? -0.35 : firing ? 0.4 : 0) + Math.sin(t * 1.1) * 0.1 };
  if (index === 8)
    return { lens: t * (0.9 + intensity), pulse: firing ? 1.34 : charging ? 0.8 : 1 };
  if (index === 9)
    return {
      eclipse: (charging ? 1.18 : firing ? 1.3 : 1) + Math.sin(t * 2.5) * 0.04,
      twist: Math.sin(t * 0.8) * 0.3,
    };
  return null;
}
