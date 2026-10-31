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
  const part = new T.Mesh(
    new T.TorusGeometry(radius, Math.max(0.045, radius * 0.1), 8, 20),
    material,
  );
  part.name = name;
  part.position.set(x, y, z);
  part.userData.visualOnly = true;
  parent.add(part);
  return part;
}

// Graphics 3.4: keep the proven NOVA-7 hull and fighter wing silhouette intact.
// Etched seams and engine internals deliberately sit INSIDE the original outline.
function trace(parent, name, material, points, radius = 0.035) {
  const curve = new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v)));
  const mesh = new T.Mesh(new T.TubeGeometry(curve, 12, radius, 5, false), material);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}

function detailRail(parent, name, material, x, y, z, w, h, d, yaw = 0) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.y = yaw;
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}

export function addFighterDetail(ship, { armor, accent, emission, enemy = false }) {
  const root = new T.Group();
  root.name = enemy ? 'enemy-premium-airframe' : 'nova7-premium-airframe';
  root.userData.visualOnly = true;
  // No bolt-on fairings, oversized pods or thick dorsal plate: retain the
  // original clean fighter from City 2.7, and add controlled surface finishing.
  for (const side of [-1, 1]) {
    trace(root, 'airframe-fuselage-micro-seam', accent, [
      [side * 0.34, 0.46, -2.8],
      [side * 0.49, 0.49, -2.2],
      [side * 0.76, 0.30, -0.55],
      [side * 0.84, 0.27, 0.36],
    ], 0.028);
    trace(root, 'airframe-wing-panel-seam', accent, [
      [side * 1.42, 0.24, -0.40],
      [side * 2.12, 0.23, 0.07],
      [side * 3.15, 0.22, 0.83],
      [side * 3.42, 0.20, 1.17],
    ], 0.032);
    for (let i = 0; i < 3; i++) {
      detailRail(root, 'airframe-low-profile-vent', accent,
        side * (1.55 + i * 0.31), 0.26, 0.56 + i * 0.14,
        0.13, 0.07, 0.53, side * 0.12);
    }
    // Original nozzles already sit at x=±1.04, y=-0.13, z=2.48.
    // Two rings, recessed blades and cool-hot inner core add perceived depth.
    for (const [i, r, z] of [[0, 0.49, 2.49], [1, 0.41, 2.67]]) {
      ring(root, 'airframe-engine-precision-ring-' + i,
        i === 0 ? armor : emission, r, side * 1.04, -0.13, z);
    }
    for (let vane = 0; vane < 6; vane++) {
      const theta = (vane * Math.PI * 2) / 6;
      const tab = detailRail(root, 'airframe-engine-turbine-vane', accent,
        side * 1.04 + Math.cos(theta) * 0.29,
        -0.13 + Math.sin(theta) * 0.29,
        2.73, 0.09, 0.17, 0.075);
      tab.rotation.z = theta - 0.36;
    }
    cylinder(root, 'airframe-engine-inner-core', emission, 0.16, 0.14,
      side * 1.04, -0.13, 2.77);
  }
  trace(root, 'airframe-dorsal-contour', armor, [
    [0, 0.79, -0.38], [0, 0.68, 0.48], [0, 0.54, 1.28],
  ], 0.042);
  ship.add(root);
  return root;
}

export function addMechDetail(robot, { armor, graphite, accent, emission }) {
  const root = new T.Group();
  root.name = 'mech-premium-mechanics';
  root.userData.visualOnly = true;
  // Preserve the already-approved shoulders, shared fighter wings and chest.
  // Replace overlapping armor plates with seams, vents and machined turbines.
  for (const side of [-1, 1]) {
    trace(root, 'mech-chest-machined-seam', accent, [
      [side * 0.37, 2.02, -1.10],
      [side * 0.79, 1.80, -1.09],
      [side * 0.94, 1.46, -1.03],
    ], 0.045);
    for (let i = 0; i < 3; i++)
      detailRail(root, 'mech-rear-cooling-slat', graphite,
        side * (0.65 + i * 0.20), 1.73 + i * 0.16, 1.76,
        0.13, 0.50, 0.12);
    cylinder(root, 'mech-shoulder-bearing', graphite, 0.29, 0.40,
      side * 1.86, 2.47, 0.35, false).rotation.z = Math.PI / 2;
    ring(root, 'mech-dorsal-nozzle-ring', armor, 0.42,
      side * 1.38, 2.51, 2.52);
    ring(root, 'mech-dorsal-ignition-ring', emission, 0.31,
      side * 1.38, 2.51, 2.57);
    detailRail(root, 'mech-shin-inset', accent, side * 0.74, -3.20, -0.86,
      0.14, 0.66, 0.14);
  }
  const gimbal = robot.getObjectByName('mech-turbine-gimbal');
  if (gimbal) {
    for (let blade = 0; blade < 6; blade++) {
      const theta = blade * Math.PI / 3;
      const part = detailRail(gimbal, 'mech-main-turbine-stator', armor,
        Math.cos(theta) * 0.47, Math.sin(theta) * 0.47, 0.72,
        0.07, 0.23, 0.09);
      part.rotation.z = theta - 0.35;
    }
    ring(gimbal, 'mech-turbine-machined-ring', graphite, 0.52, 0, 0, 0.74);
  }
  robot.add(root);
  for (const arm of robot.userData.mechRig?.arms ?? []) {
    detailRail(arm, 'mech-wrist-targeting-trim', emission, 0, -2.03, -1.30,
      0.13, 0.64, 0.11);
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
    plate(
      root,
      'boss-raised-armor-shield',
      armor,
      10 + (index % 3),
      6.0,
      1.25,
      side * outer,
      y,
      10,
      side * 0.13,
    );
    plate(root, 'boss-armor-inset', dark, 8.6, 2.15, 0.5, side * outer, y + 1.6, 10.9);
    for (let fin = 0; fin < 3; fin++)
      plate(
        root,
        'boss-cooling-gill',
        edge,
        1.1,
        0.6,
        0.17,
        side * (outer - 2.1 + fin * 1.8),
        y + 2.4,
        11.7,
      );
    cylinder(
      root,
      'boss-side-defense-turret',
      armor,
      1.38,
      6.8,
      side * (outer + 1.1),
      y - 5.4,
      13.1,
    );
    ring(root, 'boss-reactor-collar', hot, 1.6, side * (outer + 1.1), y - 5.4, 16.7);
  }
  // Upper armor signature changes with the boss, but does not replace
  // registered weak-point meshes or their damage volumes.
  const crown = plate(
    root,
    'boss-signature-crest',
    armor,
    9 + (index % 3) * 3,
    5 + (index % 4) * 2,
    0.9,
    0,
    17,
    -9,
  );
  crown.rotation.x = -0.16 - index * 0.012;
  for (let j = 0; j < 3; j++)
    plate(root, 'boss-dorsal-energy-slits', edge, 2.0, 0.7, 0.2, 0, 16.9 + j * 1.6, -8.34);
  boss.add(root);
  return root;
}

export function addSubbossDetail(cruiser, { armor, dark, hot, index = 0 }) {
  const root = new T.Group();
  root.name = 'subboss-premium-armor-' + index;
  root.userData.visualOnly = true;
  for (const side of [-1, 1]) {
    plate(
      root,
      'subboss-armored-winglet',
      armor,
      7,
      3.6,
      0.7,
      side * (10 + (index % 3)),
      2.5,
      -4,
      side * 0.14,
    );
    plate(root, 'subboss-turbine-slat', dark, 3.2, 0.64, 0.3, side * 7, 4.1, 8);
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
    plate(root, 'ground-enemy-modular-cheek', armor, w, 3.5, 0.8, side * w, h, 5, side * 0.15);
    for (let k = 0; k < 3; k++)
      plate(
        root,
        'ground-enemy-service-grille',
        dark,
        1.6,
        0.45,
        0.17,
        side * (w - 0.6),
        h + k * 0.8,
        5.6,
      );
    plate(
      root,
      'ground-enemy-threat-marker',
      warning,
      0.67,
      2.3,
      0.16,
      side * (w + 0.7),
      h + 1.2,
      6.0,
    );
  }
  enemy.add(root);
  return root;
}
