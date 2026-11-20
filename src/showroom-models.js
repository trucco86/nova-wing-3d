import * as T from 'three';
import { fighter, createShipModule } from './visuals.js';
import { pilotAt, shipColorAt } from './pilots.js';

// Adapt the existing lightweight Three.js cats to the approved character
// spotlights. Palette and face identity are independent of gameplay bonuses.
export const PILOT_ART_DIRECTION = Object.freeze({
  bia: Object.freeze({
    suit: '#26313b',
    armor: '#dde5e5',
    trim: '#a5bbc1',
    light: '#48dfd5',
    iris: '#e4ad4a',
    ear: 1.03,
    muzzle: 0.94,
    harness: '#a2a4a0',
  }),
  bob: Object.freeze({
    suit: '#20252e',
    armor: '#808b93',
    trim: '#66747e',
    light: '#40cbd9',
    iris: '#d9ac53',
    ear: 0.9,
    muzzle: 1.09,
    harness: '#958575',
  }),
  christopher: Object.freeze({
    suit: '#1c222d',
    armor: '#87949d',
    trim: '#7e8b9b',
    light: '#3b9de4',
    iris: '#d9a74f',
    ear: 0.86,
    muzzle: 1.13,
    harness: '#8f8174',
  }),
  calvin: Object.freeze({
    suit: '#273535',
    armor: '#8b9d85',
    trim: '#a4b5a0',
    light: '#6ee5a5',
    iris: '#e8b457',
    ear: 1.22,
    muzzle: 0.88,
    harness: '#8b9275',
  }),
  jenifer: Object.freeze({
    suit: '#29454c',
    armor: '#b2ced0',
    trim: '#cadbd9',
    light: '#55d4d1',
    iris: '#80bf94',
    ear: 1.16,
    muzzle: 0.97,
    harness: '#957f69',
  }),
});

// Preview resources are private: disposing them must never affect the live fighter.
export function createShowroomShip(model, color) {
  const ship = fighter();
  const module = createShipModule(model);
  const moduleGeometry = new Set();
  module.traverse((o) => {
    if (o.geometry) moduleGeometry.add(o.geometry);
  });
  ship.add(module);
  const privateMaterials = new Set([
    ...ship.userData.paint,
    ...ship.userData.flames.map((o) => o.material),
  ]);
  ship.traverse((o) => {
    if (o.material?.userData.paintModule) privateMaterials.add(o.material);
  });
  const geometry = new Map(),
    materials = new Map();
  const palette = shipColorAt(color);
  ship.traverse((o) => {
    if (o.geometry) {
      if (!geometry.has(o.geometry)) geometry.set(o.geometry, o.geometry.clone());
      o.geometry = geometry.get(o.geometry);
    }
    if (o.material) {
      const original = o.material;
      if (!materials.has(original)) materials.set(original, original.clone());
      o.material = materials.get(original);
      if (original.userData.paintModule || original.userData.paintAccent === false)
        o.material.color.set(palette.color);
      if (original.userData.paintAccent) o.material.color.set(palette.accent);
    }
  });
  // fighter() creates private paint/flame materials; the preview uses the clones above.
  privateMaterials.forEach((m) => m.dispose());
  moduleGeometry.forEach((g) => g.dispose());
  ship.userData.flames.forEach((o) => {
    // Original flame clones were replaced during traversal; shared templates stay intact.
    o.scale.z = 0.65;
  });
  ship.rotation.y = Math.PI;
  return ship;
}

export function createShowroomPilot(id, uniform = 0, earnedMedals = 0) {
  const profile = pilotAt(id),
    g = new T.Group();
  const grade = Math.min(4, Math.max(0, Number.isFinite(uniform) ? Math.floor(uniform) : 0));
  const medalCount = Math.min(
    3,
    Math.max(0, Number.isFinite(earnedMedals) ? Math.floor(earnedMedals) : 0),
  );
  const suitPalettes = [
    ['#2b414a', '#a6b5bd'],
    ['#244d60', '#82c5e6'],
    ['#344e5d', '#c1d2da'],
    ['#323d5d', '#efc36d'],
    ['#2f3b74', '#f5deb2'],
  ];
  g.userData.uniformGrade = grade;
  g.userData.medalCount = medalCount;
  g.name = 'pilot-model-' + profile.id;
  const material = (color, metalness = 0.1, roughness = 0.65) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  // Single feline identity across the hangar, cinematic launch and pilot selection.
  const direction = PILOT_ART_DIRECTION[profile.id];
  g.userData.artIdentity = profile.id;
  const fur = material(profile.fur, 0.08, 0.78);
  const armor = material(grade === 0 ? direction.suit : suitPalettes[grade][0], 0.7, 0.3),
    dark = material('#101925', 0.5);
  const trim = material(grade === 0 ? direction.armor : suitPalettes[grade][1], 0.8, 0.25),
    faceTrim = material(direction.trim, 0.68, 0.35),
    harness = material(direction.harness, 0.48, 0.56),
    pink = material(id === 'bob' || id === 'christopher' ? '#493f43' : '#b87586');
  const glow = new T.MeshStandardMaterial({
    color: direction.light,
    emissive: direction.light,
    emissiveIntensity: 0.7,
  });
  const eye = material(direction.iris);
  const white = material('#d9e0dc'),
    pupil = material('#070b13'),
    whiskerMat = material('#b5c1c7', 0, 0.85);
  function ellipsoid(parent, name, m, x, y, z, sx, sy, sz) {
    const o = new T.Mesh(new T.SphereGeometry(1, 28, 20), m);
    o.name = name;
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    parent.add(o);
    return o;
  }
  function plate(m, x, y, z, sx, sy, sz) {
    const o = new T.Mesh(new T.BoxGeometry(sx, sy, sz), m);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  }
  // Distinct body masses: Christopher remains largest, Bob only slightly slimmer.
  const torsoWidth = id === 'christopher' ? 0.74 : id === 'bob' ? 0.7 : 0.63;
  ellipsoid(g, 'flight-suit', armor, 0, 0.25, 0, torsoWidth, 0.88, 0.4);
  ellipsoid(g, 'chest-plate', trim, 0, 0.38, 0.28, 0.48, 0.66, 0.2);
  plate(dark, 0, 0.38, 0.45, 0.23, 0.75, 0.1);
  plate(glow, 0, 0.6, 0.53, 0.12, 0.2, 0.05);
  plate(dark, 0, -0.38, 0, 1.13, 0.17, 0.8);
  plate(trim, 0, -0.38, 0.43, 0.26, 0.2, 0.08);
  plate(dark, 0, 0.35, -0.43, 0.7, 0.9, 0.23);
  // The flight suit is now recognizably close to the approved spotlight:
  // metal chest plating, diagonal harness and a rigid illuminated collar.
  for (const side of [-1, 1]) {
    const strap = plate(harness, side * 0.32, 0.28, 0.49, 0.105, 1.17, 0.075);
    strap.name = 'pilot-art-harness';
    strap.rotation.z = -side * 0.3;
    const collar = plate(faceTrim, side * 0.32, 1.06, 0.19, 0.55, 0.16, 0.42);
    collar.name = 'pilot-art-collar';
    collar.rotation.z = side * -0.12;
    const chestRail = plate(glow, side * 0.37, 0.47, 0.52, 0.18, 0.045, 0.055);
    chestRail.name = 'pilot-art-chest-light';
    chestRail.rotation.z = side * -0.2;
  }
  // Earned feline rank is real, lightweight showroom geometry, not an overlay
  // detached from the cat pilot. Preserve all existing fur/eye/body proportions.
  const chestCrestShape = new T.Shape();
  chestCrestShape.moveTo(-0.18, 0.08);
  chestCrestShape.lineTo(-0.15, 0.26);
  chestCrestShape.lineTo(-0.06, 0.19);
  chestCrestShape.lineTo(0.06, 0.19);
  chestCrestShape.lineTo(0.15, 0.26);
  chestCrestShape.lineTo(0.18, 0.08);
  chestCrestShape.quadraticCurveTo(0.17, -0.15, 0, -0.18);
  chestCrestShape.quadraticCurveTo(-0.17, -0.15, -0.18, 0.08);
  const badge = new T.Mesh(new T.ShapeGeometry(chestCrestShape), trim);
  badge.name = 'pilot-feline-rank-insignia';
  badge.position.set(0, 0.32, 0.57);
  g.add(badge);
  if (grade >= 1) {
    for (const side of [-1, 1]) {
      for (let stripe = 0; stripe < Math.min(3, grade); stripe++) {
        const bar = plate(trim, side * 0.69, 0.89 - stripe * 0.1, 0.3, 0.25, 0.035, 0.04);
        bar.name = 'pilot-cat-service-stripe';
        bar.rotation.z = side * 0.24;
      }
    }
  }
  if (grade >= 3) {
    for (const side of [-1, 1]) {
      const wingTrim = plate(glow, side * 0.31, 0.45, 0.52, 0.18, 0.035, 0.03);
      wingTrim.name = 'pilot-command-wing';
      wingTrim.rotation.z = side * -0.26;
    }
  }
  for (let index = 0; index < medalCount; index++) {
    const miniature = new T.Mesh(new T.ShapeGeometry(chestCrestShape), trim);
    miniature.name = 'pilot-earned-cat-medal';
    miniature.position.set(-0.31 + index * 0.19, 0.02, 0.58);
    miniature.scale.setScalar(0.33);
    g.add(miniature);
  }
  for (const side of [-1, 1]) {
    ellipsoid(g, 'shoulder', trim, side * 0.76, 0.75, 0, 0.31, 0.3, 0.37);
    ellipsoid(g, 'arm', armor, side * 0.84, 0.12, 0, 0.23, 0.62, 0.25);
    ellipsoid(g, 'glove', dark, side * 0.85, -0.43, 0.04, 0.24, 0.28, 0.25);
    plate(glow, side * 0.79, 0.77, 0.35, 0.19, 0.08, 0.05);
    const shoulderCrest = plate(faceTrim, side * 0.76, 0.9, 0.21, 0.31, 0.09, 0.19);
    shoulderCrest.name = 'pilot-art-shoulder-armor';
    shoulderCrest.rotation.z = -side * 0.3;
    ellipsoid(g, 'leg', armor, side * 0.32, -0.98, 0, 0.28, 0.7, 0.28);
    ellipsoid(g, 'knee', trim, side * 0.32, -1.1, 0.2, 0.24, 0.27, 0.15);
    ellipsoid(g, 'boot', dark, side * 0.32, -1.65, 0.12, 0.3, 0.25, 0.45);
  }
  const head = new T.Group();
  head.name = 'head';
  head.position.y = 1.55;
  head.scale.setScalar(id === 'christopher' ? 1.13 : 1);
  g.add(head);
  ellipsoid(head, 'fur', fur, 0, 0, 0, 0.78 * direction.muzzle, 0.66, 0.62);
  // Low-cost sculpted silhouette details, readable on the close-up and roster.
  ellipsoid(head, 'feline-chin', fur, 0, -0.42, 0.37, 0.45, 0.19, 0.28);
  ellipsoid(head, 'muzzle-bridge', fur, 0, -0.1, 0.55, 0.19, 0.27, 0.15);
  for (const side of [-1, 1]) {
    const ear = new T.Mesh(new T.ConeGeometry(0.3, 0.65, 3), fur);
    ear.name = 'ear';
    ear.position.set(side * 0.56, 0.62 + (direction.ear - 1) * 0.18, 0);
    ear.scale.y = direction.ear;
    ear.rotation.z = side * -0.22;
    head.add(ear);
    const inner = new T.Mesh(new T.ConeGeometry(0.19, 0.42, 3), pink);
    inner.position.set(side * 0.56, 0.63 + (direction.ear - 1) * 0.18, 0.12);
    inner.scale.y = direction.ear;
    inner.rotation.z = side * -0.22;
    head.add(inner);
    ellipsoid(head, 'cheek', fur, side * 0.4, -0.23, 0.37, 0.37, 0.31, 0.29);
    if (id === 'bob' || id === 'christopher') {
      const tuft = new T.Mesh(new T.ConeGeometry(0.2, 0.43, 4), fur);
      tuft.name = 'feline-cheek-fur';
      tuft.position.set(side * 0.68, -0.32, 0.24);
      tuft.rotation.z = side * -0.95;
      head.add(tuft);
    }
    ellipsoid(head, 'eye-white', white, side * 0.31, 0.1, 0.55, 0.22, 0.17, 0.09);
    ellipsoid(head, 'iris', eye, side * 0.31, 0.1, 0.625, 0.12, 0.145, 0.04);
    ellipsoid(head, 'pupil', pupil, side * 0.31, 0.1, 0.66, 0.039, 0.12, 0.017);
    ellipsoid(head, 'catchlight', white, side * 0.28, 0.15, 0.68, 0.025, 0.03, 0.01);
    ellipsoid(head, 'brow', fur, side * 0.3, 0.27, 0.58, 0.27, 0.075, 0.1).rotation.z = side * 0.1;
    ellipsoid(head, 'muzzle', fur, side * 0.16, -0.24, 0.6, 0.23, 0.17, 0.16);
    for (let i = 0; i < 3; i++) {
      const whisker = new T.Mesh(new T.CylinderGeometry(0.008, 0.005, 0.48, 5), whiskerMat);
      whisker.position.set(side * 0.63, -0.19 - i * 0.07, 0.64);
      whisker.rotation.z = side * (1.1 + i * 0.2);
      head.add(whisker);
    }
  }
  ellipsoid(head, 'nose', pink, 0, -0.14, 0.76, 0.115, 0.07, 0.06);
  const tailPath = new T.CatmullRomCurve3([
    new T.Vector3(0, -0.4, -0.3),
    new T.Vector3(0.5, -0.5, -0.8),
    new T.Vector3(1, -0.2, -0.75),
    new T.Vector3(1.05, 0.35, -0.7),
  ]);
  const tail = new T.Mesh(
    new T.TubeGeometry(tailPath, 24, id === 'calvin' ? 0.065 : 0.11, 8, false),
    fur,
  );
  g.add(tail);
  // Christopher and Bob share a large body; Bia and Jenifer share the smaller one.
  g.scale.setScalar(
    id === 'calvin' ? 0.79 : id === 'christopher' ? 1.11 : id === 'bob' ? 1.055 : 0.93,
  );
  return g;
}

export function disposeShowroomModel(model) {
  const geometry = new Set(),
    materials = new Set();
  model?.traverse((o) => {
    if (o.geometry) geometry.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometry.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
