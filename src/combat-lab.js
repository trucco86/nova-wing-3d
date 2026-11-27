export const COMBAT_LAB_FIELDS = Object.freeze({
  superDamage: { base: 3.6, min: 1, max: 6, step: 0.1 },
  counterDamage: { base: 1.35, min: 1, max: 2, step: 0.05 },
  counterSeconds: { base: 4.5, min: 2, max: 10, step: 0.5 },
  shieldDuration: { base: 1, min: 0.5, max: 2, step: 0.1 },
  stasisDuration: { base: 1, min: 0.5, max: 2, step: 0.1 },
});

export function createCombatLab(allowed) {
  const selected = new Map();
  return {
    select(key, value) {
      const field = COMBAT_LAB_FIELDS[key];
      if (!allowed || !Object.hasOwn(COMBAT_LAB_FIELDS, key) || !Number.isFinite(value))
        return false;
      if (value < field.min || value > field.max) return false;
      selected.set(key, value);
      return true;
    },
    resolve(key, qaSession) {
      return allowed && qaSession && selected.has(key)
        ? selected.get(key)
        : COMBAT_LAB_FIELDS[key].base;
    },
    snapshot: () => Object.fromEntries(selected),
    reset: () => selected.clear(),
  };
}
