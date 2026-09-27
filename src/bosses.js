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
      add(drill, 0, 0, -8);
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
  const organicStart = g.children.length;
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
  // Anatomy belongs to the sector: manta gills, drill maw, orbital membranes,
  // phoenix crest, plated golem, hydra eyes, dreadnought ribs, void iris, crown.
  const anatomy = g.children.slice(organicStart);
  const proportions = [
    [1, 1, 1],
    [1.65, 0.55, 1],
    [0.6, 1.3, 1.4],
    [0.8, 0.8, 0.6],
    [1.25, 1.6, 0.7],
    [0.8, 1.65, 0.9],
    [1.45, 1.15, 1],
    [1.7, 0.7, 0.7],
    [0.65, 0.65, 0.5],
    [1.15, 1.4, 1.1],
  ][index];
  for (const o of anatomy) {
    o.position.multiply(new T.Vector3(...proportions));
    o.scale.multiply(new T.Vector3(...proportions));
  }
  tissue.position.z = Math.min(10, tissue.position.z);
  tissue.scale.z = Math.min(0.75, tissue.scale.z);
  flesh.color.set(
    [
      '#652e58',
      '#245a63',
      '#6e392b',
      '#37495e',
      '#a02d1d',
      '#466b83',
      '#68267d',
      '#694638',
      '#281d58',
      '#8c2346',
    ][index],
  );
  eye.visible = pupil.visible = ![2, 3, 6, 8].includes(index);
  jaw.visible = ![1, 3, 4, 8].includes(index);
  organic.forEach((o, i) => {
    o.visible = ![2, 3, 5, 7, 8].includes(index) || i % 3 === 0;
  });
  for (let i = 0; i < index + 2; i++) {
    const a = (i * Math.PI * 2) / (index + 2);
    const growth = [2, 5, 7].includes(index)
      ? new T.Mesh(new T.ConeGeometry(2.4, 13 + index, 6), bone)
      : sphere(index === 6 ? 3 : 1.8, index === 6 ? hot : vein, 1);
    growth.rotation.z = a - Math.PI / 2;
    add(growth, Math.cos(a) * (12 + index), Math.sin(a) * (12 + index), 21);
  }
  if ([3, 8].includes(index)) {
    for (let i = 0; i < 4; i++) {
      const iris = new T.Mesh(new T.TorusGeometry(12 + i * 3, 0.7, 8, 32), flesh);
      iris.rotation.y = i * 0.3;
      add(iris, 0, 0, 12);
      rotors.push(iris);
    }
  }
  const core = add(sphere(5, hot, 2), 0, 0, 18);
  const coreRing = add(ring(7), 0, 0, 18);
  rotors.push(coreRing);
  add(halo(sector.accent, 21, 0.7), 0, 0, 20);
  // Layered armor and exposed machinery stay behind the three aiming zones.
  const vents = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const plate = add(box(5.5, 6, 2, armor), side * (25 + i * 5), 1 + (i % 2) * 5, 18 - i);
      plate.rotation.z = side * (0.15 + i * 0.05);
      for (let j = 0; j < 3; j++)
        add(box(3.8, 0.28, 0.3, dark), side * (25 + i * 5), j + (i % 2) * 5, 19.2 - i);
      const vent = add(box(0.6, 3, 0.4, vein), side * (26 + i * 5), 3 + (i % 2) * 5, 19.4 - i);
      vents.push(vent);
    }
    const turret = new T.Group();
    turret.position.set(side * 29, 12, 17);
    turret.add(sphere(4, dark, 1));
    for (const x of [-1.2, 1.2]) {
      const barrel = new T.Mesh(new T.CylinderGeometry(0.7, 1, 10, 10), armor);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(x, 0, 4);
      turret.add(barrel);
      turret.add(box(1, 1, 0.3, hot, x, 0, 9));
    }
    g.add(turret);
    const engine = new T.Mesh(new T.CylinderGeometry(4, 5, 12, 16), dark);
    engine.rotation.x = Math.PI / 2;
    add(engine, side * 34, -6, -13);
    for (let j = 0; j < 3; j++) {
      const hoop = ring(4.5, 0.25);
      add(hoop, side * 34, -6, -10 - j * 3);
    }
    for (let j = 0; j < 3; j++) {
      const cable = new T.CatmullRomCurve3([
        new T.Vector3(side * 10, 20 + j, 5),
        new T.Vector3(side * 18, 23 + j, 12),
        new T.Vector3(side * 25, 12, 16),
      ]);
      g.add(new T.Mesh(new T.TubeGeometry(cable, 12, 0.32, 5, false), j === 1 ? vein : dark));
    }
  }
  const parts = [];
  for (const s of [-1, 1]) {
    const p = add(sphere(4, hot), s * 17, 4, 19);
    add(ring(5), s * 17, 4, 18);
    parts.push({ mesh: p, hp: 180 + index * 25, max: 180 + index * 25 });
  }
  g.userData = {
    parts,
    vents,
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

const cruiserTemplates = new Map();
export function createSubboss(index = 0) {
  if (!cruiserTemplates.has(index)) {
    const g = new T.Group(),
      armor = metal('#60748e'),
      dark = metal('#152436'),
      hot = glowMaterial('#ff713c', 2);
    g.add(box(12, 5, 19, armor), box(7, 3, 23, dark, 0, 3, 0));
    for (const side of [-1, 1]) {
      g.add(box(12, 3, 13, armor, side * 11, -1, 0), box(8, 0.5, 14, hot, side * 11, 0.7, 0));
      for (let i = 0; i < 3; i++) {
        const barrel = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 8, 8), dark);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(side * (6 + i * 3), 0, 9);
        g.add(barrel);
      }
      g.add(box(4, 4, 1, hot, side * 5, 0, 10));
    }
    const eye = new T.Mesh(new T.SphereGeometry(2, 12, 8), hot);
    eye.position.set(0, 2, 12);
    g.add(eye);
    const frames = new T.Group();
    // Shared fittings sit on ten independently shaped hulls.
    const hull = new T.Group();
    while (g.children.length) hull.add(g.children[0]);
    const sizes = [
      [1, 1, 1],
      [1.2, 0.6, 0.7],
      [0.55, 1.2, 1.4],
      [0.55, 0.7, 0.55],
      [0.9, 0.6, 0.7],
      [0.65, 1.6, 0.6],
      [0.5, 0.8, 0.5],
      [1.1, 1.1, 1],
      [0.4, 1.2, 0.5],
      [0.75, 1.3, 0.9],
    ];
    hull.scale.set(...sizes[index]);
    g.add(hull, frames);
    const add = (o, x, y, z = 0) => {
      o.position.set(x, y, z);
      frames.add(o);
    };
    switch (index) {
      case 0:
        for (const side of [-1, 1]) add(box(3, 9, 17, dark), side * 14, 4);
        break;
      case 1:
        for (const side of [-1, 1]) {
          const wing = box(18, 1.5, 12, armor);
          wing.rotation.z = side * 0.4;
          add(wing, side * 14, 2);
        }
        break;
      case 2: {
        const cone = new T.Mesh(new T.ConeGeometry(7, 26, 8), armor);
        cone.rotation.x = Math.PI / 2;
        add(cone, 0, 0, 14);
        break;
      }
      case 3:
        for (let i = 0; i < 4; i++) {
          const arm = box(18, 3, 7, armor);
          arm.rotation.z = (i * Math.PI) / 2;
          add(arm, Math.cos((i * Math.PI) / 2) * 12, Math.sin((i * Math.PI) / 2) * 12);
        }
        break;
      case 4:
        for (const side of [-1, 1])
          for (let j = 0; j < 4; j++) {
            const feather = new T.Mesh(new T.ConeGeometry(3, 19, 4), armor);
            feather.rotation.z = side * (0.6 + j * 0.2);
            add(feather, side * (9 + j * 3), 4 + j * 2, -j * 3);
          }
        break;
      case 5:
        for (const side of [-1, 1]) {
          add(box(5, 17, 7, armor), side * 13, -5);
          add(box(9, 4, 10, dark), side * 13, -14, 3);
        }
        break;
      case 6:
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const tube = new T.CatmullRomCurve3([
            new T.Vector3(),
            new T.Vector3(Math.cos(a) * 10, Math.sin(a) * 10, 2),
            new T.Vector3(Math.cos(a) * 16, Math.sin(a) * 16, 10),
          ]);
          frames.add(new T.Mesh(new T.TubeGeometry(tube, 12, 1.4, 6, false), hot));
        }
        break;
      case 7:
        for (const side of [-1, 1]) {
          add(box(8, 12, 25, armor), side * 13, 2);
          add(box(4, 4, 8, hot), side * 13, 4, 16);
        }
        break;
      case 8:
        add(
          new T.Mesh(
            new T.OctahedronGeometry(17),
            new T.MeshStandardMaterial({ color: '#6735af', wireframe: true }),
          ),
          0,
          0,
        );
        break;
      case 9:
        for (let i = 0; i < 7; i++) {
          const a = (i / 6) * Math.PI;
          const tooth = new T.Mesh(new T.ConeGeometry(2.5, 12, 5), hot);
          tooth.rotation.z = a - Math.PI / 2;
          add(tooth, Math.cos(a) * 15, Math.sin(a) * 15);
        }
        break;
    }
    g.userData.variant = index;
    cruiserTemplates.set(index, g);
  }
  return cruiserTemplates.get(index).clone(true);
}

export const SUBBOSS_NAMES = [
  'CRUZADOR ROK',
  'ARRAIA ABISSAL',
  'BROCA SENTINELA',
  'SATÉLITE CRUZADO',
  'AVE SOLAR',
  'CARANGUEJO GLACIAL',
  'MEDUSA VIVA',
  'FORTIM ÔMEGA',
  'PRISMA DO VAZIO',
  'GUARDIÃO DA COROA',
];
/** Ten tactical signatures; phase adds pressure without closing every escape lane. */
export function encounterPattern(index, volley, player, phase = 1) {
  const result = [];
  const count = 4 + phase;
  for (let i = 0; i < count; i++) {
    const u = i - (count - 1) / 2;
    const a = (i * Math.PI * 2) / count + volley * 0.4;
    let x, y;
    switch (index) {
      case 0:
        x = u * 7;
        y = i % 2 ? 3 : -3;
        break;
      case 1:
        x = (i % 2 ? 1 : -1) * (8 + i * 2);
        y = u * 4;
        break;
      case 2:
        x = Math.cos(a) * 14;
        y = Math.sin(a) * 10;
        break;
      case 3:
        x = i % 2 ? u * 8 : 0;
        y = i % 2 ? 0 : u * 6;
        break;
      case 4:
        x = u * 8;
        y = Math.abs(u) * 4 - 6;
        break;
      case 5:
        x = u * 5;
        y = Math.sin(volley) * 7 + (i % 2) * 5;
        break;
      case 6:
        x = Math.sin(a * 3) * 17;
        y = Math.cos(a) * 11;
        break;
      case 7:
        x = u * 9;
        y = ((Math.floor(volley) % 3) - 1) * 7;
        break;
      case 8:
        x = Math.cos(a) * (8 + phase * 3);
        y = Math.sin(a) * 14;
        break;
      default:
        x = u * 7;
        y = Math.cos(a * 2) * 12;
        break;
    }
    result.push(new T.Vector3(player.x + x, player.y + y, player.z));
  }
  return result;
}
