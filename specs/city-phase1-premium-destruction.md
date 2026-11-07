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
