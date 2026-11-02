// Utility-driven boss combat. Tactics use the pilot's actual movement and
// orbit rather than random bullets, and telegraph a dodgeable targeted attack.
const MELEE = Object.freeze({
  0: ['claw-swipe', 'tentacle-sweep'],
  1: ['tentacle-grab', 'claw-swipe'],
  2: ['drill-ram', 'claw-swipe'],
  3: ['reactor-vent', 'hammer-slam'],
  4: ['plasma-dive', 'solar-sweep'],
  5: ['hammer-slam', 'claw-swipe'],
  6: ['tentacle-grab', 'tentacle-sweep'],
  7: ['claw-swipe', 'hammer-slam'],
  8: ['tentacle-sweep', 'tentacle-grab'],
  9: ['bite', 'claw-swipe', 'tentacle-grab'],
});
const LABEL = Object.freeze({
  'drill-ram': 'INVESTIDA DA BROCA · FUJA DO EIXO',
  'plasma-dive': 'FÊNIX · MERGULHO SOLAR · SAIA DO IMPACTO',
  'solar-sweep': 'FÊNIX · VARREDURA DAS ASAS · SUBA OU DESÇA',
  'hammer-slam': 'MARTELO DO COLOSSO · DESVIE DO IMPACTO',
  'reactor-vent': 'DESCARGA DO MOTOR · DASH PARA FORA DO EIXO',
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
    else if (sector === 4)
      // Phoenix commits to an aimed plasma dive against high/boosting pilots;
      // low flight triggers a wide but shallow wing sweep. The player can
      // escape either area after the target is latched at windup.
      kind = boosting || playerY >= 25 || cycle % 2 === 0 ? 'plasma-dive' : 'solar-sweep';
    else if (sector === 5) kind = robot || healthy === 0 ? 'hammer-slam' : 'claw-swipe';
    else if (sector === 2)
      kind = boosting ? 'drill-ram' : cycle % 3 === 0 ? 'claw-swipe' : 'drill-ram';
    else if (sector === 3)
      // A destroyed port/starboard engine can no longer vent its side.
      // When both are broken, the carrier can only fire a core barrage.
      kind = healthy === 0 ? 'barrage' : cycle % 3 === 1 ? 'hammer-slam' : 'reactor-vent';
    else kind = options[(cycle + (boosting ? 1 : 0) + (robot ? 1 : 0)) % options.length];
    // Every third cycle retains a readable ranged counterplay window instead
    // of an endless stream of area attacks.
    if (cycle > 0 && cycle % 4 === 0) kind = 'barrage';
  }
  const ventSide =
    sector === 3 && kind === 'reactor-vent'
      ? !generators[0]
        ? 1
        : !generators[1]
          ? -1
          : playerX >= 0
            ? 1
            : -1
      : 0;
  const targetX = Math.max(-95, Math.min(95, playerX));
  const targetY = Math.max(-5, Math.min(52, playerY));
  return Object.freeze({
    kind,
    label: LABEL[kind],
    ventSide,
    sector,
    cycle,
    phase: p,
    targetX,
    targetY,
    damage:
      (kind === 'bite' || kind === 'plasma-dive'
        ? 25
        : kind === 'hammer-slam'
          ? 22
          : kind === 'solar-sweep'
            ? 18
            : 16) + p * 3,
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
    dodgeRadius:
      kind === 'reactor-vent' || kind === 'plasma-dive'
        ? 13
        : kind === 'solar-sweep'
          ? 12
          : kind === 'tentacle-sweep'
          ? 11
          : kind === 'hammer-slam'
            ? 14
            : 9,
    origin:
      kind === 'reactor-vent'
        ? ventSide < 0
          ? 'port-drive-valve'
          : 'starboard-drive-valve'
        : kind === 'plasma-dive'
          ? 'phoenix-solar-core'
          : kind === 'solar-sweep'
            ? 'phoenix-wings'
            : kind === 'bite'
              ? 'jaw'
          : kind.startsWith('tentacle')
            ? 'tentacles'
            : 'claws',
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
  if (intent.kind === 'reactor-vent') return dx < r * 1.35 && dy < r * 1.1;
  if (intent.kind === 'tentacle-sweep') return dy < r && dx < r * 2.4;
  if (intent.kind === 'solar-sweep') return dy < r * 0.68 && dx < r * 2.5;
  if (intent.kind === 'plasma-dive') return Math.hypot(dx * 0.8, dy * 1.15) < r;
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
    exhaust:
      intent.kind === 'reactor-vent' || intent.kind === 'plasma-dive'
        ? windup * 0.4 + strike
        : 0,
    lunge:
      intent.kind === 'reactor-vent'
        ? 0
        : strike *
          (['bite', 'drill-ram', 'plasma-dive'].includes(intent.kind) ? 72 : 48),
    jaw: intent.kind === 'bite' ? windup * 0.45 + strike * 0.9 : 0,
    claw:
      intent.kind === 'claw-swipe' ||
      intent.kind === 'hammer-slam' ||
      intent.kind === 'solar-sweep'
        ? windup * 0.3 + strike * 0.85
        : 0,
    tentacle: intent.kind.startsWith('tentacle') ? windup * 0.2 + strike * 0.75 : 0,
  };
}
