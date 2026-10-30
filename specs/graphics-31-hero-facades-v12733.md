# Nova Wing Graphics 3.1 — Hero Facade Architecture (v1.27.33 QA)

## Visual reference

The user-provided cinematic City of Machines image is an aspirational reference. Graphics 3.1 specifically targets recognizable silhouettes, high-frequency architectural details, layered parallax and neon-lit megastructures that must hold up from the real chase camera. It does not reproduce the image as background.

## Implementation contracts

- 20 octagonal high-rise volumes with varying heights and lateral separation, 40 stepped crown segments, 80 mechanical exoskeleton ribs, 120 cyan illumination slits, 120 warm window bands, 20 holographic panels and 20 elevated skyport decks.
- Seven GPU-instanced batches per scenery tile. All assets are deterministic Three.js runtime meshes (no remote images or 3D models), with nonnegative scales and valid positions at least 105 world units from the centerline.
- New facade group lives in the near-only city High LOD: hidden on the far looping tile and omitted from Medium. Enabled only for the City of Machines; other themes do not acquire the art-directed city dressing.
- Existing wet reflective ground, PBR studio environment, fighter/machined geometry, cinematic city rail network and UI remain intact; no new gameplay collisions, AI, damage, controls, rankings or save changes.
- No visual metadata in the middle of the screen. The setting remains accessible under Options and persists.

## Validation criteria

- Reproducible build and 2MB static HTML budget, source lint and unit suite, CI browser checks on final SHA.
- Inspect in-browser High and Medium screenshot evidence from the first sector. Frame must preserve fighter silhouette, clear shot reticle, boss warning space and readability of the central flight corridor.
- Confirm geometry does not block the pilot or intersect the playable centerline during banking and city-to-orbit ascent.
- Measure real FPS and 95th-percentile frame-time after warmup for 30s in Desktop High (target 60 FPS) and Mobile Medium (target 30 FPS), not infer speed from CI.
- Keep PR in QA; no DEV/HML/production promotion without visual review and CI success.

## Limitations

This is an art-directed procedural architecture increment, not imported GLB models, ray-traced reflections or the user-supplied cinematic reference itself. To reach asset-level excellence, additional unique GLB hero buildings, optimized materials, facade texture atlases and licensed/created art remain necessary.
