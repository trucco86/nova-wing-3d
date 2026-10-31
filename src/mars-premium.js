import * as T from 'three';

// Mars 4.0: authored desert surface and readable Curiosity-inspired rover.
// Distant celestial bodies are deliberately larger for gameplay readability.
// Decorative scene only: no projectile hitboxes or collision-system changes.
const sand = new T.MeshStandardMaterial({
  color: '#b97a52', roughness: 0.99, metalness: 0,
  vertexColors: true,
});
const stone = new T.MeshStandardMaterial({
  color: '#bba28b', roughness: 0.95, metalness: 0.02, vertexColors: true,
});
const darkRock = new T.MeshStandardMaterial({ color: '#765244', roughness: 0.94 });
const hull = new T.MeshStandardMaterial({ color: '#c6bbb0', roughness: 0.58, metalness: 0.36 });
const dark = new T.MeshStandardMaterial({ color: '#313d46', roughness: 0.72, metalness: 0.3 });
const glass = new T.MeshStandardMaterial({ color: '#55717c', metalness: 0.44, roughness: 0.25 });
const metal = new T.MeshStandardMaterial({ color: '#96836f', roughness: 0.52, metalness: 0.62 });
const marker = new T.MeshBasicMaterial({ color: '#ffd49b', toneMapped: false });
const boxGeo = new T.BoxGeometry(1, 1, 1);
const rockGeo = new T.IcosahedronGeometry(1, 1);
const dummy = new T.Object3D();

function box(parent, name, material, x, y, z, w, h, d) {
  const mesh = new T.Mesh(boxGeo, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}
const fract = (v) => v - Math.floor(v);
const seeded = (x) => fract(Math.sin(x * 127.13 + 15.78) * 43758.5453);
function ridge(x, z) {
  const mx = Math.max(0, Math.abs(x) - 29);
  const far = Math.sin(z * 0.004 + x * 0.018) * 3.5;
  return Math.min(35, mx * 0.06) * (0.64 + 0.36 * Math.sin(z * 0.009)) +
    Math.sin(z * 0.025 + x * 0.015) * (mx > 0 ? 2.7 : 0.15) + far * Math.min(1, mx / 120);
}
function makeSurface() {
  const geo = new T.PlaneGeometry(2100, 4500, 65, 140);
  geo.rotateX(-Math.PI / 2);
  const positions = geo.attributes.position;
  const colors = [];
  const base = new T.Color();
  const colorBands = ['#9f603e', '#b57a52', '#ae6846', '#bb8159', '#8d5440'];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i) - 1800;
    const h = ridge(x, z);
    positions.setY(i, h);
    base.set(colorBands[Math.floor(seeded(i * 3.1 + Math.floor(z * 0.003)) * colorBands.length)]);
    base.multiplyScalar(0.89 + seeded(i * 0.63) * 0.22);
    colors.push(base.r, base.g, base.b);
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new T.Mesh(geo, sand);
  ground.name = 'mars-premium-desert-floor';
  ground.position.set(0, -8, -1800);
  ground.userData.visualOnly = true;
  ground.userData.fixedSky = true;
  ground.receiveShadow = false;
  return ground;
}

function makeRocks(chunkIndex) {
  const group = new T.Group();
  group.name = 'mars-rock-field-' + chunkIndex;
  group.position.z = -100 - chunkIndex * 240;
  group.userData.marsChunk = true;
  group.userData.visualOnly = true;
  const rocks = new T.InstancedMesh(rockGeo, stone, 38);
  rocks.name = 'mars-erosion-boulders';
  rocks.frustumCulled = false;
  const tones = ['#9e6752', '#bd8560', '#745044', '#a66d4c', '#d09d74'];
  for (let i = 0; i < 38; i++) {
    const v = chunkIndex * 47 + i * 13;
    const side = i % 2 ? 1 : -1;
    const x = side * (45 + seeded(v + 1) * 380);
    const z = -seeded(v + 2) * 220;
    const s = 3 + seeded(v + 3) * 14;
    dummy.position.set(x, -6 + ridge(x, group.position.z + z) + s * 0.33, z);
    dummy.rotation.set(seeded(v + 4) * 0.8, seeded(v + 5) * 3, seeded(v + 6) * 0.5);
    dummy.scale.set(s * 1.3, s * (0.34 + seeded(v + 7) * 0.4), s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, new T.Color(tones[i % tones.length]));
  }
  rocks.instanceMatrix.needsUpdate = true;
  rocks.instanceColor.needsUpdate = true;
  rocks.userData.visualOnly = true;
  group.add(rocks);
  return group;
}
function makeMesa(index) {
  const group = new T.Group();
  group.name = 'mars-distant-mesa-' + index;
  group.position.set((index % 2 ? 1 : -1) * (280 + (index % 3) * 80), 0, -370 - index * 320);
  group.userData.visualOnly = true;
  group.userData.marsChunk = true;
  const p = new T.Mesh(new T.CylinderGeometry(30 + index % 3 * 6, 75 + index % 3 * 9, 75 + index % 3 * 18, 7), darkRock);
  p.name = 'mars-layered-sedimentary-mesa';
  p.position.y = 34;
  p.scale.z = 2;
  group.add(p);
  for (let k = 0; k < 4; k++) {
    const crown = new T.Mesh(new T.CylinderGeometry(35 - k * 4, 43 - k * 3, 3, 7), stone);
    crown.name = 'mars-erosion-strata-' + k;
    crown.position.y = 6 + k * 17;
    crown.scale.z = 1.5;
    group.add(crown);
  }
  return group;
}
function makeMarsMoon(name, radius, position, tint) {
  const group = new T.Group();
  group.name = 'mars-moon-' + name;
  group.position.set(...position);
  group.userData.fixedSky = true;
  group.userData.visualOnly = true;
  const mesh = new T.Mesh(new T.IcosahedronGeometry(radius, 3),
    new T.MeshStandardMaterial({color:tint, roughness: 1, metalness: 0, flatShading: true, fog: false}));
  mesh.name = name + '-rocky-moon-surface';
  mesh.scale.set(1.2, 0.84, 0.91);
  group.add(mesh);
  return group;
}
function makeCuriosity() {
  const rover = new T.Group();
  rover.name = 'mars-curiosity-rover';
  rover.userData.visualOnly = true;
  rover.userData.marsChunk = true;
  rover.position.set(-54, -3, -390);
  rover.scale.setScalar(2.05);
  box(rover, 'curiosity-central-chassis', hull, 0, 2.6, 0, 6.8, 1.6, 9.5);
  box(rover, 'curiosity-rtg-power-module', metal, 0, 3.65, 3.2, 3.6, 1.7, 2.3);
  box(rover, 'curiosity-science-instrument-deck', hull, 0, 3.8, -1.1, 5.8, 0.95, 5.3);
  for (let side of [-1, 1]) {
    for (let axle of [-1, 0, 1]) {
      const wheel = new T.Mesh(new T.CylinderGeometry(1.45, 1.45, 0.8, 14), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 4.55, 0.45, axle * 3.4);
      wheel.name = 'curiosity-wheel-' + (side < 0 ? 'left' : 'right') + '-' + axle;
      rover.add(wheel);
      box(rover, 'curiosity-rocker-bogie-link', metal,
        side * 3.1, 1.4, axle * 2.3, 2.8, 0.36, 0.45);
    }
  }
  box(rover, 'curiosity-mast', metal, 0, 6.65, -2.5, 0.45, 5.0, 0.6);
  box(rover, 'curiosity-mastcam-stereo-head', hull, 0, 9.45, -3.1, 3.4, 1.3, 1.8);
  for (const side of [-1, 1]) {
    const eye = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.8, 12), glass);
    eye.name = 'curiosity-mastcam-lens';
    eye.rotation.x = Math.PI / 2;
    eye.position.set(side * 0.93, 9.5, -4.15);
    rover.add(eye);
  }
  box(rover, 'curiosity-science-arm', metal, -3.2, 2.65, -4.1, 0.55, 0.5, 5);
  box(rover, 'curiosity-drill-head', dark, -3.2, 2.65, -7, 1.1, 1.15, 1.3);
  const beacon = new T.Mesh(new T.SphereGeometry(0.38, 8, 6), marker);
  beacon.name = 'curiosity-status-beacon';
  beacon.position.set(2.7, 4.5, 2);
  rover.add(beacon);
  return rover;
}
export function createMarsPremium() {
  const root = new T.Group();
  root.name = 'mars-premium-desert';
  root.userData.visualOnly = true;
  root.userData.marsPremium = true;
  root.add(makeSurface());
  root.add(makeMarsMoon('phobos', 35, [-340, 250, -1050], '#a29c94'));
  root.add(makeMarsMoon('deimos', 17, [260, 330, -1250], '#c5afa1'));
  for (let i = 0; i < 10; i++) root.add(makeRocks(i));
  for (let i = 0; i < 5; i++) root.add(makeMesa(i));
  root.add(makeCuriosity());
  return root;
}
export function updateMarsPremium(root, travel) {
  if (!root || !Number.isFinite(travel)) return;
  for (const child of root.children) {
    if (!child.userData.marsChunk) continue;
    const base = Number.isFinite(child.userData.startZ)
      ? child.userData.startZ : (child.userData.startZ = child.position.z);
    // Individual landmarks stream, with visible scene continuity and no
    // Earth-city architecture ever slipping into the Mars stage.
    const z = base + travel;
    child.position.z = z > 100 ? z - Math.ceil((z - 100) / 3000) * 3000 : z;
  }
}
