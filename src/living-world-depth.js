import * as T from 'three';

// Ambient-only second and third visual planes for the ten mission themes.
// Instancing keeps each animated layer at a fixed number of draw calls.
// No obstacle, damage, target or projectile data is created here.
export const LIVING_WORLD_PROFILES = Object.freeze({
  city: { name: 'sky-lanes', near: '#66dbfa', far: '#fbb869', shape: 'ship' },
  mars: { name: 'dust-and-survey-drones', near: '#e9ac78', far: '#9f6250', shape: 'crystal' },
  asteroids: { name: 'mine-haulers', near: '#f8b86c', far: '#a29abf', shape: 'rock' },
  station: { name: 'maintenance-shuttles', near: '#60dfff', far: '#f18d57', shape: 'ship' },
  sun: { name: 'plasma-sailers', near: '#ffcf6d', far: '#f26c57', shape: 'crystal' },
  ice: { name: 'glacial-probes', near: '#8cdaff', far: '#c4f2ff', shape: 'crystal' },
  nebula: { name: 'bio-spores', near: '#ec83fc', far: '#8eecfa', shape: 'rock' },
  fleet: { name: 'escort-squadrons', near: '#ffb078', far: '#72e0ff', shape: 'ship' },
  void: { name: 'gravity-debris', near: '#80d5fc', far: '#c8a1e9', shape: 'rock' },
  throne: { name: 'imperial-patrol', near: '#ff739c', far: '#ffd38d', shape: 'ship' },
});

function geometry(shape) {
  if (shape === 'ship') return new T.ConeGeometry(2, 9, 5);
  if (shape === 'crystal') return new T.OctahedronGeometry(3.4, 0);
  return new T.IcosahedronGeometry(3.8, 0);
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
    const material = new T.MeshStandardMaterial({
      color: layer.color,
      metalness: profile.shape === 'rock' ? 0.28 : 0.72,
      roughness: profile.shape === 'rock' ? 0.81 : 0.3,
      emissive: layer.color,
      emissiveIntensity: profile.shape === 'rock' ? 0.04 : 0.2,
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
  for (const layer of root.userData.layers) {
    const far = layer.name === 'third-plane';
    // Medium hides some instances; do not animate/upload invisible slots.
    // Restoring High fills all slots with their exact time-based transform.
    for (let i = 0; i < layer.mesh.count; i++) {
      const side = i % 2 ? 1 : -1;
      const lane = layer.width + (i % 4) * (far ? 27 : 13);
      const loop = (i * 97 + travel * layer.speed + time * (far ? 2.3 : 8.4)) % 1480;
      const altitude = (far ? 55 : 18) + (i % 6) * (far ? 19 : 11);
      helper.position.set(
        side * (lane + Math.sin(time * (far ? 0.11 : 0.26) + i) * (far ? 13 : 23)),
        altitude + Math.sin(time * 0.36 + i * 1.73) * (far ? 11 : 8),
        -180 - loop,
      );
      const size = (far ? 2.25 : 1.35) * (1 + (i % 4) * 0.12);
      helper.scale.set(size, size, size * (far ? 1.45 : 1));
      helper.rotation.set(
        Math.sin(time * 0.27 + i) * 0.18,
        i * 0.57 + time * (far ? 0.04 : 0.17),
        i * 0.39 + time * (far ? 0.06 : 0.13),
      );
      helper.updateMatrix();
      layer.mesh.setMatrixAt(i, helper.matrix);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  }
}
