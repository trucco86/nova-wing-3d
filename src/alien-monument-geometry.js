import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Five handcrafted, low-poly alien monument silhouettes, each merged into a
// single indexed geometry and drawn by an existing InstancedMesh. This is
// architectural shape work, not another universal planet/torus corridor.
export const ALIEN_MONUMENT_PARTS = Object.freeze({
  sun: 9,
  ice: 8,
  nebula: 10,
  void: 8,
  throne: 12,
});

const palette = Object.freeze({
  sun: ['#57473f', '#a07c60', '#d5ad78', '#384e50'],
  ice: ['#28485f', '#6ca0b3', '#c0e6e9', '#24435a'],
  nebula: ['#25375b', '#537ba5', '#9f83b8', '#55b4a8'],
  void: ['#1a2237', '#58647f', '#a3aac8', '#73b5c5'],
  throne: ['#231e29', '#5f4344', '#b78c66', '#273d40'],
});

function pushPart(parts, geometry, tone, colors, transform = {}) {
  const { x = 0, y = 0, z = 0, w = 1, h = 1, d = 1, rz = 0, ry = 0 } = transform;
  geometry.scale(w, h, d);
  if (ry) geometry.rotateY(ry);
  if (rz) geometry.rotateZ(rz);
  geometry.translate(x, y, z);
  if (!geometry.index)
    geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
  const color = new T.Color(colors[tone]);
  const vertices = geometry.attributes.position.count;
  const values = new Float32Array(vertices * 3);
  const height = geometry.getAttribute('position');
  for (let i = 0; i < vertices; i++) {
    const variation = 0.91 + Math.min(0.14, Math.max(0, height.getY(i) + 0.6) * 0.12);
    values[i * 3] = color.r * variation;
    values[i * 3 + 1] = color.g * variation;
    values[i * 3 + 2] = color.b * variation;
  }
  geometry.setAttribute('color', new T.BufferAttribute(values, 3));
  parts.push(geometry);
}

export function createAlienMonumentGeometry(theme) {
  const colors = palette[theme];
  if (!colors) throw new RangeError('Unknown alien monument civilisation: ' + theme);
  const parts = [];
  const add = (geometry, tone, transform) => pushPart(parts, geometry, tone, colors, transform);
  const block = (tone, x, y, z, w, h, d, rz = 0) =>
    add(new T.BoxGeometry(1, 1, 1), tone, { x, y, z, w, h, d, rz });

  if (theme === 'sun') {
    // Venus: stepped sulfur temple with a recessed entrance and paired
    // protective plinths. Its horizontal strata contrast with Titan's citadel.
    block(0, 0, -0.43, 0, 1.14, 0.13, 1.03);
    block(1, 0, -0.29, 0, 0.97, 0.15, 0.88);
    block(1, 0, -0.13, 0, 0.78, 0.19, 0.69);
    block(2, 0, 0.07, 0, 0.57, 0.22, 0.52);
    add(new T.ConeGeometry(0.35, 0.31, 4), 1, { y: 0.32, ry: Math.PI / 4 });
    block(0, 0, -0.16, 0.35, 0.17, 0.32, 0.09);
    block(3, 0, -0.16, 0.407, 0.12, 0.24, 0.02);
    for (const side of [-1, 1]) block(2, side * 0.37, -0.29, 0.31, 0.18, 0.27, 0.2);
  } else if (theme === 'ice') {
    // Europa: a vault rooted into the glacier; frozen ribs enclose an
    // excavated entry. No free-floating white cones or duplicated mountains.
    block(0, 0, -0.38, 0, 1.14, 0.21, 1.06);
    block(1, 0, -0.19, -0.12, 0.77, 0.29, 0.74);
    add(new T.OctahedronGeometry(0.5, 0), 2, { y: 0.12, z: -0.1, w: 0.9, h: 0.8 });
    block(3, 0, -0.22, 0.41, 0.29, 0.4, 0.08);
    for (const side of [-1, 1]) {
      block(0, side * 0.49, -0.12, 0, 0.17, 0.7, 0.66, -side * 0.1);
      add(new T.TetrahedronGeometry(0.29, 0), 1, {
        x: side * 0.48,
        y: 0.29,
        w: 0.72,
        h: 0.96,
        rz: side * 0.1,
      });
    }
  } else if (theme === 'nebula') {
    // Neptune: triple-rooted biomorphic hive, spiral armor, central seed pod
    // and coral-like fronds. Not a pyramidal temple with a blue material.
    add(new T.CylinderGeometry(0.16, 0.31, 0.92, 7), 0, { y: -0.13 });
    add(new T.DodecahedronGeometry(0.3, 0), 2, { y: 0.31, w: 1.25, h: 1.2 });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      add(new T.CylinderGeometry(0.075, 0.16, 0.57, 5), 1, {
        x: Math.cos(angle) * 0.29,
        y: -0.31,
        z: Math.sin(angle) * 0.29,
        rz: -Math.cos(angle) * 0.22,
      });
    }
    for (const side of [-1, 1]) {
      block(1, side * 0.36, 0.16, 0, 0.12, 0.76, 0.13, -side * 0.38);
      add(new T.IcosahedronGeometry(0.19, 0), 3, {
        x: side * 0.54,
        y: 0.47,
        z: 0,
        w: 0.8,
        h: 1.0,
      });
    }
    add(new T.IcosahedronGeometry(0.11, 0), 3, { y: 0.55, w: 0.8, h: 0.78 });
  } else if (theme === 'void') {
    // Orion: broken gravity obelisk with empty space between offset slabs,
    // two unstable fins and a reactor slit; not a circular stellar tunnel.
    block(0, 0, -0.38, 0, 0.9, 0.19, 0.88);
    add(new T.CylinderGeometry(0.24, 0.42, 0.86, 5), 1, { y: 0.03, ry: 0.28 });
    block(3, 0, 0.11, 0.29, 0.12, 0.49, 0.055);
    for (const side of [-1, 1]) {
      block(0, side * 0.42, -0.12, 0, 0.16, 0.63, 0.39, side * 0.19);
      add(new T.TetrahedronGeometry(0.2, 0), 2, {
        x: side * 0.43,
        y: 0.43,
        h: 1.18,
        rz: side * 0.14,
      });
    }
    block(2, 0, 0.55, 0, 0.31, 0.12, 0.35);
  } else if (theme === 'throne') {
    // Titan: armored dark citadel with stacked sloping walls, a real portal,
    // reinforced side bastions, and an angular command crown.
    block(0, 0, -0.45, 0, 1.3, 0.11, 1.18);
    block(1, 0, -0.32, 0, 1.12, 0.18, 1.05);
    block(0, 0, -0.16, -0.04, 0.93, 0.18, 0.84);
    block(1, 0, 0.01, -0.08, 0.76, 0.18, 0.68);
    add(new T.ConeGeometry(0.48, 0.42, 4), 0, { y: 0.3, z: -0.08, ry: Math.PI / 4 });
    block(3, 0, -0.18, 0.45, 0.24, 0.37, 0.035);
    block(2, 0, 0.42, -0.08, 0.35, 0.09, 0.36);
    for (const side of [-1, 1]) {
      block(0, side * 0.53, -0.17, 0.2, 0.16, 0.54, 0.24);
      block(1, side * 0.53, 0.22, 0.2, 0.18, 0.24, 0.24);
    }
    block(2, 0, -0.46, 0.59, 0.36, 0.045, 0.12);
  }
  if (parts.length !== ALIEN_MONUMENT_PARTS[theme])
    throw new Error('Alien monument source parts mismatch: ' + theme);
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!merged?.index || !merged.getAttribute('normal') || !merged.getAttribute('color'))
    throw new Error('Alien monument must be indexed PBR geometry: ' + theme);
  merged.computeBoundingSphere();
  merged.userData.alienCivilisation = theme;
  return merged;
}
