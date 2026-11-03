import { TROPHIES, PRIMARY_TROPHIES, TROPHY_TIERS, trophyProgress } from './trophy-catalog.js';
import { SECTORS } from './campaign.js';

export const TROPHY_STORAGE_KEY = 'nova-wing-trophies-v1';
const EMPTY_STATS = Object.freeze({
  clearSectors: [],
  bossSectors: [],
  hardSectors: [],
  primaryBossSectors: [],
  pilots: [],
  bestScores: {},
  points: 0,
  kills: 0,
  records: 0,
  cleanWins: 0,
  primaryBosses: 0,
  bombFreeWins: 0,
  fastWins: 0,
  mechaFinishes: 0,
  squadWins: 0,
  rings: 0,
  hardPerfect: 0,
  hardPrimary: 0,
});
const fresh = () => ({
  version: 1,
  unlocked: {},
  processed: [],
  stats: structuredClone(EMPTY_STATS),
});
const safePositive = (value) =>
  Number.isFinite(value) && value >= 0 ? Math.min(1_000_000, Math.floor(value)) : 0;
const validSector = (value) => Number.isInteger(value) && value >= 1 && value <= SECTORS.length;
const appendUnique = (values, value) => {
  if (!values.includes(value)) values.push(value);
};
const validIds = new Set(TROPHIES.map((definition) => definition.id));

export function readTrophies(storage) {
  try {
    const data = JSON.parse(storage?.getItem(TROPHY_STORAGE_KEY) ?? 'null');
    if (!data || data.version !== 1 || !data.stats || typeof data.stats !== 'object')
      return fresh();
    const state = fresh();
    for (const [key, value] of Object.entries(data.unlocked ?? {})) {
      if (validIds.has(key) && typeof value === 'string' && Number.isFinite(Date.parse(value)))
        state.unlocked[key] = value;
    }
    const raw = data.stats;
    for (const key of ['clearSectors', 'bossSectors', 'hardSectors', 'primaryBossSectors'])
      state.stats[key] = [...new Set(Array.isArray(raw[key]) ? raw[key].filter(validSector) : [])];
    state.stats.pilots = [
      ...new Set(
        Array.isArray(raw.pilots)
          ? raw.pilots.filter((id) =>
              ['bia', 'jenifer', 'christopher', 'bob', 'calvin'].includes(id),
            )
          : [],
      ),
    ];
    for (const key of [
      'points',
      'kills',
      'records',
      'cleanWins',
      'primaryBosses',
      'bombFreeWins',
      'fastWins',
      'mechaFinishes',
      'squadWins',
      'rings',
      'hardPerfect',
      'hardPrimary',
    ])
      state.stats[key] = safePositive(raw[key]);
    for (const [sector, score] of Object.entries(raw.bestScores ?? {}))
      if (validSector(Number(sector))) state.stats.bestScores[sector] = safePositive(score);
    state.processed = [
      ...new Set(
        Array.isArray(data.processed)
          ? data.processed.filter((id) => typeof id === 'string' && id.length < 140).slice(-512)
          : [],
      ),
    ];
    return state;
  } catch {
    return fresh();
  }
}

/** All rules evaluate only at verified stage completion; practice/QA never unlock. */
export function createTrophySystem({ storage, clock = () => new Date().toISOString() } = {}) {
  let state = readTrophies(storage);
  const list = () =>
    TROPHIES.map((definition) => ({
      ...definition,
      progress: trophyProgress(definition, state.stats, state.unlocked),
      target: definition.id === 'platinum' ? PRIMARY_TROPHIES.length : definition.target,
      unlockedAt: state.unlocked[definition.id] ?? null,
      points: TROPHY_TIERS[definition.tier].points,
    }));
  const summary = () => {
    const all = list();
    return {
      unlocked: all.filter((entry) => entry.unlockedAt).length,
      total: all.length,
      points: all.filter((entry) => entry.unlockedAt).reduce((s, t) => s + t.points, 0),
      platinum: !!state.unlocked.platinum,
    };
  };
  function record(event) {
    if (
      event?.type !== 'stage-finished' ||
      event.practice === true ||
      event.outcome !== 'cleared' ||
      !validSector(event.sector) ||
      typeof event.runId !== 'string' ||
      !event.runId ||
      event.runId.length > 139 ||
      state.processed.includes(event.runId)
    )
      return [];
    const stats = state.stats;
    appendUnique(stats.clearSectors, event.sector);
    if (event.bossDefeated) appendUnique(stats.bossSectors, event.sector);
    if (event.difficulty === 'hard') appendUnique(stats.hardSectors, event.sector);
    if (['bia', 'jenifer', 'christopher', 'bob', 'calvin'].includes(event.pilot))
      appendUnique(stats.pilots, event.pilot);
    const points = safePositive(event.points);
    const previousRecord = stats.bestScores[event.sector] ?? 0;
    if (previousRecord > 0 && points > previousRecord) stats.records++;
    if (points > previousRecord) stats.bestScores[event.sector] = points;
    stats.points += points;
    stats.kills += safePositive(event.kills);
    stats.rings += safePositive(event.rings);
    if (event.damageTaken === false) stats.cleanWins++;
    if (event.bombsUsed === false) stats.bombFreeWins++;
    if (event.bossDefeated && event.primaryOnly === true) {
      stats.primaryBosses++;
      appendUnique(stats.primaryBossSectors, event.sector);
      if (event.difficulty === 'hard') stats.hardPrimary++;
    }
    if (event.difficulty === 'hard' && event.damageTaken === false) stats.hardPerfect++;
    if (event.bossDefeated && event.mechaFinisher === true) stats.mechaFinishes++;
    if (event.squadSpecialUsed === true) stats.squadWins++;
    if (
      event.bossDefeated &&
      Number.isFinite(event.durationMs) &&
      event.durationMs > 0 &&
      event.durationMs <= SECTORS[event.sector - 1].duration * 1400
    )
      stats.fastWins++;
    state.processed.push(event.runId);
    state.processed = state.processed.slice(-512);
    const unlocked = [];
    for (const definition of TROPHIES) {
      if (state.unlocked[definition.id] || definition.id === 'platinum') continue;
      if (trophyProgress(definition, stats, state.unlocked) >= definition.target) {
        state.unlocked[definition.id] = clock();
        unlocked.push(definition);
      }
    }
    if (!state.unlocked.platinum && PRIMARY_TROPHIES.every((id) => state.unlocked[id])) {
      state.unlocked.platinum = clock();
      unlocked.push(TROPHIES.find((definition) => definition.id === 'platinum'));
    }
    try {
      storage?.setItem(TROPHY_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Offline volatile unlock is still visible in this session.
    }
    return unlocked;
  }
  const clearSession = () => {
    state = readTrophies(storage);
  };
  return { list, summary, record, clearSession };
}
