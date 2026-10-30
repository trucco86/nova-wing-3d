# Nova Wing Graphics 3.0 — Wet Neon City Vertical Slice (v1.27.32 QA)

## Visual brief / reference

The user-approved image of a fighter flying through a high-density, illuminated futuristic city is an **art-direction target**, not a real gameplay screenshot. This slice prioritizes its biggest missing foreground element: a richly surfaced wet roadway with reflections, distinct light bands, believable depth, steam and supporting structures.

## Implementation

- The existing terrain ShaderMaterial preserves all original ocean/ice behavior. A new city-only fragment branch (uniforms `cityWet`, `premiumWet`) draws 6x12 world-unit dark metal panels, joints, pooled wetness and procedural surface micro-variation.
- City-only **High** renders warped blue/cyan longitudinal reflections, smaller warm streaks suggesting distant window illumination and restrained wet specular glints. This is an analytic approximation of light reflected off panels, not SSR or ray tracing.
- Real near-ground neon guide rails and amber inlays are batched with instanced meshes, aligned with the scrolling city tile.
- Side architectural posts, light beacons and 44 alpha-textured steam cards add depth beyond the playable corridor. A 32x32 procedural transparent texture is embedded in source; no remote asset or video.
- High-only group on the near city tile; the duplicate far tile retains its distant architecture, without wet street dressing. Medium keeps the original shader baseline. On ocean/space/ice the city-only high branch is disabled.
- Steam moves gently while playing and stops during pause; all additions are decorative, not collision bodies, shots, enemies or interactive objects.

## QA gates

- Prepare v1.27.32, format, build:check, lint, source tests and all four browser shards on final SHA.
- New browser test captures **actual rendered** High and Medium frames from the live dynamic first sector, and rejects WebGL shader compilation errors. Compare captures with concept, not vice versa.
- Test urban ascent city disappearance; 1366x768 desktop, 844x390 landscape, 390x844 portrait; play/pause, robot transformation, aiming and mobile HUD must remain visible and unobstructed.
- Measure FPS and p95 frame-time on real desktop and mobile for 30 seconds. 60 FPS desktop / 30 FPS mobile are targets pending measured evidence.
- On the prior v1.27.31, an existing end-to-end subboss test timed out at 180s after taking 192s on an emulated software-rendered runner. Its timeout is now 240s with all assertions intact; no skip or weakening of behavior validation.

## Gaps

This is a wet-road and atmosphere vertical slice, **not** full matching of the concept. Professional GLB vehicles/buildings, high-detail modular facades, offline light baking, selective lens bloom, texture compression, carefully authored sky composition and optimized LOD remain to reach the target aesthetic. Not approved for DEV/HML/PROD until QA and human visual inspection.
