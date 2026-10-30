# Graphics 4.0 — Hero Fighter and Mecha Rebuild (QA)

Base: Graphics 3.0 PR #176. Target release: 1.27.28, isolated draft PR. Do not promote to DEV, HML or PROD without end-to-end checks.

## Why this changes visual quality more than graphics 3

The existing cockpit and fighter silhouette are low-complexity procedural primitives. Small 3D decals added by Graphics 3.0 cannot achieve the intended premium read at chase-camera distance. Graphics 4 therefore adds a **sculpted, bespoke hero hull layer**, not more building cubes.

## Functional acceptance

- High includes three proportionally distinct fighter shapes, each with a continuous nose-to-tail sculpted shell, beveled swept wings, integrated engine nacelles, ceramic inset wing panels, metallic movable-feeling flaps, glossy glass canopy and luminous running lights.
- High also exposes angled chest armor and reactor details on the articulated robot **without reparenting wrist/muzzle controls**.
- Medium keeps both added hero hull and robot armor invisible. Auto resolves as before.
- Pilot skin coloring applies to newly created physical material on the ship and mecha.
- 360° hangar uses the same hero model as live gameplay and honors the chosen graphics quality.
- Keep original collision meshes, audio, physics, weak points, weapon origins, camera bounds, saves, trophies and menu behavior.
- No remote assets and no false claim that these geometries equal bespoke concept art.

## Gates

- Unit: finite vertex data/indexes, geometry bounding boxes, variant silhouette, materials, mecha wrist rig, showroom High/Medium.
- CI: release prepare v1.27.28, format/lint, deterministic HTML, 4 Playwright shards and isolated Cloudflare preview.
- Human: actual desktop 1366x768 and touch landscape 844x390 gameplay, camera visibility, comparatives, mobile frame-time for 30s, before any promotion.
- Follow-up vertical slices: authored glTF/GLB hero assets with baking and LOD, HDR lighting pipeline, advanced VFX, unique environment compositions and performance profiling.
