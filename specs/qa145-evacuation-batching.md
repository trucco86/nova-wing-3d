# QA145 | Optimized High mode without sacrificing authored ships

## Source of truth

User hardware baseline, phase 1, HIGH, mobile viewport 430×711 CSS, 35.42s,
34 FPS average, p95 frame 39ms, 1385 p95 draw calls and 1.66M triangles.
Node deterministic scene inventory: 885 visible meshes in static High
scene, 702 city tiles; 406 city tile stand-alone Mesh.

## Optimization

Each tile had 7 evacuation shuttle groups each containing 7 Mesh
components (2 steel hull, 3 glow glass, 2 engine flames). Their rigid
local geometry/materials were static and were only translated/rotated/scaled
as one vehicle by the existing cinematic travel formula.

Keep 7 transform-proxy Groups and add one small renderer Group of three
InstancedMesh: all seven box parts geometrically merged by original
material in local coordinates (index, UV and normals preserved).
One per material: hull, glazing and engines. Each instance uses the
corresponding proxy's local matrix. The industrial clone has independent
instance buffers and shares immutable geometry, same as prior clone.

For both tiles, potential 98 Mesh draws become 6 instanced draws:
92 fewer candidate submissions; browser frustum may mean smaller
actual savings. Triangle count/ships/material palette remain unchanged.

## Acceptance

- Three real draws/tile, 7 proxy ships, 7*7 authored part identities.
- Medium draws three active ships, High seven, no flash at origin,
  pause/replay and reset deterministic.
- Enemy AI, object hitboxes, routes, city progression and player craft
  untouched.
- No performance claims until repeat real device benchmark on same phase
  and graphics mode; compare 1.385 p95 draws and 34 FPS baseline.
- 4 Playwright shards and existing regression suites required.

No merge or production deploy before approval.
