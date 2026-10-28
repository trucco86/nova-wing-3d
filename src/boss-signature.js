// Authored combat identities for the first Bosses 3.0 vertical slice.
// All values are local to the boss. World transforms belong to the runtime.
// The output is deterministic, bounded and has no DOM or Three.js dependencies.
const SIGNATURES = Object.freeze({
  0: 'INTERCEPTAÇÃO DE ROK',
  1: 'FERRÃO DE CAUDA',
  2: 'BROCA HELICOIDAL',
  3: 'PULSO DO REATOR',
  4: 'MERGULHO SOLAR',
  5: 'MARTELO GLACIAL',
  6: 'CABEÇAS DA COLMEIA',
  7: 'BORDADA ÔMEGA',
  8: 'ANEL GRAVITACIONAL',
  9: 'ECLIPSE DE MARVIN',
});
export const SIGNATURE_BOSSES = Object.freeze(Array.from({ length: 10 }, (_, index) => index));

const clampPhase = (phase) => Math.max(1, Math.min(3, Math.trunc(phase) || 1));
const shot = (origin, target, element) => ({ origin, target, element });
const TAU = Math.PI * 2;

/** Named special attacks replace generic attack windows for all ten bosses.
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
  if (index === 0) {
    // Rok intercepts with alternating twin wing batteries. Destroying one
    // generator removes that side, changing the safe flank.
    for (const side of [-1, 1]) {
      if (!(side < 0 ? left : right)) continue;
      for (let i = 0; i < 3 + (level === 3 ? 1 : 0); i++) {
        shots.push(
          shot(
            [side * (28 + i * 3), 5 + i * 2, 25],
            [side * (18 - i * 4) + Math.sin(cycle * 0.5) * 5, (i - 1) * 7, 0],
            'fire',
          ),
        );
      }
    }
    if (!live) shots.push(shot([0, 13, 27], [Math.sin(cycle * 0.5) * 8, 0, 0], 'fire'));
  }
  if (index === 1) {
    // Stingray alternates left and right tail-fan sweeps, forcing the pilot
    // to change lane instead of remaining behind a single straight barrel.
    for (let i = 0; i < 4 + level; i++) {
      const side = (i + Math.floor(cycle)) % 2 ? 1 : -1;
      if (!(side < 0 ? left : right)) continue;
      shots.push(
        shot(
          [side * (35 - (i % 3) * 4), -8 + i * 3, 25],
          [side * (16 - i * 3), -17 + i * 7 + Math.sin(cycle) * 3, 0],
          'arcane',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, -16, 27], [0, -12, 0], 'arcane'));
  }
  if (index === 2) {
    // Drill: expanding helix requires reading a moving radial gap.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + cycle * 0.45;
      const radius = 19 + level * 4;
      const x = Math.cos(angle) * radius;
      if (!(x < 0 ? left : right)) continue;
      shots.push(
        shot(
          [x, Math.sin(angle) * radius, 22],
          [Math.sin(angle) * (9 + level * 3), Math.cos(angle) * (9 + level * 3), 0],
          'fire',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, 0, 28], [0, 0, 0], 'fire'));
  }
  if (index === 3) {
    // Orbit-9 sends rotating reactor pulses from its concentric station ring.
    // A destroyed generator silences half of the annulus.
    const count = 6 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + cycle * 0.23;
      const x = Math.cos(angle) * 29;
      if (!(x < 0 ? left : right)) continue;
      shots.push(
        shot(
          [x, Math.sin(angle) * 29, 24],
          [Math.cos(angle + 0.5) * (9 + level * 3), Math.sin(angle + 0.5) * (9 + level * 3), 0],
          'arcane',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, 0, 28], [0, 0, 0], 'arcane'));
  }
  if (index === 4) {
    // Phoenix dives across the pilot's lane in alternating plasma crescents.
    for (const side of [-1, 1]) {
      if (!(side < 0 ? left : right)) continue;
      for (let i = 0; i < 3 + (level === 3 ? 1 : 0); i++) {
        shots.push(
          shot(
            [side * 40, 15 - i * 4, 23],
            [side * (21 - i * 5), -21 + i * 11 + Math.sin(cycle * 0.5) * 6, 0],
            'fire',
          ),
        );
      }
    }
    if (!shots.length) shots.push(shot([0, 0, 28], [0, -16, 0], 'fire'));
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
      if (!generators[side]) continue;
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
  if (index === 7) {
    // Omega broadsides use actual port/starboard battery assemblies. Losing
    // one generator removes half the broadside; the core retains a weak shot.
    for (const side of [-1, 1]) {
      if (!(side < 0 ? left : right)) continue;
      for (let i = 0; i < 4; i++) {
        shots.push(
          shot(
            [side * 45, 17 + i * 3, 29],
            [side * (22 - i * 5), (i - 1.5) * (7 + level * 2), 0],
            'fire',
          ),
        );
      }
    }
    if (!live) shots.push(shot([0, 12, 28], [0, 0, 0], 'fire'));
  }
  if (index === 8) {
    // Gravity Bastion emits asymmetrical orbital arcs around its rotating iris.
    // The ring's attack plane shifts with the cycle; it never changes the
    // player's controls or physics without a separate verified mechanic.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU - cycle * 0.35;
      const x = Math.cos(angle) * 43;
      if (!(x < 0 ? left : right)) continue;
      shots.push(
        shot(
          [x, Math.sin(angle) * 29, 23],
          [Math.cos(angle * 1.5) * (11 + level * 4), Math.sin(angle * 1.5) * (11 + level * 4), 0],
          'arcane',
        ),
      );
    }
    if (!shots.length) shots.push(shot([0, 0, 27], [0, 0, 0], 'arcane'));
  }
  if (index === 9) {
    // Marvin: alternating eclipsing arcs that collapse to a central barrage.
    const count = 5 + level;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + (cycle % 2) * 0.32;
      const side = Math.cos(angle) < 0 ? 0 : 1;
      if (!generators[side]) continue;
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
    return {
      wingLift: Math.sin(t * 1.9) * 0.12 + (charging ? 0.34 : firing ? -0.26 : 0),
      turretYaw: Math.sin(t * 0.8) * 0.17 + (firing ? 0.2 : 0),
    };
  if (index === 1)
    return {
      finFold: Math.sin(t * 1.6) * 0.14 + (charging ? 0.48 : firing ? -0.38 : 0),
      tailSweep: Math.sin(t * (1.3 + intensity)) * (firing ? 0.45 : 0.2),
    };
  if (index === 2)
    return { spin: t * (2.4 + intensity * 2.5), extension: charging ? 8 : firing ? 13 : 0 };
  if (index === 3)
    return {
      reactorSpin: t * (0.7 + intensity * 1.1),
      reactorPulse: (charging ? 1.17 : firing ? 1.32 : 1) + Math.sin(t * 2.7) * 0.04,
    };
  if (index === 4)
    return {
      flameSweep: Math.sin(t * 1.5) * 0.18 + (charging ? 0.31 : firing ? -0.42 : 0),
      solarDive: (charging ? -0.22 : firing ? 0.28 : 0) + Math.sin(t * 0.8) * 0.08,
    };
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
    return {
      broadsideLeft: Math.sin(t * 0.8) * 0.1 + (charging ? -0.27 : firing ? 0.3 : 0),
      broadsideRight: Math.sin(t * 0.8 + Math.PI) * 0.1 + (charging ? 0.27 : firing ? -0.3 : 0),
    };
  if (index === 8)
    return {
      irisSpin: t * (0.45 + intensity * 0.8),
      irisTilt: Math.sin(t * 0.9) * 0.19 + (charging ? 0.27 : firing ? -0.24 : 0),
    };
  if (index === 9)
    return {
      eclipse: (charging ? 1.18 : firing ? 1.3 : 1) + Math.sin(t * 2.5) * 0.04,
      twist: Math.sin(t * 0.8) * 0.3,
    };
  return null;
}
