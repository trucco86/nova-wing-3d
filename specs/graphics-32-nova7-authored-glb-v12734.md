# Graphics 3.2 — NOVA-7 Authored GLB Hero Asset (v1.27.34 QA)

## Visual intent

The approved City of Machines image remains an art-direction reference. The immediate bottleneck is the hero fighter's close-up geometry. This version introduces a **real glTF 2.0 / GLB asset**, not another procedural overlay built during every gameplay frame.

## Implementation contract

- `npm run assets:prepare` uses a deterministic Node-only GLB exporter to author the NOVA-7 fighter as 24-segment variable-section fuselage, high-res canopy, dual volumetric swept wings, rear engine barrels, detailed rings, lateral armor, vents and luminous accents.
- Six named glTF physically based materials: selectable player paint, graphite, titanium, optical canopy, cyan emitter and amber emitter. Batch as six GLB mesh primitives rather than one mesh per accent/bolt.
- Embed `src/assets/nova7-hero.glb.base64` in the generated static `index.html`. Browser offline startup and Cloudflare preview still require only one HTML artifact; no remote model/CDN/texture fetch.
- **High only** lazily decodes glTF via `GLTFLoader.parse` for NOVA-7. While it loads, or if it fails, retain the previous sculpted fighter. Once ready, hide the prior sculpted overlay, inherit player paint and safely dispose materials on replacement or exit.
- Other ship classes remain on their prior models, as does all Medium rendering.
- No changes to collisions, aiming, boss AI, combat, boost physics, story, HUD, mobile touch, ranking, login or saves.

## QA and review

- The asset tests validate GLB binary header, glTF version, binary chunk lengths, every accessor range, material names and triangle budget.
- Playwright proves real in-browser GLB load reaches ready in High, checks Medium fallback and captures _real_ render frames in both modes.
- `assets:prepare`, `release:prepare -- 1.27.34`, format, build/check, lint/validate and all four browser CI shards must be green on final SHA.
- Compare user-provided target image against _gameplay screenshots_, not GLB previews; verify ship remains fully visible, reticle clear, boost, robot transformation and ring collisions intact.
- Desktop 60 FPS / mobile 30 FPS remain performance targets until 30-second FPS and p95 frame-time measurements in real hardware.

## Known parent-branch issues

- Graphics 3.1 (#186) passed source tests, but failed two browser shards; one had an intermittent boost HUD messaging assertion and another exceeded the extended 15-minute browser validation limit. Do not attribute these failures to GLB without reproducible evidence, and do not declare this PR homologated until resolved.
- This GLB is source-authored deterministic hard-surface artwork, not artist-made AAA content. Production-level material atlases, KTX2 textures, cinematic shadows and bespoke enemy/city GLB assets remain future work.

## Deployment discipline

Draft PR against #186. No promotion to DEV, HML or production without QA and human visual acceptance.
