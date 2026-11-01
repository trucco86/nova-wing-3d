import { ARSENAL, SPECIALS, xpForStage } from './strategy.js';
import { SHIP_MODELS } from './pilots.js';

// Disposable QA only. These loadouts reuse the real game progression system.
export const QA_EVOLUTION_STAGES = Object.freeze([0, 3, 6, 9, 12, 18]);
export function developerLabLoadout(tier, ship, arsenal, special) {
  const level = Number(tier);
  const weapon = Number(arsenal);
  const spell = Number(special);
  if (
    !QA_EVOLUTION_STAGES.includes(level) ||
    !SHIP_MODELS.some((s) => s.id === ship) ||
    !Number.isInteger(weapon) || weapon < 0 || weapon >= ARSENAL.length ||
    !Number.isInteger(spell) || spell < 0 || spell >= SPECIALS.length
  ) return null;
  const xp = xpForStage(level);
  // Even level 0 can inspect the complete arsenal via a lab-only bonus stage;
  // never leak these unlocks into ordinary campaign checkpoints.
  const unlockedXp = Math.max(xp, xpForStage(ARSENAL[weapon].stage), xpForStage(SPECIALS[spell].stage));
  return {
    level: Math.max(level, ARSENAL[weapon].stage, SPECIALS[spell].stage),
    xp: unlockedXp,
    ship,
    arsenal: weapon,
    special: spell,
    weaponLevel: Math.min(5, Math.floor(level / 3) + 1),
    pods: level >= 6 ? 3 : level >= 3 ? 2 : 1,
    armor: Math.min(4, Math.floor(level / 3)),
    volley: level >= 6 ? 2 : level >= 3 ? 1 : 0,
    rapid: level >= 6 ? 2 : level >= 3 ? 1 : 0,
    scatterOwned: true,
    bombs: 8,
  };
}
