// QA166: the sector-3 PERFURADOR is already physically large and correct,
// but in portrait mode the 64-degree chase lens clips its silhouette behind
// the mobile HUD. Widen ONLY the portrait boss lens. Keep boss distance,
// actual collision sizes, weak points, gun muzzle mounts and damage unchanged.
export const ASTEROID_BOSS_PORTRAIT_FOV = 89;
export const ASTEROID_BOSS_PORTRAIT_ASPECT_LIMIT = 0.7;

export function asteroidBossPortraitFov(aspect) {
  if (!Number.isFinite(aspect) || aspect <= 0)
    throw new RangeError('Invalid asteroid camera aspect');
  return aspect < ASTEROID_BOSS_PORTRAIT_ASPECT_LIMIT ? ASTEROID_BOSS_PORTRAIT_FOV : null;
}
