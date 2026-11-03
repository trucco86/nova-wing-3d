// Utility-driven boss combat. Tactics use the pilot's actual movement and
// orbit rather than random bullets, and telegraph a dodgeable targeted attack.
const MELEE = Object.freeze({
  0: ['rok-pincer', 'rok-ram'],
  1: ['stingray-scissor', 'stingray-sting'],
  2: ['drill-ram', 'drill-crosscut'],
  3: ['reactor-vent', 'hammer-slam'],
  4: ['plasma-dive', 'solar-sweep'],
  5: ['ice-quake', 'cryo-pincer'],
  6: ['tentacle-grab', 'tentacle-sweep'],
  7: ['bite', 'claw-swipe', 'hammer-slam', 'tentacle-grab', 'tentacle-sweep'],
  8: ['orion-gravity-pulse', 'orion-iris-shear'],
  9: ['bite', 'claw-swipe', 'tentacle-grab'],
});
const LABEL = Object.freeze({
  'rok-pincer': 'ROK · PINÇA DAS ASAS · SUBA DA ZONA VERMELHA',
  'rok-ram': 'ROK · INVESTIDA FRONTAL · DESVIE DO EIXO',
  'stingray-scissor': 'STINGRAY · TESOURA VERTICAL · ESQUIVE PELA LATERAL',
  'stingray-sting': 'STINGRAY · FERRÃO · SAIA DA LINHA DE INVESTIDA',
  'drill-crosscut': 'CARBIDE · BROCA TRANSVERSAL · MUDE DE ALTURA',
  'orion-gravity-pulse': 'ÓRION · PULSO GRAVITACIONAL · AFASTE-SE DO CENTRO',
  'orion-iris-shear': 'ÓRION · RAIO DA ÍRIS · SAIA DA FAIXA VERTICAL',
  'drill-ram': 'INVESTIDA DA BROCA · FUJA DO EIXO',
  'plasma-dive': 'FÊNIX · MERGULHO SOLAR · SAIA DO IMPACTO',
  'solar-sweep': 'FÊNIX · VARREDURA DAS ASAS · SUBA OU DESÇA',
  'hammer-slam': 'MARTELO DO COLOSSO · DESVIE DO IMPACTO',
  'ice-quake': 'COLOSSO · ONDA NO GELO · MUDE DE ALTURA',
  'cryo-pincer': 'COLOSSO · PINÇA CRIOGÊNICA · DESVIE PARA O LADO',
  'reactor-vent': 'DESCARGA DO MOTOR · DASH PARA FORA DO EIXO',
  'claw-swipe': 'GARRAS · TROQUE DE FLANCO',
  'tentacle-grab': 'TENTÁCULOS · QUEBRE O RASTREAMENTO',
  'tentacle-sweep': 'VARREDURA · MUDE DE ALTURA',
  bite: 'MORDIDA · SAIA DA ÁREA MARCADA',
  barrage: 'RAJADA · PROCURE A ABERTURA',
});
export const BOSS_MELEE = Object.freeze(Object.keys(MELEE).map(Number));

// Shared collision and HUD footprint. The same dimensions drive both the
// real hit predicate and the tactical radar: no imaginary green safe zones.
const EXCLUSIVE_FOOTPRINTS = Object.freeze({
  'rok-pincer': Object.freeze({ type: 'rect', x: 1.8, y: 0.6 }),
  'rok-ram': Object.freeze({ type: 'ellipse', x: 1.12, y: 0.84 }),
  'stingray-scissor': Object.freeze({ type: 'rect', x: 0.65, y: 1.55 }),
  'stingray-sting': Object.freeze({ type: 'ellipse', x: 0.82, y: 1.16 }),
  'drill-ram': Object.freeze({ type: 'ellipse', x: 1, y: 1 }),
  'drill-crosscut': Object.freeze({ type: 'rect', x: 1.55, y: 0.65 }),
  'orion-gravity-pulse': Object.freeze({ type: 'ellipse', x: 1.18, y: 1.18 }),
  'orion-iris-shear': Object.freeze({ type: 'rect', x: 0.55, y: 1.9 }),
});
export const bossExclusiveFootprint = (kind) => EXCLUSIVE_FOOTPRINTS[kind] ?? null;

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
    if (sector === 0) {
      // Rok's converging wing rig cuts a horizontal lane; frontal rushes
      // instead reward a timely sidestep. The attack locks at windup.
      kind = flank || cycle % 3 !== 0 ? 'rok-pincer' : 'rok-ram';
    } else if (sector === 1) {
      // Stingray punishes low flight with a vertical scissor, while climbing
      // or boosting exposes the pilot to a narrower tail-sting dive.
      kind = boosting || playerY >= 25 ? 'stingray-sting' : 'stingray-scissor';
    } else if (sector === 8) {
      // Orion alternates a circular gravity pulse and a narrow iris beam.
      // The latter reacts to high flight and lateral orbit, not random rolls.
      kind = flank || playerY >= 28 ? 'orion-iris-shear' : 'orion-gravity-pulse';
    } else if (sector === 9) {
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
    else if (sector === 5)
      // A low pilot or robot triggers an ice-quake; high flight or alternate
      // cycle brings in the narrow cryo-pincer. Both latch aim at windup.
      kind = robot || (playerY < 23 && cycle % 2 !== 0) ? 'ice-quake' : 'cryo-pincer';
    else if (sector === 7) {
      // Omega counters the approach angle chosen by the pilot.
      // Face: jaw; flank: claws; stern: tracking tentacles; heavy: hammer arms.
      const angle = Math.abs(Math.atan2(Math.sin(orbit), Math.cos(orbit)));
      kind =
        angle > 2.1
          ? 'tentacle-grab'
          : angle > 0.85
            ? 'claw-swipe'
            : robot || cycle % 3 === 2
              ? 'hammer-slam'
              : boosting || playerY >= 28 || cycle % 3 === 1
                ? 'tentacle-sweep'
                : 'bite';
    } else if (sector === 2)
      kind = boosting || (!flank && cycle % 3 !== 0) ? 'drill-ram' : 'drill-crosscut';
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
      (kind === 'bite' || kind === 'plasma-dive' || kind === 'ice-quake'
        ? 25
        : kind === 'cryo-pincer'
          ? 19
          : kind === 'hammer-slam'
            ? 22
            : kind === 'solar-sweep'
              ? 18
              : 16) +
      p * 3,
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
      kind === 'orion-gravity-pulse' ? 13 :
      kind === 'rok-pincer' || kind === 'drill-crosscut' ? 12 :
      kind === 'stingray-scissor' || kind === 'orion-iris-shear' || kind === 'rok-ram' ? 11 :
      kind === 'reactor-vent' || kind === 'plasma-dive'
        ? 13
        : kind === 'solar-sweep' || kind === 'cryo-pincer'
          ? 12
          : kind === 'ice-quake'
            ? 13
            : kind === 'tentacle-sweep'
              ? 11
              : kind === 'hammer-slam'
                ? 14
                : 9,
    origin:
      kind === 'rok-pincer' ? 'signature-rok-left'
      : kind === 'rok-ram' ? 'signature-rok-right'
      : kind === 'stingray-scissor' ? 'signature-stingray-tail'
      : kind === 'stingray-sting' ? 'signature-stingray-tail'
      : kind === 'drill-crosscut' || kind === 'drill-ram' ? 'signature-drill-bit'
      : kind === 'orion-gravity-pulse' || kind === 'orion-iris-shear' ? 'signature-orion-lens'
      : kind === 'reactor-vent'
        ? ventSide < 0
          ? 'port-drive-valve'
          : 'starboard-drive-valve'
        : kind === 'ice-quake'
          ? 'colossus-impact-plates'
          : kind === 'cryo-pincer'
            ? 'colossus-piston-arms'
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
  const footprint = bossExclusiveFootprint(intent.kind);
  if (footprint) {
    const radiusX = r * footprint.x;
    const radiusY = r * footprint.y;
    return footprint.type === 'rect'
      ? dx < radiusX && dy < radiusY
      : (dx / radiusX) ** 2 + (dy / radiusY) ** 2 < 1;
  }
  if (intent.kind === 'reactor-vent') return dx < r * 1.35 && dy < r * 1.1;
  if (intent.kind === 'tentacle-sweep') return dy < r && dx < r * 2.4;
  if (intent.kind === 'solar-sweep') return dy < r * 0.68 && dx < r * 2.5;
  if (intent.kind === 'plasma-dive') return Math.hypot(dx * 0.8, dy * 1.15) < r;
  if (intent.kind === 'ice-quake') return dx < r * 2.5 && dy < r * 0.55;
  if (intent.kind === 'cryo-pincer') return dx < r * 0.75 && dy < r * 1.75;
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
      intent.kind === 'reactor-vent' || intent.kind === 'plasma-dive' ||
      intent.kind === 'orion-gravity-pulse' || intent.kind === 'orion-iris-shear'
        ? windup * 0.4 + strike
        : 0,
    lunge:
      intent.kind === 'reactor-vent'
        ? 0
        : strike * (['bite', 'drill-ram', 'plasma-dive', 'rok-ram', 'stingray-sting'].includes(intent.kind) ? 72 : 48),
    jaw: intent.kind === 'bite' ? windup * 0.45 + strike * 0.9 : 0,
    claw:
      intent.kind === 'rok-pincer' ||
      intent.kind === 'stingray-scissor' ||
      intent.kind === 'drill-crosscut' ||
      intent.kind === 'claw-swipe' ||
      intent.kind === 'hammer-slam' ||
      intent.kind === 'solar-sweep' ||
      intent.kind === 'ice-quake' ||
      intent.kind === 'cryo-pincer'
        ? windup * 0.3 + strike * 0.85
        : 0,
    tentacle: intent.kind.startsWith('tentacle') ? windup * 0.2 + strike * 0.75 : 0,
  };
}
