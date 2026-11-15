# QA146: reduce city draw submissions via safe static batching

Source: 15/11 mobile phase-1 High baseline, 34 FPS, frame p95 39ms,
1385 real draw calls p95, 837 geometry counter (+449). The latter alone
is not proof of a resource leak.

## Geometry preservation

Each tile has 3 independently named maglev station groups. Each group
contains 8 original box parts, now stored as `stationParts` immutable-like
descriptors and transformed into three material-identical InstancedMesh batches
at tile-local coordinates. Original steel, cap and line glow materials,
triangles and local dimensions remain exact.

Six fictional commercial signs preserve their six textured screens and six
independently animated beacons. Six metal support rectangles and twelve cyan
trim bars use two new InstancedMesh batches, so all 18 original boxes survive
but need only 2 submitted draws instead of 18.

Two cloned city tiles reuse geometric assets and keep separate instance
transforms. No route, collision or gameplay effect changes.

## Acceptance

- 3 stations × 8 authored parts; 3 batches, count (9,9,6) per tile.
- 6 signs × 3 original fixed parts; 2 batches, count (6,12) per tile.
- Same 12 triangle faces for each box, same world-space bounding transforms.
- High and Medium preserve both signs and stations; quality changes do not
  allocate new geometry.
- 74 fewer potential draw submissions with both tiles in scene. This
  is not equivalent to guaranteed -74 actual per-frame GPU calls.
- Compare p95/p99 FPS/draw calls and geometry count in hardware with QA145,
  at the same viewport, flight segment and session length.
- Four browser shards required before merge readiness. Production blocked.
