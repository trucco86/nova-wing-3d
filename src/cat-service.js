import {
  CAT_MEDALS,
  CAT_RANKS,
  PILOT_IDS,
  catRankForPoints,
  catUniformForRank,
  squadRankForPoints,
} from './cat-rank-catalog.js';
import { SECTORS } from './campaign.js';

export const CAT_SERVICE_STORAGE_KEY = 'nova-wing-five-cats-service-v1';
const MAX_POINTS = 10000000;
const clampInt = (value, max = 1000000) =>
  Number.isInteger(value) && value >= 0 ? Math.min(max, value) : 0;
const uniqueSectors = (values) => [
  ...new Set(
    Array.isArray(values)
      ? values.filter((s) => Number.isInteger(s) && s >= 1 && s <= SECTORS.length)
      : [],
  ),
];
const freshPilot = () => ({
  points: 0,
  wins: 0,
  bossSectors: [],
  clearSectors: [],
  primaryBossWins: 0,
  cleanWins: 0,
  records: 0,
  fastWins: 0,
  hardWins: 0,
  mechaWins: 0,
  squadWins: 0,
  marvinWins: 0,
  kills: 0,
  rings: 0,
  medals: [],
});
const fresh = () => ({
  version: 1,
  pilots: Object.fromEntries(PILOT_IDS.map((id) => [id, freshPilot()])),
  processed: [],
});

function readPilot(input) {
  const pilot = freshPilot();
  if (!input || typeof input !== 'object') return pilot;
  for (const key of [
    'points',
    'wins',
    'primaryBossWins',
    'cleanWins',
    'records',
    'fastWins',
    'hardWins',
    'mechaWins',
    'squadWins',
    'marvinWins',
    'kills',
    'rings',
  ])
    pilot[key] = clampInt(input[key], key === 'points' ? MAX_POINTS : 1000000);
  pilot.bossSectors = uniqueSectors(input.bossSectors);
  pilot.clearSectors = uniqueSectors(input.clearSectors);
  pilot.medals = [
    ...new Set(
      Array.isArray(input.medals)
        ? input.medals.filter((id) => CAT_MEDALS.some((m) => m.id === id))
        : [],
    ),
  ];
  return pilot;
}

export function readCatService(storage) {
  try {
    const data = JSON.parse(storage?.getItem(CAT_SERVICE_STORAGE_KEY) ?? 'null');
    if (!data || data.version !== 1) return fresh();
    return {
      version: 1,
      pilots: Object.fromEntries(PILOT_IDS.map((id) => [id, readPilot(data.pilots?.[id])])),
      processed: [
        ...new Set(
          Array.isArray(data.processed)
            ? data.processed.filter((id) => typeof id === 'string' && id.length <= 139).slice(-512)
            : [],
        ),
      ],
    };
  } catch {
    return fresh();
  }
}

const withinTargetTime = (event) =>
  Number.isFinite(event.durationMs) &&
  event.durationMs > 0 &&
  event.durationMs <= SECTORS[event.sector - 1].duration * 1400;

function specialtyBonus(id, event, { fast, record }) {
  if (id === 'bia' && (event.bossDefeated || event.squadSpecialUsed)) return 22;
  if (id === 'jenifer' && (record || (event.primaryOnly && event.bossDefeated))) return 22;
  if (id === 'christopher' && (event.mechaFinisher || event.difficulty === 'hard')) return 22;
  if (id === 'bob' && (fast || event.damageTaken === false)) return 22;
  if (id === 'calvin' && (event.squadSpecialUsed || (event.trophiesUnlocked ?? 0) > 0)) return 22;
  return 0;
}

/** Achievement points are not convertible to Credits, RPG XP or battle buffs. */
export function servicePoints(event) {
  const fast = withinTargetTime(event);
  const record = event.newRecord === true;
  const base =
    70 +
    Math.min(140, clampInt(event.kills, 500) * 2) +
    Math.floor(Math.min(1000, clampInt(event.points, 1000000)) / 10) +
    Math.min(24, clampInt(event.rings, 1000)) +
    (event.bossDefeated === true ? 55 : 0) +
    (event.damageTaken === false ? 25 : 0) +
    (event.difficulty === 'hard' ? 30 : 0) +
    (fast ? 20 : 0) +
    (record ? 22 : 0) +
    (event.primaryOnly && event.bossDefeated ? 18 : 0) +
    (event.mechaFinisher && event.bossDefeated ? 12 : 0) +
    (event.squadSpecialUsed ? 12 : 0) +
    Math.min(5, clampInt(event.trophiesUnlocked, 100)) * 10;
  return base + specialtyBonus(event.pilot, event, { fast, record });
}

export function createCatService({ storage } = {}) {
  const state = readCatService(storage);
  const pilotView = (id) => {
    if (!PILOT_IDS.includes(id)) return null;
    const pilot = state.pilots[id];
    const rank = catRankForPoints(pilot.points);
    const next = CAT_RANKS[rank.index + 1] ?? null;
    return {
      id,
      ...structuredClone(pilot),
      rank,
      uniform: catUniformForRank(rank.index),
      nextRank: next,
      untilNext: next ? Math.max(0, next.threshold - pilot.points) : 0,
      progress: next ? (pilot.points - rank.threshold) / (next.threshold - rank.threshold) : 1,
      medalsEarned: CAT_MEDALS.filter((medal) => pilot.medals.includes(medal.id)),
      medalsTotal: CAT_MEDALS.length,
    };
  };
  const roster = () => PILOT_IDS.map((id) => pilotView(id));
  const squad = () => {
    const points = PILOT_IDS.reduce((sum, id) => sum + state.pilots[id].points, 0);
    return { points, rank: squadRankForPoints(points), pilotCount: PILOT_IDS.length };
  };
  function record(event) {
    if (
      event?.type !== 'stage-finished' ||
      event.outcome !== 'cleared' ||
      event.practice === true ||
      !PILOT_IDS.includes(event.pilot) ||
      !Number.isInteger(event.sector) ||
      event.sector < 1 ||
      event.sector > SECTORS.length ||
      typeof event.runId !== 'string' ||
      event.runId.length < 1 ||
      event.runId.length > 139 ||
      state.processed.includes(event.runId)
    )
      return { accepted: false, points: 0, medals: [] };
    const pilot = state.pilots[event.pilot];
    const before = catRankForPoints(pilot.points);
    const earned = servicePoints(event);
    pilot.points = Math.min(MAX_POINTS, pilot.points + earned);
    pilot.wins++;
    pilot.kills += clampInt(event.kills);
    pilot.rings += clampInt(event.rings);
    if (!pilot.clearSectors.includes(event.sector)) pilot.clearSectors.push(event.sector);
    if (event.bossDefeated === true) {
      if (!pilot.bossSectors.includes(event.sector)) pilot.bossSectors.push(event.sector);
      if (event.primaryOnly === true) pilot.primaryBossWins++;
      if (event.mechaFinisher === true) pilot.mechaWins++;
      if (event.sector === 10) pilot.marvinWins++;
    }
    if (event.damageTaken === false) pilot.cleanWins++;
    if (event.newRecord === true) pilot.records++;
    if (withinTargetTime(event)) pilot.fastWins++;
    if (event.difficulty === 'hard') pilot.hardWins++;
    if (event.squadSpecialUsed === true) pilot.squadWins++;
    const medals = [];
    for (const medal of CAT_MEDALS) {
      const value = Array.isArray(pilot[medal.type]) ? pilot[medal.type].length : pilot[medal.type];
      if (value >= medal.target && !pilot.medals.includes(medal.id)) {
        pilot.medals.push(medal.id);
        medals.push(medal);
      }
    }
    const after = catRankForPoints(pilot.points);
    state.processed.push(event.runId);
    state.processed.splice(0, Math.max(0, state.processed.length - 512));
    try {
      storage?.setItem(CAT_SERVICE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Offline-only session state still works when persistent storage is blocked.
    }
    return {
      accepted: true,
      points: earned,
      id: event.pilot,
      rank: after,
      promotion: after.index > before.index ? { previous: before, current: after } : null,
      uniform: catUniformForRank(after.index),
      medals,
    };
  }
  return { pilotView, roster, squad, record };
}
