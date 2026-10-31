import * as T from 'three';

// City 3.0 — meaningful, building-anchored scenery rather than unrelated boxes.
// All decorative geometry is instanced by material, so extra windows, elevated
// pedestrian routes, reconstruction platforms and taxis stay inexpensive.
const unit = new T.BoxGeometry(1, 1, 1);
const frame = new T.Object3D();
const steel = new T.MeshStandardMaterial({ color: '#557b78', metalness: 0.78, roughness: 0.36 });
const glass = new T.MeshStandardMaterial({ color: '#164a48', metalness: 0.49, roughness: 0.31 });
const green = new T.MeshBasicMaterial({ color: '#60e8a2', toneMapped: false });
const jade = new T.MeshBasicMaterial({ color: '#b3f9c9', toneMapped: false });
const amber = new T.MeshBasicMaterial({ color: '#ffd18b', toneMapped: false });
const wreckage = new T.MeshStandardMaterial({ color: '#182627', metalness: 0.52, roughness: 0.84 });
function matrix(x, y, z, w, h, d, ry = 0) {
  frame.position.set(x, y, z);
  frame.rotation.set(0, ry, 0);
  frame.scale.set(w, h, d);
  frame.updateMatrix();
  return frame.matrix.clone();
}
function pack(parent, name, material, entries, count) {
  const mesh = new T.InstancedMesh(unit, material, entries.length);
  mesh.name = name;
  mesh.count = count ?? entries.length;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  entries.forEach((entry, i) => mesh.setMatrixAt(i, entry));
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}
export function createCity30DistrictLife(buildings = []) {
  const root = new T.Group();
  root.name = 'city-matrix-streets';
  root.userData.visualOnly = true;
  const high = new T.Group();
  high.name = 'city-matrix-high-detail';
  high.visible = false;
  const structure = [], glazing = [], signage = [], damage = [], moreWindows = [], warmWindows = [];
  const pads = [];
  let damaged = 0;
  let bridges = 0;
  const visited = new Set();
  // All coordinates are taken from the exact procedural building transforms;
  // windows and damage never float away from their respective tower facades.
  buildings.forEach((b, i) => {
    const { x, h, z, w, depth } = b;
    const face = z + depth * 0.5 + 0.44;
    const rows = Math.max(4, Math.min(17, Math.floor(h / 4.4)));
    const cols = i % 5 === 0 ? 5 : 3 + (i % 3);
    const broken = i % 29 === 8 || i % 37 === 14;
    if (broken) damaged++;
    const facade = i % 4;
    if (facade === 0) {
      structure.push(matrix(x, -7 + h * 0.55, face, w * 0.76, 0.8, 0.75));
      structure.push(matrix(x, -7 + h * 0.84, face, w * 0.91, 0.72, 0.8));
    } else if (facade === 1) {
      for (const side of [-1, 1]) {
        structure.push(matrix(x + side * w * 0.23, -7 + h * 0.5, face, 0.55, h * 0.83, 0.76));
      }
    } else if (facade === 2) {
      structure.push(matrix(x, -7 + h * 0.5, face, w * 0.78, 0.3, 1.05));
      structure.push(matrix(x, -7 + h * 0.85, face, w * 0.86, 0.26, 1.1));
    } else {
      structure.push(matrix(x, h - 4, face - depth * 0.3, w * 0.55, 1.3, depth * 0.7));
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // A few dark apartment and evacuation zones break regular window grids.
        if ((row * 13 + col * 7 + i * 3) % 17 === 0) continue;
        if (broken && row > rows / 2 && col > cols / 2) continue;
        const px = x + ((col + 0.5) / cols - 0.5) * w * 0.73;
        const py = -7 + (row + 1.2) / (rows + 1.8) * h;
        const part = (i + row * 5 + col * 7) % 9 === 0 ? warmWindows : moreWindows;
        part.push(matrix(px, py, face + 0.28, w * 0.43 / cols, 0.48, 0.15));
      }
    }
    if (i % 7 === 0) {
      // Rooftop fins and distinct heliotaxi beacons for navigable sky lanes.
      for (let k = -1; k <= 1; k++)
        structure.push(matrix(x + k * w * 0.3, h + 2.4, z, 0.65, 7 + i % 4, 1.2));
      signage.push(matrix(x, h - 3, face + 0.65, w * 0.61, 0.55, 0.24));
    }
    if (broken) {
      const impactY = -7 + h * 0.64;
      damage.push(matrix(x + w * 0.23, impactY, face + 0.55, w * 0.27, h * 0.21, 0.78));
      damage.push(matrix(x + w * 0.33, impactY + h * 0.09, face + 0.75,
        w * 0.13, h * 0.1, 0.45, 0.26));
      for (let k = 0; k < 4; k++) {
        const level = -5 + h * (0.17 + k * 0.15);
        for (const side of [-1, 1])
          structure.push(matrix(x + side * (w * 0.46 + 3), level, face + 4,
            0.65, Math.min(13, h * 0.2), 0.65));
        structure.push(matrix(x, level, face + 4, w + 8, 0.5, 4.5));
      }
      // Future-city construction gantry, some damaged but anchored to tower.
      structure.push(matrix(x, impactY + 3, face + 4, w + 8, 1, 4));
      signage.push(matrix(x, impactY + 3.65, face + 7, w * 0.66, 0.26, 0.2));
    }
    if (i % 13 === 2 && h > 32) {
      const side = Math.sign(x);
      const landingX = x - side * (w * 0.5 + 9);
      const landingY = Math.min(h - 9, 25 + i % 3 * 6);
      structure.push(matrix(landingX, landingY, z + depth * 0.24, 17, 1.1, 17));
      signage.push(matrix(landingX, landingY + 0.9, z + depth * 0.24, 15, 0.2, 15));
      pads.push({ x: landingX, y: landingY + 4.5, z: z + depth * 0.24 });
    }
    // Cross links between real, close towers on the SAME side, not floating
    // unlabeled slabs across the central flight corridor.
    const prev = buildings[i - 2];
    if (prev && i % 12 === 4 && Math.sign(prev.x) === Math.sign(x) &&
      prev.h > 58 && h > 58 && Math.abs(prev.x - x) < 85) {
      const midX = (prev.x + x) * 0.5;
      const midZ = (prev.z + z) * 0.5;
      const centerY = Math.max(44, Math.min(prev.h, h) - 13);
      const length = Math.hypot(prev.x - x, prev.z - z) + 6;
      const yaw = Math.atan2(x - prev.x, z - prev.z);
      structure.push(matrix(midX, centerY, midZ, 7, 1.4, length, yaw));
      glazing.push(matrix(midX, centerY + 3, midZ, 6, 5.7, length - 2, yaw));
      for (const side of [-1, 1]) {
        const dx = Math.cos(yaw) * side * 3.6;
        const dz = -Math.sin(yaw) * side * 3.6;
        structure.push(matrix(midX + dx, centerY + 2.3, midZ + dz, 0.55, 4.8, length, yaw));
        signage.push(matrix(midX + dx, centerY + 4.9, midZ + dz, 0.35, 0.27, length, yaw));
      }
      bridges++;
      visited.add(i);
    }
  });
  pack(root, 'city-matrix-structural-frames-and-skybridges', steel, structure);
  pack(root, 'city-matrix-glass-walkways', glass, glazing);
  pack(root, 'city-matrix-green-walkway-neon', green, signage);
  pack(high, 'city-matrix-dense-windows', jade, moreWindows);
  pack(high, 'city-matrix-warm-window-variation', amber, warmWindows);
  pack(high, 'city-matrix-broken-facades', wreckage, damage);
  root.add(high);
  // A modest fleet of tiny near-building taxis. Animation stays attached to
  // the city tile and costs only two draw calls, independent of taxi count.
  const taxis = new T.Group();
  taxis.name = 'city-matrix-rooftop-taxis';
  const craft = [], engines = [];
  const origin = pads.length ? pads.slice(0, 12) :
    buildings.filter((b) => b.h > 40).slice(0, 8).map((b) => ({ x: b.x, y: 28, z: b.z }));
  origin.forEach(({ x, y, z }, i) => {
    craft.push(matrix(x, y, z, 5.2, 2, 8.5));
    engines.push(matrix(x, y - 1.35, z + 2.2, 4.0, 0.45, 1.4));
  });
  const cab = pack(taxis, 'city-matrix-taxi-cabs', glass, craft, Math.min(5, craft.length));
  const thrusters = pack(taxis, 'city-matrix-taxi-thrusters', amber, engines,
    Math.min(5, engines.length));
  taxis.userData.origin = origin;
  taxis.userData.cab = cab;
  taxis.userData.thrusters = thrusters;
  taxis.userData.phase = 0;
  root.add(taxis);
  root.userData.anchors = buildings.length;
  root.userData.damaged = damaged;
  root.userData.bridges = bridges;
  root.userData.visualOnly = true;
  return root;
}
export function setCity30Quality(group, quality) {
  if (!group) return;
  const high = quality === 'high';
  group.getObjectByName('city-matrix-high-detail').visible = high;
  const taxis = group.getObjectByName('city-matrix-rooftop-taxis');
  const count = taxis.userData.origin.length;
  for (const mesh of taxis.children) mesh.count = Math.min(high ? 12 : 5, count);
}
export function animateCity30(group, travel) {
  if (!group || !Number.isFinite(travel)) return;
  const taxis = group.getObjectByName('city-matrix-rooftop-taxis');
  const count = taxis.userData.origin.length;
  const phase = taxis.userData.phase ?? 0;
  for (let i = 0; i < count; i++) {
    const { x, y, z } = taxis.userData.origin[i];
    // Shuttling between the facade and a landing, not circling aimlessly.
    const progress = Math.sin(travel * (0.006 + i % 3 * 0.001) + phase + i * 1.7);
    const offset = 5 * progress;
    const lift = 1.7 * Math.sin(travel * 0.009 + i);
    taxis.userData.cab.setMatrixAt(i, matrix(x + offset, y + lift, z,
      5.2, 2, 8.5, 0.2 * progress));
    taxis.userData.thrusters.setMatrixAt(i, matrix(x + offset, y - 1.35 + lift,
      z + 2.2, 4, 0.45, 1.4, 0.2 * progress));
  }
  for (const mesh of taxis.children) mesh.instanceMatrix.needsUpdate = true;
}
