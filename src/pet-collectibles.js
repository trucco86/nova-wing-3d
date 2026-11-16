// Stable IDs are intentional: existing local save files keep their collection counts.
export const PET_ITEMS = [
  {
    id: 'can',
    name: 'ATUM',
    care: 'food',
    points: 55,
    color: '#ffb365',
    perk: { type: 'xp', amount: 6 },
  },
  {
    id: 'treat',
    name: 'PEIXE',
    care: 'food',
    points: 45,
    color: '#71d8ed',
    perk: { type: 'shield', amount: 12 },
  },
  {
    id: 'toy',
    name: 'RATINHO',
    care: 'play',
    points: 40,
    color: '#7ecfff',
    perk: { type: 'energy', amount: 18 },
  },
  {
    id: 'litter',
    name: 'SACHÊ',
    care: 'food',
    points: 50,
    color: '#bca1e9',
    perk: { type: 'shield', amount: 20 },
  },
];
export function readPetCare(raw) {
  return Object.fromEntries(
    PET_ITEMS.map(({ id }) => {
      const value = raw?.[id];
      return [id, Number.isSafeInteger(value) && value >= 0 ? Math.min(999, value) : 0];
    }),
  );
}
export function collectPetItem(raw, id) {
  const item = PET_ITEMS.find((entry) => entry.id === id);
  if (!item) return null;
  const care = readPetCare(raw);
  care[id] = Math.min(999, care[id] + 1);
  return {
    care,
    points: item.points,
    message: item.name,
    category: item.care,
    audioCue: id,
    perk: { ...item.perk },
  };
}
