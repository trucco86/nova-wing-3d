import * as T from 'three';

/**
 * Lightweight, art-directed set dressing for the City of Machines. All buildings,
 * rails and flying vehicles stay outside the gameplay corridor. The high-detail
 * tier uses instancing rather than one draw call per building or train.
 */
export function createPremiumCityLandmarks() {
  const group = new T.Group();
  group.name = 'city-premium-cinematic-landmarks';
  const armor = new T.MeshStandardMaterial({
    color: '#28475b',
    metalness: 0.79,
    roughness: 0.34,
  });
  const dark = new T.MeshStandardMaterial({
    color: '#101e32',
    metalness: 0.67,
    roughness: 0.37,
  });
  const cyan = new T.MeshBasicMaterial({ color: '#50eaff', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#f9a85c', toneMapped: false });
  const obj = new T.Object3D();
  const addInstances = (name, geo, material, count) => {
    const mesh = new T.InstancedMesh(geo, material, count);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    group.add(mesh);
    return mesh;
  };
  const set = (mesh, index, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0) => {
    obj.position.set(x, y, z);
    obj.rotation.set(rx, ry, 0);
    obj.scale.set(sx, sy, sz);
    obj.updateMatrix();
    mesh.setMatrixAt(index, obj.matrix);
  };

  // Six massive, hexagonal cathedral-like towers with tapered upper sections.
  const tower = addInstances(
    'premium-hero-tower-shell',
    new T.CylinderGeometry(5.5, 12, 66, 6),
    armor,
    12,
  );
  const crown = addInstances('premium-hero-tower-crown', new T.ConeGeometry(9, 25, 6), dark, 12);
  const halo = addInstances(
    'premium-hero-tower-halo',
    new T.TorusGeometry(8.8, 0.36, 6, 32),
    cyan,
    12,
  );
  const towerFin = addInstances('premium-hero-tower-fins', new T.BoxGeometry(1, 1, 1), dark, 48);
  const towerGlow = addInstances('premium-hero-tower-neon', new T.BoxGeometry(1, 1, 1), cyan, 48);
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const stage = Math.floor(i / 2);
    const x = side * (168 + (stage % 3) * 21);
    const z = -160 - stage * 290;
    const y = 54 + (stage % 3) * 11;
    set(tower, i, x, y, z, 1, 1 + (stage % 3) * 0.13, 1, 0, stage * 0.17);
    set(crown, i, x, y + 46, z, 1, 1, 1, 0, stage * 0.17);
    set(halo, i, x, y + 33, z, 1, 1, 1, Math.PI / 2);
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + stage * 0.17;
      const dx = Math.sin(a) * 9;
      const dz = Math.cos(a) * 9;
      set(towerFin, i * 4 + j, x + dx, y, z + dz, 1.1, 51, 1.8, 0, a);
      set(towerGlow, i * 4 + j, x + dx * 1.13, y + 8, z + dz * 1.13, 0.3, 31, 0.32, 0, a);
    }
  }

  // Peripheral elevated transport lanes create parallax and a sense of scale.
  // Neither rail nor support crosses the protected central flight route.
  const rails = addInstances('premium-elevated-skyrail', new T.BoxGeometry(1, 1, 1), armor, 28);
  const railLights = addInstances(
    'premium-skyrail-light-strip',
    new T.BoxGeometry(1, 1, 1),
    cyan,
    28,
  );
  const supports = addInstances(
    'premium-skyrail-support',
    new T.CylinderGeometry(0.8, 1.5, 30, 6),
    dark,
    28,
  );
  for (let i = 0; i < 28; i++) {
    const side = i % 2 ? 1 : -1;
    const segment = Math.floor(i / 2);
    const x = side * 75;
    const z = -94 - segment * 123;
    set(rails, i, x, 27, z, 4.4, 1.5, 118);
    set(railLights, i, x - side * 2.3, 28, z, 0.22, 0.24, 118);
    set(supports, i, x, 11, z, 1, 1, 1);
  }

  // Distinct moving commuter craft make the city feel inhabited.
  const trains = addInstances(
    'premium-animated-commuter-craft',
    new T.BoxGeometry(1, 1, 1),
    dark,
    8,
  );
  const windows = addInstances('premium-commuter-window', new T.BoxGeometry(1, 1, 1), amber, 8);
  const span = 1630;
  function update(time) {
    const t = Math.max(0, Number.isFinite(time) ? time : 0);
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1;
      const lane = Math.floor(i / 2);
      const z = -70 - ((((lane * 415 + t * (24 + lane * 4)) % span) + span) % span);
      const x = side * 75;
      set(trains, i, x, 30, z, 3.2, 2.1, 15.5);
      set(windows, i, x - side * 1.72, 30.45, z, 0.21, 0.85, 11);
    }
    trains.instanceMatrix.needsUpdate = true;
    windows.instanceMatrix.needsUpdate = true;
  }
  update(0);

  // Avoid expensive bounds recomputation on each animation frame.
  trains.frustumCulled = false;
  windows.frustumCulled = false;
  group.traverse((node) => {
    if (node.isInstancedMesh) node.instanceMatrix.needsUpdate = true;
  });
  return { group, update };
}
