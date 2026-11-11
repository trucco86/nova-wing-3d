import * as T from 'three';
import { advertisingTexture } from './city-32-living.js';
import { CITY_AD_CREATIVES, planCityAdSlots } from './city-ad-slots.js';

const box = new T.BoxGeometry(1, 1, 1);
const plane = new T.PlaneGeometry(1, 1);
const polishedFrame = new T.MeshPhysicalMaterial({
  color: '#c0d9e0',
  metalness: 0.82,
  roughness: 0.2,
  clearcoat: 0.72,
  clearcoatRoughness: 0.18,
});
const neon = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });

function batch(root, name, geometry, material, shapes) {
  if (!shapes.length) return null;
  const mesh = new T.InstancedMesh(geometry, material, shapes.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  const position = new T.Object3D();
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    position.position.set(shape.x, shape.y, shape.z);
    position.scale.set(shape.w, shape.h, shape.depth ?? 1);
    position.rotation.set(0, 0, 0);
    position.updateMatrix();
    mesh.setMatrixAt(i, position.matrix);
    if (shape.color) mesh.setColorAt(i, new T.Color(shape.color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  root.add(mesh);
  return mesh;
}

function existingAdHosts(tile, buildings) {
  // City32 and City33 predate the user-facing slot inventory. Reserve their
  // actual building anchors, not guesses based on a generator index.
  tile.updateMatrixWorld(true);
  const inverse = tile.matrixWorld.clone().invert();
  const marked = new Set();
  const p = new T.Vector3();
  tile.traverse((object) => {
    if (
      !/^(city32-sign-\d+|city32-hologram-\d+|city33-building-campaign-\d+|city32-district-.*-billboard)$/.test(
        object.name,
      )
    )
      return;
    object.getWorldPosition(p).applyMatrix4(inverse);
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (Math.abs(b.x - p.x) < 0.4 && Math.abs(b.z + b.depth / 2 - p.z) < 3.5) marked.add(i);
    }
  });
  return [...marked];
}

export function createCityAdInventory(tile, variant = 'civic') {
  const root = new T.Group();
  root.name = 'city-premium-ad-inventory';
  root.userData.visualOnly = true;
  root.userData.variant = variant;
  const buildings = tile.userData.buildingFootprints;
  const district = tile.getObjectByName('city-architectural-districts');
  const excludedHosts = existingAdHosts(tile, buildings);
  const slots = planCityAdSlots(buildings, {
    variant,
    excludedHosts,
    districtBuildings: [
      ...district.userData.towerFootprints,
      ...district.userData.platformFootprints,
    ],
  });

  const metal = [];
  const accent = [];
  const arts = new Map(CITY_AD_CREATIVES.map((creative) => [creative.id, []]));

  for (const slot of slots) {
    arts.get(slot.creativeId).push(slot.panel);
    const brand = CITY_AD_CREATIVES.find((ad) => ad.id === slot.creativeId);
    // Opaque, grounded backplate and four genuinely continuous frame rails.
    metal.push({
      x: slot.x,
      y: slot.y,
      z: slot.z - 0.37,
      w: slot.w + 1.1,
      h: slot.h + 1.0,
      depth: 0.58,
    });
    for (const support of slot.supports) metal.push(support);
    if (slot.kind !== 'roof') {
      // Visible steel brackets connect the decorative frame to the real
      // masonry, not an arbitrary sky coordinate.
      const b = buildings[slot.hostIndex];
      const wallZ = b.z + b.depth / 2;
      for (const direction of [-1, 1])
        metal.push({
          x: slot.x + direction * slot.w * 0.42,
          y: slot.y,
          z: wallZ + 1,
          w: 0.34,
          h: 0.34,
          depth: 2,
        });
    }
    accent.push({
      x: slot.x,
      y: slot.y + slot.h / 2 + 0.33,
      z: slot.z + 0.18,
      w: slot.w + 0.45,
      h: 0.24,
      depth: 0.22,
      color: brand.color,
    });
    accent.push({
      x: slot.x,
      y: slot.y - slot.h / 2 - 0.33,
      z: slot.z + 0.18,
      w: slot.w + 0.45,
      h: 0.24,
      depth: 0.22,
      color: brand.color,
    });
  }

  batch(root, 'city-ad-grounded-metal-frames-and-mounts', box, polishedFrame, metal);
  batch(root, 'city-ad-illuminated-sign-borders', box, neon, accent);
  for (const creative of CITY_AD_CREATIVES) {
    batch(
      root,
      'city-ad-artwork-' + creative.id,
      plane,
      new T.MeshBasicMaterial({
        map: advertisingTexture(creative.name, creative.line, creative.color),
        side: T.DoubleSide,
        toneMapped: false,
      }),
      arts.get(creative.id),
    );
  }
  root.userData.slots = slots.map((slot) => ({
    id: slot.id,
    type: slot.kind,
    creative: slot.creativeId,
    hostIndex: slot.hostIndex,
    surface: slot.surface,
    x: slot.x,
    y: slot.y,
    z: slot.z,
    width: slot.w,
    height: slot.h,
  }));
  root.userData.total = slots.length;
  root.userData.counts = Object.fromEntries(
    ['facade', 'roof', 'banner'].map((type) => [
      type,
      slots.filter((slot) => slot.kind === type).length,
    ]),
  );
  // Future asset swaps can target these stable IDs. Do not use real ad server
  // URLs, user tracking or partner creative assets in the public QA preview.
  tile.add(root);
  return root;
}
