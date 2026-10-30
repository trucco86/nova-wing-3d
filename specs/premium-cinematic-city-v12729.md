# Graphics 2.3 — Cinematic City Composition (v1.27.29 QA)

## Player-facing objective

The previous graphics packages improved metal materials, skyline volume and LOD, but repeated boxes still made the City of Machines look procedural. This pass adds **readable new forms, vertical scale and moving civilization**, not just more neon.

## Visual changes

- Six mirrored pairs of tall, tapered hexagonal megastructures with independent crowns, fins, light bands and vertical exposed mechanical rails.
- Elevated transport lanes on both far sides of the rail-shooter corridor, with structural supports and cyan edge lighting.
- Eight independent commuter vehicles with warm windows moving along those elevated lanes. Motion is purely decorative and deterministic; it is neither an enemy nor a collision obstacle.
- GPU instancing: ten new mesh batches per tile. The far repeating tile keeps the structure in memory but does not draw this cinematic-only detail group. All instance centres are at least 70 world units horizontally from the route.
- High graphics toggles all new detail through the same Options screen; Medium removes the rendering cost.
- Compatible with existing City → Orbit transition: the landmarks belong to the city parent, which is hidden once the orbital horizon replaces the city.
- Static browser HTML, Three.js, keyboard, touch, progress, boss AI, FPS monitor and saves unchanged.

## Acceptance gates

- `npm run release:prepare -- 1.27.29`, `npm run format`, `npm run build`, `npm run validate`, and all four browser CI shards on the **final** commit.
- Verify all ten instanced batches, finite transform matrices, deterministic traffic animation/reset and corridor separation.
- Verify the central screen remains empty of HUD/decoration in portrait and landscape, with no collision intrusion during orbital ascent.
- Desktop High and Medium: capture real screenshot and frame-time after 30 seconds; repeat on 844×390 mobile landscape and 390×844 portrait.
- Preview in isolated PR; **no** DEV, HML or production promotion without visual acceptance.

## Explicit limitations

This pass adds authored 3D architectural silhouettes without yet importing GLB meshes, photogrammetry, baked GI or volumetric light. Do not treat reference concept art as a screenshot, and do not claim console-grade parity without real device tests.
