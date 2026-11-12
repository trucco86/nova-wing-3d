import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Ambient-only second and third visual planes for the ten mission themes.
// Instancing keeps each animated layer at a fixed number of draw calls.
// No obstacle, damage, target or projectile data is created here.
export const LIVING_WORLD_PROFILES = Object.freeze({
  // Each sector has its own silhouette and flight signature. Only two GPU draws
  // remain active; these meshes never participate in collision or targeting.
  city: {
    name: 'sky-lanes',
    near: '#66dbfa',
    far: '#fbb869',
    shape: 'commuter',
    motion: { lateral: 6, vertical: 3, forward: 1.4, spin: 0.4, size: 0.95, altitude: 0 },
  },
  mars: {
    name: 'dust-and-survey-drones',
    near: '#e9ac78',
    far: '#9f6250',
    shape: 'surveyor',
    motion: { lateral: 25, vertical: 13, forward: 0.7, spin: 1.5, size: 0.85, altitude: -14 },
  },
  asteroids: {
    name: 'mine-haulers',
    near: '#f8b86c',
    far: '#a29abf',
    shape: 'ore',
    motion: { lateral: 31, vertical: 8, forward: 0.5, spin: 2.1, size: 1.18, altitude: 6 },
  },
  station: {
    name: 'maintenance-shuttles',
    near: '#60dfff',
    far: '#f18d57',
    shape: 'shuttle',
    motion: { lateral: 4, vertical: 3, forward: 1.1, spin: 0.3, size: 1.0, altitude: 9 },
  },
  sun: {
    name: 'plasma-sailers',
    near: '#ffcf6d',
    far: '#f26c57',
    shape: 'sail',
    motion: { lateral: 13, vertical: 20, forward: 1.6, spin: 1.2, size: 1.15, altitude: 23 },
  },
  ice: {
    name: 'glacial-probes',
    near: '#8cdaff',
    far: '#c4f2ff',
    shape: 'ice',
    motion: { lateral: 12, vertical: 5, forward: 0.28, spin: 0.18, size: 1.35, altitude: -18 },
  },
  nebula: {
    name: 'bio-spores',
    near: '#ec83fc',
    far: '#8eecfa',
    shape: 'spore',
    motion: { lateral: 27, vertical: 24, forward: 0.24, spin: 1.8, size: 0.9, altitude: 18 },
  },
  fleet: {
    name: 'escort-squadrons',
    near: '#ffb078',
    far: '#72e0ff',
    shape: 'escort',
    motion: { lateral: 5, vertical: 3, forward: 1.7, spin: 0.32, size: 1.13, altitude: 11 },
  },
  void: {
    name: 'gravity-debris',
    near: '#80d5fc',
    far: '#c8a1e9',
    shape: 'grav-ring',
    motion: { lateral: 36, vertical: 11, forward: 0.18, spin: 2.3, size: 1.2, altitude: 30 },
  },
  throne: {
    name: 'imperial-patrol',
    near: '#ff739c',
    far: '#ffd38d',
    shape: 'interceptor',
    motion: { lateral: 8, vertical: 4, forward: 1.9, spin: 0.15, size: 1.02, altitude: 15 },
  },
});

// Ten sector-native objects, each with a recognisable manufactured/mineral
// silhouette. Vertex-coloured subparts are merged into ONE GPU mesh per depth
// plane. This replaces bare cones/boxes without adding lights, colliders,
// materials, per-frame allocations or render passes.
const MATERIAL_PALETTES = Object.freeze({
  commuter: ['#c9d9dd', '#42606c', '#efd7ab'],
  surveyor: ['#c3ae91', '#564f4d', '#e0c68d'],
  ore: ['#655d67', '#a6b7b4', '#dba97a'],
  shuttle: ['#b9c6cc', '#354b5d', '#dfb278'],
  sail: ['#dfb899', '#7f3c37', '#ffd39c'],
  ice: ['#cae7ef', '#79b7c6', '#e0f5ed'],
  spore: ['#9d78ab', '#c69bc5', '#c2d9b8'],
  escort: ['#a4afb8', '#525968', '#edb390'],
  'grav-ring': ['#677887', '#a5a5c7', '#bfd7df'],
  interceptor: ['#51545f', '#9a4751', '#d8a77f'],
});
function geometry(shape) {
  const tones = MATERIAL_PALETTES[shape];
  if (!tones) throw new Error('Unknown ambient silhouette: ' + shape);
  const parts = [];
  const add = (geometry, colorIndex, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rz = 0) => {
    geometry.scale(sx, sy, sz);
    if (rz) geometry.rotateZ(rz);
    geometry.translate(x, y, z);
    // Primitive generators differ in indexed layout. Normalise to indexed
    // geometry without duplicating vertices before combining parts.
    if (!geometry.index)
      geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
    const color = new T.Color(tones[colorIndex]);
    const rgb = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < rgb.length; i += 3) {
      rgb[i] = color.r;
      rgb[i + 1] = color.g;
      rgb[i + 2] = color.b;
    }
    geometry.setAttribute('color', new T.BufferAttribute(rgb, 3));
    parts.push(geometry);
  };
  const block = (c, x, y, z, w, h, d) => add(new T.BoxGeometry(1, 1, 1), c, x, y, z, w, h, d);
  switch (shape) {
    case 'commuter':
      // Compact flying transport, supported by actual wings and twin drives.
      block(0, 0, 0, 0, 2.5, 0.85, 8.2);
      block(1, 0, 0.58, -1.15, 1.72, 0.48, 2.65);
      for (const side of [-1, 1]) {
        block(0, side * 2.15, -0.08, 0.45, 2.2, 0.2, 3.0);
        block(2, side * 0.83, -0.1, 3.7, 0.38, 0.35, 0.4);
      }
      break;
    case 'surveyor':
      // Mars: a scientific six-sided drone with mast, sensor and outriggers.
      add(new T.CylinderGeometry(2.65, 2.65, 1.5, 6), 0);
      block(1, 0, 1.1, 0, 2.5, 0.55, 2.4);
      add(new T.SphereGeometry(0.85, 6, 4), 2, 0, 2.1, -0.35);
      for (const side of [-1, 1]) block(0, side * 2.9, 0, 0, 2.15, 0.2, 1.4);
      break;
    case 'ore':
      // Asteroids: sculpted stone mass with embedded ore and broken facets.
      add(new T.IcosahedronGeometry(3.8, 0), 0, 0, 0, 0, 1.15, 0.9, 1.4);
      add(new T.OctahedronGeometry(2.15, 0), 1, 2.2, 1.2, -0.8, 0.65, 1.0, 0.72);
      add(new T.OctahedronGeometry(1.4, 0), 2, -1.9, -1.1, 1.4);
      break;
    case 'shuttle':
      block(0, 0, 0, 0, 3.6, 2, 10);
      block(1, 0, 1.12, -2.5, 2.1, 0.46, 2.5);
      for (const side of [-1, 1]) {
        block(0, side * 2.8, -0.3, 1, 2.2, 0.28, 3.6);
        block(2, side * 1.05, -0.3, 5.12, 0.7, 0.65, 0.24);
      }
      break;
    case 'sail':
      // Venus: bright thermoceramic core with two swept plasma sails.
      add(new T.TetrahedronGeometry(3.4, 0), 0);
      for (const side of [-1, 1]) {
        block(1, side * 3.4, 0.2, 0.2, 4.7, 0.18, 2.7);
        block(2, side * 5.2, 0.2, -0.3, 0.33, 0.25, 1.9);
      }
      break;
    case 'ice':
      add(new T.OctahedronGeometry(4.1, 0), 0, 0, 0, 0, 1.1, 1.5, 1);
      for (const side of [-1, 1])
        add(
          new T.OctahedronGeometry(2.3, 0),
          side < 0 ? 1 : 2,
          side * 2.6,
          -1.0,
          1.1,
          0.5,
          1.1,
          0.7,
        );
      break;
    case 'spore':
      add(new T.DodecahedronGeometry(3.1, 0), 0);
      for (const side of [-1, 1]) {
        add(new T.ConeGeometry(0.68, 5.4, 5), 1, side * 2.7, -2.4, 0, 1, 1, 1, side * 0.32);
        add(new T.SphereGeometry(0.7, 5, 4), 2, side * 2.8, 2.35, 0);
      }
      break;
    case 'escort':
      // Saturn's fleets use distinct armored hulls and visible engine pairs.
      add(new T.ConeGeometry(2.15, 10.7, 5), 0, 0, 0, 0, 1, 1, 1, Math.PI / 2);
      block(1, 0, 0.55, -1.2, 1.35, 0.7, 2.8);
      for (const side of [-1, 1]) {
        block(0, side * 2.1, -0.5, 1.1, 2.4, 0.25, 3.3);
        block(2, side * 1.0, -0.3, 4.55, 0.42, 0.5, 0.4);
      }
      break;
    case 'grav-ring':
      add(new T.TorusGeometry(3.6, 0.72, 4, 9), 1);
      add(new T.OctahedronGeometry(2.15, 0), 0, 0, 0, 0);
      add(new T.TorusGeometry(2.2, 0.25, 3, 8), 2, 0, 0, 0, 1, 1, 1, Math.PI / 2);
      break;
    case 'interceptor':
      add(new T.CylinderGeometry(0.1, 3.15, 10.5, 5), 0, 0, 0, 0, 1, 1, 1, Math.PI / 2);
      block(1, 0, 0.74, -1.4, 1.65, 0.5, 2.6);
      for (const side of [-1, 1]) {
        block(0, side * 2.35, -0.48, 0.1, 2.35, 0.28, 3.6);
        block(2, side * 1.0, -0.25, 4.15, 0.5, 0.55, 0.45);
      }
      break;
  }
  const merged = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!merged) throw new Error('Could not merge premium ambient geometry: ' + shape);
  merged.computeBoundingSphere();
  return merged;
}

export function createLivingWorldLayers(theme, quality = 'high') {
  const profile = LIVING_WORLD_PROFILES[theme];
  if (!profile) return null;
  const root = new T.Group();
  root.name = 'world-living-depth-' + theme;
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.theme = theme;
  root.userData.profile = profile.name;
  const geo = geometry(profile.shape);
  const layers = [
    { name: 'second-plane', count: 18, medium: 10, width: 120, speed: 0.38, color: profile.near },
    { name: 'third-plane', count: 28, medium: 14, width: 280, speed: 0.13, color: profile.far },
  ];
  const mats = [];
  const instances = layers.map((layer) => {
    const mineral = ['ore', 'ice', 'grav-ring'].includes(profile.shape);
    const material = new T.MeshStandardMaterial({
      color: '#ffffff',
      vertexColors: true,
      metalness: mineral ? 0.17 : 0.64,
      roughness: mineral ? 0.73 : 0.38,
      emissive: layer.color,
      emissiveIntensity: mineral ? 0.035 : 0.09,
      flatShading: true,
    });
    mats.push(material);
    const mesh = new T.InstancedMesh(geo, material, layer.count);
    mesh.name = 'living-' + layer.name + '-' + profile.name;
    mesh.userData.visualOnly = true;
    mesh.frustumCulled = false;
    mesh.count = quality === 'high' ? layer.count : layer.medium;
    root.add(mesh);
    return { mesh, ...layer };
  });
  root.userData.layers = instances;
  root.userData.materials = mats;
  root.userData.geometry = geo;
  // Reuse the transform across frames: these ambient layers are animated
  // continuously, but creating an Object3D per frame produces GC churn.
  root.userData.transformHelper = new T.Object3D();
  updateLivingWorldLayers(root, { time: 0, travel: 0 });
  return root;
}

export function setLivingWorldQuality(root, quality = 'high') {
  if (!root) return;
  for (const layer of root.userData.layers)
    layer.mesh.count = quality === 'high' ? layer.count : layer.medium;
}

export function updateLivingWorldLayers(root, { time = 0, travel = 0 } = {}) {
  if (!root) return;
  const helper = root.userData.transformHelper;
  const motion = LIVING_WORLD_PROFILES[root.userData.theme].motion;
  for (const layer of root.userData.layers) {
    const far = layer.name === 'third-plane';
    // Medium hides some instances; do not animate/upload invisible slots.
    // Restoring High fills all slots with their exact time-based transform.
    for (let i = 0; i < layer.mesh.count; i++) {
      const side = i % 2 ? 1 : -1;
      const lane = layer.width + (i % 4) * (far ? 27 : 13);
      const loop =
        (i * 97 + travel * layer.speed + time * (far ? 2.3 : 8.4) * motion.forward) % 1480;
      const altitude = (far ? 55 : 18) + (i % 6) * (far ? 19 : 11) + motion.altitude;
      helper.position.set(
        side *
          (lane +
            Math.sin(time * (far ? 0.11 : 0.26) * motion.spin + i) *
              motion.lateral *
              (far ? 0.55 : 1)),
        altitude +
          Math.sin(time * 0.36 * motion.spin + i * 1.73) * motion.vertical * (far ? 0.8 : 1),
        -180 - loop,
      );
      const size = (far ? 2.25 : 1.35) * (1 + (i % 4) * 0.12) * motion.size;
      helper.scale.set(size, size, size * (far ? 1.45 : 1));
      helper.rotation.set(
        Math.sin(time * 0.27 * motion.spin + i) * 0.18,
        i * 0.57 + time * (far ? 0.04 : 0.17) * motion.spin,
        i * 0.39 + time * (far ? 0.06 : 0.13) * motion.spin,
      );
      helper.updateMatrix();
      layer.mesh.setMatrixAt(i, helper.matrix);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  }
}
