import * as T from 'three';
import { PET_ITEMS } from './pet-collectibles.js';

// Four readable silhouettes; objects use cached geometry, like the existing rings.
const templates = new Map();
export function createPetPickup(kind) {
  const item = PET_ITEMS.find((entry) => entry.id === kind);
  if (!item) return null;
  if (!templates.has(kind)) {
    const group = new T.Group();
    const base = new T.MeshStandardMaterial({
      color: item.color,
      roughness: 0.42,
      metalness: kind === 'can' ? 0.7 : 0.2,
      emissive: item.color,
      emissiveIntensity: 0.25,
    });
    const bright = new T.MeshBasicMaterial({ color: '#e8faff' });
    const dark = new T.MeshStandardMaterial({ color: '#213249', roughness: 0.65 });
    function add(geometry, material, x = 0, y = 0, z = 0) {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    }
    if (kind === 'can') {
      const tin = add(new T.CylinderGeometry(1.35, 1.35, 1.8, 12), base);
      tin.rotation.x = Math.PI / 2;
      add(new T.TorusGeometry(1.1, 0.13, 6, 16), bright, 0, 0, 0.96);
      add(new T.CircleGeometry(0.55, 16), dark, 0, 0, 1.05);
    } else if (kind === 'treat') {
      add(new T.BoxGeometry(3.2, 0.9, 1.2), base);
      for (const x of [-1.4, 1.4])
        for (const y of [-0.5, 0.5]) add(new T.SphereGeometry(0.7, 10, 8), base, x, y, 0);
      add(new T.BoxGeometry(0.6, 0.45, 1.35), dark);
    } else if (kind === 'toy') {
      add(new T.SphereGeometry(1.5, 16, 12), base);
      const loop = add(new T.TorusGeometry(1.5, 0.12, 8, 24), bright);
      loop.rotation.y = Math.PI / 3;
      add(new T.SphereGeometry(0.35, 8, 6), dark, 0.4, 0.4, 1.3);
    } else {
      add(new T.BoxGeometry(2.4, 2.5, 1.3), base);
      add(new T.BoxGeometry(2.55, 0.35, 1.4), bright, 0, 1.38, 0);
      add(new T.SphereGeometry(0.56, 10, 8), dark, 0, -0.3, 0.72);
      for (const x of [-0.65, -0.2, 0.3, 0.75])
        add(new T.SphereGeometry(0.25, 8, 6), dark, x, 0.5, 0.7);
    }
    const halo = new T.Mesh(
      new T.TorusGeometry(2.6, 0.085, 6, 28),
      new T.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.8 }),
    );
    group.add(halo);
    group.userData = { kind, color: item.color, pet: true };
    templates.set(kind, group);
  }
  return templates.get(kind).clone(true);
}
