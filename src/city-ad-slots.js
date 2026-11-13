import { CITY_BUILDING_OUTER_LIMIT, CITY_TRANSIT_RESERVED_EDGE } from './city-spatial-layout.js';

// Physical contract of each ad slot. The billboard itself is decorative,
// anchored to already occupied building space. Its envelope may not intersect
// any other building, railway, neighbouring ad or the playable flight corridor.
const STREET_FLOOR = -7;
const LAYOUT = Object.freeze([
  'facade',
  'banner',
  'rear',
  'roof',
  'banner',
  'facade',
  'roof',
  'rear',
  'banner',
  'facade',
  'roof',
  'banner',
]);
export const CITY_AD_CREATIVES = Object.freeze([
  Object.freeze({
    id: 'nova-city',
    name: 'NOVA CITY',
    line: 'O FUTURO EM MOVIMENTO',
    color: '#66e7ff',
  }),
  Object.freeze({
    id: 'skyline-labs',
    name: 'SKYLINE LABS',
    line: 'INOVE ALÉM DO HORIZONTE',
    color: '#ffb978',
  }),
  Object.freeze({
    id: 'cosmo-market',
    name: 'COSMO MARKET',
    line: 'EXPERIÊNCIAS PARA TODOS',
    color: '#f8a2dd',
  }),
]);

export function cityVolumesOverlap(a, b, clearance = 0) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w + clearance * 2 &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h + clearance * 2 &&
    Math.abs(a.z - b.z) * 2 < a.depth + b.depth + clearance * 2
  );
}
function structure(b) {
  return { x: b.x, y: STREET_FLOOR + b.h / 2, z: b.z, w: b.w, h: b.h, depth: b.depth };
}
function candidate(host, index, type, variant, slotNumber) {
  const face = host.z + host.depth / 2;
  const rear = type === 'rear';
  const rearFace = host.z - host.depth / 2;
  const tint =
    CITY_AD_CREATIVES[(slotNumber + (variant === 'industrial' ? 1 : 0)) % CITY_AD_CREATIVES.length];
  const w = Math.min(host.w * (type === 'banner' ? 0.73 : 0.66), type === 'banner' ? 20 : 15);
  const h =
    type === 'roof'
      ? 7
      : type === 'banner'
        ? Math.min(5, host.h * 0.12)
        : Math.min(13, host.h * 0.26);
  const roofTop = host.h - 3;
  const y =
    type === 'roof'
      ? roofTop + 4 + h / 2
      : STREET_FLOOR + host.h * (type === 'banner' ? 0.27 : 0.59);
  const z = type === 'roof' ? host.z + host.depth * 0.28 : rear ? rearFace - 2.05 : face + 2.05;
  const panel = { x: host.x, y, z, w, h, depth: 0.36, rotationY: rear ? Math.PI : 0 };
  const supports =
    type === 'roof'
      ? [-1, 1].map((side) => ({
          x: host.x + side * w * 0.39,
          y: roofTop + 2,
          z,
          w: 0.45,
          h: 4,
          depth: 0.48,
        }))
      : [
          {
            x: host.x - w * 0.42,
            y,
            z: z + (rear ? 0.33 : -0.33),
            w: 0.35,
            h: h + 0.6,
            depth: 0.46,
          },
          {
            x: host.x + w * 0.42,
            y,
            z: z + (rear ? 0.33 : -0.33),
            w: 0.35,
            h: h + 0.6,
            depth: 0.46,
          },
        ];
  return {
    id: variant + '-' + type + '-' + String(slotNumber + 1).padStart(2, '0'),
    kind: type,
    hostIndex: index,
    creativeId: tint.id,
    x: host.x,
    y,
    z,
    w,
    h,
    surface: type === 'roof' ? 'roof-cap' : rear ? 'rear-facade' : 'front-facade',
    panel,
    supports,
    // Slots and dimensions can be mapped to future creatives without moving
    // geometry or mixing ads with gameplay hitboxes.
  };
}

export function planCityAdSlots(
  buildings,
  { variant = 'civic', excludedHosts = [], districtBuildings = [] } = {},
) {
  if (!Array.isArray(buildings) || !buildings.length)
    throw new Error('City ad planner requires real buildings');
  if (!['civic', 'industrial'].includes(variant)) throw new RangeError('Unsupported ad district');
  const excluded = new Set(excludedHosts);
  const structures = [...buildings, ...districtBuildings].map(structure);
  const planned = [];
  const used = new Set();
  for (let step = 0; step < LAYOUT.length; step++) {
    const type = LAYOUT[step];
    const targetZ = -130 - step * 145;
    const side = step % 2 === 0 ? 1 : -1;
    const candidates = buildings
      .map((b, index) => ({ b, index }))
      .filter(
        ({ b, index }) =>
          Math.sign(b.x) === side &&
          !excluded.has(index) &&
          !used.has(index) &&
          b.h >= (type === 'roof' ? 42 : type === 'facade' || type === 'rear' ? 35 : 29) &&
          b.w >= 9.5 &&
          b.depth >= 8 &&
          Math.abs(b.x) - b.w / 2 >= CITY_TRANSIT_RESERVED_EDGE &&
          Math.abs(b.x) + b.w / 2 <= CITY_BUILDING_OUTER_LIMIT &&
          (type !== 'roof' || index % (variant === 'civic' ? 8 : 5) !== 2),
      )
      .sort((left, right) => Math.abs(left.b.z - targetZ) - Math.abs(right.b.z - targetZ));
    for (const { b: host, index } of candidates) {
      if (Math.abs(host.z - targetZ) > (type === 'roof' ? 420 : 130)) continue;
      const slot = candidate(host, index, type, variant, step);
      if (
        // A side of the footprint must be outside the flight corridor.
        Math.abs(slot.panel.x) - slot.panel.w / 2 < CITY_TRANSIT_RESERVED_EDGE ||
        planned.some((other) => cityVolumesOverlap(slot.panel, other.panel, 1.3)) ||
        structures.some(
          (volume, i) => i !== index && cityVolumesOverlap(slot.panel, volume, 0.75),
        ) ||
        // Supports may touch only the host building, and never another tower.
        slot.supports.some((support) =>
          structures.some((volume, i) => i !== index && cityVolumesOverlap(support, volume, 0.6)),
        )
      )
        continue;
      planned.push(slot);
      used.add(index);
      break;
    }
  }
  return planned;
}
