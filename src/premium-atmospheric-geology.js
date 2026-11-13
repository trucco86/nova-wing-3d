import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Authored side-biome silhouettes for the Venus sulfur cloud sea and the
// Neptunian hive storm. One merged geometry per existing InstancedMesh.
// No new materials, lights, rigid bodies, draw calls or frame allocations.
export const ATMOSPHERIC_PARTS = Object.freeze({
  'venus-volcanic-vent': 8,
  'neptune-hive-tower': 9,
  'venus-cloud-bank': 3,
  'neptune-storm-bank': 3,
});

export function createPremiumAtmosphericGeometry(kind) {
  if (!(kind in ATMOSPHERIC_PARTS)) throw new RangeError('unknown atmospheric sculpture');
  const parts = [];
  const add = (geometry, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, roll = 0) => {
    geometry.scale(sx, sy, sz);
    if (roll) geometry.rotateZ(roll);
    geometry.translate(x, y, z);
    // PolyhedronGeometry is emitted non-indexed while boxes and cylinders
    // are indexed. Normalize both before merging into one GPU geometry.
    if (!geometry.index)
      geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
    parts.push(geometry);
  };
  if (kind === 'venus-volcanic-vent') {
    // A wide, anchored seven-sided eroded stack, stepped caldera lip,
    // fractured heat baffles and paired fumaroles. Unlike a floating
    // icosahedron this has a readable base connected to the landscape.
    add(new T.CylinderGeometry(0.35, 0.62, 1.0, 7, 3), 0, 0, 0);
    add(new T.IcosahedronGeometry(0.47, 0), -0.14, -0.4, 0.03, 1.1, 0.47, 0.95);
    add(new T.CylinderGeometry(0.39, 0.32, 0.13, 7), 0, 0.5, 0);
    for (const side of [-1, 1]) {
      add(new T.BoxGeometry(0.16, 0.63, 0.42), side * 0.39, -0.14, 0, 1, 1, 1, side * 0.25);
      add(new T.ConeGeometry(0.12, 0.44, 5), side * 0.34, 0.48, -0.1, 1, 1, 1, -side * 0.19);
    }
    add(new T.CylinderGeometry(0.23, 0.23, 0.07, 8), 0, 0.59, 0.045);
  } else if (kind === 'neptune-hive-tower') {
    // An organic ice-gas hive with load-bearing roots, a separate cap and
    // three long wind-sculpted fronds, no simplistic isolated cone.
    add(new T.CylinderGeometry(0.22, 0.42, 1.05, 7, 2), 0, -0.04, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      add(
        new T.CylinderGeometry(0.06, 0.16, 0.67, 5),
        Math.cos(a) * 0.31,
        -0.34,
        Math.sin(a) * 0.31,
        1,
        1,
        1,
        -Math.cos(a) * 0.27,
      );
    }
    add(new T.DodecahedronGeometry(0.32, 0), 0, 0.48, 0, 1, 0.8, 1);
    add(new T.ConeGeometry(0.11, 0.36, 5), 0, 0.86, 0);
    for (const side of [-1, 0, 1]) {
      const s = side === 0 ? 1 : side;
      add(
        new T.BoxGeometry(0.14, 0.56, 0.13),
        s * (side === 0 ? 0.19 : 0.46),
        0.24,
        side === 0 ? 0.27 : -0.12,
        1,
        1,
        1,
        s * 0.44,
      );
    }
  } else {
    // One translucent, turbulent bank instead of a uniformly scaled sphere.
    // Its low-poly rounded lobes overlap with varied altitude and depth.
    const isVenus = kind === 'venus-cloud-bank';
    const specs = isVenus
      ? [
          [-0.34, -0.16, 0.0, 0.8, 0.5, 0.77],
          [0.31, 0.02, -0.18, 0.75, 0.62, 0.72],
          [0, 0.33, 0.18, 0.59, 0.42, 0.63],
        ]
      : [
          [-0.42, -0.12, -0.1, 0.69, 0.44, 0.85],
          [0.24, 0.16, 0.12, 0.8, 0.56, 0.74],
          [0.02, 0.43, -0.14, 0.55, 0.34, 0.58],
        ];
    for (const [x, y, z, sx, sy, sz] of specs)
      add(new T.SphereGeometry(1, 9, 6), x, y, z, sx, sy, sz);
  }
  if (parts.length !== ATMOSPHERIC_PARTS[kind])
    throw new Error('incorrect atmospheric shape source parts: ' + kind);
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged || !merged.index || !merged.getAttribute('normal'))
    throw new Error('atmospheric geometry must be physically modeled and indexed: ' + kind);
  merged.computeBoundingSphere();
  merged.userData.premiumAtmosphere = kind;
  return merged;
}
