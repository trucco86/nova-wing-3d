import * as T from 'three';

// City 2.7: authored, reproducible retail districts. All geometry is visual
// only, outside the playable corridor and independent of network assets.
const BOX = new T.BoxGeometry(1, 1, 1);
const steel = (color, roughness = 0.38) =>
  new T.MeshStandardMaterial({ color, metalness: 0.74, roughness });
const light = (color) => new T.MeshBasicMaterial({ color, toneMapped: false });

function mallSignTexture(name, color) {
  if (typeof document === 'undefined') {
    const texture = new T.DataTexture(new Uint8Array([25, 62, 79, 255]), 1, 1);
    texture.needsUpdate = true;
    return texture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new T.DataTexture(new Uint8Array([25, 62, 79, 255]), 1, 1);
    fallback.needsUpdate = true;
    return fallback;
  }
  ctx.fillStyle = '#081522';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 7);
  ctx.fillRect(0, 121, 512, 7);
  ctx.textAlign = 'center';
  ctx.font = 'bold 43px sans-serif';
  ctx.fillStyle = '#f0ffff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillText(name, 256, 78, 482);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

export function createCityCommerce() {
  const commerce = new T.Group();
  commerce.name = 'city-commerce-streets';
  commerce.userData.visualOnly = true;
  const high = new T.Group();
  high.name = 'city-commerce-high-detail';
  high.visible = false;
  const materials = {
    plaza: steel('#486c8f', 0.33),
    building: steel('#759bad', 0.3),
    canopy: steel('#98afbc', 0.25),
    glazing: steel('#357fa6', 0.13),
    retail: light('#5ef9fa'),
    warm: light('#ffc381'),
    fine: steel('#b4d0d9', 0.24),
    window: light('#f1fdff'),
  };
  const arrays = new Map();
  const transform = new T.Object3D();
  function block(type, x, y, z, w, h, d, premium = false) {
    const key = (premium ? 'high-' : 'base-') + type;
    if (!arrays.has(key)) arrays.set(key, []);
    transform.position.set(x, y, z);
    transform.scale.set(w, h, d);
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    arrays.get(key).push(transform.matrix.clone());
  }

  const malls = [
    { name: 'ORBITAL PLAZA', side: 1, x: 151, z: -420, color: '#66e8ff' },
    { name: 'NOVA MARKET', side: -1, x: -151, z: -1040, color: '#ffc78a' },
    { name: 'SKYLINE MALL', side: 1, x: 162, z: -1630, color: '#a2b7ff' },
  ];
  for (const [i, mall] of malls.entries()) {
    const { x, z, side } = mall;
    const tag = new T.Group();
    tag.name = 'city-shopping-center-' + i;
    tag.position.set(x, 0, z);
    tag.userData.visualOnly = true;
    commerce.add(tag);
    // Broad commercial podium, terraced atrium and unmistakable glass frontage.
    block('plaza', x, -3, z, 92, 8, 110);
    block('building', x, 18, z - 6, 75, 44, 72);
    block('glazing', x, 15, z + 31, 65, 33, 2);
    block('canopy', x, 42, z + 4, 82, 4, 91);
    block('canopy', x, 8, z + 42, 83, 2.2, 14);
    block('retail', x, 11, z + 43.5, 75, 0.75, 0.8);
    for (let level = 0; level < 3; level++) {
      block('retail', x, 10 + level * 10.2, z + 32.5, 62, 0.4, 0.5);
      block('fine', x, 9 + level * 10.2, z + 34, 66, 0.38, 0.42, true);
    }
    for (const flank of [-1, 1]) {
      block('building', x + flank * 33, 26, z - 6, 10, 66, 76);
      block('warm', x + flank * 34, 27, z + 33, 0.8, 44, 0.75);
      for (let line = 0; line < 7; line++) {
        block('window', x + flank * 33, 5 + line * 7, z + 34, 4, 0.6, 0.5, true);
      }
    }
    // Public piazza, market kiosks and pedestrian roofs are outside x=±90.
    for (let kiosk = 0; kiosk < 4; kiosk++) {
      const sx = x + side * (35 + (kiosk % 2) * 11);
      const sz = z + 54 + Math.floor(kiosk / 2) * 16;
      block('building', sx, 0, sz, 13, 13, 10);
      block('canopy', sx, 7.8, sz, 15, 1.1, 13);
      block('warm', sx, 1.1, sz + 5.2, 11, 0.6, 0.4);
    }
    const label = new T.Mesh(
      new T.PlaneGeometry(52, 11),
      new T.MeshBasicMaterial({
        map: mallSignTexture(mall.name, mall.color),
        transparent: false,
        side: T.DoubleSide,
        toneMapped: false,
      }),
    );
    label.name = 'city-mall-advertising-sign';
    label.position.set(x, 34, z + 35.2);
    commerce.add(label);

    // Each district has a different architectural profile. Curved,
    // camera-facing silhouettes read as malls rather than repeat office blocks.
    const sculpture = new T.Group();
    sculpture.name = 'city-mall-signature-' + i;
    sculpture.userData.visualOnly = true;
    if (i === 0) {
      // ORBITAL PLAZA: enormous glazed domed atrium visible above the roofs.
      const atrium = new T.Mesh(
        new T.SphereGeometry(37, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshPhysicalMaterial({
          color: '#5297b4',
          metalness: 0.12,
          roughness: 0.16,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        }),
      );
      atrium.name = 'city-mall-glass-dome';
      atrium.position.set(x, 44, z - 6);
      atrium.scale.set(1, 0.74, 0.82);
      sculpture.add(atrium);
    } else if (i === 1) {
      // NOVA MARKET: elevated angular retail canopy with distinct roofline.
      for (const flank of [-1, 1]) {
        const fin = new T.Mesh(new T.ConeGeometry(13, 37, 5), materials.canopy);
        fin.name = 'city-mall-roof-fin';
        fin.position.set(x + flank * 27, 66, z - 7);
        fin.userData.visualOnly = true;
        sculpture.add(fin);
      }
    } else {
      // SKYLINE MALL: monumental arch rather than another cuboid office block.
      const arch = new T.Mesh(new T.TorusGeometry(42, 3, 7, 48, Math.PI), materials.retail);
      arch.name = 'city-mall-sky-arch';
      arch.position.set(x, 53, z + 42);
      arch.rotation.z = 0;
      sculpture.add(arch);
    }
    commerce.add(sculpture);
  }

  // A true elevated stop makes passing trains read as public transit, instead
  // of carriages floating beside generic light rails. Station roofs clear the
  // vehicle envelope and sit outside the playable flight corridor.
  const station = new T.Group();
  station.name = 'city-maglev-market-station';
  station.userData.visualOnly = true;
  station.position.set(80, 0, -690);
  const stationHull = materials.building;
  const stationGlow = materials.retail;
  for (const side of [-1, 1]) {
    const platform = new T.Mesh(BOX, stationHull);
    platform.name = 'city-maglev-platform';
    platform.scale.set(14, 2.1, 92);
    platform.position.set(side * 19, 27, 0);
    station.add(platform);
    const canopy = new T.Mesh(BOX, materials.canopy);
    canopy.name = 'city-maglev-station-canopy';
    canopy.scale.set(15, 2.4, 96);
    canopy.position.set(side * 20, 51, 0);
    station.add(canopy);
    const edge = new T.Mesh(BOX, stationGlow);
    edge.name = 'city-maglev-platform-neon';
    edge.scale.set(1, 0.7, 90);
    edge.position.set(side * 12, 29, 0);
    station.add(edge);
  }
  const stationTitle = new T.Mesh(
    new T.PlaneGeometry(50, 9),
    new T.MeshBasicMaterial({
      map: mallSignTexture('NOVA TRANSIT', '#77efff'),
      toneMapped: false,
      side: T.DoubleSide,
    }),
  );
  stationTitle.name = 'city-maglev-station-sign';
  stationTitle.position.set(22, 46, 41);
  station.add(stationTitle);
  commerce.add(station);

  const storeZ = [-140, -280, -610, -760, -905, -1165, -1360, -1765];
  storeZ.forEach((z, i) => {
    for (const side of [-1, 1]) {
      const x = side * (112 + (i % 3) * 5);
      const width = 22 + (i % 3) * 4;
      // Glass shopfronts sit below the towers, with awnings and lighted
      // signage that remains recognisable in Medium as well as High.
      block('building', x, 3.8, z, width, 21, 23);
      block('glazing', x, -0.1, z + 12.1, width * 0.84, 12, 0.9);
      block('canopy', x, 11.9, z + 12.4, width * 1.14, 1.5, 7);
      block(i % 3 === 0 ? 'warm' : 'retail', x, 9.1, z + 13.1, width * 0.9, 1.8, 0.9);
      block('plaza', x, -6, z + 17, width * 1.3, 1.4, 21);
      for (let door = -1; door <= 1; door++) {
        block('fine', x + door * width * 0.26, 1.5, z + 12.8, 0.35, 11, 0.35, true);
      }
    }
  });

  for (const [name, transforms] of arrays) {
    const premium = name.startsWith('high-');
    const type = name.slice(5);
    const mesh = new T.InstancedMesh(BOX, materials[type], transforms.length);
    mesh.name = 'city-commerce-' + name;
    mesh.userData.visualOnly = true;
    for (let i = 0; i < transforms.length; i++) mesh.setMatrixAt(i, transforms[i]);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    (premium ? high : commerce).add(mesh);
  }
  commerce.add(high);
  commerce.userData.malls = malls.map((mall) => mall.name);
  commerce.userData.shops = storeZ.length * 2;
  return commerce;
}

export function createCityHorizonMegastructure() {
  // QA141: a lit, architectural destination instead of a sparse untextured
  // citadel. Build all details ONCE in the same static instanced material
  // batches; rendering cost depends on six materials, not hundreds of windows.
  // The landmark stays far above the flight corridor and has no hitboxes.
  const root = new T.Group();
  root.name = 'city-horizon-megastructure';
  root.userData.visualOnly = true;
  const high = new T.Group();
  high.name = 'city-megastructure-high-detail';
  high.visible = false;

  const batches = {
    structure: [],
    cladding: [],
    cool: [],
    amber: [],
    precision: [],
    highGlow: [],
  };
  function place(kind, x, y, z, w, h, d, color) {
    if (!(Math.min(w, h, d) > 0)) throw new Error('Invalid citadel detail size');
    batches[kind].push({ x, y, z, w, h, d, color });
  }

  const z = -1130;
  for (const side of [-1, 1]) {
    const x = side * 104;
    // A foundation, real vertical support and stepped roof. The silhouette
    // is unchanged; architectural skin is attached to these actual volumes.
    place('structure', x, 157, z, 35, 260, 69, '#46657c');
    place('structure', x, 34, z, 49, 31, 76, '#536f81');
    place('cladding', x, 293, z, 44, 22, 76, '#a0b8c5');
    place('structure', side * 62, 238, z, 72, 15, 57, '#506f80');
    place('cladding', x, 316, z - 4, 20, 18, 23, '#c7d9dd');
    place('structure', x, 335, z - 4, 4, 25, 4, '#587788');
    place('cool', x, 343, z - 1.6, 5.2, 4.3, 1, '#c1f5ff');
    // Massive pylon ribs reinforce scale, supporting actual floor plates.
    for (const rib of [-1, 1]) {
      place('cladding', x + rib * 16.4, 154, z + 35.2, 1.45, 228, 1.2, '#759aad');
      place('precision', x + rib * 17.2, 163, z + 35.8, 0.4, 206, 0.35, '#c2dce5');
    }
    for (let floor = 0; floor < 11; floor++) {
      const y = 55 + floor * 20.1;
      // Two differently colored occupied rooms on every level, even Medium.
      for (const col of [-1, 1]) {
        const kind = (floor + col + (side > 0 ? 1 : 0)) % 3 === 0 ? 'amber' : 'cool';
        place(
          kind,
          x + col * 7.8,
          y,
          z + 35.25,
          5.9,
          2.4,
          0.56,
          kind === 'amber' ? '#ffe0a8' : '#b9edfc',
        );
        // Wall-facing light wells are actually on the pylons, not suspended
        // in the corridor or hidden behind the front glass slab.
        place('highGlow', x + col * 7.8, y + 4.6, z + 35.5, 4, 0.45, 0.48, '#d5f6ff');
      }
      place('cladding', x, y + 7, z + 35.1, 32, 0.85, 0.9, '#8facba');
      if (floor % 2 === 0)
        place('amber', x, y + 7.6, z + 35.8, 23, 0.35, 0.5, '#f9c795');
    }
    // Facade facing the flight lane: repeated bays along the interior wall.
    // Light bars are attached to the side of the left/right supporting tower.
    for (let floor = 0; floor < 8; floor++) {
      const y = 73 + floor * 25;
      place('cool', x - side * 18.2, y, z + 3, 0.52, 2.4, 19, '#99d7ed');
    }
    // An explicitly supported gantry and beacon at each tower crown.
    place('cladding', x, 306, z + 12, 30, 1.4, 39, '#adc8d3');
    place('cool', x, 308, z + 32, 27, 0.82, 0.8, '#d5f8ff');
  }

  place('structure', 0, 369, z - 14, 31, 248, 47, '#40596e');
  place('cladding', 0, 507, z - 14, 48, 35, 55, '#acc5d1');
  place('cool', 0, 534, z + 15, 14, 52, 2, '#94ecfb');
  place('structure', 0, 231, z + 8, 188, 18, 60, '#506e80');
  place('cladding', 0, 245, z + 39, 180, 2, 2, '#9dbcc7');
  place('cool', 0, 219, z + 39, 153, 3, 2, '#94e8f7');

  for (const x of [-62, -42, -22, 22, 42, 62]) {
    // Actual lattice held by the solid skybridge at y 231.
    place('cladding', x, 251, z + 38, 1.5, 24, 1.2, '#96abb9');
    place('cool', x, 265, z + 38.9, 3.1, 1.4, 0.7, '#c5f4ff');
  }
  for (let floor = 0; floor < 9; floor++) {
    const y = 281 + floor * 24.1;
    for (const x of [-9, 9]) {
      place(floor % 3 ? 'cool' : 'amber', x, y, z + 10, 5.7, 3.2, 0.55, floor % 3 ? '#c6efff' : '#ffd2a2');
      place('highGlow', x, y + 5, z + 10.3, 3.8, 0.4, 0.55, '#f0f9ff');
    }
    place('cladding', 0, y + 9, z + 10, 30, 1.1, 1, '#7da1b5');
  }
  for (const x of [-13.1, 13.1]) {
    place('cladding', x, 368, z + 10.8, 1.5, 180, 1.05, '#a5c3d0');
    place('precision', x, 369, z + 11.6, 0.48, 165, 0.4, '#cbe5ed');
  }
  // Existing orbital ring: add little navigation beacons within the existing
  // cool instanced batch. No additional torus or point light is allocated.
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    const x = Math.cos(a) * 79.2;
    const y = 354 + Math.sin(a) * 79.2;
    place('cool', x, y, z + 29.4, 2.8, 2.8, 0.75, i % 3 ? '#b1e7ff' : '#ffe1b8');
  }

  const materials = {
    structure: steel('#ffffff', 0.44),
    cladding: steel('#ffffff', 0.27),
    cool: light('#ffffff'),
    amber: light('#ffffff'),
    precision: steel('#ffffff', 0.23),
    highGlow: light('#ffffff'),
  };
  const names = {
    structure: 'citadel-architectural-massing-batched',
    cladding: 'citadel-facade-frames-batched',
    cool: 'citadel-occupied-cool-windows-batched',
    amber: 'citadel-occupied-warm-windows-batched',
    precision: 'citadel-precision-ribs-batched',
    highGlow: 'citadel-high-window-batched',
  };
  const dummy = new T.Object3D();
  const tint = new T.Color();
  for (const [kind, entries] of Object.entries(batches)) {
    if (!entries.length) continue;
    const mesh = new T.InstancedMesh(BOX, materials[kind], entries.length);
    mesh.name = names[kind];
    mesh.userData.visualOnly = true;
    mesh.frustumCulled = true;
    for (let i = 0; i < entries.length; i++) {
      const b = entries[i];
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tint.set(b.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    (kind === 'precision' || kind === 'highGlow' ? high : root).add(mesh);
  }

  const ring = new T.Mesh(new T.TorusGeometry(80, 4, 7, 44), steel('#98b8c8', 0.29));
  ring.name = 'citadel-orbital-ring';
  ring.position.set(0, 354, z + 25);
  ring.userData.visualOnly = true;
  ring.frustumCulled = true;
  root.add(ring, high);
  root.userData.detailBudget = {
    mediumDraws: 5,
    highDraws: 7,
    mediumIlluminatedWindows: batches.cool.length + batches.amber.length,
    highIlluminatedWindows: batches.highGlow.length,
    materials: 7, // Six instanced materials + the single ring material.
    nonPlayable: true,
  };
  return root;
}
