import * as T from 'three';

// A single 520-unit frozen cavern replaces Europa's anonymous industrial
// tunnel skin. Gameplay collision boxes, breach panel and projectile blocking
// still belong exclusively to the pre-existing tunnel obstacle.
export const EUROPA_CAVE_LENGTH = 520;
export const EUROPA_CAVE_BUDGET = Object.freeze({
  wallRocks: 38,
  ceilingSpires: 22,
  crystalSpikes: 36,
});

const rng = (i) => {
  const value = Math.sin(i * 24.128 + 33.7) * 43758.5453;
  return value - Math.floor(value);
};

function addBatch(parent, name, geometry, material, count, pose) {
  const batch = new T.InstancedMesh(geometry, material, count);
  batch.name = name;
  batch.userData.visualOnly = true;
  batch.frustumCulled = false;
  const transform = new T.Object3D();
  for (let i = 0; i < count; i++) {
    const p = pose(i);
    transform.position.set(p.x, p.y, p.z);
    transform.rotation.set(p.pitch ?? 0, p.yaw ?? 0, p.roll ?? 0);
    transform.scale.set(p.w, p.h, p.d);
    transform.updateMatrix();
    batch.setMatrixAt(i, transform.matrix);
  }
  batch.instanceMatrix.needsUpdate = true;
  parent.add(batch);
  return batch;
}

export function createEuropaIceCavern() {
  const root = new T.Group();
  root.name = 'europa-cathedral-ice-cavern';
  root.userData.visualOnly = true;
  const rock = new T.MeshStandardMaterial({
    color: '#b4d5ed',
    roughness: 0.68,
    metalness: 0.03,
    flatShading: true,
    emissive: '#23445e',
    emissiveIntensity: 0.13,
  });
  const ceiling = new T.MeshStandardMaterial({
    color: '#89afca',
    roughness: 0.52,
    metalness: 0.07,
    flatShading: true,
    emissive: '#13374e',
    emissiveIntensity: 0.1,
  });
  const crystal = new T.MeshStandardMaterial({
    color: '#e6faff',
    roughness: 0.2,
    metalness: 0.11,
    flatShading: true,
    emissive: '#5ad9ff',
    emissiveIntensity: 0.42,
  });
  // The cliff skin is uneven and rooted into the existing left/right walls.
  addBatch(
    root,
    'europa-cave-sculpted-wall',
    new T.DodecahedronGeometry(1, 0),
    rock,
    EUROPA_CAVE_BUDGET.wallRocks,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const z = -14 - Math.floor(i / 2) * 27;
      return {
        x: side * (37 + rng(i + 7) * 3),
        y: 13 + rng(i + 9) * 8,
        z,
        w: 7 + rng(i + 23) * 6,
        h: 21 + rng(i + 27) * 8,
        d: 17 + rng(i + 31) * 5,
        yaw: rng(i + 11) * 0.5,
      };
    },
  );
  addBatch(
    root,
    'europa-cave-vaulted-ceiling',
    new T.IcosahedronGeometry(1, 0),
    ceiling,
    EUROPA_CAVE_BUDGET.ceilingSpires,
    (i) => ({
      x: (rng(i + 45) - 0.5) * 57,
      y: 44 + rng(i + 48) * 2,
      z: -23 - i * 23,
      w: 13 + rng(i + 51) * 7,
      h: 10 + rng(i + 54) * 4,
      d: 16 + rng(i + 57) * 4,
      roll: (rng(i + 65) - 0.5) * 0.25,
    }),
  );
  addBatch(
    root,
    'europa-cave-hanging-ice-stalactites',
    new T.ConeGeometry(1, 1, 5),
    crystal,
    EUROPA_CAVE_BUDGET.crystalSpikes,
    (i) => {
      const side = i % 2 ? 1 : -1;
      return {
        x: side * (25 + rng(i + 70) * 5),
        y: 34 - rng(i + 73) * 2,
        z: -22 - Math.floor(i / 2) * 28,
        w: 2.3 + rng(i + 76) * 1.8,
        h: 8 + rng(i + 79) * 6,
        d: 2.1 + rng(i + 82) * 1.3,
        // Inverted stalactites, well clear of the ship and safe opening.
        roll: Math.PI + (rng(i + 84) - 0.5) * 0.15,
      };
    },
  );
  return root;
}
