# Graphics 2.4 — Sculpted Starfighter Pass (v1.27.30, QA)

## Purpose
Replace the generic block-built appearance of the hero spacecraft with intentional hard-surface sculpted geometry, while preserving browser-first WebGL and safe gameplay.

## Visible implementation
- NOVA-7, Aegis and Specter gain a continuous 16-sided sectional 3D fuselage with vertex normals and sealed tip and aft sections. Profile is wide at the cockpit and tapers progressively toward the front.
- Two swept extruded wings with bevels, inset armored panels and independent mechanical ribs, scaled to each selected chassis.
- Raised optical canopy with physical clearcoat and a separate centerline frame.
- Two detailed rear engine nacelles, six circular emission/casing rings and independently rotating six-blade engine rotors.
- Hero hull and wing plating use the existing selected paint material; cockpit/glass, titanium and dark carbon remain separate.
- Entire sculpted group lives inside the existing **ship-premium-details** group, visible in High and invisible in Medium. Boost changes rotor spin along with the already-established plume logic.
- No changes to physics, damage, collision, targeting, robots, input, HUD, save, rank or production.

## Browser and performance
- No external 3D asset load or binary asset footprint; geometry is source-authored directly in Three.js (not an imported GLB file).
- Materials allocated per ship are tracked for disposal on ship change and game shutdown.
- Enhanced meshes add GPU cost only in High; do not infer FPS performance without a real device benchmark.
- Existing 2 MB HTML budget, localized settings and desktop/mobile rendering remain mandatory.

## QA gates
- Versioned `1.27.30` release prepare, source formatting, reproducible browser HTML, lint, `npm run validate`, and four Playwright shards on the final commit.
- Unit tests verify valid and finite vertex/index data, distinct models, names, paint inheritance, High/Medium visibility and rotor animation.
- Real screenshots on 1366x768 desktop, 844x390 landscape, and 390x844 portrait, with two graphics modes and at least 30 seconds frame-time/FPS.
- Keep draft PR on top of Graphics 2.3; do not merge to DEV/HML/PROD without visual acceptance.

## Explicit limitation
This is higher-fidelity mesh authoring in live gameplay, not a full GLB asset pipeline or a photorealistic render. Further visual parity with the approved concept requires professional authored assets, LOD, compressed textures, environment reflections, and lighting controlled by measured frame budgets.
