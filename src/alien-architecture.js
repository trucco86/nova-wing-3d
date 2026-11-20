import * as T from 'three';
import {
  createAlienMonumentGeometry,
  createEuropaSunkenVaultGeometry,
} from './alien-monument-geometry.js';

// Authored ruins for the worlds that were still recycling planet/torus props.
// All architecture is background-only; it never becomes a hidden collision wall.
export const ANCIENT_WORLD_THEMES = Object.freeze({
  sun: Object.freeze({
    structure: 'sulfur-pyramids',
    site: 'venus-sulfur-temples',
    stone: '#755849',
    base: '#493d3a',
    trim: '#dcb983',
    energy: '#a5dbdd',
    elevation: -36,
    height: 1.05,
  }),
  ice: Object.freeze({
    structure: 'glacial-vaults',
    site: 'europa-buried-vaults',
    stone: '#54778b',
    base: '#334e63',
    trim: '#a9d9e2',
    energy: '#90e7ff',
    elevation: -19,
    height: 0.78,
  }),
  nebula: Object.freeze({
    structure: 'biomechanical-spires',
    site: 'neptune-ancient-spires',
    stone: '#375587',
    base: '#202f54',
    trim: '#93a7d2',
    energy: '#78e0da',
    elevation: -17,
    height: 1.18,
  }),
  void: Object.freeze({
    structure: 'gravity-monoliths',
    site: 'orion-gravity-monuments',
    stone: '#3d4b66',
    base: '#1a223c',
    trim: '#8e9cba',
    energy: '#80d8f1',
    elevation: -27,
    height: 1.36,
  }),
  throne: Object.freeze({
    structure: 'obsidian-citadel-pyramids',
    site: 'titan-obsidian-citadel',
    stone: '#64504a',
    base: '#342e38',
    trim: '#bc9066',
    energy: '#8ce8d5',
    elevation: -32,
    height: 1.45,
  }),
});

function createBatch(root, name, geometry, material, count, positionAt) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.frustumCulled = false;
  mesh.userData.visualOnly = true;
  const dummy = new T.Object3D();
  const depth = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const position = positionAt(i);
    dummy.position.set(position.x, position.y, position.z);
    dummy.rotation.set(0, position.yaw ?? 0, position.lean ?? 0);
    dummy.scale.set(position.width, position.height, position.depth);
    depth[i] = position.z;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.userData.authoredDepth = depth;
  mesh.instanceMatrix.needsUpdate = true;
  root.add(mesh);
  return mesh;
}

export function createAlienArchitecture(theme, quality = 'high') {
  const profile = ANCIENT_WORLD_THEMES[theme];
  if (!profile) return null;
  const root = new T.Group();
  root.name = 'alien-architecture-' + theme;
  root.userData.site = profile.site;
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  const stone = new T.MeshStandardMaterial({
    color: profile.stone,
    roughness: 0.77,
    metalness: 0.24,
    flatShading: true,
  });
  const basalt = new T.MeshStandardMaterial({
    color: profile.base,
    roughness: 0.88,
    metalness: 0.08,
    flatShading: true,
  });
  const trim = new T.MeshStandardMaterial({
    color: profile.trim,
    roughness: 0.48,
    metalness: 0.52,
  });
  const energy = new T.MeshBasicMaterial({
    color: profile.energy,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  // An offset left/right trail never occupies the central x +/- 72 flight lane.
  // Each structure sits on a slab and an excavated rock foundation; no more
  // orphaned columns or triangular props floating without a physical context.
  const locations = Array.from({ length: 10 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return {
      x: side * (156 + (i % 3) * 57),
      y: profile.elevation + (i % 3) * 7,
      z: -245 - i * 137,
      yaw: ((i % 5) - 2) * 0.105,
      size: 0.76 + (i % 4) * 0.14,
    };
  });
  const widthAt = (i) => locations[i].size;
  createBatch(
    root,
    profile.site + '-bedrock',
    new T.DodecahedronGeometry(1, 0),
    basalt,
    10,
    (i) => {
      const s = widthAt(i);
      return {
        ...locations[i],
        y: locations[i].y - 10,
        width: 38 * s,
        height: 17 * s,
        depth: 44 * s,
      };
    },
  );
  createBatch(root, profile.site + '-terraces', new T.BoxGeometry(1, 1, 1), stone, 10, (i) => {
    const s = widthAt(i);
    return {
      ...locations[i],
      y: locations[i].y + 8 * s,
      width: 72 * s,
      height: 11 * s,
      depth: 76 * s,
    };
  });
  // Authored, vertex-coloured PBR monuments bring structural detail to each
  // civilisation without adding separate draws, textures or point lights.
  const primaryShape = createAlienMonumentGeometry(theme);
  const monumentMaterial = new T.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    metalness: theme === 'nebula' ? 0.29 : 0.38,
    roughness: theme === 'ice' ? 0.45 : 0.67,
    flatShading: true,
    emissive: theme === 'ice' ? '#102733' : '#090a0d',
    emissiveIntensity: 0.08,
  });
  const structureHeight = (theme === 'void' ? 94 : theme === 'nebula' ? 75 : 60) * profile.height;
  const structureWidth = theme === 'void' ? 35 : theme === 'nebula' ? 39 : 53;
  createBatch(
    root,
    profile.site + '-' + profile.structure,
    primaryShape,
    monumentMaterial,
    10,
    (i) => {
      const s = widthAt(i);
      return {
        ...locations[i],
        y: locations[i].y + (15 + structureHeight / 2) * s,
        width: structureWidth * s,
        height: structureHeight * s,
        depth: structureWidth * s,
      };
    },
  );
  createBatch(root, profile.site + '-capstones', new T.OctahedronGeometry(1, 0), trim, 10, (i) => {
    const s = widthAt(i);
    return {
      ...locations[i],
      y: locations[i].y + (15 + structureHeight) * s,
      width: 9 * s,
      height: 9 * s,
      depth: 9 * s,
      yaw: Math.PI / 4,
    };
  });
  // Paired obelisks establish scale and a repeatable visual path to the
  // citadels. Their emissive glyphs are decorative and stay outside the lane.
  createBatch(
    root,
    profile.site + '-obelisk-pairs',
    new T.BoxGeometry(1, 1, 1),
    basalt,
    20,
    (i) => {
      const p = locations[Math.floor(i / 2)];
      const s = p.size;
      const offset = i % 2 ? 1 : -1;
      return {
        x: p.x + offset * 39 * s,
        y: p.y + 35 * s,
        z: p.z + 7,
        width: 9 * s,
        height: 62 * s,
        depth: 10 * s,
        lean: offset * 0.02,
      };
    },
  );
  const runes = createBatch(
    root,
    profile.site + '-emissive-runes',
    new T.BoxGeometry(1, 1, 1),
    energy,
    20,
    (i) => {
      const p = locations[Math.floor(i / 2)];
      const s = p.size;
      const offset = i % 2 ? 1 : -1;
      return {
        x: p.x + offset * 39 * s,
        y: p.y + 33 * s,
        z: p.z + 12 * s,
        width: 1.3 * s,
        height: 27 * s,
        depth: 0.8 * s,
      };
    },
  );
  runes.userData.highOnly = true;
  if (theme === 'ice') {
    // One hero structure provides the visual destination for the frozen
    // journey. Build it as a single draw, away from the x +/- 72 flight lane.
    // Its darker masonry contrasts with the already-authored glacial ridges.
    const vault = createBatch(
      root,
      'europa-sunken-alien-vault-hero',
      createEuropaSunkenVaultGeometry(),
      new T.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        roughness: 0.6,
        metalness: 0.2,
        flatShading: true,
        emissive: '#112f41',
        emissiveIntensity: 0.08,
      }),
      1,
      () => ({
        x: -165,
        y: 43,
        // It begins deep in the landscape, approaches once and becomes a
        // stable visual destination; a unique hero building must not loop.
        z: -650,
        width: 108,
        height: 116,
        depth: 73,
        yaw: 0.13,
      }),
    );
    vault.userData.heroLandmark = true;
  }
  setAlienArchitectureQuality(root, quality);
  return root;
}

export function setAlienArchitectureQuality(root, quality) {
  if (!root) return;
  for (const child of root.children) {
    if (child.userData.highOnly) child.visible = quality === 'high';
  }
}

const FAR_DEPTH = -1700;
const DEPTH_SPAN = 1825;
const PARALLAX_RATE = 0.22;
const HERO_APPROACH_RATE = 0.065;
const HERO_NEAR_DEPTH = -285;

// Background ruins may loop after leaving the camera, but a unique mission
// landmark must NEVER wrap into empty space or vanish at a random moment.
// Keep the Europa hero vault progressively readable in the middle of flight
// until the separate boss arena transition explicitly hides its entire site.
// Only instance translations change: no extra draws or allocations per frame.
export function updateAlienArchitecture(root, travel) {
  if (!root || !Number.isFinite(travel)) return;
  const advanced = travel * PARALLAX_RATE;
  for (const mesh of root.children) {
    const base = mesh.userData.authoredDepth;
    if (!base) continue;
    const matrices = mesh.instanceMatrix.array;
    for (let i = 0; i < base.length; i++) {
      if (mesh.userData.heroLandmark) {
        matrices[i * 16 + 14] = Math.min(
          HERO_NEAR_DEPTH,
          base[i] + Math.max(0, travel) * HERO_APPROACH_RATE,
        );
      } else {
        const distance = base[i] + advanced - FAR_DEPTH;
        const wrapped = ((distance % DEPTH_SPAN) + DEPTH_SPAN) % DEPTH_SPAN;
        matrices[i * 16 + 14] = FAR_DEPTH + wrapped;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
