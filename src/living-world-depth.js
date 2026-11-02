import * as T from 'three';

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

function geometry(shape) {
  switch (shape) {
    case 'commuter':
      return new T.ConeGeometry(2, 9, 5);
    case 'surveyor':
      return new T.CylinderGeometry(3, 3, 1.7, 6);
    case 'ore':
      return new T.IcosahedronGeometry(3.8, 0);
    case 'shuttle':
      return new T.BoxGeometry(3.5, 2.5, 10);
    case 'sail':
      return new T.TetrahedronGeometry(4, 0);
    case 'ice':
      return new T.OctahedronGeometry(4.3, 0);
    case 'spore':
      return new T.DodecahedronGeometry(3.1, 0);
    case 'escort':
      return new T.ConeGeometry(2.2, 11, 3);
    case 'grav-ring':
      return new T.TorusGeometry(3.5, 1.1, 6, 10);
    case 'interceptor':
      return new T.CylinderGeometry(0, 4, 11, 4);
    default:
      throw new Error('Unknown ambient silhouette: ' + shape);
  }
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
      color: layer.color,
      metalness: mineral ? 0.28 : 0.72,
      roughness: mineral ? 0.81 : 0.3,
      emissive: layer.color,
      emissiveIntensity: mineral ? 0.04 : 0.2,
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
