import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Author each recognizable distant silhouette once, then draw dozens of
// variations with the EXISTING destination InstancedMesh, one GPU draw each.
// Indexed primitives have the same position/normal/uv attribute layout.
// No materials, lights, per-frame allocations, hitboxes or invisible blockers.
export const PREMIUM_LANDMARK_PARTS = Object.freeze({
  dreadnought: 10,
  'orion-lens': 8,
  'titan-fortress': 10,
});

export function createPremiumLandmarkHull(kind) {
  if (!(kind in PREMIUM_LANDMARK_PARTS)) throw new RangeError('unknown premium landmark hull');
  const parts = [];
  const box = (x, y, z, width, height, depth, roll = 0) => {
    const geometry = new T.BoxGeometry(width, height, depth);
    if (roll) geometry.rotateZ(roll);
    geometry.translate(x, y, z);
    parts.push(geometry);
  };
  const ring = (radius, arcLength, x, y, z, roll) => {
    const geometry = new T.TorusGeometry(radius, 0.035, 4, 14, arcLength);
    geometry.rotateZ(roll);
    geometry.translate(x, y, z);
    parts.push(geometry);
  };
  switch (kind) {
    case 'dreadnought':
      // Saturn: broad armored naval hull with an inset command bridge, engine
      // exhausts and two symmetrical wing outriggers, not rectangular cargo.
      box(0, 0, 0, 0.84, 0.54, 1.9);
      box(0, 0.34, -0.22, 0.49, 0.24, 0.66);
      box(0, -0.29, 0.44, 0.51, 0.2, 0.89);
      box(0, -0.11, -1.02, 0.22, 0.2, 0.28);
      for (const side of [-1, 1]) {
        box(side * 0.72, -0.04, 0.09, 0.76, 0.17, 0.99, -side * 0.18);
        box(side * 1.13, 0.11, 0.35, 0.15, 0.49, 0.66, side * 0.13);
        box(side * 0.3, -0.11, 1.0, 0.15, 0.23, 0.17);
      }
      break;
    case 'orion-lens':
      // Orion: broken lens blades orbiting a central gravitational scaffold.
      // Intentional open silhouette avoids a generic spinning solid crystal.
      box(0, 0, 0, 0.43, 1.25, 0.4);
      box(0, -0.53, 0, 0.88, 0.14, 0.63);
      box(0, 0.53, 0, 0.71, 0.12, 0.57);
      box(-0.53, 0.15, 0.02, 0.17, 0.96, 0.26, -0.21);
      box(0.53, -0.13, 0.02, 0.17, 0.98, 0.26, 0.21);
      ring(0.69, Math.PI * 1.28, 0, 0, 0.04, 0.21);
      ring(0.62, Math.PI * 1.14, 0, 0, -0.03, Math.PI * 1.12);
      box(0, 0, 0.29, 0.28, 0.28, 0.16);
      break;
    case 'titan-fortress':
      // Titan: heavy *grounded* wall fortification with lateral buttresses,
      // a shielded command cell and two antennae. Its bottom is a real base.
      box(0, -0.35, 0, 1.0, 0.3, 1.0);
      box(0, 0.06, 0, 0.64, 0.65, 0.7);
      box(0, 0.43, -0.06, 0.82, 0.16, 0.84);
      box(0, 0.55, 0, 0.46, 0.28, 0.46);
      for (const side of [-1, 1]) {
        box(side * 0.5, -0.22, -0.07, 0.28, 0.56, 0.68);
        box(side * 0.53, 0.16, 0.09, 0.24, 0.4, 0.34);
        box(side * 0.23, 0.83, 0, 0.07, 0.35, 0.07);
      }
      break;
  }
  if (parts.length !== PREMIUM_LANDMARK_PARTS[kind])
    throw new Error('premium landmark draw source changed unexpectedly: ' + kind);
  const mesh = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!mesh || !mesh.index || !mesh.getAttribute('normal'))
    throw new Error('unable to construct indexed PBR silhouette: ' + kind);
  mesh.userData.premiumHull = kind;
  mesh.computeBoundingSphere();
  return mesh;
}
