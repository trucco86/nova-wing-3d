# City Phase 1 — Urban Destruction and Concept-Premium Skyline

## Approved concept alignment

The source reference is “Corrida Nova Wing sob a Lua Gigante.png”: a long, reflective technological avenue; densely staggered skyscrapers with readable volume and lit windows; blue-cyan and amber lane lighting; tall projected adverts; overhead crossings and a train on a suspension guideway; numerous aircraft in the mid-background; a layered urban vanishing point. The user has approved the original phases 1 and 2, so these are additive events, not a replacement of the city layout or gameplay.

## Integration status and scope

The old city layers already provided trains, billboards, traffic and a deep skyline, but their static architecture was visual-only; orbital debris templates were not a credible source of crashed urban objects. This candidate adds **one authored, deterministic, stage-1-only destructible sequence**, without creating objects per-frame.

- Urban billboard: detaches at 4.2 seconds, falls and rests on roadway-height floor.
- Hovercar: loses altitude at 8 seconds, hits ground with a layered glow/shockwave.
- Facade: architectural section collapses at 11.4 seconds, with an oriented conservative AABB after landing.
- Maglev: at 15.3 seconds one carriage tears free and hangs partly over the right side of the roadway, secured by a visible strut, physically avoidable by the left lane. Both projectiles and player can intersect its visible collider.
- VFX: one preallocated flash, shockwave and 18-spark instanced burst for each impact. No explosions spawn materials or emit meshes every frame.
- Ground clamp: support-point height of the rotated AABB must always be `>= -7` (terrain top); analytically calculated motion avoids the previous floor-penetration bug even when frame rate changes. Negative vertical rebound is forbidden.
- Scenic objects travel with the same speed as the city, but are **not parented to its repeating road tiles**. No teleports or materialization into the ground when the tile loops.
- Collision is a swept sphere/AABB vs. moving rubble, using the same `crossesSolid` routine as existing obstacles. Hits apply the standard damage/invulnerability rules. Projectile impacts are occluded by the actual visible wreck. Avoid invisible colliders before the scripted event.
- Present for city sector only. Hide progressively during orbital ascent; no collision in other sectors. Pause and restart preserve deterministic state.
- Skyline: another batch of multi-depth, physically volumetric towers with architectural glazing, lit crowns and bright windows; 3 elevated bridge layers and owned Nova Wing/AERORAIL/ORBITAL ads; side towers remain outside central flight corridor. Only two extra high-detail instanced materials in quality Alto, without additional per-frame scene instantiation.

## Acceptance gates

- Node regression: debris stays above the support plane for 30/60/120 Hz, nonintersecting debris, pause and restart, impact FX life cycle, ground train collider matches the rendered carriage and left dodge lane is open, concept tower gap and optional visual quality.
- Browser: in-game stage 1 from start to before mandatory boost; verify early billboard, car, facade and maglev events, no clipping through road, screenshot and GPU no error in desktop and mobile.
- Hardware: inspect from chase mode at 30/60 FPS, benchmark the critical frames during 4.2/8/11.4/15.3s destruction against baseline. Software WebGL tests are not a substitute for real-device FPS.
- No PR merge and no production deploy without visual QA approval. Phase 2 and other stages must retain their approved geometry and progression.

## Future increments (not claimed as done)

- Destructible building bays fully driven by projectile hits, localized damage decals and multiple persistent destruction states.
- More detailed animation for the damaged suspended maglev and interactive wreck components, with bounded simulation cost.
- Wet pavement/metal/glazing physically-based reflections tuned against actual image comparison, with a low-cost fallback for mobile.

## Collision integrity follow-up — ship passing through scenery (v1.27.68)

A reported defect was verified in source: the previous stage-1 rubble collision merely called `hit(26)`; invulnerability/dash/roll could suppress damage, but neither result prevented the ship from ending inside the rendered mesh. Only maglev and facade had physical volumes, while roadside guardrails and generic city obstacles still used damage-only checks. The original stage-1 dynamics were not a true solid collision system.

**Corrective rules**

- Every falling authored billboard, hovercar, facade and suspended maglev has a real collider. Previous and current XYZ positions are recorded so scenery scrolling and falling are included in the relative sweep.
- Resolve the ship's swept path against fighter-sized expanded AABBs. The collision response _moves the ship outside the obstacle_ onto the entry-side lane, or above/below the hazard if a side is unavailable; never merely call `hit()`. Damage and screen effects remain independent, so temporary invulnerability or robot dash does not produce phasing.
- Reuse identical solver for existing stage-1 gantries/reactors. The city avenue has physical side constraints before ascent: visible guardrails at x=±47 imply ship-center limit ±36 with room for wings. Outside city/ascent the previous flight arena is restored.
- Do not inject new GPU/physics geometry on the frame hot path. Use a single scratch hazard and reuse city hazard arrays. No array allocations in per-axis sweep.
- Tests must establish actual final position outside solid at different frame rates, moving obstacle CCD, dash/boost tunneling, wall response, and pause/reset; the prior assertion that damage changed alone is insufficient.

**Validation status:** code and tests are candidate only until full Node and WebGL CI, physical mobile visual review and comparison to the approved concept. The previous v1.27.67 cannot be classified as collision-complete.

## Freedom of flight / object-only collision — revised V1.27.69

- Reverted unintended `x=±36` global avenue clamp from 1.27.68. The existing 3D pilot area remains `x=±72`, consistently across the city and later phases.
- **Collision never applies to empty air.** Only visible meshes with localized actual solid volume can block the player; the hard global air wall has been removed.
- Existing collision solver continues to sweep between prior and next positions to avoid passing through actual geometry during dash, boost and invulnerability; its lane fallback may use the full 72 units instead of assuming a 36-unit road.
- City solid shapes added from **visible geometry**: roadside guardrails have low y support only (ship can fly _over_ them at standard altitude), elevated guideways block only when pilot reaches their physical height, overpass support columns obstruct only their local x/y/z footprint when high-quality meshes are actually visible, and the maglev moves with its rendered carriage. No fake full-height corridor boundary; graphics Medium omits high-only pillar and west train colliders.
- Cached transforms track the actual 1,900-unit city tile loop and maglev wrap. Discontinuities reset sweep history to avoid teleporting phantom collision planes. All colliders and their arrays are created once, outside the update loop.
- Added two _localized_ shootable side-facade bays in stage 1. Repeated projectile impacts change persistent crack/exposed-core visuals; destruction results in grounded falling masonry and a pooled flash/smoke/impact wave. Their collision footprint remains limited to the visible bays and rubble.
- Regression tests: east and west navigation past ±36 to the original area; crossing x47 above low rail versus hitting it at ground height; actual obstacle avoidance versus empty air; high-quality columns only when rendered; moving train and wrapping stage; projectile/local bay damage and persistent grounded destruction.
- **Release only after CI browser/Desktop/Mobile plus hardware FPS and visual sign-off.** Stage-1 exploration may not be reduced by a global collision volume again.
