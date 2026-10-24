export const XP_STAGES = [0, 8, 24, 52, 96, 160, 250, 370, 530, 740];
export const ARSENAL = [
  { name: 'PULSO', element: 'kinetic', color: '#62ffe0', stage: 0, cadence: 0.135, damage: 1 },
  { name: 'GEADA', element: 'ice', color: '#82dfff', stage: 2, cadence: 0.22, damage: 1.2 },
  { name: 'PLASMA', element: 'fire', color: '#ff994a', stage: 4, cadence: 0.25, damage: 1.6 },
  { name: 'ARCANO', element: 'arcane', color: '#c57bff', stage: 6, cadence: 0.3, damage: 1.3 },
  { name: 'VAZIO', element: 'void', color: '#f15aca', stage: 8, cadence: 0.36, damage: 2.2 },
];
export const SPECIALS = [
  { name: 'BARREIRA', stage: 0, cost: 30 },
  { name: 'NOVA', stage: 3, cost: 55 },
  { name: 'ESTASE', stage: 5, cost: 65 },
];
export const xpForStage = (n) => (n < 10 ? XP_STAGES[n] : 740 + 250 * (n - 9) + 30 * (n - 9) ** 2);
export const stageAt = (xp) =>
  xp < 740
    ? XP_STAGES.reduce((n, threshold, i) => (xp >= threshold ? i : n), 0)
    : 9 + Math.floor((-250 + Math.sqrt(62500 + 120 * (xp - 740))) / 60);
export const specialtyRank = (xp, specialty, branch) =>
  stageAt(xp * (specialty === branch ? 1.4 : 1));
export function progressionBenefits(xp, specialty = 'attack') {
  const level = stageAt(xp);
  const branch = (name) => specialtyRank(xp, specialty, name);
  return {
    attack: Math.round(
      ((1 + branch('attack') * 0.12) * (specialty === 'attack' ? 1.15 : 1) - 1) * 100,
    ),
    shield: branch('defense') * 3 + (specialty === 'defense' ? 25 : 0),
    agility: Math.min(30, level) * 3,
    arcana: Math.round(
      ((1 + branch('spirit') * 0.025) * (specialty === 'spirit' ? 1.3 : 1) - 1) * 100,
    ),
  };
}
export function nextRpgUnlock(level) {
  const candidates = [
    ...ARSENAL.slice(1).map((item) => ({ type: 'ARMA', name: item.name, stage: item.stage })),
    ...SPECIALS.slice(1).map((item) => ({ type: 'ESPECIAL', name: item.name, stage: item.stage })),
  ]
    .filter((item) => item.stage > level)
    .sort((a, b) => a.stage - b.stage || a.type.localeCompare(b.type));
  return candidates[0] ?? null;
}
export function readStrategy(value) {
  const valid = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  const xp = valid(value?.xp, Number.MAX_SAFE_INTEGER) ? value.xp : 0;
  const stage = stageAt(xp);
  return {
    xp,
    specialty: ['attack', 'defense', 'spirit'].includes(value?.specialty)
      ? value.specialty
      : 'attack',
    arsenal: valid(value?.arsenal, 4) && ARSENAL[value.arsenal].stage <= stage ? value.arsenal : 0,
    special: valid(value?.special, 2) && SPECIALS[value.special].stage <= stage ? value.special : 0,
  };
}
export const weaknessAt = (index, phase = 1) =>
  ARSENAL[(index + phase - 1) % ARSENAL.length].element;
export const elementalDamage = (amount, element, weakness) =>
  amount * (element === weakness ? 1.5 : 1);
export const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
// The camera/player frame stays stable; orbit rotates the boss and existing projectiles.
export function weakPointOpen(angle, index = -1) {
  return (
    angleDistance(angle, index < 0 ? 0 : index === 0 ? -Math.PI / 3 : Math.PI / 3) <
    (index < 0 ? 0.85 : 0.8)
  );
}
