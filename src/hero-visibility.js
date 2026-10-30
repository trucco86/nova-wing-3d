/**
 * Graphics High must replace the old flat craft, not stack a sculpted craft on
 * top of its low-poly ancestor. Preserve engine flames and billboard exhaust.
 * Accept the snapshot of legacy player parts (taken before adding the mecha)
 * rather than traversing the live player, so weapon/robot rigs remain untouched.
 */
export function setHeroFighterVisuals(legacyParts, shipModule, quality, shipVisible = true) {
  const hero = shipModule?.getObjectByName('hero-fighter-hull');
  const premium = shipModule?.getObjectByName('premium-ship-details');
  if (!hero) return false;
  const high = quality === 'high';
  hero.visible = high;
  if (premium) premium.visible = high;
  shipModule.visible = shipVisible;
  for (const part of legacyParts) {
    if (part === shipModule || !part.parent) continue;
    const exhaust =
      part.name === 'flame' ||
      part.isSprite ||
      (part.isMesh && part.material?.isMeshBasicMaterial && part.position.z > 2.3);
    part.visible = shipVisible && (!high || exhaust);
  }
  // Preserve RPG progression neons at their actual upgrade tier, as managed
  // by setFighterEvolution. The root shipModule hides everything in mecha mode.
  for (const part of shipModule.children) {
    if (part === hero || part === premium || part.name.startsWith('ship-evolution-neon-'))
      continue;
    part.visible = !high;
  }
  return true;
}
