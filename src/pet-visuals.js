import * as T from 'three';
import { PET_ITEMS } from './pet-collectibles.js';

// Six cat-only collectibles. Template geometry is shared and cloned at spawn.
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
      // Small kibble nuggets in a low-profile paper tray, never a dog bone.
      add(new T.BoxGeometry(3, 0.6, 1.4), dark);
      for (const x of [-0.8, 0, 0.8])
        add(new T.DodecahedronGeometry(0.46, 0), base, x, 0.6, 0);
    } else if (kind === 'fish') {
      const body = add(new T.SphereGeometry(1, 12, 8), base);
      body.scale.set(1.8, 0.84, 0.58);
      const tail = add(new T.ConeGeometry(0.85, 1.4, 3), base, -2, 0, 0);
      tail.rotation.z = Math.PI / 2;
      add(new T.SphereGeometry(0.16, 8, 6), dark, 0.9, 0.2, 0.55);
      const fin = add(new T.ConeGeometry(0.58, 0.85, 3), bright, -0.2, 0.8, 0);
      fin.rotation.z = -0.16;
    } else if (kind === 'pouch') {
      const pack = add(new T.BoxGeometry(2.3, 2.8, 0.4), base);
      pack.rotation.z = -0.08;
      add(new T.BoxGeometry(2.5, 0.34, 0.5), bright, 0, 1.38, 0);
      add(new T.TorusGeometry(0.55, 0.13, 6, 12), bright, 0, -0.2, 0.26);
    } else if (kind === 'catnip') {
      // Green leaves identify catnip, avoiding a generic box silhouette.
      add(new T.CylinderGeometry(0.12, 0.2, 2.4, 6), dark);
      for (const side of [-1, 1]) {
        const leaf = add(new T.SphereGeometry(0.75, 10, 6), base, side * 0.65, 0.48, 0);
        leaf.scale.set(0.95, 0.36, 0.2);
        leaf.rotation.z = side * 0.43;
      }
      add(new T.SphereGeometry(0.35, 8, 6), bright, 0, 1.38, 0);
    } else if (kind === 'toy') {
      add(new T.SphereGeometry(1.5, 16, 12), base);
      const loop = add(new T.TorusGeometry(1.5, 0.12, 8, 24), bright);
      loop.rotation.y = Math.PI / 3;
      add(new T.SphereGeometry(0.35, 8, 6), dark, 0.4, 0.4, 1.3);
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
