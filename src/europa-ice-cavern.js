import * as T from 'three';

// The extended ice gorge is entirely physical: the visual rock skin and
// authoritative walls, roof, deck and gates share the same 940-unit depth.
export const EUROPA_CAVE_LENGTH = 1500;
// Europa is a natural glacial gorge, not an industrial slalom. The six
// industrial bars/collision gates belong ONLY to the first-city mission.
export const EUROPA_CAVE_GATE_DEPTHS = Object.freeze([]);
export const EUROPA_CAVE_BUDGET = Object.freeze({
  wallRocks: 114,
  ceilingSpires: 66,
  crystalSpikes: 108,
  entranceRocks: 10,
  archstones: 13,
  exteriorCliffs: 16,
  approachFjord: 24,
  frozenWaterfall: 18,
  naturalPillars: 22,
  buriedRuins: 14,
  iceVeins: 52,
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
      const z = -14 - Math.floor(i / 2) * 26;
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
      z: -23 - i * 22,
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
        z: -22 - Math.floor(i / 2) * 27,
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
      // Keep flanking cliffs behind the entrance, not as a huge foreground
      // shard that fills half of a portrait screen.
      const height = 34 + rng(i + 231) * 42;
      return {
        x: side * (147 + rng(i + 221) * 78),
        y: -7 + height * 0.46,
        z: -28 - Math.floor(i / 2) * 31,
        w: 16 + rng(i + 227) * 19,
        h: height,
        d: 22 + rng(i + 233) * 19,
        yaw: (rng(i + 239) - 0.5) * 0.55,
      };
    },
  );
  // Distant fjord silhouettes appear several seconds ahead of the true
  // cave mouth. They travel with the same physical tunnel, so the approach
  // grows naturally rather than spawning a portal in front of the player.
  addBatch(
    root,
    'europa-cave-distant-fjord-approach',
    new T.DodecahedronGeometry(1, 0),
    rock,
    EUROPA_CAVE_BUDGET.approachFjord,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const height = 46 + rng(i + 333) * 45;
      return {
        x: side * (86 + rng(i + 343) * 22 + row * 1.1),
        y: -7 + height * 0.43,
        z: 70 + row * 33,
        w: 15 + rng(i + 353) * 13,
        h: height,
        d: 20 + rng(i + 363) * 22,
        yaw: (rng(i + 373) - 0.5) * 0.45,
      };
    },
  );
  // Three distinct moments of the physical gorge: long lateral frozen falls
  // near the mouth, a crystalline cathedral in the middle and close-spaced
  // rock fins deeper inside. These are visuals only and keep the central
  // 64-unit collision-free flight lane open for ship and mecha.
  addBatch(
    root,
    'europa-cave-frozen-waterfalls',
    new T.ConeGeometry(1, 1, 6),
    crystal,
    EUROPA_CAVE_BUDGET.frozenWaterfall,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const section = Math.floor(i / 2);
      return {
        x: side * (46 + rng(i + 501) * 5),
        y: 18 + rng(i + 511) * 6,
        z: -75 - section * 89,
        w: 5.5 + rng(i + 521) * 4,
        h: 22 + rng(i + 531) * 13,
        d: 5 + rng(i + 541) * 3,
        pitch: Math.PI + (rng(i + 551) - 0.5) * 0.12,
      };
    },
  );
  addBatch(
    root,
    'europa-cave-cathedral-crystal-pillars',
    new T.IcosahedronGeometry(1, 0),
    crystal,
    EUROPA_CAVE_BUDGET.naturalPillars,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      return {
        x: side * (41 + rng(i + 561) * 6),
        y: 12 + rng(i + 571) * 9,
        z: -350 - row * 77,
        w: 5 + rng(i + 581) * 5,
        h: 20 + rng(i + 591) * 15,
        d: 8 + rng(i + 601) * 5,
        roll: (rng(i + 611) - 0.5) * 0.27,
      };
    },
  );
  addBatch(
    root,
    'europa-cave-buried-alien-ruins',
    new T.OctahedronGeometry(1, 0),
    new T.MeshStandardMaterial({
      color: '#507e95',
      roughness: 0.39,
      metalness: 0.24,
      flatShading: true,
      emissive: '#175977',
      emissiveIntensity: 0.34,
    }),
    EUROPA_CAVE_BUDGET.buriedRuins,
    (i) => ({
      x: (i % 2 ? 1 : -1) * (61 + rng(i + 621) * 15),
      y: 10 + rng(i + 631) * 8,
      z: -520 - Math.floor(i / 2) * 127,
      w: 9 + rng(i + 641) * 4,
      h: 14 + rng(i + 651) * 10,
      d: 7 + rng(i + 661) * 4,
      yaw: rng(i + 671) * 0.5,
    }),
  );
  // Fine cyan fissures on the inner cliff walls. No copy-pasted crossbars.
  addBatch(
    root,
    'europa-cave-luminous-ice-veins',
    new T.IcosahedronGeometry(1, 0),
    new T.MeshBasicMaterial({ color: '#8feaff', transparent: true, opacity: 0.32 }),
    EUROPA_CAVE_BUDGET.iceVeins,
    (i) => ({
      x: (i % 2 ? 1 : -1) * (40 + rng(i + 681) * 8),
      y: 7 + rng(i + 691) * 23,
      z: -60 - Math.floor(i / 2) * 56,
      w: 0.5 + rng(i + 701) * 1.2,
      h: 6 + rng(i + 711) * 9,
      d: 1.8 + rng(i + 721) * 3,
      roll: (rng(i + 731) - 0.5) * 0.4,
    }),
  );
  // Low-cost optical flow: one Points draw with time-based movement along
  // the walls. Near-field flecks add a readable speed cue to the fixed camera.
  const count = 96;
  const positions = new Float32Array(count * 3);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const flecks = new T.Points(
    geometry,
    new T.PointsMaterial({
      color: '#d9f9ff',
      size: 2.5,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      sizeAttenuation: true,
      blending: T.AdditiveBlending,
    }),
  );
  flecks.name = 'europa-cave-optical-flow-ice';
  flecks.userData.visualOnly = true;
  flecks.frustumCulled = false;
  root.add(flecks);
  updateEuropaIceCavernMotion(root, 0, 48);
  return root;
}

export function updateEuropaIceCavernMotion(root, seconds, speed = 48) {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(speed) || speed < 0)
    throw new RangeError('Invalid Europa cave optical flow');
  const flecks = root?.getObjectByName('europa-cave-optical-flow-ice');
  if (!flecks) return false;
  const attr = flecks.geometry.getAttribute('position');
  for (let i = 0; i < attr.count; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 45 - ((i * 41 + seconds * speed * 0.82) % (EUROPA_CAVE_LENGTH + 80));
    const wobble = Math.sin(seconds * 3.4 + i * 0.78) * 1.6;
    attr.setXYZ(i, side * (18 + rng(i + 404) * 13) + wobble, 4 + rng(i + 412) * 27, z);
  }
  attr.needsUpdate = true;
  return true;
}
