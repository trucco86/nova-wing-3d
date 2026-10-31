import * as T from 'three';

// Sector-specific architecture for every boss. No physics, weapons or weak
// point positions are changed; those remain owned by boss-combat and bosses.js.
export const BOSS_SHAPES = Object.freeze([
  'interceptor-rok',
  'martian-dune-colossus',
  'asteroid-drill-behemoth',
  'orbital-reactor-citadel',
  'solar-phoenix',
  'glacial-titan',
  'hydra-bio-hive',
  'omega-dreadnought',
  'orion-gravity-eye',
  'marvin-imperial-crown',
]);
const geo = new T.BoxGeometry(1, 1, 1);
function slab(g, mat, name, x, y, z, w, h, d, rz = 0) {
  const mesh = new T.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.rotation.z = rz;
  g.add(mesh);
  return mesh;
}
function arc(g, mat, name, radius, x, y, z, arcLength = Math.PI * 1.4) {
  const mesh = new T.Mesh(new T.TorusGeometry(radius, 1.1, 9, 34, arcLength), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  g.add(mesh);
}
function talon(g, mat, name, x, y, z, radius, height, angle = 0) {
  const mesh = new T.Mesh(new T.ConeGeometry(radius, height, 6), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.z = angle;
  g.add(mesh);
}
export function createBossVisualIdentity(index, { armor, dark, edge, hot }) {
  if (!Number.isInteger(index) || index < 0 || index > 9) throw new RangeError('boss identity');
  const root = new T.Group();
  root.name = 'boss-distinct-' + BOSS_SHAPES[index];
  root.userData.visualOnly = true;
  root.userData.bossIdentity = BOSS_SHAPES[index];
  if (index === 0) {
    for (const side of [-1, 1]) {
      slab(root, armor, 'rok-swept-interceptor-wing', side * 35, 2, -12, 42, 4, 23, side * 0.22);
      slab(root, edge, 'rok-wing-navigation-beam', side * 48, 7, -7, 29, 1, 3, side * 0.19);
      talon(root, dark, 'rok-fin', side * 30, 18, -10, 5, 30, -side * 0.2);
    }
  } else if (index === 1) {
    // Mars: giant six-legged quarry machine, not a sleek ocean manta.
    slab(root, armor, 'mars-armored-crust', 0, 13, -8, 56, 21, 35);
    slab(root, dark, 'mars-excavator-visor', 0, 16, 15, 28, 7, 8);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        slab(
          root,
          armor,
          'mars-dune-walker-upper-leg-' + side + '-' + i,
          side * (33 + i * 4),
          -13 - i * 7,
          (i - 1) * 19,
          8,
          34,
          9,
          side * 0.43,
        );
        slab(
          root,
          dark,
          'mars-dune-walker-foot-' + side + '-' + i,
          side * (42 + i * 7),
          -37 - i * 5,
          (i - 1) * 19,
          17,
          6,
          13,
        );
        slab(
          root,
          edge,
          'mars-thermal-vent-' + side + '-' + i,
          side * (17 + i * 4),
          27,
          7 - i * 7,
          5,
          2,
          12,
        );
      }
    }
    for (let i = 0; i < 4; i++)
      talon(root, armor, 'mars-excavation-teeth', -12 + i * 8, -15, 28, 4, 18, Math.PI);
  } else if (index === 2) {
    for (let k = 0; k < 3; k++) {
      const r = 19 + k * 7;
      arc(root, edge, 'asteroid-drill-retaining-ring-' + k, r, 0, 0, 25 - k * 9, Math.PI * 2);
      for (let i = 0; i < 4; i++)
        talon(
          root,
          armor,
          'asteroid-carbide-tooth-' + k + '-' + i,
          Math.cos((i * Math.PI) / 2) * r,
          Math.sin((i * Math.PI) / 2) * r,
          25 - k * 9,
          4,
          18,
          (i * Math.PI) / 2,
        );
    }
  } else if (index === 3) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const spoke = new T.Group();
      spoke.name = 'station-reactor-shield-spoke-' + i;
      spoke.rotation.z = a;
      slab(spoke, armor, 'reactor-shield-block', 0, 36, 8, 18, 34, 12);
      slab(spoke, hot, 'reactor-coil', 0, 35, 16, 5, 22, 2);
      root.add(spoke);
    }
  } else if (index === 4) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const feather = slab(
          root,
          edge,
          'solar-phoenix-feather-' + i,
          side * (25 + i * 9),
          9 + i * 6,
          -12 - i * 4,
          8,
          43 - i * 4,
          6,
          -side * (0.15 + i * 0.13),
        );
        feather.rotation.y = side * 0.14;
      }
      talon(root, dark, 'phoenix-crest', side * 7, 38, 0, 5, 37, side * 0.3);
    }
  } else if (index === 5) {
    for (const side of [-1, 1]) {
      slab(root, armor, 'glacial-exosuit-shoulder', side * 29, 25, -7, 25, 22, 23);
      slab(root, dark, 'glacial-artillery-forearm', side * 44, -18, 14, 18, 48, 19, side * 0.16);
      talon(root, edge, 'glacial-back-ice-spire', side * 18, 48, -15, 8, 56);
    }
    slab(root, dark, 'glacial-masked-jaw', 0, -9, 21, 24, 12, 8);
  } else if (index === 6) {
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      const x = Math.cos(a) * 44,
        y = Math.sin(a) * 31;
      talon(root, armor, 'hydra-serpentine-spine-' + i, x, y, -5, 8, 32, a);
      const sensor = new T.Mesh(new T.IcosahedronGeometry(7, 1), hot);
      sensor.name = 'hydra-head-eye-' + i;
      sensor.position.set(x, y + 5, 23);
      root.add(sensor);
    }
  } else if (index === 7) {
    for (const side of [-1, 1]) {
      slab(root, armor, 'omega-heavy-broadside-wing', side * 49, -3, -14, 48, 24, 38);
      for (let i = 0; i < 4; i++) {
        slab(
          root,
          dark,
          'omega-armored-battery-emplacement',
          side * (32 + i * 11),
          15,
          11,
          8,
          15,
          18,
        );
        slab(root, edge, 'omega-broadside-muzzle-flare', side * (32 + i * 11), 15, 21, 5, 4, 2);
      }
    }
  } else if (index === 8) {
    for (let i = 0; i < 4; i++) {
      arc(root, edge, 'orion-lensing-iris-' + i, 21 + i * 8, 0, 0, 11 - i * 8, Math.PI * 2);
    }
    for (const side of [-1, 1]) {
      slab(root, dark, 'orion-gravitic-pylon', side * 47, 10, -11, 13, 69, 16);
      talon(root, armor, 'orion-pylon-tipped-spear', side * 47, 54, -11, 8, 20);
    }
  } else if (index === 9) {
    for (let i = -2; i <= 2; i++) {
      talon(
        root,
        armor,
        'marvin-imperial-crown-spire-' + i,
        i * 13,
        42 + (2 - Math.abs(i)) * 6,
        -20,
        9,
        55 - Math.abs(i) * 8,
      );
      slab(root, edge, 'marvin-crown-eye-light', i * 13, 24, 2, 5, 3, 5);
    }
    for (const side of [-1, 1])
      slab(root, dark, 'marvin-royal-hull-guard', side * 55, 1, -11, 24, 45, 30);
  }
  return root;
}
