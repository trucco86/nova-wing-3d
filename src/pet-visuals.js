import * as T from 'three';
import { PET_ITEMS } from './pet-collectibles.js';

// Four cached readable silhouettes; preserved item IDs keep existing checkpoints intact.
// Old dog-bone pickup replaced by a real fish, while bagged litter becomes a cat-food pouch.
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
      const label = add(new T.CircleGeometry(0.6, 16), dark, 0, 0, 1.05);
      label.rotation.z = Math.PI / 4;
    } else if (kind === 'treat') {
      // Fish: rounded torso, triangular tail and visible eye. Never a bone.
      const fish = add(new T.SphereGeometry(1, 12, 8), base, 0.1, 0, 0);
      fish.scale.set(1.6, 0.68, 0.56);
      const tail = add(new T.ConeGeometry(0.87, 1.3, 3), base, -1.8, 0, 0);
      tail.rotation.z = Math.PI / 2;
      const fin = add(new T.ConeGeometry(0.48, 0.95, 3), bright, 0, 0.8, 0);
      fin.rotation.z = -0.15;
      add(new T.SphereGeometry(0.15, 8, 6), dark, 1.05, 0.16, 0.48);
    } else if (kind === 'toy') {
      // Tiny plush mouse with whiskers, ears and curled tail.
      const mouse = add(new T.SphereGeometry(1, 12, 8), base);
      mouse.scale.set(1.45, 0.8, 0.7);
      add(new T.SphereGeometry(0.43, 8, 6), bright, 0.62, 0.78, 0.2);
      add(new T.SphereGeometry(0.43, 8, 6), bright, -0.25, 0.78, 0.2);
      add(new T.SphereGeometry(0.17, 8, 6), dark, 1.2, -0.1, 0.4);
      const tail = add(new T.TorusGeometry(1.0, 0.105, 6, 18, Math.PI), bright, -1.45, -0.28, 0);
      tail.rotation.z = -0.5;
    } else {
      // Wet-food sachet rather than a litter bag.
      add(new T.BoxGeometry(2.2, 2.8, 0.45), base);
      add(new T.BoxGeometry(2.35, 0.26, 0.55), bright, 0, 1.38, 0);
      add(new T.CircleGeometry(0.7, 14), bright, 0, -0.1, 0.27);
      add(new T.SphereGeometry(0.23, 8, 6), dark, 0.45, -0.05, 0.29);
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
