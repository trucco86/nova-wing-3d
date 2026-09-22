import * as T from 'three';
import { box, metal, glowMaterial, halo } from './visuals.js';
export const PICKUP_COLORS = { shield: '#35ff38', blue: '#2975ff' };
const pickups = new Map(),
  pods = new Map();
export function createPickup(kind) {
  if (!pickups.has(kind)) {
    const g = new T.Group(),
      color = PICKUP_COLORS[kind],
      rim = new T.MeshBasicMaterial({ color }),
      bright = glowMaterial(color, 1.4);
    g.add(new T.Mesh(new T.TorusGeometry(3, 0.3, 10, 40), rim));
    g.add(new T.Mesh(new T.TorusGeometry(3.5, 0.07, 6, 40), bright));
    if (kind === 'shield') {
      g.add(box(1.8, 0.5, 0.18, rim), box(0.5, 1.8, 0.18, rim));
    } else {
      for (const y of [-0.65, 0.65])
        for (const side of [-1, 1]) {
          const bar = box(1.15, 0.3, 0.18, rim, side * 0.4, y, 0);
          bar.rotation.z = -side * 0.65;
          g.add(bar);
        }
    }
    g.userData = { kind, color };
    pickups.set(kind, g);
  }
  return pickups.get(kind).clone(true);
}
export function createPod(level) {
  level = Math.max(1, Math.min(3, level));
  if (!pods.has(level)) {
    const g = new T.Group(),
      armor = metal('#d5e1e8', 0.75, 0.3),
      dark = metal('#172d48'),
      color = ['#ffb735', '#33baff', '#db72ff'][level - 1],
      plasma = glowMaterial(color, 2);
    const core = new T.Mesh(new T.SphereGeometry(0.7 + level * 0.14, 16, 12), plasma);
    core.name = 'pod-core';
    g.add(core);
    const ring = new T.Mesh(new T.TorusGeometry(1.1 + level * 0.15, 0.16, 8, 28), dark);
    ring.name = 'pod-ring';
    g.add(ring);
    for (let i = 0; i < 2 + level; i++) {
      const a = (i * Math.PI * 2) / (2 + level),
        arm = new T.Group();
      arm.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0);
      arm.rotation.z = a;
      arm.add(box(0.65, 0.45, 2.3 + level * 0.3, armor, 0.3, 0, 0.2));
      arm.add(box(0.2, 0.25, 1.8, plasma, 0.7, 0, -0.3));
      const claw = new T.Mesh(new T.ConeGeometry(0.38, 1.6, 5), dark);
      claw.rotation.x = -Math.PI / 2;
      claw.position.set(0.25, 0, -1.6);
      arm.add(claw);
      g.add(arm);
    }
    if (level > 1) {
      const collar = ring.clone();
      collar.scale.setScalar(1.25);
      collar.position.z = 0.8;
      g.add(collar);
    }
    if (level === 3) for (const s of [-1, 1]) g.add(box(2.2, 0.2, 1.4, armor, s * 1.5, 0, 0.8));
    g.add(halo(color, 3.2, 0.25));
    g.userData = { level };
    pods.set(level, g);
  }
  return pods.get(level).clone(true);
}
export function animatePod(p, time) {
  p.getObjectByName('pod-ring').rotation.z = time * 1.6;
  p.getObjectByName('pod-core').scale.setScalar(1 + Math.sin(time * 5) * 0.08);
}
