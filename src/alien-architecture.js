import * as T from 'three';

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
  for (let i = 0; i < count; i++) {
    const position = positionAt(i);
    dummy.position.set(position.x, position.y, position.z);
    dummy.rotation.set(0, position.yaw ?? 0, position.lean ?? 0);
    dummy.scale.set(position.width, position.height, position.depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
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
  // Different civilisations need different silhouettes, not one pyramid
  // duplicated with five material tints. Venus/Titan own stone pyramids,
  // Europa frozen vaults, Neptune bio-structures and Orion monolith arrays.
  const primaryShape =
    theme === 'ice'
      ? new T.OctahedronGeometry(1, 0)
      : theme === 'nebula'
        ? new T.DodecahedronGeometry(1, 0)
        : theme === 'void'
          ? new T.CylinderGeometry(0.54, 1, 1, 5)
          : new T.ConeGeometry(1, 1, 4);
  if (theme === 'sun' || theme === 'throne') primaryShape.rotateY(Math.PI / 4);
  const structureHeight = (theme === 'void' ? 94 : theme === 'nebula' ? 75 : 60) * profile.height;
  const structureWidth = theme === 'void' ? 35 : theme === 'nebula' ? 39 : 53;
  createBatch(root, profile.site + '-' + profile.structure, primaryShape, stone, 10, (i) => {
    const s = widthAt(i);
    return {
      ...locations[i],
      y: locations[i].y + (15 + structureHeight / 2) * s,
      width: structureWidth * s,
      height: structureHeight * s,
      depth: structureWidth * s,
    };
  });
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
  setAlienArchitectureQuality(root, quality);
  return root;
}

export function setAlienArchitectureQuality(root, quality) {
  if (!root) return;
  for (const child of root.children) {
    if (child.userData.highOnly) child.visible = quality === 'high';
  }
}
