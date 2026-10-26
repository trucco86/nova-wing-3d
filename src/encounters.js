import * as T from 'three';
import { box, metal, glowMaterial } from './visuals.js';
export const isGroundSector = (sector) => ['city', 'ocean', 'ice'].includes(sector.theme);
const armor = metal('#4a6772', 0.8, 0.32),
  dark = metal('#101d2b'),
  joint = metal('#a9aeb7', 0.85),
  hazard = metal('#bd7435'),
  red = glowMaterial('#ff604b', 1.8),
  cyan = glowMaterial('#41d9d0', 1.4);
const templates = new Map();
const ball = (r, m) => new T.Mesh(new T.SphereGeometry(r, 12, 8), m);
function beam(a, b, r, material) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b),
    d = end.clone().sub(start);
  const o = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), material);
  o.position.copy(start.add(end).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return o;
}
export function createGroundEnemy(kind, variant = -1) {
  const key = kind + ':' + variant;
  if (!templates.has(key)) {
    const g = new T.Group();
    if (variant < 0) g.add(box(kind === 'walker' ? 23 : 16, 1, 24, dark, 0, -0.5));
    const turret = new T.Group();
    turret.name = 'turret';
    if (kind === 'tank') {
      g.add(box(8, 3, 12, armor, 0, 2.5));
      for (const s of [-1, 1]) {
        g.add(box(2.6, 3, 14, dark, s * 5, 2));
        for (let j = 0; j < 5; j++) {
          const wheel = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 2.7, 10), joint);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(s * 5, 2, j * 2.5 - 5);
          g.add(wheel);
        }
        g.add(box(1, 0.25, 11, hazard, s * 5, 3.8));
      }
      turret.position.y = 5;
      turret.add(box(6, 2.6, 6, armor));
      turret.add(box(1, 1, 10, joint, 0, 0.2, 6));
      turret.add(box(2, 1.8, 1, dark, 0, 0.2, 11));
      turret.add(box(3, 0.6, 0.3, red, 0, 0.8, 3.2));
    } else {
      for (const s of [-1, 1]) {
        const leg = new T.Group();
        leg.name = 'leg' + s;
        leg.add(box(5, 3, 9, dark, s * 5, 1.5, 2));
        leg.add(beam([s * 5, 3, 0], [s * 7, 9, -1], 1.7, armor));
        leg.add(beam([s * 7, 9, -1], [s * 4, 15, 0], 2, joint));
        const knee = ball(2.2, hazard);
        knee.position.set(s * 7, 9, -1);
        leg.add(knee);
        g.add(leg);
        g.add(box(4, 8, 5, armor, s * 10, 16));
        g.add(box(2, 2, 9, dark, s * 10, 13, 4));
        g.add(box(2.5, 0.5, 1, red, s * 10, 13, 8.6));
      }
      g.add(box(11, 9, 7, armor, 0, 18));
      for (let i = 0; i < 4; i++) g.add(box(8, 0.5, 0.4, dark, 0, 16 + i * 1.4, 3.6));
      turret.position.y = 25;
      turret.add(box(7, 4, 6, dark));
      turret.add(box(5.5, 1, 0.4, red, 0, 0.4, 3.1));
      turret.add(beam([0, 1, 0], [0, 5, 0], 0.25, joint));
    }
    if (variant >= 0) {
      const light = variant === 1 ? cyan : red;
      for (const side of [-1, 1]) {
        for (let j = 0; j < 4; j++) {
          const hub = new T.Mesh(
            new T.CylinderGeometry(
              kind === 'tank' ? 1.25 : 0.65,
              kind === 'tank' ? 1.25 : 0.65,
              0.5,
              12,
            ),
            joint,
          );
          hub.rotation.z = Math.PI / 2;
          hub.position.set(
            side * (kind === 'tank' ? 6.7 : 5.5),
            kind === 'tank' ? 1.8 : 3 + j * 3,
            kind === 'tank' ? j * 3 - 4.5 : 1,
          );
          g.add(hub);
        }
        const fin = new T.Mesh(new T.ConeGeometry(1.5, 4, 4), armor);
        fin.position.set(side * (kind === 'tank' ? 4 : 9), kind === 'tank' ? 6 : 24, -2);
        g.add(fin);
        turret.add(beam([side * 2, 0, -2], [side * 2.7, 3, -3], 0.2, joint));
        turret.add(box(0.7, 0.5, 0.4, light, side * 1.1, 1.3, 3.2));
      }
      if (kind === 'tank') {
        // Sloped glacis and segmented skirts break up the rectangular silhouette.
        for (const side of [-1, 1]) {
          const cheek = box(2.7, 2.4, 8, armor, side * 3.8, 4, 0);
          cheek.rotation.z = side * 0.35;
          g.add(cheek);
          for (let j = 0; j < 7; j++) {
            const tread = box(3, 0.5, 1.2, armor, side * 5, 3.7, j * 2 - 6);
            g.add(tread, box(0.3, 1.5, 0.7, hazard, side * 6.4, 2.4, j * 2 - 6));
          }
          g.add(beam([side * 3, 4, -4], [side * 3, 8, -4], 0.25, joint));
          const exhaust = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 3, 8), dark);
          exhaust.position.set(side * 3, 4, -5);
          g.add(exhaust);
          turret.add(box(1.3, 2.2, 3.5, dark, side * 3.5, 0.7, -1));
          for (let j = 0; j < 3; j++)
            turret.add(box(0.7, 0.4, 0.3, light, side * 3.5, j * 0.6, -0.2));
          if (variant === 1) {
            turret.add(beam([side * 1.6, 0, 3], [side * 1.6, 0, 13], 0.45, joint));
            turret.add(box(1.2, 1.1, 1.4, light, side * 1.6, 0, 13));
          }
          if (variant === 2) {
            const rack = box(3, 3, 5, dark, side * 4, 2, -1);
            rack.rotation.x = -0.35;
            turret.add(rack);
            for (const x of [-0.7, 0.7])
              for (const y of [1.3, 2.5]) {
                const tube = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 3.7, 8), joint);
                tube.rotation.x = Math.PI / 2;
                tube.position.set(side * 4 + x, y, 1);
                turret.add(tube);
              }
          }
        }
        const hatch = new T.Mesh(new T.CylinderGeometry(1.4, 1.7, 0.5, 10), joint);
        hatch.position.set(0, 1.7, -1);
        turret.add(hatch);
        const prow = box(7, 2, 3, armor, 0, 3, 5);
        prow.rotation.x = 0.45;
        g.add(prow);
      } else {
        for (const side of [-1, 1]) {
          const shoulder = new T.Mesh(new T.IcosahedronGeometry(3.6, 0), armor);
          shoulder.scale.set(1, 0.7, 1);
          shoulder.position.set(side * 9, 21, 0);
          g.add(shoulder);
          g.add(beam([side * 4, 15, 3], [side * 7, 9, 2], 0.45, hazard));
          g.add(beam([side * 7, 9, 2], [side * 5, 3, 3], 0.35, joint));
          for (let j = 0; j < 3; j++) g.add(box(3.5, 0.4, 5, dark, side * 9, 18 + j, 1));
          if (variant === 1) {
            const shield = new T.Mesh(new T.CylinderGeometry(4.5, 4.5, 1, 6), armor);
            shield.rotation.x = Math.PI / 2;
            shield.position.set(side * 12, 16, 4);
            g.add(shield);
            g.add(box(0.5, 6, 1.2, cyan, side * 12, 16, 4.7));
          } else {
            for (let j = 0; j < (variant === 2 ? 3 : 1); j++)
              g.add(beam([side * 10 + j - 1, 13, 3], [side * 10 + j - 1, 13, 12], 0.38, joint));
          }
        }
        const chest = new T.Mesh(new T.IcosahedronGeometry(4.5, 0), armor);
        chest.scale.set(1.3, 1, 0.5);
        chest.position.set(0, 19, 3);
        g.add(chest);
        const reactor = ball(1.6, light);
        reactor.position.set(0, 19, 5);
        g.add(reactor);
        turret.add(box(1, 1, 3, armor, -3, 2.5, 0), box(1, 1, 3, armor, 3, 2.5, 0));
        if (variant === 2) turret.add(beam([0, 2, 0], [0, 8, -1], 0.5, hazard));
      }
    }
    g.add(turret);
    templates.set(key, g);
  }
  const model = templates.get(key).clone(true);
  model.userData = { turret: model.getObjectByName('turret'), kind, variant };
  return model;
}
export function animateGroundEnemy(model, time, target) {
  const turret = model.userData.turret;
  turret.rotation.y = T.MathUtils.clamp(
    Math.atan2(target.x - model.position.x, target.z - model.position.z),
    -0.7,
    0.7,
  );
  if (model.userData.kind === 'walker')
    for (const s of [-1, 1])
      model.getObjectByName('leg' + s).rotation.x = Math.sin(time * 2.5 + s) * 0.07;
}
/** Geometry and collision boxes are built together. No invisible solid opening. */
export function createObstacle(kind = 'gantry') {
  if (!templates.has(kind)) {
    const g = new T.Group(),
      solids = [];
    const solid = (w, h, d, x, y, z, material = armor) => {
      g.add(box(w, h, d, material, x, y, z));
      solids.push({ center: new T.Vector3(x, y, z), half: new T.Vector3(w / 2, h / 2, d / 2) });
    };
    if (kind === 'tunnel') {
      solid(4, 44, 520, -34, 15, -260, dark);
      solid(4, 44, 520, 34, 15, -260, dark);
      solid(72, 3, 520, 0, -8.5, -260, armor);
      solid(72, 3, 520, 0, 38.5, -260, dark);
      for (let z = 0; z >= -520; z -= 40) {
        for (const s of [-1, 1]) {
          g.add(box(2, 40, 2, armor, s * 31, 15, z));
          g.add(box(0.4, 24, 0.6, cyan, s * 29.8, 17, z + 1.1));
        }
        g.add(box(64, 2, 3, armor, 0, 36, z));
        g.add(box(18, 0.3, 3, cyan, 0, 34.8, z));
      }
      for (let i = 0; i < 3; i++) {
        const gap = i % 2 ? -9 : 9,
          z = -110 - i * 150;
        // A 30-unit opening, tall enough to evade without scraping the ceiling.
        const left = gap - 15,
          right = gap + 15;
        solid(left + 32, 43, 5, (-32 + left) / 2, 14.5, z);
        solid(32 - right, 43, 5, (right + 32) / 2, 14.5, z);
        for (const x of [left, right]) g.add(box(0.5, 35, 5.5, hazard, x, 13, z));
        const arrow = new T.Mesh(new T.ConeGeometry(2, 4, 3), cyan);
        arrow.rotation.z = gap > 0 ? -Math.PI / 2 : Math.PI / 2;
        arrow.position.set(gap, 30, z + 3);
        g.add(arrow);
      }
    } else if (kind === 'carrier') {
      // Derelict ship: hull, bridge and two wings with escapable upper corridor.
      solid(36, 11, 42, 0, 14, 0, armor);
      solid(14, 9, 13, 0, 22, -8, dark);
      for (const side of [-1, 1]) {
        solid(18, 4, 25, side * 26, 13, 4, dark);
        g.add(box(14, 0.8, 17, cyan, side * 26, 15.6, 5));
        g.add(box(5, 3, 4, red, side * 8, 13, 22));
      }
      g.add(box(14, 1, 28, cyan, 0, 20, 3));
      // Heavy escort carrier: plated command deck, hangar, visible engines and guns.
      // Functional protrusions are added to solids; thin lights remain decorative.
      const bridge = box(10, 0.6, 9, cyan, 0, 27, -8);
      bridge.name = 'carrier-command-windows';
      g.add(bridge);
      const hangar = box(17, 6, 0.8, joint, 0, 13, 21.6);
      hangar.name = 'carrier-hangar-gate';
      g.add(hangar);
      for (const side of [-1, 1]) {
        solid(6, 5, 8, side * 13, 14, 18, dark);
        const thruster = new T.Mesh(new T.TorusGeometry(2.45, 0.55, 6, 14), cyan);
        thruster.position.set(side * 13, 14, 22.2);
        thruster.name = 'carrier-engine-nozzle';
        g.add(thruster);
        g.add(box(14, 0.8, 14, armor, side * 26, 16, 4));
        for (let i = 0; i < 3; i++)
          g.add(box(2.5, 0.35, 1.4, cyan, side * 26, 16.6, -2 + i * 6));
        solid(4, 2, 6, side * 12, 22, -16, armor);
        const cannon = box(1.3, 1.3, 8, joint, side * 12, 22.6, -21);
        cannon.name = 'carrier-defense-cannon';
        g.add(cannon);
      }
      for (let i = 0; i < 5; i++) {
        g.add(box(3, 0.7, 1.3, dark, 0, 20.8, -12 + i * 6));
        g.add(box(1.5, 0.2, 0.7, red, 0, 21.3, -12 + i * 6));
      }
    } else if (kind === 'satellite') {
      solid(8, 9, 10, 0, 14, 0, armor);
      solid(2, 9, 2, 0, 22, 0, joint);
      const antenna = ball(3.6, cyan);
      antenna.position.y = 28;
      g.add(antenna);
      for (const side of [-1, 1]) {
        solid(19, 1.5, 14, side * 15, 15, 0, dark);
        for (const z of [-5, 0, 5]) g.add(box(18, 0.2, 0.35, cyan, side * 15, 16, z));
        for (let i = -3; i <= 3; i += 2)
          g.add(box(0.32, 0.18, 12, joint, side * 15 + i * 2.2, 16, 0));
        const panel = box(3, 0.35, 10, armor, side * 23, 16.4, 0);
        panel.name = 'satellite-array-rib';
        g.add(panel);
      }
      const uplink = new T.Mesh(new T.TorusGeometry(2.6, 0.35, 6, 12), cyan);
      uplink.name = 'satellite-telemetry-ring';
      uplink.position.set(0, 27.7, 0);
      g.add(uplink);
      g.add(box(4, 0.4, 7, red, 0, 18.7, 0));
    } else if (kind === 'debris') {
      solid(14, 12, 16, 0, 18, 0, dark);
      for (const side of [-1, 1]) {
        const shard = box(8, 2, 12, armor, side * 8, 21, -3);
        shard.rotation.z = side * 0.35;
        g.add(shard);
        // Physical debris fins: include the rotated shard's conservative AABB,
        // so the ship and projectiles cannot pass through visible wreckage.
        solids.push({
          center: new T.Vector3(side * 8, 21, -3),
          half: new T.Vector3(5, 3, 6),
        });
      }
      g.add(box(6, 2, 4, red, 0, 18, 9));
      // Debris must read as a destroyed ship, not an anonymous floating box.
      for (const side of [-1, 1]) {
        const brokenFin = box(4, 1, 11, armor, side * 5, 22, -2);
        brokenFin.rotation.y = side * 0.2;
        brokenFin.name = 'debris-broken-ship-fin';
        g.add(brokenFin);
        g.add(box(1.2, 0.6, 5, red, side * 5, 23, 0));
      }
      const hullMarking = box(10, 0.6, 3, joint, 0, 24.1, -4);
      hullMarking.name = 'debris-hull-marking';
      g.add(hullMarking);
    } else if (kind === 'gantry') {
      for (const s of [-1, 1]) {
        solid(7, 38, 10, s * 28, 12, 0);
        g.add(beam([s * 28, -7, 4], [s * 15, 28, 4], 0.6, hazard));
        g.add(box(1, 28, 1, cyan, s * 24, 12, 5.1));
      }
      solid(63, 5, 10, 0, 29, 0);
      solid(14, 12, 9, -12, 20.5, 0, dark);
      g.add(box(14, 0.5, 9.5, hazard, -12, 14.3, 0));
    } else {
      solid(12, 18, 18, 0, 2, 0, dark);
      for (const s of [-1, 1]) {
        const drum = new T.Mesh(new T.CylinderGeometry(3, 3, 17, 12), armor);
        drum.position.set(s * 3, 2, 0);
        g.add(drum);
        g.add(box(0.6, 16, 1, hazard, s * 5.8, 2, 9));
      }
      g.add(box(12, 1, 18, cyan, 0, 11.5));
    }
    g.userData = { solids, kind, length: kind === 'tunnel' ? 520 : kind === 'carrier' ? 45 : 18 };
    templates.set(kind, g);
  }
  const template = templates.get(kind),
    clone = template.clone(true);
  clone.userData = template.userData; // Immutable shared collision geometry.
  return clone;
}
