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
export function createGroundEnemy(kind) {
  if (!templates.has(kind)) {
    const g = new T.Group();
    g.add(box(kind === 'walker' ? 23 : 16, 1, 24, dark, 0, -0.5));
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
    g.add(turret);
    templates.set(kind, g);
  }
  const model = templates.get(kind).clone(true);
  model.userData = { turret: model.getObjectByName('turret'), kind };
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
    g.userData = { solids, kind, length: kind === 'tunnel' ? 520 : 18 };
    templates.set(kind, g);
  }
  const template = templates.get(kind),
    clone = template.clone(true);
  clone.userData = template.userData; // Immutable shared collision geometry.
  return clone;
}
