import * as T from 'three';
import { fighter, createShipModule } from './visuals.js';
import { pilotAt, shipColorAt } from './pilots.js';

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
  const fur = material(id === 'jenifer' ? '#707a86' : id === 'calvin' ? '#28252d' : '#161a23');
  const armor = material(suitPalettes[grade][0], 0.7, 0.3),
    dark = material('#101925', 0.5);
  const trim = material(suitPalettes[grade][1], 0.8, 0.25),
    pink = material('#b87586');
  const glow = new T.MeshStandardMaterial({
    color: profile.color,
    emissive: profile.color,
    emissiveIntensity: 0.7,
  });
  const eye = material(id === 'jenifer' || id === 'bob' ? '#aedb91' : '#e3b95b');
  const white = material('#d9e0dc'),
    pupil = material('#070b13');
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
  ellipsoid(g, 'flight-suit', armor, 0, 0.25, 0, 0.67, 0.88, 0.4);
  ellipsoid(g, 'chest-plate', trim, 0, 0.38, 0.28, 0.48, 0.66, 0.2);
  plate(dark, 0, 0.38, 0.45, 0.23, 0.75, 0.1);
  plate(glow, 0, 0.6, 0.53, 0.12, 0.2, 0.05);
  plate(dark, 0, -0.38, 0, 1.13, 0.17, 0.8);
  plate(trim, 0, -0.38, 0.43, 0.26, 0.2, 0.08);
  plate(dark, 0, 0.35, -0.43, 0.7, 0.9, 0.23);
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
    miniature.position.set(-0.31 + index * 0.19, 0.02, 0.435);
    miniature.scale.setScalar(0.33);
    g.add(miniature);
  }
  for (const side of [-1, 1]) {
    ellipsoid(g, 'shoulder', trim, side * 0.76, 0.75, 0, 0.31, 0.3, 0.37);
    ellipsoid(g, 'arm', armor, side * 0.84, 0.12, 0, 0.23, 0.62, 0.25);
    ellipsoid(g, 'glove', dark, side * 0.85, -0.43, 0.04, 0.24, 0.28, 0.25);
    plate(glow, side * 0.79, 0.77, 0.35, 0.19, 0.08, 0.05);
    ellipsoid(g, 'leg', armor, side * 0.32, -0.98, 0, 0.28, 0.7, 0.28);
    ellipsoid(g, 'knee', trim, side * 0.32, -1.1, 0.2, 0.24, 0.27, 0.15);
    ellipsoid(g, 'boot', dark, side * 0.32, -1.65, 0.12, 0.3, 0.25, 0.45);
  }
  const head = new T.Group();
  head.name = 'head';
  head.position.y = 1.55;
  head.scale.setScalar(id === 'christopher' ? 1.13 : 1);
  g.add(head);
  ellipsoid(head, 'fur', fur, 0, 0, 0, 0.78, 0.66, 0.62);
  for (const side of [-1, 1]) {
    const ear = new T.Mesh(new T.ConeGeometry(0.3, 0.65, 3), fur);
    ear.name = 'ear';
    ear.position.set(side * 0.56, 0.62, 0);
    ear.rotation.z = side * -0.22;
    head.add(ear);
    const inner = new T.Mesh(new T.ConeGeometry(0.19, 0.42, 3), pink);
    inner.position.set(side * 0.56, 0.63, 0.12);
    inner.rotation.z = side * -0.22;
    head.add(inner);
    ellipsoid(head, 'cheek', fur, side * 0.4, -0.23, 0.37, 0.37, 0.31, 0.29);
    ellipsoid(head, 'eye-white', white, side * 0.31, 0.1, 0.55, 0.22, 0.17, 0.09);
    ellipsoid(head, 'iris', eye, side * 0.31, 0.1, 0.625, 0.12, 0.145, 0.04);
    ellipsoid(head, 'pupil', pupil, side * 0.31, 0.1, 0.66, 0.039, 0.12, 0.017);
    ellipsoid(head, 'catchlight', white, side * 0.28, 0.15, 0.68, 0.025, 0.03, 0.01);
    ellipsoid(head, 'brow', fur, side * 0.3, 0.27, 0.58, 0.27, 0.075, 0.1).rotation.z = side * 0.1;
    ellipsoid(head, 'muzzle', fur, side * 0.16, -0.24, 0.6, 0.23, 0.17, 0.16);
    for (let i = 0; i < 3; i++) {
      const whisker = new T.Mesh(new T.CylinderGeometry(0.008, 0.005, 0.48, 5), trim);
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
  g.scale.setScalar(id === 'calvin' ? 0.79 : ['christopher', 'bob'].includes(id) ? 1.08 : 0.93);
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
