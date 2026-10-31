import * as T from 'three';

/**
 * Graphics 3.3: bounded hard-surface detailing for existing gameplay models.
 * Additive decoration only — no hitboxes, rig changes or damage multipliers.
 * Reuses parent paint material so ship colour choices still cover the shell.
 */
const shapePanel = (w, h, bevel = 0.14) => {
  const b = Math.min(w, h) * bevel;
  const s = new T.Shape();
  s.moveTo(-w / 2 + b, -h / 2);
  s.lineTo(w / 2 - b, -h / 2);
  s.lineTo(w / 2, -h / 2 + b);
  s.lineTo(w / 2, h / 2 - b);
  s.lineTo(w / 2 - b, h / 2);
  s.lineTo(-w / 2 + b, h / 2);
  s.lineTo(-w / 2, h / 2 - b);
  s.lineTo(-w / 2, -h / 2 + b);
  s.closePath();
  return s;
};

function plate(parent, name, material, w, h, depth, x, y, z, turn = 0) {
  const geometry = new T.ExtrudeGeometry(shapePanel(w, h), {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: Math.min(0.06, depth / 4),
    bevelThickness: Math.min(0.05, depth / 4),
  });
  geometry.translate(0, 0, -depth / 2);
  const part = new T.Mesh(geometry, material);
  part.name = name;
  part.position.set(x, y, z);
  part.rotation.z = turn;
  part.userData.visualOnly = true;
  parent.add(part);
  return part;
}

function cylinder(parent, name, material, radius, depth, x, y, z, alongZ = true) {
  const part = new T.Mesh(new T.CylinderGeometry(radius, radius * 1.07, depth, 12), material);
  part.name = name;
  part.position.set(x, y, z);
  if (alongZ) part.rotation.x = Math.PI / 2;
  part.userData.visualOnly = true;
  parent.add(part);
  return part;
}

function ring(parent, name, material, radius, x, y, z) {
  const part = new T.Mesh(new T.TorusGeometry(radius, Math.max(0.045, radius * 0.1), 8, 20), material);
  part.name = name;
  part.position.set(x, y, z);
  part.userData.visualOnly = true;
  parent.add(part);
  return part;
}

export function addFighterDetail(ship, { armor, accent, emission, enemy = false }) {
  const root = new T.Group();
  root.name = enemy ? 'enemy-premium-airframe' : 'nova7-premium-airframe';
  root.userData.visualOnly = true;
  // Stepped side fairings, individually swept intakes and three vent ribs per
  // side give a readable aircraft silhouette rather than a flat light bar.
  for (const side of [-1, 1]) {
    const fairing = plate(root, 'airframe-swept-fairing', armor, 1.9, 3.3, 0.4,
      side * 1.23, 0.25, -0.05, side * -0.13);
    fairing.rotation.x = -0.18;
    plate(root, 'airframe-hull-armor', armor, 1.1, 2.0, 0.3,
      side * 0.55, 0.43, -1.85, -side * 0.1);
    for (let n = 0; n < 3; n++) {
      plate(root, 'airframe-intake-louver', accent, 0.45, 0.18, 0.12,
        side * (1.55 + n * 0.34), 0.48, 0.65 + n * 0.27, -side * 0.2);
    }
    const hood = cylinder(root, 'airframe-weapon-pod', accent, 0.26, 2.15,
      side * 2.58, -0.24, -0.55);
    hood.rotation.y = side * 0.08;
    ring(root, 'airframe-engine-turbine-ring', emission, 0.36,
      side * 1.04, -0.13, 2.54);
    plate(root, 'airframe-wing-control-surface', armor, 1.15, 0.42, 0.2,
      side * 3.1, 0.18, 1.1, side * 0.24);
  }
  plate(root, 'airframe-dorsal-spine', accent, 0.32, 2.7, 0.25,
    0, 0.58, 0.35);
  ship.add(root);
  return root;
}

export function addMechDetail(robot, { armor, graphite, accent, emission }) {
  const root = new T.Group();
  root.name = 'mech-premium-mechanics';
  root.userData.visualOnly = true;
  // The chest stays attached to the fixed torso, while wrist reinforcement
  // joins the *actual* articulated arm pivots (not floating decoration).
  for (const side of [-1, 1]) {
    plate(root, 'mech-layered-chest-plate', armor, 1.03, 1.02, 0.23,
      side * 0.57, 1.76, -1.20, -side * 0.17);
    plate(root, 'mech-clavicle-guard', graphite, 1.04, 0.30, 0.20,
      side * 0.97, 2.60, -0.81, side * 0.25);
    for (let n = 0; n < 3; n++) {
      plate(root, 'mech-rear-heatsink-fin', armor, 0.24, 0.66, 0.17,
        side * (0.54 + n * 0.22), 1.64 + n * 0.19, 1.74);
    }
    cylinder(root, 'mech-shoulder-actuator', graphite, 0.31, 0.45,
      side * 1.88, 2.47, 0.35, false).rotation.z = Math.PI / 2;
    ring(root, 'mech-dorsal-nozzle-trim', emission, 0.37,
      side * 1.38, 2.51, 2.52);
    plate(root, 'mech-knee-shield', accent, 0.45, 0.48, 0.22,
      side * 0.75, -2.09, -1.10);
  }
  ring(root, 'mech-central-reactor-rim', emission, 0.55, 0, 1.75, -1.33);
  robot.add(root);
  const rig = robot.userData.mechRig;
  if (rig?.arms?.length === 2) {
    for (let index = 0; index < rig.arms.length; index++) {
      const arm = rig.arms[index];
      const side = index === 0 ? -1 : 1;
      plate(arm, 'mech-wrist-targeting-rail', accent, 0.24, 1.02, 0.16,
        side * 0.09, -2.05, -1.31);
      cylinder(arm, 'mech-dual-arm-cannon-collar', emission, 0.26, 0.24,
        side * 0.15, -2.11, -1.57);
    }
  }
  return root;
}

export function addBossDetail(boss, { armor, dark, edge, hot, index = 0, kind = 'carrier' }) {
  const root = new T.Group();
  root.name = 'boss-premium-surface-' + index;
  root.userData.visualOnly = true;
  const scale = kind === 'dreadnought' || kind === 'emperor' ? 1.3 : 1;
  // Distinct wing/shoulder panel placements per boss profile and stage.
  for (const side of [-1, 1]) {
    const outer = (17 + (index % 4) * 4) * scale;
    const y = 6 + (index % 3) * 2.7;
    plate(root, 'boss-raised-armor-shield', armor, 10 + index % 3, 6.0, 1.25,
      side * outer, y, 10, side * 0.13);
    plate(root, 'boss-armor-inset', dark, 8.6, 2.15, 0.5,
      side * outer, y + 1.6, 10.9);
    for (let fin = 0; fin < 3; fin++)
      plate(root, 'boss-cooling-gill', edge, 1.1, 0.6, 0.17,
        side * (outer - 2.1 + fin * 1.8), y + 2.4, 11.7);
    cylinder(root, 'boss-side-defense-turret', armor, 1.38, 6.8,
      side * (outer + 1.1), y - 5.4, 13.1);
    ring(root, 'boss-reactor-collar', hot, 1.6,
      side * (outer + 1.1), y - 5.4, 16.7);
  }
  // Upper armor signature changes with the boss, but does not replace
  // registered weak-point meshes or their damage volumes.
  const crown = plate(root, 'boss-signature-crest', armor,
    9 + (index % 3) * 3, 5 + (index % 4) * 2, 0.9, 0, 17, -9);
  crown.rotation.x = -0.16 - index * 0.012;
  for (let j = 0; j < 3; j++)
    plate(root, 'boss-dorsal-energy-slits', edge, 2.0, 0.7, 0.2,
      0, 16.9 + j * 1.6, -8.34);
  boss.add(root);
  return root;
}

export function addSubbossDetail(cruiser, { armor, dark, hot, index = 0 }) {
  const root = new T.Group();
  root.name = 'subboss-premium-armor-' + index;
  root.userData.visualOnly = true;
  for (const side of [-1, 1]) {
    plate(root, 'subboss-armored-winglet', armor, 7, 3.6, 0.7,
      side * (10 + index % 3), 2.5, -4, side * 0.14);
    plate(root, 'subboss-turbine-slat', dark, 3.2, 0.64, 0.3,
      side * 7, 4.1, 8);
    ring(root, 'subboss-rear-reactor', hot, 1.7, side * 8, 0, 12);
  }
  cruiser.add(root);
  return root;
}

export function addGroundEnemyDetail(enemy, { armor, dark, warning, kind }) {
  const root = new T.Group();
  root.name = kind === 'tank' ? 'tank-premium-armor' : 'walker-premium-armor';
  root.userData.visualOnly = true;
  for (const side of [-1, 1]) {
    const h = kind === 'tank' ? 5.1 : 18;
    const w = kind === 'tank' ? 3.7 : 6.8;
    plate(root, 'ground-enemy-modular-cheek', armor, w, 3.5, 0.8,
      side * w, h, 5, side * 0.15);
    for (let k = 0; k < 3; k++)
      plate(root, 'ground-enemy-service-grille', dark, 1.6, 0.45, 0.17,
        side * (w - 0.6), h + k * 0.8, 5.6);
    plate(root, 'ground-enemy-threat-marker', warning, 0.67, 2.3, 0.16,
      side * (w + 0.7), h + 1.2, 6.0);
  }
  enemy.add(root);
  return root;
}
