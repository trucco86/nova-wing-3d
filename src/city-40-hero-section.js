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
    // This builder emits hundreds of facade quads at startup. Compute the
    // cross product in scalars, avoiding three transient Vector3 allocations
    // for every face and reducing GC pressure on mobile initial load.
    const abx = b[0] - a[0],
      aby = b[1] - a[1],
      abz = b[2] - a[2];
    const acx = c[0] - a[0],
      acy = c[1] - a[1],
      acz = c[2] - a[2];
    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const magnitude = Math.hypot(nx, ny, nz) || 1;
    nx /= magnitude;
    ny /= magnitude;
    nz /= magnitude;
    const base = positions.length / 3;
    const color = rgb(tint);
    for (const [i, p] of [a, b, c, d].entries()) {
      positions.push(...p);
      normals.push(nx, ny, nz);
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
  // Convex Y/Z silhouettes are extruded along X instead of the old Z-only
  // prisms. This is real camera-facing massing, not another flat facade decal.
  // Coordinates are [z, y]; the outward side uses a safe 12cm-equivalent
  // protrusion and the other face sits INSIDE the approved host building.
  function sidePrism(corners, outerX, inset, side, tint) {
    if (corners.length < 3 || !(inset > 0) || ![-1, 1].includes(side))
      throw new Error('Invalid camera-facing architectural profile');
    const front = positions.length / 3;
    const color = rgb(tint);
    let winding = 0;
    for (let i = 0; i < corners.length; i++) {
      const [z0, y0] = corners[i];
      const [z1, y1] = corners[(i + 1) % corners.length];
      winding += z0 * y1 - z1 * y0;
    }
    const invert = winding > 0 !== side > 0;
    for (const [z, y] of corners) {
      positions.push(outerX, y, z);
      normals.push(-side, 0, 0);
      colors.push(...color);
      uvs.push(z / 12, y / 12);
    }
    for (let i = 1; i < corners.length - 1; i++) {
      if (invert) indices.push(front, front + i + 1, front + i);
      else indices.push(front, front + i, front + i + 1);
    }
    const innerX = outerX + side * inset;
    // The rear cap would be permanently buried inside the real building.
    // Keep the four side walls that provide actual relief, but avoid
    // generating invisible triangles and vertex buffers per facade pod.
    for (let i = 0; i < corners.length; i++) {
      const j = (i + 1) % corners.length;
      const p = corners[i],
        q = corners[j];
      quad(
        [outerX, p[1], p[0]],
        [innerX, p[1], p[0]],
        [innerX, q[1], q[0]],
        [outerX, q[1], q[0]],
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
    result.computeBoundingBox();
    return {
      geometry: result,
      vertices: positions.length / 3,
      triangles: indices.length / 3,
      elements,
    };
  }
  return { box, polygonPrism, sidePrism, finish };
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

// A tiny, locally generated reflection probe. Three converts this shared
// cubemap into a filtered environment once; the city doesn't need six dynamic
// cameras, screen-space reflections or new runtime render passes. Six 32px
// faces contain low-frequency skyline/sky highlights, not sharp fake mirrors.
function createCity40ReflectionProbe() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const side = 32;
  const faces = [];
  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grade = ctx.createLinearGradient(0, 0, 0, side);
    grade.addColorStop(0, face === 2 ? '#a5dff7' : '#5f9cc6');
    grade.addColorStop(0.47, '#8ab7c7');
    grade.addColorStop(0.58, '#3c687c');
    grade.addColorStop(1, face === 3 ? '#202936' : '#263c52');
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, side, side);
    // Reflect an urban skyline and two broad warm/cool luminaires.
    ctx.globalAlpha = 0.22;
    for (let column = 0; column < 7; column++) {
      const height = 7 + ((face * 7 + column * 13) % 12);
      ctx.fillStyle = column % 2 ? '#182c43' : '#23445a';
      ctx.fillRect(column * 5, 18 - height * 0.3, 4, height);
    }
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = face % 2 ? '#d9f5ff' : '#ffe0b2';
    ctx.fillRect(5 + (face % 3) * 6, 7, 7, 3);
    faces.push(canvas);
  }
  const probe = new T.CubeTexture(faces);
  probe.mapping = T.CubeReflectionMapping;
  probe.colorSpace = T.SRGBColorSpace;
  probe.needsUpdate = true;
  return probe;
}

let materials;
function sharedMaterials() {
  if (materials) return materials;
  const normals = finishMaterialMap('normal');
  const roughness = finishMaterialMap('roughness');
  const reflection = createCity40ReflectionProbe();
  const masonry = new T.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.66,
    roughness: 0.34,
    normalMap: normals,
    normalScale: new T.Vector2(0.2, 0.2),
    roughnessMap: roughness,
    clearcoat: 0.26,
    clearcoatRoughness: 0.31,
    envMap: reflection,
    envMapIntensity: 0.68,
  });
  const glass = new T.MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.28,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
    emissive: '#1e5266',
    emissiveIntensity: 0.27,
    envMap: reflection,
    envMapIntensity: 1.0,
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
    envMap: reflection,
    envMapIntensity: 0.72,
  });
  materials = { masonry, glass, shadow, fine };
  // Material and reflection resources remain shared by both city tiles.
  // There is no texture creation or GPU allocation in the per-frame update.
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
            b.h >= 35 &&
            Math.abs(b.x) < 245 &&
            Math.abs(b.z - z) < 57,
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

// Camera-facing side skins make the premium treatment visible during forward
// flight. Each facade is built against the side of its real host, instead of
// only decorating the far/front surface hidden by maglev rails. Glazing can
// protrude toward the corridor only when there is verified safe clearance.
function makeCorridorSideFacade(host, style, groups) {
  const side = Math.sign(host.x) || 1;
  const innerWallX = host.x - (side * host.w) / 2;
  const clearance = Math.abs(innerWallX) - SIDE_CLEARANCE;
  if (clearance < 0.38) return null;
  const projection = Math.min(0.32, clearance - 0.22);
  const sideX = innerWallX - side * projection;
  const { masonry, glass, shadow, fine } = groups;
  const tone =
    style === 'civic'
      ? { pane: '#94c6d8', lit: '#a8ecf5', rim: '#d3e5e7', shade: '#182e3b' }
      : { pane: '#6b9bb1', lit: '#efbd90', rim: '#bdac9b', shade: '#263440' };
  const depth = host.depth * 0.83;
  const bottom = -7;
  // Wider window bays preserve modeled depth while removing redundant floor
  // subpanels that pushed the QA114 GPU geometry budget above 3%.
  const floors = Math.max(4, Math.min(7, Math.floor((host.h - 13) / 9.5)));
  const pitch = (host.h - 13) / floors;
  // Recessed base appears beside the pilot's route, with realistic bearing
  // beams. Side skins never exceed the existing building's Z footprint.
  shadow.box(sideX, bottom + host.h * 0.53, host.z, 0.16, host.h * 0.78, depth, tone.shade);
  masonry.box(sideX - side * 0.07, bottom + 5.5, host.z, 0.26, 0.65, depth, tone.rim);
  for (let floor = 0; floor < floors; floor++) {
    const y = bottom + 10 + (floor + 0.5) * pitch;
    const span = depth * 0.78;
    glass.box(
      sideX - side * 0.1,
      y,
      host.z,
      0.18,
      pitch * 0.52,
      span,
      floor % 4 === 1 ? tone.lit : tone.pane,
    );
    masonry.box(sideX - side * 0.1, y - pitch * 0.36, host.z, 0.24, 0.27, depth * 0.91, tone.rim);
    if (style === 'industrial') {
      // Banded HVAC/ventilation louvers face the actual flight route.
      for (const zSide of [-1, 1])
        fine.box(
          sideX - side * 0.15,
          y + pitch * 0.21,
          host.z + zSide * depth * 0.23,
          0.16,
          0.26,
          depth * 0.36,
          tone.rim,
        );
    } else {
      // Tall cyan slits in civic towers are contrasted with pale stone fins.
      fine.box(sideX - side * 0.15, y, host.z + depth * 0.21, 0.16, pitch * 0.64, 0.19, tone.rim);
    }
  }
  // QA114: the camera-facing side has two full-height architectural
  // buttresses and continuous vertical window ribbons. They are supported
  // by the host's existing wall and merged into the original four material
  // families, so finer silhouettes do not add draw calls.
  const sideProfile =
    style === 'civic'
      ? { structural: '#d5e2e3', glazing: '#88d6e5', cap: '#e5f0ef' }
      : { structural: '#b1a99f', glazing: '#a8c9c9', cap: '#e2c3a0' };
  const sideColumns = [];
  for (const zSide of [-1, 1]) {
    const columnZ = host.z + zSide * depth * 0.43;
    masonry.box(
      sideX - side * 0.065,
      bottom + host.h * 0.49,
      columnZ,
      0.16,
      host.h * 0.7,
      0.38,
      sideProfile.structural,
    );
    glass.box(
      sideX - side * 0.1,
      bottom + host.h * 0.48,
      host.z + zSide * depth * 0.32,
      0.15,
      host.h * 0.52,
      depth * 0.11,
      sideProfile.glazing,
    );
    // The cornice is bounded inside the same host footprint, with no
    // cantilever over the pilot lane or an unrelated tower.
    masonry.box(
      sideX - side * 0.08,
      bottom + host.h * 0.855,
      columnZ,
      0.16,
      0.35,
      depth * 0.12,
      sideProfile.cap,
    );
    sideColumns.push(columnZ);
  }
  if (style === 'industrial') {
    // Supported alternating mechanical spandrels distinguish the industrial
    // quarter without an additional material, particle or postprocess pass.
    for (const direction of [-1, 1])
      fine.box(
        sideX - side * 0.12,
        bottom + host.h * 0.69,
        host.z + direction * depth * 0.15,
        0.16,
        0.29,
        depth * 0.22,
        sideProfile.cap,
      );
  }
  // QA115: chamfered storefront shoulders and inset glass panels are
  // actually modelled along the X-facing facade, where the player sees them.
  // Each panel projects only 0.11 units beyond the approved sideX; its rear
  // penetrates the owning building, not the flight corridor or its neighbors.
  const pods = [];
  for (const direction of [-1, 1]) {
    const centerZ = host.z + direction * depth * 0.2;
    const width = depth * 0.26;
    const yBase = bottom + 11.5;
    const yPeak = bottom + Math.min(host.h * 0.75, host.h - 10);
    const profile = [
      [centerZ - width * 0.49, yBase],
      [centerZ + width * 0.49, yBase],
      [centerZ + width * 0.36, yPeak - 4],
      [centerZ + width * 0.18, yPeak],
      [centerZ - width * 0.18, yPeak],
      [centerZ - width * 0.36, yPeak - 4],
    ];
    masonry.sidePrism(
      profile,
      sideX - side * 0.1,
      0.29,
      side,
      style === 'civic' ? '#c8dbe4' : '#9eabb3',
    );
    const innerProfile = [
      [centerZ - width * 0.3, yBase + 5],
      [centerZ + width * 0.3, yBase + 5],
      [centerZ + width * 0.21, yPeak - 7],
      [centerZ - width * 0.21, yPeak - 7],
    ];
    glass.sidePrism(
      innerProfile,
      sideX - side * 0.12,
      0.15,
      side,
      style === 'civic' ? '#9fdfeb' : '#9ab9be',
    );
    pods.push({ centerZ, outerX: sideX - side * 0.12, height: yPeak - yBase });
  }
  const minLaneAbsX = Math.abs(sideX) - 0.16;
  if (minLaneAbsX < SIDE_CLEARANCE)
    throw new Error('Graphics 4.0 side skin entered the reserved flight lane');
  return {
    hostIndex: host.index,
    x: sideX,
    depth,
    floors,
    minLaneAbsX,
    sideColumns,
    supportedRibbonCount: sideColumns.length,
    sculptedPodiums: pods,
  };
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
  // Supported, multi-level commercial entrance: chamfered awning,
  // recessed glass storefront, structural struts and soffit shadows.
  // Unlike floating decorative props, all details are part of a host.
  const canopy = y0 + doorHeight + 2.7;
  masonry.polygonPrism(
    [
      [x - width * 0.42, canopy - 0.65],
      [x + width * 0.42, canopy - 0.65],
      [x + width * 0.36, canopy + 0.72],
      [x - width * 0.36, canopy + 0.72],
    ],
    z + 1.8,
    1.5,
    p.bright,
  );
  shadow.box(x, canopy - 0.79, z + 1.68, width * 0.67, 0.22, 0.54, p.shade);
  // Inner display bays read as retail space instead of an unbroken wall.
  for (const wing of [-1, 1]) {
    const sx = x + wing * width * 0.235;
    glass.box(sx, y0 + 3.25, z + 1.43, width * 0.28, 4.1, 0.23, p.glass);
    masonry.box(sx, y0 + 5.52, z + 1.7, width * 0.31, 0.4, 0.3, p.trim);
    fine.box(sx, y0 + 2.25, z + 1.73, width * 0.27, 0.19, 0.26, p.trim);
  }

  // The new glass is visibly in front of legacy City33 glazing at z+1.18,
  // preventing old windows from intersecting the new bay design.
  // Recessed, divided bay glazing is real depth, not a luminous texture pasted
  // onto a box. Deep horizontal spandrels cast shadow along each floor.
  // Larger glazing modules keep the premium readable on mobile while avoiding
  // geometry whose projected screen size falls below a useful pixel.
  const floors = Math.max(4, Math.min(7, Math.floor((b.h - 14) / 9.5)));
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
      // A narrow secondary shadow reveal visibly separates the glazing from
      // the structural extrusion. It is merged with the existing material
      // draw call; fine mullions only appear in the High profile.
      if ((host.band + col) % 2 === 0)
        fine.box(px + pitch * 0.34, floorY, z + 1.75, 0.15, glazingHeight * 0.83, 0.19, p.bright);
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
  // Roof architecture differs materially between district identities.
  // Civic buildings carry asymmetric sculptural shoulders; industrial
  // buildings expose supported structural fins and ventilation slats.
  if (style === 'civic') {
    masonry.polygonPrism(
      [
        [x - width * 0.31, yTop + 0.5],
        [x + width * 0.21, yTop + 0.5],
        [x + width * 0.13, yTop + crownHeight + 2.2],
        [x - width * 0.17, yTop + crownHeight + 2.2],
      ],
      z + 1.23,
      0.82,
      p.trim,
    );
    for (const side of [-1, 1])
      fine.box(x + side * width * 0.31, yTop - 1.05, z + 1.75, width * 0.08, 1.8, 0.25, p.lit);
  } else {
    for (const side of [-1, 1]) {
      masonry.polygonPrism(
        [
          [x + side * width * 0.35, yTop + 0.3],
          [x + side * width * 0.19, yTop + 0.3],
          [x + side * width * 0.22, yTop + crownHeight + 1.8],
        ],
        z + 1.18,
        0.93,
        p.trim,
      );
      // Shallow service ventilation remains attached to a load-bearing roof
      // wall and never stretches between unrelated buildings.
      for (let fin = 0; fin < 3; fin++)
        fine.box(
          x + side * width * 0.31,
          yTop - 2.0 - fin * 1.15,
          z + 1.67,
          width * 0.11,
          0.25,
          0.28,
          p.trim,
        );
    }
  }
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
  const corridorFacades = [];
  for (const host of selected) {
    makeFacade(host, variant, shapes);
    const visibleSide = makeCorridorSideFacade(host, variant, shapes);
    if (visibleSide) corridorFacades.push(visibleSide);
  }

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
    // Coarse-grained section culling protects both devices when this
    // 285m prototype exits the view; no extra object per window is needed.
    mesh.frustumCulled = true;
    parent.add(mesh);
    metrics.triangles += finished.triangles;
    metrics.vertices += finished.vertices;
    metrics.drawUnits++;
    metrics.bytes =
      (metrics.bytes ?? 0) +
      Object.values(finished.geometry.attributes).reduce((n, a) => n + a.array.byteLength, 0) +
      finished.geometry.index.array.byteLength;
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
  root.userData.corridorFacades = corridorFacades;
  tile.add(root);
  return root;
}

export function setCity40HeroQuality(tile, quality) {
  const section = tile?.getObjectByName('city40-hero-architecture');
  if (!section) return;
  section.getObjectByName('city40-precision-high').visible = quality === 'high';
  section.userData.quality = quality === 'high' ? 'high' : 'medium';
}

// A skyline monument built from a small number of faceted, supported meshes.
// Unlike facade-only geometry, its central position is visible on portrait
// phones. It belongs to the distant non-collidable horizon, NEVER to a road
// tile or the pilot's flight path. The baseline horizon is located ~900 units
// farther back, so these towers remain a scenic landmark throughout stage 1.
export function createCity40SkylineLandmark() {
  const root = new T.Group();
  root.name = 'city40-distant-signature';
  root.userData.visualOnly = true;
  const frame = geometryBuilder();
  const glass = geometryBuilder();
  const trim = geometryBuilder();
  const z = -450;
  for (const side of [-1, 1]) {
    const x = side * 57;
    const cladding = side < 0 ? '#98b5bb' : '#9cabb7';
    // The lower pillar is a real structural foundation for the spire, and
    // the crown has an angled, recognizable profile instead of a cube.
    frame.box(x, 68, z - 6, 20, 150, 20, cladding);
    frame.polygonPrism(
      [
        [x - 13, 132],
        [x + 13, 132],
        [x + 12, 176],
        [x + 6, 219],
        [x + 1, 256],
        [x - 5, 227],
        [x - 12, 176],
      ],
      z + 7,
      23,
      cladding,
    );
    for (let level = 0; level < 7; level++) {
      const y = 33 + level * 22;
      glass.box(
        x,
        y,
        z + 5.6,
        8,
        6.4,
        0.3,
        (level + (side > 0 ? 1 : 0)) % 3 ? '#8bc6d7' : '#c9e8e1',
      );
      trim.box(x, y + 4.9, z + 6.1, 15, 0.34, 0.28, '#dae2dc');
    }
    glass.box(x, 190, z + 7.6, 2.9, 103, 0.5, side < 0 ? '#a9e2ed' : '#efc5a8');
    trim.box(x, 255.5, z + 7.9, 5, 0.8, 0.38, '#eff4f4');
  }
  // QA114: a faceted orbital aperture gives the city a distinctive,
  // readable silhouette while adding ZERO draw calls. Twelve angled
  // architectural panels are attached across the existing 157m skyway,
  // far outside the playable road and flight volume.
  const aperture = { radius: 43, innerRadius: 36.5, y: 178, segments: 12, frontZ: z + 11 };
  for (let i = 0; i < aperture.segments; i++) {
    const start = (i * Math.PI * 2) / aperture.segments;
    const end = ((i + 1) * Math.PI * 2) / aperture.segments;
    const polar = (r, angle) => [Math.cos(angle) * r, aperture.y + Math.sin(angle) * r];
    const outerStart = polar(aperture.radius, start);
    const outerEnd = polar(aperture.radius, end);
    const innerStart = polar(aperture.innerRadius, start);
    const innerEnd = polar(aperture.innerRadius, end);
    // Winding follows a convex quad around the aperture's hollow center.
    const facet = [outerStart, outerEnd, innerEnd, innerStart];
    frame.polygonPrism(facet, aperture.frontZ, 2.6, '#c4d8e1');
    // The narrow colored sub-panel is integrated into the same glass batch.
    // Neither side owns a new light source, shader variant or texture.
    if (i % 2 === 0) {
      const glassInnerStart = polar(aperture.innerRadius + 0.4, start);
      const glassInnerEnd = polar(aperture.innerRadius + 0.4, end);
      const glassOuterStart = polar(aperture.innerRadius + 2.5, start);
      const glassOuterEnd = polar(aperture.innerRadius + 2.5, end);
      glass.polygonPrism(
        [glassOuterStart, glassOuterEnd, glassInnerEnd, glassInnerStart],
        aperture.frontZ + 0.22,
        0.3,
        i % 4 === 0 ? '#a6e5ef' : '#e8c8ab',
      );
    }
  }
  // The skyway is actually connected to BOTH towers at y~157. Its stepped
  // steel truss spans only the far-background structure, not playable space.
  frame.polygonPrism(
    [
      [-64, 157],
      [64, 157],
      [59, 172],
      [31, 178],
      [0, 193],
      [-31, 178],
      [-59, 172],
    ],
    z + 8,
    20,
    '#b2c7cf',
  );
  trim.box(0, 158.5, z + 9, 105, 1.7, 1.1, '#d1e7e6');
  glass.polygonPrism(
    [
      [-10.5, 183],
      [0, 201],
      [10.5, 183],
      [0, 168],
    ],
    z + 9.4,
    1.2,
    '#a7e0ee',
  );

  const materials = sharedMaterials();
  const standard = new T.Group();
  standard.name = 'city40-landmark-medium';
  const high = new T.Group();
  high.name = 'city40-landmark-high';
  high.visible = false;
  const metrics = { drawUnits: 0, triangles: 0, bytes: 0 };
  for (const [name, builder, parent, material] of [
    ['city40-landmark-faceted-spires', frame, standard, materials.masonry],
    ['city40-landmark-glazing', glass, standard, materials.glass],
    ['city40-landmark-fine-frames', trim, high, materials.fine],
  ]) {
    const finished = builder.finish();
    if (!finished) continue;
    const mesh = new T.Mesh(finished.geometry, material);
    mesh.name = name;
    mesh.userData.visualOnly = true;
    mesh.frustumCulled = true;
    parent.add(mesh);
    metrics.drawUnits++;
    metrics.triangles += finished.triangles;
    metrics.bytes +=
      Object.values(finished.geometry.attributes).reduce(
        (n, attr) => n + attr.array.byteLength,
        0,
      ) + finished.geometry.index.array.byteLength;
  }
  root.add(standard, high);
  root.userData.metrics = metrics;
  root.userData.localZ = z;
  root.userData.aperture = {
    radius: aperture.radius,
    innerRadius: aperture.innerRadius,
    segments: aperture.segments,
    supportedSkywayY: 157,
    nonPlayable: true,
  };
  return root;
}

export function setCity40SkylineQuality(horizon, quality) {
  const root = horizon?.getObjectByName('city40-distant-signature');
  if (!root) return;
  root.getObjectByName('city40-landmark-high').visible = quality === 'high';
}
