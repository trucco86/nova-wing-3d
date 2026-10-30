# P0 — Graphics 5.0: premium readability, PBR material fidelity, no double-hull

**User priority (30/10/2026):** maximum focus on visual fidelity to the reference concept. This overrides _new_ mechanic ideas as planning priority; safety, gameplay P0 regressions, QA and production guards remain mandatory.

## Vertical slice 1 — actual source changes

- On High, the continuous sculpted hero-fighter hull **replaces** the visible low-poly fuselage, rather than being layered on top of it. Keep engine flames and glows, weapon mechanics and true collision untouched.
- On Medium, the former playable model is visible, and all hero premium pieces remain hidden.
- Both gameplay and hangar 360° use the same switch; transitions to and from mecha and stage resets must restore the appropriate model with no floating parts.
- The hero-fighter and mecha receive deterministic reusable normal maps and roughness maps on PBR surfaces: three material finishes (painted armor, dark ceramic, brushed titanium), non-flat surface detail, UV tiling, and no external network dependency. Texture data < 0.5 MiB across finishes (uncompressed).
- Profile GPU on real browser hardware; visual quality cannot be declared 'AAA' from tests alone.

## Acceptance and gates

- Unit tests: model replacement vs stacked geometry, thruster visibility, three hull variants, mecha rig and stage transition contracts, shared textures, finite and nonuniform normals/roughness, paint customization.
- Release: v1.27.29; deterministic generated HTML and complete CI (quality + four Playwright shards), source repair and isolated Cloudflare preview, then desktop/mobile visual sign-off.
- Visual compare: matched 3/4, top and rear hangar shots; 30 s High vs Medium chase-camera session with FPS report on desktop and mobile landscape.
- No modifications in main, dev or hml until validated.

## Next P0 slices — not done by this change

1. Art-directed **authorial GLB/glTF models** for main fighter, mecha, flagship, and each boss with separate LOD0/1/2 and consistent scale/origin, validated and budgeted offline.
2. Real high-resolution UV atlas, baked normal/ORM, damage wear, emissive, metal/roughness and optional detail decals from original/licensed artwork.
3. Lighting and composition pass (environment/HDR IBL, volumetric feel, non-destructive highlights), cinematic VFX (thruster, plasma, explosion), unique environment landmarks by sector.
4. Automated screenshot comparisons, GPU/frame-time baselines and deliberate High/Medium performance targets. Graceful fallbacks in WebGL; never promise native-like quality at arbitrary mobile FPS.

**Honesty gate:** the current PBR generated textures and geometry do not have the same art direction/detail as the provided concept. They are a quality stepping stone; full asset production is a distinct workstream.
