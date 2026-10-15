export const SKINS = [
  { id: 'classic', name: 'POLAR', color: '#d8e6ef', accent: '#122d50', price: 0, hits: 0 },
  { id: 'ember', name: 'BRASA', color: '#fa663d', accent: '#421e29', price: 120, hits: 0 },
  { id: 'aurora', name: 'AURORA', color: '#46e5b0', accent: '#0c4458', price: 180, hits: 0 },
  { id: 'nebula', name: 'NEBULOSA', color: '#b385ff', accent: '#35225e', price: 260, hits: 50 },
  { id: 'solar', name: 'SOLAR', color: '#ffcc65', accent: '#52341c', price: 400, hits: 150 },
];
export function readCosmetics(data) {
  const owned = SKINS.filter(
    (s) => s.id === 'classic' || (Array.isArray(data?.owned) && data.owned.includes(s.id)),
  ).map((s) => s.id);
  return { owned, skin: owned.includes(data?.skin) ? data.skin : 'classic' };
}
export function skinPurchase(profile, id, credits, hits) {
  const skin = SKINS.find((s) => s.id === id);
  if (!skin || (!profile.owned.includes(id) && (credits < skin.price || hits < skin.hits)))
    return null;
  return {
    owned: [...new Set([...profile.owned, id])],
    skin: id,
    credits: credits - (profile.owned.includes(id) ? 0 : skin.price),
  };
}
