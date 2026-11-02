// Only contacts with actual generator volumes reveal armored weak points.
export const REVEAL_HITS = 3;
export function newWeakpointEvidence(parts = []) {
  return parts.map(() => ({ contacts: 0, revealed: false, recentDamage: 0 }));
}
export function recordWeakpointContact(evidence, index, dealt = 0) {
  const item = evidence?.[index];
  if (!item) return null;
  item.contacts = Math.min(99, item.contacts + 1);
  item.recentDamage = Math.max(0, Number.isFinite(dealt) ? dealt : 0);
  item.revealed = item.revealed || item.contacts >= REVEAL_HITS || item.recentDamage > 0;
  return item;
}
export function bossIntegrityRatio(parts, coreHp, coreMax) {
  const core = Math.max(0, Math.min(1, coreHp / Math.max(1, coreMax)));
  if (!parts?.length) return core;
  const remaining = parts.reduce(
    (total, part) => total + Math.max(0, Math.min(1, part.hp / Math.max(1, part.max))),
    0,
  );
  return Math.max(0, Math.min(1, (0.65 * remaining) / parts.length + 0.35 * core));
}
export function weakpointReadout(part, evidence, open) {
  if (!part || part.hp <= 0) return null;
  const percent = Math.ceil((100 * part.hp) / Math.max(1, part.max));
  if (open) return { label: 'FRACO · ' + percent + '%', state: 'open' };
  if (evidence?.revealed) return { label: 'BLINDADO · ORBITE', state: 'armored' };
  return null;
}
