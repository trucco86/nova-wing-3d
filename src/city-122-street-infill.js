import * as T from 'three';
import { CITY_RETAIL_RESERVATIONS, cityFootprintsOverlap } from './city-spatial-layout.js';

// Human-scale architecture in previously empty bands between the avenue,
// maglev and the first skyscrapers. Only *existing* building footprints anchor
// storefronts; unoccupied sidewalk parcels host small transit/service pods.
// Every detail is decorative, always outside x=+/-95, and fixed to its road
// tile so city loops, ascent and reset cannot leave floating scenery.
const unit = new T.BoxGeometry(1, 1, 1);
const dummy = new T.Object3D();
const steel = new T.MeshStandardMaterial({ color: '#727a7b', metalness: 0.69, roughness: 0.42 });
const paving = new T.MeshStandardMaterial({ color: '#797c76', metalness: 0.27, roughness: 0.74 });
const glass = new T.MeshStandardMaterial({ color: '#91a8a5', metalness: 0.36, roughness: 0.3 });
const amber = new T.MeshStandardMaterial({
  color: '#f4ce9b', metalness: 0.24, roughness: 0.47,
  emissive: '#806040', emissiveIntensity: 0.12,
});
const brass = new T.MeshStandardMaterial({ color: '#a49379', metalness: 0.65, roughness: 0.44 });
const part = (x, y, z, w, h, d) => ({ x, y, z, w, h, d });

function batch(parent, name, material, entries) {
  const mesh = new T.InstancedMesh(unit, material, entries.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.userData.architectural = true;
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  entries.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(p.w, p.h, p.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

export function planCity122SidewalkParcels(buildings = []) {
  const lots = [];
  for (const side of [-1, 1]) {
    for (let sector = 0; sector < 54; sector++) {
      const z = -24 - sector * 35;
      const slot = { x: side * 105.5, z, w: 15.5, depth: 31 };
      // The existing three retail podiums already fill their parcels.
      // Refuse to place decorative kiosks through those buildings or any
      // generated office tower. Never shift props into the flight corridor.
      if (CITY_RETAIL_RESERVATIONS.some((b) => cityFootprintsOverlap(slot, b, 1))) continue;
      if (buildings.some((b) => cityFootprintsOverlap(slot, b, 1))) continue;
      lots.push({ ...slot, side, sector, kiosk: sector % 3 === 1 });
    }
  }
  return lots;
}

export function createCity122StreetInfill(buildings = []) {
  const root = new T.Group();
  root.name = 'city122-lived-in-street-blocks';
  root.userData.visualOnly = true;
  root.userData.quality = 'medium';
  const medium = new T.Group();
  medium.name = 'city122-visible-street-life-medium';
  const high = new T.Group();
  high.name = 'city122-extra-street-furniture-high';
  const sidewalks = [];
  const structures = [];
  const storefronts = [];
  const lights = [];
  const furniture = [];
  const finer = [];
  const parcels = planCity122SidewalkParcels(buildings);
  for (const lot of parcels) {
    const x = lot.x, z = lot.z, side = lot.side;
    // Supports sit on the same y=-7 ground as the road, not underground.
    sidewalks.push(part(x, -6.72, z, lot.w, 0.45, lot.depth));
    // Two textured curb seams make the narrow pedestrian route perceptible
    // in motion while never entering the x=+/-95 maglev safety boundary.
    structures.push(part(side * 97.95, -6.4, z, 0.55, 0.58, 30));
    if (lot.kiosk) {
      // Distinct transit, parcel and repair bays with supported roof and
      // side glazing. Every vertical support reaches the pavement.
      const y = -2.2;
      structures.push(part(x + side * 2.7, y, z + 3, 0.85, 8.0, 0.85));
      structures.push(part(x - side * 2.7, y, z + 3, 0.85, 8.0, 0.85));
      structures.push(part(x, 2.15, z + 3, 8.2, 0.78, 11.3));
      structures.push(part(x, -3.7, z - 1, 6.6, 5.2, 1.0));
      storefronts.push(part(x, -2.8, z + 3.05, 6.6, 4.9, 0.24));
      lights.push(part(x, 1.63, z + 9, 6.2, 0.28, 0.4));
      finer.push(part(x, -5.9, z - 9, 6.0, 0.45, 2.0));
      finer.push(part(x + side * 1.7, -4.8, z - 8.3, 0.22, 2.0, 0.25));
    } else {
      // Freight stalls and benches fill other street bays without introducing
      // a giant repeated illuminated sign in the city's main view.
      for (const n of [-1, 1]) {
        finer.push(part(x + n * 3.3, -5.7, z + 5, 4.2, 0.48, 2.3));
        finer.push(part(x + n * 3.3, -6.0, z + 5, 0.5, 1.8, 2.3));
      }
    }
    for (const dz of [-12, 12]) {
      lights.push(part(side * 98.4, -3.1, z + dz, 0.35, 7.3, 0.35));
      lights.push(part(side * 98.4, 0.7, z + dz, 0.72, 0.34, 1.0));
      furniture.push(part(side * 110.6, -5.65, z + dz * 0.8, 2.8, 2.1, 2.8));
    }
  }
  buildings.forEach((b, i) => {
    const front = b.z + b.depth / 2;
    const side = Math.sign(b.x) || 1;
    // Materially recognizable ground floors on REAL building anchors.
    // Bay frontage is attached to the host footprint, never a free cube.
    if (b.h < 20) return;
    const width = Math.min(13, b.w * 0.81);
    structures.push(part(b.x, -2.7, front + 0.42, width + 1.8, 7.9, 1.08));
    storefronts.push(part(b.x, -2.6, front + 1.04, width, 5.6, 0.28));
    structures.push(part(b.x, 1.95, front + 2.0, width + 2.0, 0.65, 3.2));
    // Sparse warm wayfinding instead of all windows glowing cyan/magenta.
    if (i % 3 === 0)
      lights.push(part(b.x, 2.15, front + 3.7, width * 0.66, 0.32, 0.22));
    if (i % 4 === 2) {
      structures.push(part(b.x - side * (b.w * 0.48), -2.65, front + 1.25, 0.42, 8.0, 0.52));
      finer.push(part(b.x + side * (b.w * 0.33), -5.4, front + 3.6, 2.3, 3.0, 1.0));
    }
  });
  batch(medium, 'city122-grounded-pedestrian-pavements', paving, sidewalks);
  batch(medium, 'city122-service-entries-and-transit-shelters', steel, structures);
  batch(medium, 'city122-real-ground-floor-storefront-glazing', glass, storefronts);
  batch(medium, 'city122-subtle-amber-street-wayfinding', amber, lights);
  batch(high, 'city122-service-bench-and-planter-furniture', brass, furniture);
  batch(high, 'city122-loading-bay-small-furniture', steel, finer);
  root.add(medium, high);
  root.userData.sidewalkParcels = parcels;
  setCity122Quality(root, 'medium');
  return root;
}

export function setCity122Quality(root, quality) {
  if (!root) return;
  root.userData.quality = quality === 'high' ? 'high' : 'medium';
  root.getObjectByName('city122-extra-street-furniture-high').visible =
    root.userData.quality === 'high';
}
