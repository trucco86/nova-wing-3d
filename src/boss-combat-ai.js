// Utility-driven boss combat. Tactics use the pilot's actual movement and
// orbit rather than random bullets, and telegraph a dodgeable targeted attack.
const MELEE = Object.freeze({
  0: ['claw-swipe', 'tentacle-sweep'],
  1: ['tentacle-grab', 'claw-swipe'],
  2: ['drill-ram', 'claw-swipe'],
  3: ['hammer-slam', 'tentacle-sweep'],
  4: ['drill-ram', 'claw-swipe'],
  5: ['hammer-slam', 'claw-swipe'],
  6: ['tentacle-grab', 'tentacle-sweep'],
  7: ['claw-swipe', 'hammer-slam'],
  8: ['tentacle-sweep', 'tentacle-grab'],
  9: ['bite', 'claw-swipe', 'tentacle-grab'],
});
const LABEL = Object.freeze({
  'drill-ram': 'INVESTIDA DA BROCA · FUJA DO EIXO',
  'hammer-slam': 'MARTELO DO COLOSSO · DESVIE DO IMPACTO',
  'claw-swipe': 'GARRAS · TROQUE DE FLANCO',
  'tentacle-grab': 'TENTÁCULOS · QUEBRE O RASTREAMENTO',
  'tentacle-sweep': 'VARREDURA · MUDE DE ALTURA',
  bite: 'MORDIDA · SAIA DA ÁREA MARCADA',
  barrage: 'RAJADA · PROCURE A ABERTURA',
});
export const BOSS_MELEE = Object.freeze(Object.keys(MELEE).map(Number));

export function chooseBossIntent({
  sector,
  cycle = 0,
  phase = 1,
  playerX = 0,
  playerY = 6,
  orbit = 0,
  boosting = false,
  robot = false,
  generators = [true, true],
}) {
  const options = MELEE[sector];
  const p = Math.max(1, Math.min(3, phase));
  const healthy = generators.filter(Boolean).length;
  let kind = 'barrage';
  if (options) {
    const flank = Math.abs(Math.atan2(Math.sin(orbit), Math.cos(orbit))) > 0.8;
    if (sector === 9) {
      // Marvin learns the pilot's approach at each *latched* attack window:
      // climbing or boosting attracts a tentacle intercept, a flank or heavy
      // mecha draws his claws, and a low/front approach risks his bite.
      // Phase 3 mixes in an intercept after repeated frontal approaches.
      const climbing = playerY >= 28;
      kind =
        boosting || climbing
          ? 'tentacle-grab'
          : flank || robot
            ? 'claw-swipe'
            : p === 3 && cycle % 3 === 0
              ? 'tentacle-grab'
              : 'bite';
    } else if (sector === 6)
      // The Hydra counters high flight, boost and orbiting with a focused grab;
      // low/front flight must dodge a horizontal tentacle sweep vertically.
      kind = boosting || flank || playerY >= 28 ? 'tentacle-grab' : 'tentacle-sweep';
    else if (sector === 5) kind = robot || healthy === 0 ? 'hammer-slam' : 'claw-swipe';
    else if (sector === 2)
      kind = boosting ? 'drill-ram' : cycle % 3 === 0 ? 'claw-swipe' : 'drill-ram';
    else kind = options[(cycle + (boosting ? 1 : 0) + (robot ? 1 : 0)) % options.length];
    // Every third cycle retains a readable ranged counterplay window instead
    // of an endless stream of area attacks.
    if (cycle > 0 && cycle % 4 === 0) kind = 'barrage';
  }
  const targetX = Math.max(-95, Math.min(95, playerX));
  const targetY = Math.max(-5, Math.min(52, playerY));
  return Object.freeze({
    kind,
    label: LABEL[kind],
    sector,
    cycle,
    phase: p,
    targetX,
    targetY,
    damage: (kind === 'bite' ? 25 : kind === 'hammer-slam' ? 22 : 16) + p * 3,
    // Always commit once at windup: the boss cannot instantly retarget after
    // the player starts dodging the telegraphed danger area.
    counter:
      boosting && (sector === 6 || sector === 9)
        ? 'boost'
        : playerY >= 28 && (sector === 6 || sector === 9)
          ? 'altitude'
          : (sector === 6 || sector === 9) &&
              Math.abs(Math.atan2(Math.sin(orbit), Math.cos(orbit))) > 0.8
            ? 'flank'
            : robot && sector === 9
              ? 'mecha'
              : 'approach',
    warning: 2.2,
    dodgeRadius: kind === 'tentacle-sweep' ? 11 : kind === 'hammer-slam' ? 14 : 9,
    origin: kind === 'bite' ? 'jaw' : kind.startsWith('tentacle') ? 'tentacles' : 'claws',
  });
}

/** The telegraph is latched once at windup; running out of the marked danger
 * zone is a real defence. Shield, roll and invulnerability remain in hit().
 */
export function bossMeleeHit(intent, { x, y, orbit = 0 }) {
  if (!intent || intent.kind === 'barrage') return false;
  const dx = Math.abs(x - intent.targetX);
  const dy = Math.abs(y - intent.targetY);
  const r = intent.dodgeRadius;
  if (intent.kind === 'tentacle-sweep') return dy < r && dx < r * 2.4;
  if (intent.kind === 'claw-swipe') {
    const flank =
      intent.sector !== 9 || Math.abs(Math.atan2(Math.sin(orbit), Math.cos(orbit))) > 0.45;
    return flank && dx < r * 1.7 && dy < r;
  }
  if (intent.kind === 'tentacle-grab') return Math.hypot(dx * 0.7, dy) < r;
  return Math.hypot(dx, dy) < r;
}

// Drives visual strikes while the real attack clock runs. No rogue timers or
// physical collisions before the warning window.
export function bossMeleePose(intent, state, phaseAge = 0) {
  if (!intent || intent.kind === 'barrage')
    return Object.freeze({ lunge: 0, jaw: 0, claw: 0, tentacle: 0 });
  const windup = state === 'windup' ? Math.min(1, phaseAge / intent.warning) : 0;
  const strike = state === 'attack' ? Math.sin(Math.min(1, phaseAge / 1.4) * Math.PI) : 0;
  return {
    lunge: strike * (intent.kind === 'bite' || intent.kind === 'drill-ram' ? 72 : 48),
    jaw: intent.kind === 'bite' ? windup * 0.45 + strike * 0.9 : 0,
    claw:
      intent.kind === 'claw-swipe' || intent.kind === 'hammer-slam'
        ? windup * 0.3 + strike * 0.85
        : 0,
    tentacle: intent.kind.startsWith('tentacle') ? windup * 0.2 + strike * 0.75 : 0,
  };
}
