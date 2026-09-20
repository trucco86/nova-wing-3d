import * as T from 'three';
import { box, metal, glowMaterial, halo } from './visuals.js';
// Every silhouette is authored procedurally; the red generators are actual targets.
export function createBossModel(sector, index = 0) {
  const g = new T.Group(),
    armor = metal('#344658', 0.8, 0.3),
    dark = metal('#111b2c'),
    edge = glowMaterial(sector.accent, 2),
    hot = glowMaterial('#ff574b', 3);
  const rotors = [];
  const add = (o, x = 0, y = 0, z = 0) => {
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  const sphere = (r, m, detail = 1) => new T.Mesh(new T.IcosahedronGeometry(r, detail), m);
  const ring = (r, t = 0.5) => new T.Mesh(new T.TorusGeometry(r, t, 8, 56), edge);
  add(sphere(9, armor));
  add(box(18, 11, 22, dark));
  switch (sector.kind) {
    case 'carrier':
    case 'dreadnought': {
      const heavy = sector.kind === 'dreadnought';
      for (const s of [-1, 1]) {
        add(box(heavy ? 34 : 26, 8, 30, armor), s * 30);
        add(box(28, 1, 32, edge), s * 30, -4);
        for (let i = 0; i < 4; i++) add(box(4, 5, 20, dark), s * (15 + i * 8), 5, -5 + i * 2);
      }
      add(box(16, 18, 34, armor), 0, 10, -10);
      break;
    }
    case 'stingray':
    case 'phoenix': {
      for (const s of [-1, 1])
        for (let i = 0; i < 5; i++) {
          let wing = box(15, 3, 26, armor);
          wing.rotation.z = s * (0.2 + i * 0.09);
          add(wing, s * (13 + i * 9), i * 2, -i * 3);
          add(box(15, 0.6, 28, edge), s * (13 + i * 9), i * 2 + 2, -i * 3);
        }
      add(new T.Mesh(new T.ConeGeometry(7, 38, 5), dark), 0, -13, -8);
      break;
    }
    case 'drill': {
      const drill = new T.Mesh(new T.ConeGeometry(13, 40, 8), armor);
      drill.rotation.x = Math.PI / 2;
      add(drill, 0, 0, 20);
      for (let i = 0; i < 4; i++) {
        const q = ring(15 + i * 3);
        add(q, 0, 0, -i * 7);
        rotors.push(q);
      }
      for (const s of [-1, 1]) add(box(15, 10, 35, dark), s * 30);
      break;
    }
    case 'station':
    case 'orbital': {
      for (let i = 0; i < 3; i++) {
        const q = ring(20 + i * 9, 1.4);
        q.rotation.x = i * 0.35;
        add(q);
        rotors.push(q);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const arm = box(34, 5, 8, armor);
        arm.rotation.z = a;
        add(arm, Math.cos(a) * 24, Math.sin(a) * 24);
      }
      break;
    }
    case 'mech': {
      add(box(20, 25, 16, armor), 0, -2);
      add(sphere(8, edge), 0, 18, 0);
      for (const s of [-1, 1]) {
        add(box(12, 30, 14, armor), s * 21, -4);
        add(box(11, 25, 15, dark), s * 12, -28);
        add(box(12, 6, 23, armor), s * 12, -42, 5);
        add(box(6, 6, 22, edge), s * 23, -13, 12);
      }
      break;
    }
    case 'hydra': {
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7,
          arm = new T.Group();
        for (let j = 1; j < 6; j++) {
          let p = sphere(4 - j * 0.35, armor);
          p.position.set(Math.cos(a) * j * 8, Math.sin(a) * j * 5, -j * 2);
          arm.add(p);
        }
        const head = sphere(6, edge);
        head.position.set(Math.cos(a) * 44, Math.sin(a) * 28, -10);
        arm.add(head);
        g.add(arm);
        rotors.push(arm);
      }
      break;
    }
    case 'emperor': {
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5;
        const spike = new T.Mesh(new T.ConeGeometry(4, 28, 5), armor);
        spike.rotation.z = a - Math.PI / 2;
        add(spike, Math.cos(a) * 37, Math.sin(a) * 24, -8);
      }
      for (const s of [-1, 1]) {
        add(box(35, 10, 45, armor), s * 33, -2, -10);
        add(box(30, 1, 47, edge), s * 33, 4, -10);
      }
      const crown = ring(24, 2);
      add(crown, 0, 4, -10);
      rotors.push(crown);
      break;
    }
  }
  if (sector.kind === 'phoenix') {
    for (const side of [-1, 1]) {
      const flame = new T.Mesh(new T.ConeGeometry(9, 40, 6), edge);
      flame.rotation.z = side * 0.4;
      add(flame, side * 40, 15, -24);
    }
    add(sphere(12, edge), 0, 0, -15);
  }
  if (sector.kind === 'orbital') {
    const shell = new T.Mesh(new T.OctahedronGeometry(31), dark);
    add(shell, 0, 0, -12);
    const haloRing = ring(45, 2);
    add(haloRing, 0, 0, -18);
    rotors.push(haloRing);
  }
  const core = add(sphere(5, hot, 2), 0, 0, 18);
  const coreRing = add(ring(7), 0, 0, 18);
  rotors.push(coreRing);
  add(halo(sector.accent, 21, 0.7), 0, 0, 20);
  const parts = [];
  for (const s of [-1, 1]) {
    const p = add(sphere(4, hot), s * 17, 4, 19);
    add(ring(5), s * 17, 4, 18);
    parts.push({ mesh: p, hp: 32 + index * 7, max: 32 + index * 7 });
  }
  g.userData = { parts, core, rotors, coreZ: 18, owned: true, materials: [armor, dark, edge, hot] };
  return g;
}
export function disposeBoss(g) {
  const geos = new Set();
  g.traverse((o) => {
    if (o.geometry) geos.add(o.geometry);
  });
  geos.forEach((x) => x.dispose());
  g.userData.materials?.forEach((x) => x.dispose());
}
