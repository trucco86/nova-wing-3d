// Local guest/offline history. Independent of the campaign checkpoint and Google identity.
// Remote scores are recorded separately and labeled provisional until anti-cheat exists.
export const HISTORY_STORAGE_KEY = 'nova-wing-score-history-v1';
const MAX_ENTRIES = 100;

export function readLocalHistory(storage) {
  try {
    const value = JSON.parse(storage?.getItem(HISTORY_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (entry) =>
          typeof entry.id === 'string' &&
          entry.id.length < 100 &&
          Number.isInteger(entry.sector) &&
          entry.sector >= 1 &&
          entry.sector <= 10 &&
          Number.isInteger(entry.points) &&
          entry.points >= 0 &&
          entry.points <= 1000000 &&
          Number.isInteger(entry.durationMs) &&
          entry.durationMs >= 0 &&
          entry.durationMs <= 7200000 &&
          typeof entry.completedAt === 'string' &&
          Number.isFinite(Date.parse(entry.completedAt)),
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function recordLocalResult(storage, entry) {
  const candidate = {
    id: entry.id,
    sector: entry.sector,
    points: entry.points,
    durationMs: entry.durationMs,
    completedAt: entry.completedAt,
  };
  if (readLocalHistory({ getItem: () => JSON.stringify([candidate]) }).length !== 1) return false;
  try {
    const previous = readLocalHistory(storage);
    if (previous.some((item) => item.id === candidate.id)) return true;
    storage?.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([candidate, ...previous].slice(0, MAX_ENTRIES)),
    );
    return !!storage;
  } catch {
    return false;
  }
}

export function localScoreSummary(storage) {
  const history = readLocalHistory(storage);
  return {
    count: history.length,
    best: history.reduce((max, entry) => Math.max(max, entry.points), 0),
    total: history.reduce((sum, entry) => sum + entry.points, 0),
  };
}
