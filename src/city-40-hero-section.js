import * as T from 'three';
import { cityVolumesOverlap } from './city-ad-slots.js';

// Graphics 4.0: a deliberately limited 285-metre architectural proof of concept.
// The existing buildings and physics boxes remain the source of truth.
// Instead of multiplying shallow box instances, three contiguous meshes per
// district carry genuinely modeled relief, glass bays and sculpted crowns.
export const CITY40_HERO_RANGE = Object.freeze({ frontZ: -115, backZ: -400 });
const SIDE_CLEARANCE = 118;
const FRAME_DEPTH = 2.28;
const colorCache = new Map();

function rgb(hex) {
  if (!colorCache.has(hex)) colorCache.set(hex, new T.Color(hex).toArray());
  return colorCache.get(hex);
}

function geometryBuilder() {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  let elements = 0;

  function quad(a, b, c, d, tint) {
    const normal = new T.Vector3()
      .subVectors(new T.Vector3(...b), new T.Vector3(...a))
      .cross(new T.Vector3().subVectors(new T.Vector3(...c), new T.Vector3(...a)))
      .normalize();
    const base = positions.length / 3;
    const color = rgb(tint);
    for (const [i, p] of [a, b, c, d].entries()) {
      positions.push(...p);
      normals.push(normal.x, normal.y, normal.z);
      colors.push(...color);
      uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    elements++;
  }

  function box(x, y, z, w, h, depth, tint) {
    if (Math.min(w, h, depth) <= 0) throw new Error('City40 detail dimensions must be positive');
    const x0 = x - w / 2,
      x1 = x + w / 2;
    const y0 = y - h / 2,
      y1 = y + h / 2;
    const z0 = z - depth / 2,
      z1 = z + depth / 2;
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], tint);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], tint);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], tint);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], tint);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], tint);
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], tint);
  }

  // The chamfered shoulders and roof crowns have a non-rectangular silhouette,
  // rather than being additional generic cubes.
  function polygonPrism(corners, frontZ, depth, tint) {
    if (corners.length < 3 || depth <= 0) throw new Error('Invalid hero prism');
    const rearZ = frontZ - depth;
    const color = rgb(tint);
    const front = positions.length / 3;
    for (const point of corners) {
      positions.push(point[0], point[1], frontZ);
      normals.push(0, 0, 1);
      colors.push(...color);
      uvs.push(point[0] / 10, point[1] / 10);
    }
    for (let i = 1; i < corners.length - 1; i++) indices.push(front, front + i, front + i + 1);
    const back = positions.length / 3;
    for (const point of corners) {
      positions.push(point[0], point[1], rearZ);
      normals.push(0, 0, -1);
      colors.push(...color);
      uvs.push(point[0] / 10, point[1] / 10);
    }
    for (let i = 1; i < corners.length - 1; i++) indices.push(back, back + i + 1, back + i);
    for (let i = 0; i < corners.length; i++) {
      const j = (i + 1) % corners.length;
      quad(
        [corners[j][0], corners[j][1], frontZ],
        [corners[i][0], corners[i][1], frontZ],
        [corners[i][0], corners[i][1], rearZ],
        [corners[j][0], corners[j][1], rearZ],
        tint,
      );
    }
    elements++;
  }
  function finish() {
    if (!positions.length) return null;
    const result = new T.BufferGeometry();
    result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    result.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    result.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    result.setIndex(indices);
    result.computeBoundingSphere();
    return {
      geometry: result,
      vertices: positions.length / 3,
      triangles: indices.length / 3,
      elements,
    };
  }
  return { box, polygonPrism, finish };
}

function finishMaterialMap(type) {
  const size = 32,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const grain = ((x * 37 + y * 67 + x * y * 17) % 29) - 14;
      if (type === 'normal') {
        data[i] = 128 + Math.round(grain * 0.43);
        data[i + 1] = 128 + Math.round(grain * 0.27);
        data[i + 2] = 253;
      } else {
        const roughness = 178 + grain * 2;
        data[i] = roughness;
        data[i + 1] = roughness;
        data[i + 2] = roughness;
      }
      data[i + 3] = 255;
    }
  const texture = new T.DataTexture(data, size, size, T.RGBAFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

let materials;
function sharedMaterials() {
  if (materials) return materials;
  const normals = finishMaterialMap('normal');
  const roughness = finishMaterialMap('roughness');
  const masonry = new T.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.66,
    roughness: 0.34,
    normalMap: normals,
    normalScale: new T.Vector2(0.2, 0.2),
    roughnessMap: roughness,
    clearcoat: 0.26,
    clearcoatRoughness: 0.31,
  });
  const glass = new T.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.28,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    emissive: '#1e5266',
    emissiveIntensity: 0.27,
  });
  const shadow = new T.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.25,
    roughness: 0.87,
  });
  const fine = new T.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.82,
    roughness: 0.24,
    clearcoat: 0.56,
    clearcoatRoughness: 0.18,
  });
  materials = { masonry, glass, shadow, fine };
  return materials;
}

function buildingVolume(b) {
  return { x: b.x, y: b.h / 2 - 7, z: b.z, w: b.w, h: b.h, depth: b.depth };
}

// Every selected building is a true, previously zoned site. Exclude facades
// with existing media slots, keep a conservative protrusion envelope and
// reject any other physical skyscraper that enters the new facade volume.
export function planCity40HeroBuildings(tile, variant = 'civic') {
  if (!['civic', 'industrial'].includes(variant)) throw new RangeError('Unknown City40 style');
  const base = tile?.userData?.buildingFootprints;
  if (!base?.length) throw new Error('City40 requires real building anchors');
  const taken = new Set(
    tile.getObjectByName('city-premium-ad-inventory')?.userData?.slots.map((s) => s.hostIndex) ??
      [],
  );
  const legacySigns = tile.getObjectByName('city32-facade-advertisements')?.children ?? [];
  for (const sign of legacySigns)
    for (const [i, b] of base.entries())
      if (
        Math.abs(sign.position.x - b.x) < 0.6 &&
        Math.abs(sign.position.z - (b.z + b.depth / 2 + 1.35)) < 0.6
      )
        taken.add(i);
  const district = tile.getObjectByName('city-architectural-districts');
  const blockers = [
    ...base.map(buildingVolume),
    ...(district?.userData?.towerFootprints ?? []).map(buildingVolume),
    ...(district?.userData?.platformFootprints ?? []).map(buildingVolume),
  ];
  const selected = [];
  const span = CITY40_HERO_RANGE.frontZ - CITY40_HERO_RANGE.backZ;
  for (let band = 0; band < 6; band++)
    for (const side of [-1, 1]) {
      const z = CITY40_HERO_RANGE.frontZ - ((band + 0.5) * span) / 6;
      const options = base
        .map((b, index) => ({ ...b, index }))
        .filter(
          (b) =>
            !taken.has(b.index) &&
            Math.sign(b.x) === side &&
            b.z <= CITY40_HERO_RANGE.frontZ &&
            b.z >= CITY40_HERO_RANGE.backZ &&
            b.w >= 10 &&
            b.h >= 38 &&
            Math.abs(b.x) < 245 &&
            Math.abs(b.z - z) < 49,
        )
        .sort(
          (a, b) =>
            Math.abs(a.x) * 0.65 + Math.abs(a.z - z) - (Math.abs(b.x) * 0.65 + Math.abs(b.z - z)),
        );
      for (const host of options) {
        const face = host.z + host.depth * 0.5;
        const envelope = {
          x: host.x,
          y: -7 + host.h * 0.46,
          z: face + 1.38,
          w: host.w * 0.96,
          h: host.h * 0.84,
          depth: FRAME_DEPTH,
        };
        if (Math.abs(envelope.x) - envelope.w / 2 < SIDE_CLEARANCE) continue;
        if (
          blockers.some((solid, i) => i !== host.index && cityVolumesOverlap(envelope, solid, 0.3))
        )
          continue;
        if (selected.some((old) => cityVolumesOverlap(envelope, old.envelope, 0.55))) continue;
        selected.push({ ...host, envelope, side, band });
        taken.add(host.index);
        break;
      }
    }
  return selected;
}

function makeFacade(host, style, groups) {
  const { masonry, glass, shadow, fine } = groups;
  const b = host;
  const front = b.z + b.depth / 2;
  const y0 = -7,
    yTop = b.h - 7;
  const p =
    style === 'civic'
      ? { bright: '#c5d3d7', trim: '#e0dde0', shade: '#172f41', glass: '#80b7cf', lit: '#c7f0ed' }
      : { bright: '#93a8b3', trim: '#c5a98e', shade: '#192632', glass: '#6194b0', lit: '#f7cba5' };
  const theme = host.band % 3;
  const wide = Math.min(b.w * 0.92, b.w - 0.85);
  const width = Math.max(2.5, wide);
  const x = b.x,
    z = front;
  // Existing actual office block remains under every piece and retains its
  // original collision. All facade additions are architectural skin only.
  const bayWidth = width * (theme === 2 ? 0.57 : 0.68);
  shadow.box(x, y0 + b.h * 0.51, z + 0.69, bayWidth, b.h * 0.72, 0.29, p.shade);
  masonry.box(
    x - width * 0.43,
    y0 + b.h * 0.47,
    z + 0.87,
    width * 0.13,
    b.h * 0.84,
    1.45,
    p.bright,
  );
  masonry.box(
    x + width * 0.43,
    y0 + b.h * 0.47,
    z + 0.87,
    width * 0.13,
    b.h * 0.84,
    1.45,
    p.bright,
  );
  // A 3D portal: load-bearing pillars and a chamfered overhanging canopy.
  const doorHeight = 7.8;
  masonry.box(x - width * 0.36, y0 + doorHeight * 0.53, z + 0.87, 0.65, doorHeight, 1.25, p.trim);
  masonry.box(x + width * 0.36, y0 + doorHeight * 0.53, z + 0.87, 0.65, doorHeight, 1.25, p.trim);
  masonry.polygonPrism(
    [
      [x - width * 0.45, y0 + doorHeight],
      [x + width * 0.45, y0 + doorHeight],
      [x + width * 0.37, y0 + doorHeight + 2.1],
      [x - width * 0.37, y0 + doorHeight + 2.1],
    ],
    z + 1.62,
    1.8,
    p.trim,
  );
  glass.box(x, y0 + doorHeight * 0.47, z + 1.49, bayWidth * 0.92, doorHeight * 0.7, 0.26, p.glass);

  // The new glass is visibly in front of legacy City33 glazing at z+1.18,
  // preventing old windows from intersecting the new bay design.
  // Recessed, divided bay glazing is real depth, not a luminous texture pasted
  // onto a box. Deep horizontal spandrels cast shadow along each floor.
  const floors = Math.max(4, Math.min(9, Math.floor((b.h - 14) / 7.5)));
  const usable = b.h - 14;
  const step = usable / floors;
  for (let level = 0; level < floors; level++) {
    const floorY = y0 + 11 + (level + 0.47) * step;
    const glazingHeight = step * 0.57;
    const pairs = theme === 2 ? 3 : 2;
    for (let col = 0; col < pairs; col++) {
      const pitch = bayWidth / pairs;
      const px = x + (col - (pairs - 1) / 2) * pitch;
      shadow.box(px, floorY, z + 0.84, pitch * 0.89, glazingHeight + 0.62, 0.3, p.shade);
      glass.box(
        px,
        floorY,
        z + 1.49,
        pitch * 0.78,
        glazingHeight * 0.84,
        0.18,
        (level + col + host.band) % 5 === 0 ? p.lit : p.glass,
      );
      fine.box(px, floorY + glazingHeight * 0.47, z + 1.72, pitch * 0.83, 0.19, 0.26, p.trim);
    }
    masonry.box(x, floorY - step * 0.43, z + 1.67, width * 0.77, 0.37, 0.79, p.bright);
    if (level % 2 === 0)
      masonry.box(x, floorY - step * 0.47, z + 1.75, width * 0.48, 0.27, 0.88, p.trim);
  }

  // Offset roof shoulders build recognizable city silhouettes from the
  // existing building roof, with only about two units of outward protrusion.
  const crownHeight = theme === 0 ? 3.8 : theme === 1 ? 2.7 : 4.7;
  masonry.polygonPrism(
    [
      [x - width * 0.49, yTop - 0.8],
      [x + width * 0.49, yTop - 0.8],
      [x + width * 0.34, yTop + crownHeight],
      [x - width * 0.34, yTop + crownHeight],
    ],
    z + 1.47,
    1.35,
    p.bright,
  );
  fine.box(x, yTop + crownHeight * 0.65, z + 1.61, width * 0.55, 0.36, 0.24, p.trim);
  if (theme === 1) {
    // Engineering truss makes industrial towers materially different.
    for (const side of [-1, 1])
      masonry.polygonPrism(
        [
          [x + side * width * 0.4, y0 + 11],
          [x + side * width * 0.28, y0 + 12],
          [x + side * width * 0.43, yTop - 4.5],
        ],
        z + 1.52,
        0.72,
        p.trim,
      );
  }
  if (theme === 2) {
    // Sculptural stack of narrow recessed glass slots for the civic quarter.
    for (const side of [-1, 1])
      glass.box(
        x + side * width * 0.34,
        y0 + b.h * 0.45,
        z + 1.48,
        width * 0.08,
        b.h * 0.39,
        0.2,
        p.lit,
      );
  }
}

export function createCity40HeroSection(tile, variant = 'civic') {
  const selected = planCity40HeroBuildings(tile, variant);
  const root = new T.Group();
  root.name = 'city40-hero-architecture';
  root.userData.visualOnly = true;
  root.userData.variant = variant;
  const architecture = geometryBuilder();
  const glazing = geometryBuilder();
  const occlusion = geometryBuilder();
  const precision = geometryBuilder();
  const shapes = { masonry: architecture, glass: glazing, shadow: occlusion, fine: precision };
  for (const host of selected) makeFacade(host, variant, shapes);

  const materials = sharedMaterials();
  const standard = new T.Group();
  standard.name = 'city40-architectural-medium';
  const high = new T.Group();
  high.name = 'city40-precision-high';
  high.visible = false;
  const metrics = { triangles: 0, vertices: 0, drawUnits: 0 };
  for (const [name, builder, parent, material] of [
    ['city40-sculpted-masonry', architecture, standard, materials.masonry],
    ['city40-deep-bay-glazing', glazing, standard, materials.glass],
    ['city40-occlusion-recesses', occlusion, standard, materials.shadow],
    ['city40-precision-mullions', precision, high, materials.fine],
  ]) {
    const finished = builder.finish();
    if (!finished) continue;
    const mesh = new T.Mesh(finished.geometry, material);
    mesh.name = name;
    mesh.userData.visualOnly = true;
    parent.add(mesh);
    metrics.triangles += finished.triangles;
    metrics.vertices += finished.vertices;
    metrics.drawUnits++;
  }
  root.add(standard, high);
  root.userData.buildings = selected.map(({ index, x, z, w, h, depth, envelope }) => ({
    index,
    x,
    z,
    w,
    h,
    depth,
    envelope,
  }));
  root.userData.range = { ...CITY40_HERO_RANGE };
  root.userData.metrics = metrics;
  tile.add(root);
  return root;
}

export function setCity40HeroQuality(tile, quality) {
  const section = tile?.getObjectByName('city40-hero-architecture');
  if (!section) return;
  section.getObjectByName('city40-precision-high').visible = quality === 'high';
  section.userData.quality = quality === 'high' ? 'high' : 'medium';
}
