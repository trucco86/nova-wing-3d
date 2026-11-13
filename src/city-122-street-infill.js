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
  color: '#f4ce9b',
  metalness: 0.24,
  roughness: 0.47,
  emissive: '#806040',
  emissiveIntensity: 0.12,
});
const brass = new T.MeshStandardMaterial({ color: '#a49379', metalness: 0.65, roughness: 0.44 });
const foliage = new T.MeshStandardMaterial({ color: '#507460', metalness: 0.03, roughness: 0.88 });
const crown = new T.ConeGeometry(1, 1, 6);
const wayfindingColors = ['#f1c58b', '#9ebfb5', '#c2bd98', '#b4c5cb'];
const part = (x, y, z, w, h, d) => ({ x, y, z, w, h, d });

function batch(parent, name, material, entries, geometry = unit) {
  const mesh = new T.InstancedMesh(geometry, material, entries.length);
  const hasInstanceTint = entries.some((p) => !!p.tint);
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
    if (hasInstanceTint) mesh.setColorAt(i, new T.Color(p.tint || '#ffffff'));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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

// Places real micro-blocks in open outer-city footprints, not on top of the
// 200 office towers, 24 district towers, transit platforms or shopping podiums.
// Two bands are sampled across the full 1.9-km road tile; no generated volume
// is allowed in the piloted flight lane. One block per row plus an occasional
// outer block keeps skyline density meaningful without multiplying meshes.
export function planCity122OuterParcels(buildings = [], districtFootprints = []) {
  const reserved = [...CITY_RETAIL_RESERVATIONS, ...buildings, ...districtFootprints];
  const lots = [];
  const inner = [146, 185, 224];
  const outer = [268, 309, 352];
  for (const side of [-1, 1]) {
    for (let row = 0; row < 44; row++) {
      for (const band of [0, 1]) {
        if (band === 1 && row % 3 !== 0) continue;
        const centers = band === 0 ? inner : outer;
        const z = -32 - row * 42 + (band ? -3 : 3);
        for (let offset = 0; offset < centers.length; offset++) {
          const center = centers[(row + band + offset) % centers.length];
          const lot = {
            x: side * center,
            z,
            w: 17.5,
            depth: 28,
            row,
            side,
            band,
            kind: ['parking', 'garden', 'delivery', 'plaza', 'service', 'access'][
              (row + band * 2 + (side < 0 ? 3 : 0)) % 6
            ],
          };
          if (Math.abs(lot.x) - lot.w / 2 < 125) continue;
          if (reserved.some((b) => cityFootprintsOverlap(lot, b, 5))) continue;
          if (lots.some((b) => cityFootprintsOverlap(lot, b, 2))) continue;
          lots.push(lot);
          break;
        }
      }
    }
  }
  return lots;
}

export function createCity122StreetInfill(buildings = [], districtFootprints = []) {
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
  const trees = [];
  const walkers = [];
  const parcels = planCity122SidewalkParcels(buildings);
  const outerParcels = planCity122OuterParcels(buildings, districtFootprints);
  for (const lot of parcels) {
    const x = lot.x,
      z = lot.z,
      side = lot.side;
    // Supports sit on the same y=-7 ground as the road, not underground.
    sidewalks.push(part(x, -6.72, z, lot.w, 0.45, lot.depth));
    // Two textured curb seams make the narrow pedestrian route perceptible
    // in motion while never entering the x=+/-95 maglev safety boundary.
    structures.push(part(side * 97.95, -6.4, z, 0.55, 0.58, 30));
    if (lot.kiosk) {
      // Distinct transit, parcel and repair bays with supported roof and
      // side glazing. Every vertical support reaches the pavement.
      const y = -2.3;
      structures.push(part(x + side * 2.7, y, z + 3, 0.85, 8.0, 0.85));
      structures.push(part(x - side * 2.7, y, z + 3, 0.85, 8.0, 0.85));
      structures.push(part(x, 2.15, z + 3, 8.2, 0.78, 11.3));
      structures.push(part(x, -3.9, z - 1, 6.6, 5.2, 1.0));
      storefronts.push(part(x, -2.8, z + 3.05, 6.6, 4.9, 0.24));
      lights.push({
        ...part(x, 1.63, z + 9, 6.2, 0.28, 0.4),
        tint: wayfindingColors[lot.sector % wayfindingColors.length],
      });
      // A grounded shelter screen echoes the existing fictional building ads.
      // Real creative artwork remains on the shared city-ad atlas.
      lights.push({
        ...part(x, -1.9, z + 8.8, 4.8, 2.6, 0.2),
        tint: wayfindingColors[(lot.sector + 1) % wayfindingColors.length],
      });
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
    if (!lot.kiosk && lot.sector % 6 === 2) {
      // Urban landscaping remains entirely within the unused pavement bay.
      // Two tapered crowns read as trees instead of metallic cubes.
      const treeX = side * 109.2;
      const treeZ = z - 5.2;
      structures.push(part(treeX, -4.25, treeZ, 0.55, 4.8, 0.55));
      trees.push(part(treeX, -1.55, treeZ, 3.5, 4.3, 3.5));
      trees.push(part(treeX, 0.05, treeZ, 2.6, 3.2, 2.6));
    }
    if (!lot.kiosk && lot.sector % 9 === 5 && lot.sector % 6 !== 2) {
      // A few service pedestrians make the sidewalks inhabited. Their
      // positions are stable and are animated only while gameplay advances.
      walkers.push({ x: side * 102.7, z: z - 4.5, phase: lot.sector * 0.7 + side });
    }
    for (const dz of [-12, 12]) {
      lights.push(part(side * 98.4, -3.1, z + dz, 0.35, 7.3, 0.35));
      lights.push(part(side * 98.4, 0.7, z + dz, 0.72, 0.34, 1.0));
      furniture.push(part(side * 110.6, -5.65, z + dz * 0.8, 2.8, 2.1, 2.8));
    }
  }
  // The city's empty outer bands now have legible ground-level functions:
  // connected-looking access lanes, courtyards, local delivery stations,
  // small gardens and parked commuter transport. Every piece stays inside
  // a collision-checked parcel and shares the original seven GPU batches.
  for (const lot of outerParcels) {
    const { x, z, side, kind } = lot;
    const p = (dx, y, dz, w, h, d) => part(x + dx, y, z + dz, w, h, d);
    // The tarmac is only 0.16 tall and rests on the existing y=-7 ground.
    sidewalks.push(p(0, -6.87, 0, 17.5, 0.22, 28));
    structures.push(p(side * 8.1, -6.53, 0, 0.55, 0.74, 26));
    if (kind === 'parking') {
      // Two clearly marked parked city cars, not flying anonymous cubes.
      for (const offset of [-4, 4]) {
        structures.push(p(offset, -5.56, 0, 5.6, 2.5, 9.1));
        storefronts.push(p(offset, -3.94, -0.6, 4.2, 1.15, 4.7));
        lights.push({ ...p(offset, -4.95, 4.61, 3.6, 0.22, 0.18), tint: '#edd3a4' });
        lights.push({ ...p(offset, -4.95, -4.61, 3.1, 0.18, 0.18), tint: '#b3c9ba' });
      }
      for (const offset of [-8, 0, 8])
        lights.push({ ...p(0, -6.73, offset, 14, 0.08, 0.2), tint: '#c4c6b2' });
    } else if (kind === 'garden') {
      // An actual parklet: bounded planters, trees, low seating and paths.
      structures.push(p(0, -6.48, 0, 15, 0.85, 14));
      for (const offset of [-4.5, 4.5]) {
        structures.push(p(offset, -4.85, 1.5, 0.65, 3.9, 0.65));
        trees.push(p(offset, -1.8, 1.5, 4.4, 4.9, 4.4));
        furniture.push(p(offset, -5.82, -7.4, 3.7, 0.6, 1.7));
      }
      finer.push(p(0, -5.94, 8, 7.8, 0.65, 2.4));
    } else if (kind === 'delivery') {
      // Courier depot roof is supported by four posts that touch the slab.
      for (const dx of [-6, 6])
        for (const dz of [-7, 7]) structures.push(p(dx, -2.65, dz, 0.66, 8.3, 0.66));
      structures.push(p(0, 1.75, 0, 14, 0.7, 19));
      structures.push(p(0, -5.55, 1, 6.2, 2.65, 10.7));
      storefronts.push(p(0, -3.65, -2, 5.0, 1.55, 4.5));
      lights.push({ ...p(0, 1.35, 9.6, 10.8, 0.28, 0.25), tint: '#f0d6a5' });
      for (const dx of [-5, 5]) finer.push(p(dx, -5.8, -9, 2.6, 2.1, 3.2));
    } else if (kind === 'plaza') {
      // A modest paved square with an articulated bus shelter and planter.
      structures.push(p(0, -6.52, 0, 15, 0.62, 17));
      for (const dx of [-5, 5]) structures.push(p(dx, -3.4, 4, 0.58, 6.6, 0.58));
      structures.push(p(0, 0.1, 4, 12, 0.6, 7.5));
      storefronts.push(p(0, -3.4, 7.65, 10, 3.0, 0.26));
      lights.push({ ...p(0, -1.8, 7.83, 7.5, 0.3, 0.16), tint: '#aac8bd' });
      furniture.push(p(0, -5.6, -6, 7, 1.2, 2.2));
    } else if (kind === 'service') {
      // A public utilities yard: transformers, cabinets and ground poles.
      for (const dx of [-4.7, 4.7]) {
        structures.push(p(dx, -4.6, 0, 4.4, 4.5, 5.4));
        finer.push(p(dx, -2.05, 0, 3.5, 0.5, 4.1));
      }
      structures.push(p(side * 6.9, -2.8, 9, 0.55, 8.2, 0.55));
      lights.push({ ...p(side * 6.9, 1.45, 9, 2.0, 0.3, 1.7), tint: '#e8b78a' });
      for (const dz of [-10, -6]) finer.push(p(0, -5.7, dz, 10, 0.55, 1));
    } else {
      // Access lanes connect the side road visually to the built blocks.
      // Direction markings stay readable, never entering the flight area.
      for (const dx of [-5, 5])
        lights.push({ ...p(dx, -6.72, 0, 0.2, 0.08, 21), tint: '#d7c7a5' });
      for (const dz of [-8, 8]) {
        structures.push(p(side * 7.7, -2.6, dz, 0.45, 8.2, 0.45));
        lights.push({ ...p(side * 7.7, 1.6, dz, 1.9, 0.3, 1.2), tint: '#c6d5ba' });
      }
      finer.push(p(0, -6.55, 0, 0.3, 0.14, 6));
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
      lights.push({
        ...part(b.x, 2.15, front + 3.7, width * 0.66, 0.32, 0.22),
        tint: wayfindingColors[i % wayfindingColors.length],
      });
    if (i % 7 === 3 && b.h > 34) {
      // Architectural accent strips stay fixed to the real host facade.
      lights.push({
        ...part(b.x, Math.min(b.h - 12, 15), front + 0.85, width * 0.64, 0.25, 0.24),
        tint: wayfindingColors[(i + 2) % wayfindingColors.length],
      });
    }
    if (i % 4 === 2) {
      structures.push(part(b.x - side * (b.w * 0.48), -2.65, front + 1.25, 0.42, 8.0, 0.52));
      finer.push(part(b.x + side * (b.w * 0.33), -5.4, front + 3.6, 2.3, 3.0, 1.0));
    }
  });
  const pedestrianIndices = walkers.map((walker) => {
    const body = structures.length;
    structures.push(part(walker.x, -5.35, walker.z, 0.75, 2.6, 0.65));
    const head = structures.length;
    structures.push(part(walker.x, -3.65, walker.z, 0.85, 0.82, 0.82));
    return { ...walker, body, head };
  });
  batch(medium, 'city122-grounded-pedestrian-pavements', paving, sidewalks);
  batch(medium, 'city122-service-entries-and-transit-shelters', steel, structures);
  batch(medium, 'city122-real-ground-floor-storefront-glazing', glass, storefronts);
  batch(medium, 'city122-grounded-street-tree-canopies', foliage, trees, crown);
  batch(medium, 'city122-subtle-amber-street-wayfinding', amber, lights);
  batch(high, 'city122-service-bench-and-planter-furniture', brass, furniture);
  batch(high, 'city122-loading-bay-small-furniture', steel, finer);
  root.add(medium, high);
  root.userData.sidewalkParcels = parcels;
  root.userData.outerParcels = outerParcels;
  root.userData.pedestrians = pedestrianIndices;
  setCity122Quality(root, 'medium');
  return root;
}

export function setCity122Quality(root, quality) {
  if (!root) return;
  root.userData.quality = quality === 'high' ? 'high' : 'medium';
  root.getObjectByName('city122-extra-street-furniture-high').visible =
    root.userData.quality === 'high';
}

/**
 * Deterministic slow sidewalk motion. Reuses the already-instanced steel batch
 * and updates at coarse distance intervals, without per-frame allocations,
 * extra draw calls, physics, or animation when the game is paused.
 */
export function animateCity122StreetLife(root, travel) {
  if (!root?.visible || !Number.isFinite(travel)) return;
  const frame = Math.floor(travel / 11);
  if (root.userData.pedestrianFrame === frame) return;
  root.userData.pedestrianFrame = frame;
  const mesh = root.getObjectByName('city122-service-entries-and-transit-shelters');
  const pedestrians = root.userData.pedestrians ?? [];
  for (const person of pedestrians) {
    const offset = Math.sin(frame * 0.17 + person.phase) * 2.4;
    dummy.position.set(person.x, -5.35, person.z + offset);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.75, 2.6, 0.65);
    dummy.updateMatrix();
    mesh.setMatrixAt(person.body, dummy.matrix);
    dummy.position.y = -3.65;
    dummy.scale.set(0.85, 0.82, 0.82);
    dummy.updateMatrix();
    mesh.setMatrixAt(person.head, dummy.matrix);
  }
  if (pedestrians.length) mesh.instanceMatrix.needsUpdate = true;
}
