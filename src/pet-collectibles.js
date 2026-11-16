// Only cat-relevant pickups. Retain the legacy 'can' save key for tuna tins.
export const PET_ITEMS = Object.freeze([
  { id: 'can', name: 'ATUM', care: 'food', points: 30, effect: 'shield', amount: 12, color: '#ffb365' },
  { id: 'fish', name: 'PEIXE', care: 'food', points: 24, effect: 'energy', amount: 22, color: '#83dfff' },
  { id: 'pouch', name: 'SACHÊ', care: 'food', points: 28, effect: 'shield', amount: 18, color: '#f6a5ca' },
  { id: 'treat', name: 'PETISCO', care: 'food', points: 14, effect: 'energy', amount: 12, color: '#f5cb7d' },
  { id: 'toy', name: 'BOLINHA', care: 'play', points: 20, effect: 'xp', amount: 6, color: '#7ecfff' },
  { id: 'catnip', name: 'ERVA-DO-GATO', care: 'play', points: 26, effect: 'arcana', amount: 18, color: '#9fe9a1' },
]);
const LEGACY_SAVE_IDS = ['litter'];
export function readPetCare(raw) {
  return Object.fromEntries(
    [...PET_ITEMS.map(({ id }) => id), ...LEGACY_SAVE_IDS].map((id) => {
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
    effect: item.effect,
    amount: item.amount,
    audioCue: item.id,
  };
}
