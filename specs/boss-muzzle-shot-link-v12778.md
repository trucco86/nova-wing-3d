# Boss shot readability 2.0 — Nova Wing v1.27.78 (QA)

## Player problem
Muzzle geometry, shot trails and charge rings can be visually obscured by the boss model and busy mobile HUD, even though physical hardpoint origin tests pass. The player must follow *muzzle → flash → projectile* through actual 3D play.

## VFX solution
1. Enlarge **real** cannon mouth and armor collar for ten bosses without moving the hardpoints, weak points, cameras or damage volumes.
2. Show an additive color halo only when actual charge > 15%, and a bright brief white-gold muzzle burst when that cannon fires.
3. Add a shared, pooled **0.42-second line** between the actual world-space muzzle at release and the boss bolt. The link follows the bolt each simulation frame; its geometry is length/orientation derived from `shot.launchOrigin` and `shot.o.position`, not an invented graphic origin.
4. No beam remains after 0.42s; no permanent particle or full-screen indicator. Preserve existing projectile speed, homing/arcane targeting, hit volumes, damage, cadence and max pool budget.
5. Destroyed batteries never show glow/flash/links; central emergency cannon is enabled only when both battery generators are gone.
6. No changes to approved stage geometry, stage 8 Saturn/orbit logic, the RPG panel or existing boss melee AI.

## Test coverage
- Node: 10 boss hardpoints, no dead weapon glow, pooled life cycle of transient link and normal-bullet reuse, true 3D midpoint/orientation.
- Browser: Omega and Europa QA fights, desktop and mobile, only accept a real active `bossShotLinks` sample if a rendered connection truly links source/projectile, capture screenshot.
- Manual: portrait 390×844 and landscape 844×390 on iPhone physical. Compare precharge, charge, release, postrelease; inspect high-/medium-quality FPS and thermal behavior.
- Optional follow-up: reduce competing QA HUD/Berserk overlays during action (separate menu issue, not part of this visual slice).

## Production gate
Draft, stacked on #266 and original #265/#262 changes; keep production unchanged until CI, Playwright and real-device visual approval.
