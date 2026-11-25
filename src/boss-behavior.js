// Tactical melee director: bosses choose attacks from the player's CURRENT
// position and orbital threat. Deterministic, no random spray or timer-only hit.
export const MELEE_ARCHETYPES = Object.freeze({
  2: { name: 'INVESTIDA DA BROCA', kind: 'drill', reach: 26, damage: 22 },
  5: { name: 'GARRAS DO COLOSSO', kind: 'claw', reach: 31, damage: 26 },
  6: { name: 'CHICOTE DE TENTÁCULOS', kind: 'tentacle', reach: 36, damage: 20 },
  9: { name: 'MORDIDA DE MARVIN', kind: 'bite', reach: 30, damage: 30 },
});
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** One tactical choice per attack cycle. Changing player position/orbit changes
 * the decision, not just the visual animation. Other bosses retain ranged AI.
 */
export function bossMeleeDecision(index, { phase = 1, cycle = 0, playerDistance = 99, flank = false } = {}) {
  const profile = MELEE_ARCHETYPES[index];
  if (!profile) return null;
  const close = playerDistance <= 46;
  // Prefer a charge against a nearby, exposed player, counter a flank only
  // when enraged. Distant players face ranged attacks and can reposition.
  const engage = close && ((!flank && (cycle % 2 === 0 || phase >= 2)) || (flank && phase === 3 && cycle % 3 === 0));
  return { ...profile, engage, phase: clamp(Math.trunc(phase) || 1, 1, 3), cycle };
}

/** 0..1 strike lunge. Windup = advance warning, attack = approach, recovery =
 * retreat. One damage window at 0.48–0.7 of the strike segment.
 */
export function bossMeleeMotion(state, attackProgress) {
  const p = clamp(Number.isFinite(attackProgress) ? attackProgress : 0, 0, 1);
  if (state === 'windup') return { lunge: 0, striking: false, telegraph: true, pose: 0.45 };
  if (state === 'attack') {
    const lunge = Math.sin(p * Math.PI) ** 2;
    return { lunge, striking: p >= 0.48 && p <= 0.7, telegraph: false, pose: 0.5 + lunge * 0.5 };
  }
  return { lunge: 0, striking: false, telegraph: false, pose: 0 };
}

/** Swept local attack, avoid hits outside the contact radius. The player may
 * dodge by moving laterally / gaining altitude or using the shield.
 */
export function bossMeleeConnect({ player, boss, reach, lunge }) {
  if (!player || !boss || !Number.isFinite(reach)) return false;
  return (
    Math.hypot(player.x - boss.x, player.y - boss.y) <= reach &&
    Math.abs(player.z - (boss.z + 57 * clamp(lunge, 0, 1))) <= 43
  );
}
