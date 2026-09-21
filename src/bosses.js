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
      if (heavy)
        for (const side of [-1, 1]) {
          add(box(11, 24, 48, armor), side * 45, 17, 3);
          add(box(7, 7, 2, hot), side * 45, 17, 28);
        }
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
  // Living tissue grafted onto the existing ten mechanical silhouettes.
  const flesh = new T.MeshStandardMaterial({ color: '#652e58', roughness: 0.72, metalness: 0.08 }),
    bone = metal('#cfb59b', 0.18, 0.62),
    vein = glowMaterial('#d95b91', 1.1);
  const organic = [];
  const tissue = add(sphere(13, flesh, 2), 0, 3, 10);
  tissue.scale.set(1.1, 1.3, 0.75);
  // Face above core: a living eye surrounded by a split armored brow.
  const eye = add(sphere(4.1, bone, 2), 0, 14, 22);
  eye.scale.set(1.3, 0.7, 0.65);
  const pupil = add(sphere(2, hot, 2), 0, 14, 25);
  pupil.scale.set(0.5, 1, 0.4);
  for (const side of [-1, 1]) {
    const brow = add(box(11, 2.8, 4, armor), side * 6, 18, 22);
    brow.rotation.z = side * 0.18;
    for (let i = 0; i < 4; i++) {
      const rib = new T.Mesh(new T.TorusGeometry(8 + i * 0.8, 0.65, 6, 18, Math.PI * 0.65), bone);
      rib.rotation.z = side < 0 ? Math.PI * 0.65 : -Math.PI * 0.3;
      add(rib, side * 8, -i * 3, 14 - i);
    }
    for (let i = 0; i < 3; i++) {
      const limb = new T.Group();
      limb.position.set(side * (23 + i * 7), -4 + i * 5, 0);
      const points = [
        new T.Vector3(),
        new T.Vector3(side * 8, -5, 7),
        new T.Vector3(side * 12, -18 - i * 3, 15),
        new T.Vector3(side * 4, -24, 23),
      ];
      const curve = new T.CatmullRomCurve3(points);
      limb.add(new T.Mesh(new T.TubeGeometry(curve, 14, 1.7 - i * 0.2, 7, false), flesh));
      for (let j = 1; j < 4; j++) {
        const clamp = sphere(2.1 - i * 0.2, armor);
        clamp.position.copy(curve.getPoint(j / 4));
        clamp.scale.y = 0.55;
        limb.add(clamp);
      }
      const claw = new T.Mesh(new T.ConeGeometry(1.8, 8, 6), bone);
      claw.position.copy(points[3]);
      claw.rotation.x = -0.7;
      limb.add(claw);
      g.add(limb);
      organic.push(limb);
    }
    const conduit = new T.CatmullRomCurve3([
      new T.Vector3(side * 17, 4, 18),
      new T.Vector3(side * 10, 9, 23),
      new T.Vector3(side * 7, 4, 21),
    ]);
    g.add(new T.Mesh(new T.TubeGeometry(conduit, 12, 0.65, 6, false), vein));
  }
  const jaw = new T.Group();
  jaw.position.set(0, -10, 16);
  const mouth = new T.Mesh(new T.TorusGeometry(8, 1.6, 8, 24, Math.PI), flesh);
  mouth.rotation.z = Math.PI;
  jaw.add(mouth);
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 2,
      tooth = new T.Mesh(new T.ConeGeometry(0.7, 4, 5), bone);
    tooth.position.set(x, -4 + Math.abs(x) * 0.35, 1.5);
    jaw.add(tooth);
  }
  g.add(jaw);
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
  g.userData = {
    parts,
    core,
    rotors,
    organic,
    jaw,
    coreZ: 18,
    owned: true,
    materials: [armor, dark, edge, hot, flesh, bone, vein],
  };
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
