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
    plaza: steel('#283e50', 0.4),
    building: steel('#4b6979', 0.39),
    canopy: steel('#98afbc', 0.25),
    glazing: steel('#16445a', 0.13),
    retail: light('#75e8e9'),
    warm: light('#f8aa7b'),
    fine: steel('#b4d0d9', 0.24),
    window: light('#c8f6fd'),
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
  // A permanently distant terminus gives the route a vanishing point. It
  // always remains well above the flight lane and never creates hitboxes.
  const group = new T.Group();
  group.name = 'city-horizon-megastructure';
  group.userData.visualOnly = true;
  const hull = steel('#344f65', 0.48);
  const cap = steel('#7298a9', 0.3);
  const glow = light('#69dff3');
  const amber = light('#f5b978');
  function part(material, name, x, y, z, w, h, d) {
    const mesh = new T.Mesh(BOX, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.userData.visualOnly = true;
    group.add(mesh);
    return mesh;
  }
  const z = -1130;
  for (const side of [-1, 1]) {
    part(hull, 'citadel-flight-side-pylon', side * 104, 157, z, 35, 260, 69);
    part(cap, 'citadel-tapered-crown', side * 104, 293, z, 44, 22, 76);
    part(glow, 'citadel-vertical-beacon', side * 104, 175, z + 36, 3, 191, 2);
    part(hull, 'citadel-cantilever', side * 62, 238, z, 72, 15, 57);
    for (let tier = 0; tier < 6; tier++)
      part(amber, 'citadel-window-tier', side * 104, 76 + tier * 30, z + 35, 24, 2, 1);
  }
  part(hull, 'citadel-central-spire', 0, 369, z - 14, 31, 248, 47);
  part(cap, 'citadel-spire-crown', 0, 507, z - 14, 48, 35, 55);
  part(glow, 'citadel-spire-beacon', 0, 534, z + 15, 14, 52, 2);
  part(hull, 'citadel-skybridge', 0, 231, z + 8, 188, 18, 60);
  part(glow, 'citadel-skybridge-neon', 0, 219, z + 39, 153, 3, 2);
  const ring = new T.Mesh(new T.TorusGeometry(80, 4, 7, 44), cap);
  ring.name = 'citadel-orbital-ring';
  ring.position.set(0, 354, z + 25);
  ring.userData.visualOnly = true;
  group.add(ring);
  const high = new T.Group();
  high.name = 'city-megastructure-high-detail';
  high.visible = false;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const mesh = new T.Mesh(BOX, glow);
      mesh.name = 'citadel-high-window';
      mesh.position.set(side * 104, 50 + i * 18, z + 36);
      mesh.scale.set(15, 0.9, 1);
      mesh.userData.visualOnly = true;
      high.add(mesh);
    }
  }
  group.add(high);
  return group;
}
