import * as T from 'three';

// The near and far city stretches share physical parcels, not paint.
// Reuse existing instanced district meshes; adding separate draw calls
// exceeded the measured graphics-test budget on the first QA109 attempt.
const palette = Object.freeze({
  civic: {
    crownEvery: 8,
    lightEvery: 7,
    walls: ['#859eaa', '#a6bcc6', '#718995', '#a9aaa5', '#587d8c'],
    light: '#78dcf1',
    crown: '#7aa9bd',
  },
  industrial: {
    crownEvery: 5,
    lightEvery: 6,
    walls: ['#536e79', '#8b9694', '#98aab1', '#6d7987', '#b29e8c'],
    light: '#f6bf88',
    crown: '#8c9fae',
  },
});

function addToBatch(mesh, part, color) {
  const index = mesh.count;
  if (index >= mesh.instanceMatrix.count)
    throw new Error('City identity would overflow existing GPU instance budget: ' + mesh.name);
  const transform = new T.Object3D();
  transform.position.set(part.x, part.y, part.z);
  transform.scale.set(part.w, part.h, part.d);
  transform.updateMatrix();
  mesh.setMatrixAt(index, transform.matrix);
  if (color) mesh.setColorAt(index, color);
  mesh.count = index + 1;
  return index;
}

function finishBatch(mesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
}

export function applyCityTileIdentity(tile, variant = 'civic') {
  if (!tile) throw new Error('City identity needs an existing tile');
  if (tile.getObjectByName('city-tile-local-identity'))
    throw new Error('City tile identity cannot be installed twice');
  const profile = palette[variant];
  if (!profile) throw new Error('Unknown city tile variant: ' + variant);
  const anchors = tile.userData.buildingFootprints ?? [];
  if (!anchors.length) throw new Error('Missing building footprints for city identity');

  const district = tile.getObjectByName('city-architectural-districts');
  const bodies = district.getObjectByName('city-district-towers-and-infrastructure');
  const ledges = district.getObjectByName('city-district-crowns-and-gantries');
  const lights = district.getObjectByName('city-district-wayfinding-lights');
  const highLights = district.getObjectByName('city-district-premium-windows');
  const originalCounts = {
    bodies: bodies.count,
    ledges: ledges.count,
    lights: lights.count,
    highLights: highLights.count,
  };
  const lightColor = new T.Color(profile.light);
  const crownColor = new T.Color(profile.crown);
  const crowns = [];
  const facades = [];
  anchors.forEach((building, i) => {
    const b = building;
    if (i % profile.crownEvery === 2 && b.h >= 32) {
      const height = variant === 'industrial' ? 8 + (i % 4) * 3 : 5 + (i % 3) * 2;
      const roof = {
        x: b.x,
        y: b.h - 3 + height / 2,
        z: b.z,
        w: b.w * 0.6,
        h: height,
        d: b.depth * 0.64,
      };
      const index = addToBatch(bodies, roof, crownColor);
      crowns.push({ building: i, index });
      // A roof light is physically supported by the crown, and is High-only
      // through the existing premium group. No extra draw call is created.
      addToBatch(
        highLights,
        { x: b.x, y: b.h - 3 + height + 0.3, z: b.z, w: b.w * 0.35, h: 0.6, d: 0.5 },
        lightColor,
      );
    }
    if (i % profile.lightEvery === 3 && b.h >= 28) {
      const z = b.z + b.depth / 2 + 0.23;
      const start = lights.count;
      for (const side of [-1, 1])
        addToBatch(
          lights,
          {
            x: b.x + side * b.w * 0.3,
            y: -7 + b.h * 0.48,
            z,
            w: Math.min(0.5, b.w * 0.05),
            h: b.h * 0.59,
            d: 0.38,
          },
          lightColor,
        );
      addToBatch(
        ledges,
        { x: b.x, y: -7 + b.h * 0.83, z: z + 0.11, w: b.w * 0.65, h: 0.65, d: 0.4 },
        crownColor,
      );
      facades.push({ building: i, firstLight: start });
    }
  });
  for (const mesh of [bodies, ledges, lights, highLights]) finishBatch(mesh);

  // The original buildings already have per-instance paint; changing colors
  // on the far tile must never repaint the near tile's GPU instance buffer.
  const base = tile.getObjectByName('city-base-building-bodies');
  const roofs = tile.getObjectByName('city-base-building-roofs');
  if (base && roofs) {
    const colors = profile.walls.map((value) => new T.Color(value));
    for (let i = 0; i < anchors.length; i++) {
      base.setColorAt(i, colors[(i * 7 + Math.floor(i / 13)) % colors.length]);
      roofs.setColorAt(i, colors[(i * 11 + 2) % colors.length]);
    }
    base.instanceColor.needsUpdate = true;
    roofs.instanceColor.needsUpdate = true;
  }
  const identity = new T.Group();
  identity.name = 'city-tile-local-identity';
  identity.userData.visualOnly = true;
  identity.userData.variant = variant;
  identity.userData.anchors = anchors.length;
  identity.userData.crowns = crowns.length;
  identity.userData.facadeDetails = facades.length * 3;
  identity.userData.crownIndices = crowns;
  identity.userData.facadeIndices = facades;
  identity.userData.originalCounts = originalCounts;
  tile.add(identity);
  return identity;
}

export function setCityTileIdentityQuality(tile, quality) {
  const identity = tile?.getObjectByName('city-tile-local-identity');
  if (identity) identity.userData.quality = quality === 'high' ? 'high' : 'medium';
}
