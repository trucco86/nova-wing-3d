import * as T from 'three';

// A single 520-unit frozen cavern replaces Europa's anonymous industrial
// tunnel skin. Gameplay collision boxes, breach panel and projectile blocking
// still belong exclusively to the pre-existing tunnel obstacle.
export const EUROPA_CAVE_LENGTH = 520;
export const EUROPA_CAVE_BUDGET = Object.freeze({
  wallRocks: 38,
  ceilingSpires: 22,
  crystalSpikes: 36,
  entranceRocks: 10,
  archstones: 13,
  exteriorCliffs: 16,
  gateFacets: 72,
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
        x: side * (47 + rng(i + 7) * 3),
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
      y: 53 + rng(i + 48) * 2,
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
        x: side * (36 + rng(i + 70) * 3),
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
  // Massive, unmistakable cave mouth rather than a rectangular loading
  // corridor. These sculpted boulders frame the safe 64-unit width without
  // adding colliders; the functional tunnel walls remain underneath.
  addBatch(
    root,
    'europa-cave-monumental-entrance',
    new T.DodecahedronGeometry(1, 0),
    rock,
    EUROPA_CAVE_BUDGET.entranceRocks,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      return {
        x: side * (42 + row * 1.5),
        y: 14 + row * 4,
        z: -row * 2.5,
        w: 8 + row,
        h: 14 - row * 0.8,
        d: 10 + row,
        yaw: side * (row % 2 ? 0.19 : -0.11),
      };
    },
  );
  // A jagged, layered arch closes the square roof silhouette at the mouth.
  // Their undersides closely follow the physical ceiling at y=37, and are only
  // visual decoration. They never change the 520-unit tunnel's hitboxes.
  addBatch(
    root,
    'europa-cave-natural-ice-arch',
    new T.IcosahedronGeometry(1, 0),
    ceiling,
    EUROPA_CAVE_BUDGET.archstones,
    (i) => {
      const x = -31 + (i * 62) / (EUROPA_CAVE_BUDGET.archstones - 1);
      return {
        x,
        y: 40 + 2.4 * (1 - Math.abs(x) / 32) + rng(i + 161) * 1.5,
        z: -3 - rng(i + 171) * 6,
        w: 4.5 + rng(i + 181) * 1.2,
        h: 4.6 + rng(i + 191) * 0.7,
        d: 8 + rng(i + 201) * 3,
        roll: (rng(i + 211) - 0.5) * 0.4,
      };
    },
  );
  // The exterior must read as a glacial fissure, not a doorway floating in
  // outer space. One batched row of natural cliffs surrounds the cave mouth.
  // This skyline remains outside the 64-unit corridor and has no hitboxes.
  addBatch(
    root,
    'europa-cave-exterior-glacial-cliffs',
    new T.DodecahedronGeometry(1, 0),
    rock,
    EUROPA_CAVE_BUDGET.exteriorCliffs,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const height = 48 + rng(i + 231) * 55;
      return {
        x: side * (103 + rng(i + 221) * 60),
        y: -7 + height * 0.46,
        z: 24 - Math.floor(i / 2) * 26,
        w: 18 + rng(i + 227) * 24,
        h: height,
        d: 29 + rng(i + 233) * 21,
        yaw: (rng(i + 239) - 0.5) * 0.55,
      };
    },
  );
  // Break up the repetitive square gate surfaces with shallow crystalline
  // facets. These shards sit on the EXISTING physical gate solids, so the
  // collision opening, breakable right wall and projectile checks stay exact.
  addBatch(
    root,
    'europa-cave-faceted-gate-skin',
    new T.DodecahedronGeometry(1, 0),
    new T.MeshStandardMaterial({
      color: '#9bd4e7',
      roughness: 0.28,
      metalness: 0.1,
      flatShading: true,
      emissive: '#277896',
      emissiveIntensity: 0.34,
    }),
    EUROPA_CAVE_BUDGET.gateFacets,
    (i) => {
      const gate = Math.floor(i / 24);
      const side = Math.floor((i % 24) / 12) === 0 ? -1 : 1;
      const row = i % 12;
      const gap = gate % 2 ? -9 : 9;
      const left = gap - 15;
      const right = gap + 15;
      const min = side < 0 ? -32 : right;
      const max = side < 0 ? left : 32;
      const margin = Math.min(2.5, (max - min) * 0.22);
      const center = (min + max) * 0.5;
      const offset = (rng(i + 94) - 0.5) * (max - min) * 0.55;
      return {
        x: Math.max(min + margin, Math.min(max - margin, center + offset)),
        y: -1 + (row % 6) * 6.1 + (rng(i + 123) - 0.5) * 3,
        z: -107 - gate * 150,
        w: Math.min(2.8, (max - min) * 0.23),
        h: 2.1 + (i % 3) * 0.7,
        d: 1.4,
        yaw: rng(i + 141) * 0.9,
        roll: (rng(i + 149) - 0.5) * 0.4,
      };
    },
  );
  return root;
}
