export const PET_ITEMS = [
  { id: 'can', name: 'LATINHA', care: 'food', points: 15, color: '#ffb365' },
  { id: 'treat', name: 'PETISCO', care: 'food', points: 10, color: '#f5cb7d' },
  { id: 'toy', name: 'BRINQUEDO', care: 'play', points: 20, color: '#7ecfff' },
  { id: 'litter', name: 'AREIA', care: 'hygiene', points: 15, color: '#bca1e9' },
];
export function readPetCare(raw) {
  return Object.fromEntries(PET_ITEMS.map(({ id }) => {
    const value = raw?.[id];
    return [id, Number.isSafeInteger(value) && value >= 0 ? Math.min(999, value) : 0];
  }));
}
export function collectPetItem(raw, id) {
  const item = PET_ITEMS.find((entry) => entry.id === id);
  if (!item) return null;
  const care = readPetCare(raw);
  care[id] = Math.min(999, care[id] + 1);
  return { care, points: item.points, message: item.name, category: item.care, audioCue: id };
}
