import * as T from 'three';

// Purpose-built tile identities use existing tower footprints. All added
// architectural details are supported by a real roof or facade; none changes
// gameplay physics or the shared street/rail geometry.
const unit = new T.BoxGeometry(1, 1, 1);
const cool = new T.MeshBasicMaterial({ color: '#8ae8f2', toneMapped: false });
const warm = new T.MeshBasicMaterial({ color: '#f5c28e', toneMapped: false });
const graphite = new T.MeshStandardMaterial({
  color: '#3f6075',
  metalness: 0.7,
  roughness: 0.4,
});
const alloy = new T.MeshStandardMaterial({
  color: '#a3b7bf',
  metalness: 0.71,
  roughness: 0.34,
});

const SERIES = {
  civic: {
    roofEvery: 8,
    frontEvery: 7,
    palette: ['#859eaa', '#a6bcc6', '#718995', '#a9aaa5', '#587d8c'],
  },
  industrial: {
    roofEvery: 5,
    frontEvery: 6,
    palette: ['#536e79', '#8b9694', '#98aab1', '#6d7987', '#b29e8c'],
  },
};

function instanced(name, material, items, root) {
  const mesh = new T.InstancedMesh(unit, material, items.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  const cursor = new T.Object3D();
  for (let i = 0; i < items.length; i++) {
    const part = items[i];
    cursor.position.set(part.x, part.y, part.z);
    cursor.scale.set(part.w, part.h, part.d);
    cursor.rotation.set(0, 0, 0);
    cursor.updateMatrix();
    mesh.setMatrixAt(i, cursor.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  root.add(mesh);
  return mesh;
}

export function applyCityTileIdentity(tile, variant = 'civic') {
  if (!tile) throw new Error('City identity needs an existing tile');
  if (tile.getObjectByName('city-tile-local-identity'))
    throw new Error('City tile identity cannot be installed twice');

  const profile = SERIES[variant];
  if (!profile) throw new Error('Unknown city tile variant: ' + variant);
  const anchors = tile.userData.buildingFootprints ?? [];
  if (!anchors.length) throw new Error('Missing building footprints for city identity');

  const root = new T.Group();
  root.name = 'city-tile-local-identity';
  root.userData.visualOnly = true;
  root.userData.variant = variant;
  const high = new T.Group();
  high.name = 'city-tile-identity-high';
  high.visible = false;
  const crowns = [];
  const windows = [];
  const ledges = [];
  const roofEquipment = [];

  // A crown can rest on the actual body roof at h-7: do not use arbitrary
  // global y values or change the physical outer dimensions of the building.
  anchors.forEach((b, i) => {
    if (i % profile.roofEvery === 2 && b.h >= 32) {
      const baseY = b.h - 3;
      const crownHeight = variant === 'industrial' ? 8 + (i % 4) * 3 : 5 + (i % 3) * 2;
      crowns.push({
        x: b.x,
        y: baseY + crownHeight / 2,
        z: b.z,
        w: b.w * 0.6,
        h: crownHeight,
        d: b.depth * 0.64,
      });
      // Antennae and ventilation housings attach to the roof crown and are
      // a real purpose-built feature, not unsupported floating decoration.
      roofEquipment.push({
        x: b.x,
        y: baseY + crownHeight + 1.2,
        z: b.z,
        w: Math.min(3.2, b.w * 0.24),
        h: 2.4,
        d: Math.min(3.2, b.depth * 0.24),
      });
    }
    if (i % profile.frontEvery === 3 && b.h >= 28) {
      const facadeZ = b.z + b.depth * 0.5 + 0.23;
      // Two related, narrow decorative strips along the true street-facing wall.
      for (const side of [-1, 1])
        windows.push({
          x: b.x + side * b.w * 0.3,
          y: -7 + b.h * 0.48,
          z: facadeZ,
          w: Math.min(0.5, b.w * 0.05),
          h: b.h * 0.59,
          d: 0.38,
        });
      ledges.push({
        x: b.x,
        y: -7 + b.h * 0.83,
        z: facadeZ + 0.11,
        w: b.w * 0.65,
        h: 0.65,
        d: 0.4,
      });
    }
  });
  instanced('city-tile-supported-roof-crowns', alloy, crowns, root);
  instanced('city-tile-facade-light-strips', variant === 'industrial' ? warm : cool, windows, root);
  instanced('city-tile-facade-ledges', graphite, ledges, root);
  instanced('city-tile-roof-service-housings', graphite, roofEquipment, high);

  // Base towers already have per-instance paint. Recolor ONLY this tile's
  // own instance buffer; the sibling tile must preserve its distinct palette.
  const buildings = tile.getObjectByName('city-base-building-bodies');
  const roofs = tile.getObjectByName('city-base-building-roofs');
  if (buildings && roofs) {
    const colors = profile.palette.map((color) => new T.Color(color));
    for (let i = 0; i < anchors.length; i++) {
      buildings.setColorAt(i, colors[(i * 7 + Math.floor(i / 13)) % colors.length]);
      roofs.setColorAt(i, colors[(i * 11 + 2) % colors.length]);
    }
    buildings.instanceColor.needsUpdate = true;
    roofs.instanceColor.needsUpdate = true;
  }
  root.add(high);
  tile.add(root);
  root.userData.anchors = anchors.length;
  root.userData.crowns = crowns.length;
  root.userData.facadeDetails = windows.length + ledges.length;
  return root;
}

export function setCityTileIdentityQuality(tile, quality) {
  const details = tile?.getObjectByName('city-tile-identity-high');
  if (details) details.visible = quality === 'high';
}
