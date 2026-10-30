import * as T from 'three';

// GPU-instanced, non-collidable premium decoration. Gameplay remains authoritative
// in the original city and fighter models; these objects are purely visual.
const boxGeometry = new T.BoxGeometry(1, 1, 1);
const chrome = new T.MeshStandardMaterial({
  color: '#547489',
  metalness: 0.86,
  roughness: 0.27,
});
const darkArmor = new T.MeshStandardMaterial({
  color: '#1b3448',
  metalness: 0.82,
  roughness: 0.32,
});
const copper = new T.MeshStandardMaterial({
  color: '#ab8a72',
  metalness: 0.76,
  roughness: 0.3,
});
const tealLight = new T.MeshBasicMaterial({ color: new T.Color('#43defa').multiplyScalar(1.75) });
const goldLight = new T.MeshBasicMaterial({ color: new T.Color('#ffb36a').multiplyScalar(1.65) });

function instanced(group, name, geometry, material, count) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.userData.premiumDecoration = true;
  mesh.frustumCulled = false; // An individual high-rise can enter view independently.
  group.add(mesh);
  return mesh;
}

function matrix(mesh, index, x, y, z, sx, sy, sz, object) {
  object.position.set(x, y, z);
  object.scale.set(sx, sy, sz);
  object.updateMatrix();
  mesh.setMatrixAt(index, object.matrix);
}

function finish(group) {
  for (const mesh of group.children) mesh.instanceMatrix.needsUpdate = true;
  group.userData.premiumDecoration = true;
  group.visible = false;
  return group;
}

/**
 * Same building placements as the authoritative base city. Exactly five
 * additional instanced draws, independent of building count and flight physics.
 * The city can be cloned for the distant loop without creating new meshes.
 */
export function createPremiumCityDetails(buildings) {
  if (!Array.isArray(buildings) || buildings.some((b) =>
    !['x', 'z', 'h', 'w', 'depth'].every((k) => Number.isFinite(b[k])) ||
    !['h', 'w', 'depth'].every((k) => b[k] > 0))) {
    throw new TypeError('Premium city requires positive, finite building dimensions');
  }
  const group = new T.Group();
  group.name = 'city-premium-details';
  const count = buildings.length;
  const inset = instanced(group, 'premium-armor-insets', boxGeometry, darkArmor, count * 2);
  const decks = instanced(group, 'premium-terraces', boxGeometry, chrome, count * 2);
  const spines = instanced(group, 'premium-luminous-spines', boxGeometry, tealLight, count * 2);
  const roof = instanced(group, 'premium-rooftop-fins', boxGeometry, copper, count);
  const signs = instanced(group, 'premium-holo-billboards', boxGeometry, goldLight, Math.ceil(count / 5));
  const dummy = new T.Object3D();
  let signIndex = 0;
  buildings.forEach(({ x, z, h, w, depth }, i) => {
    const front = z + depth / 2;
    for (const side of [-1, 1]) {
      const index = i * 2 + (side === -1 ? 0 : 1);
      matrix(inset, index, x + side * w * 0.3, h * 0.54 - 7, front + 0.32,
        w * 0.24, h * 0.67, 0.22, dummy);
      matrix(decks, index, x, h * (side === -1 ? 0.27 : 0.75) - 7, front + 0.42,
        w * 0.94, 0.42, 0.62, dummy);
      matrix(spines, index, x + side * w * 0.47, h * 0.53 - 7, front + 0.41,
        0.18, h * 0.83, 0.17, dummy);
    }
    matrix(roof, i, x + w * 0.22, h + 5, z - depth * 0.16,
      0.6, 11 + i % 5 * 2, 1.1, dummy);
    if (i % 5 === 0) {
      matrix(signs, signIndex++, x, h * 0.76 - 7, front + 0.62,
        w * 0.56, Math.max(1.1, h * 0.085), 0.15, dummy);
    }
  });
  group.userData.drawCallBudget = 5;
  return finish(group);
}

/** Close-camera detail on all three player hull variants; no hitbox changes. */
export function createPremiumShipDetails(model = 'nova7') {
  const group = new T.Group();
  group.name = 'premium-ship-details';
  const plates = instanced(group, 'premium-wing-plates', boxGeometry, chrome, 16);
  const vents = instanced(group, 'premium-mechanical-vents', boxGeometry, darkArmor, 12);
  const tracks = instanced(group, 'premium-wing-light-tracks', boxGeometry, tealLight, 12);
  const thrusters = instanced(group, 'premium-thruster-markers', boxGeometry, goldLight, 4);
  const dummy = new T.Object3D();
  const span = model === 'specter' ? 1.12 : model === 'aegis' ? 0.94 : 1;
  for (let i = 0; i < 8; i++) {
    for (const side of [-1, 1]) {
      const index = i * 2 + (side === -1 ? 0 : 1);
      const x = side * (1.48 + i * 0.37) * span;
      matrix(plates, index, x, 0.37, 0.5 + (i % 3) * 0.3,
        0.28, 0.08, 0.47, dummy);
    }
  }
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const index = i * 2 + (side === -1 ? 0 : 1);
      matrix(vents, index, side * (1.65 + i * 0.3) * span, 0.51,
        -0.32 + (i % 2) * 0.4, 0.17, 0.11, 0.45, dummy);
      matrix(tracks, index, side * (1.78 + i * 0.37) * span, 0.49,
        0.7 + (i % 2) * 0.24, 0.11, 0.08, 0.65, dummy);
    }
  }
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    matrix(thrusters, i, side * (2.7 + Math.floor(i / 2) * 0.5) * span,
      0.18, 1.82, 0.3, 0.25, 0.58, dummy);
  }
  group.userData.drawCallBudget = 4;
  return finish(group);
}


/** Flagship silhouette and launch-bay accents, also purely cosmetic. */
export function createPremiumCarrierDetails() {
  const group = new T.Group();
  group.name = 'premium-flagship-details';
  const armor = instanced(group, 'premium-flagship-armor', boxGeometry, chrome, 28);
  const ribs = instanced(group, 'premium-flagship-ribs', boxGeometry, darkArmor, 24);
  const lights = instanced(group, 'premium-launch-bay-beacons', boxGeometry, tealLight, 16);
  const towers = instanced(group, 'premium-defense-silhouettes', boxGeometry, copper, 12);
  const dummy = new T.Object3D();
  for (let i = 0; i < 28; i++) {
    const side = i % 2 ? 1 : -1;
    matrix(armor, i, side * (30 + Math.floor(i / 2) * 3.3), 6.2,
      -17 + i % 7 * 5.2, 2.3, 0.6, 3.8, dummy);
  }
  for (let i = 0; i < 24; i++) {
    const side = i % 2 ? 1 : -1;
    matrix(ribs, i, side * (38 + Math.floor(i / 2) * 2.4), 4.6,
      -14 + i % 6 * 5.5, 0.6, 3, 2.3, dummy);
  }
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    matrix(lights, i, side * (18.2 + Math.floor(i / 2) * 2), -5,
      21.8, 0.35, 0.55 + i % 3 * 0.2, 0.4, dummy);
  }
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    matrix(towers, i, side * (27 + Math.floor(i / 2) * 8),
      11, -10 + i % 3 * 9, 2.4, 10, 2.4, dummy);
  }
  group.userData.drawCallBudget = 4;
  return finish(group);
}
