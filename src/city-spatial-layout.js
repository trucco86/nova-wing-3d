// Stage-1 shared spatial contract. Rendered buildings occupy actual X/Z
// footprints: they may not intersect each other, the ground-level rail line,
// station canopies, or the fixed commercial podiums.
// All positions are tile-local and deterministic across near/far city tiles.
export const CITY_BUILDING_CLEARANCE = 2;
export const CITY_TRANSIT_RESERVED_EDGE = 118;
export const CITY_BUILDING_OUTER_LIMIT = 420;

// Retail centres include their podiums, wings, kiosks and public walkways.
// Reserve the whole complexes BEFORE adding procedural or district towers.
export const CITY_RETAIL_RESERVATIONS = Object.freeze(
  [
    { x: 161, z: -409, w: 120, depth: 175, role: 'orbital-plaza' },
    { x: -161, z: -1029, w: 120, depth: 175, role: 'nova-market' },
    { x: 170, z: -1619, w: 128, depth: 175, role: 'skyline-mall' },
  ].map(Object.freeze),
);

export function cityFootprintsOverlap(a, b, clearance = CITY_BUILDING_CLEARANCE) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w + clearance * 2 &&
    Math.abs(a.z - b.z) * 2 < a.depth + b.depth + clearance * 2
  );
}

export function cityBuildingHasClearFootprint(plan, occupied = []) {
  const side = Math.sign(plan.x);
  if (!side || Math.abs(plan.x) - plan.w / 2 < CITY_TRANSIT_RESERVED_EDGE) return false;
  // The train also needs to clear the canopies of the three maglev stations.
  // Landmark footprints are static obstacles, not hidden scenery colliders.
  return (
    !CITY_RETAIL_RESERVATIONS.some((reserved) => cityFootprintsOverlap(plan, reserved)) &&
    !occupied.some((building) => cityFootprintsOverlap(plan, building))
  );
}

function placeOutward(plan, occupied, side, stepSize, label) {
  const outward = side < 0 ? -1 : 1;
  const first = Math.max(Math.abs(plan.x), CITY_TRANSIT_RESERVED_EDGE + plan.w / 2 + 0.01);
  for (let step = 0; step <= 70; step++) {
    const x = first + step * stepSize;
    if (x + plan.w / 2 > CITY_BUILDING_OUTER_LIMIT) break;
    const candidate = { ...plan, x: outward * x };
    if (cityBuildingHasClearFootprint(candidate, occupied)) return candidate;
  }
  throw new Error('Cannot fit ' + label + ' without intersecting the tram or urban structures');
}

export function placeCityBaseBuilding(plan, occupied, side) {
  return placeOutward(plan, occupied, side, 7, 'base building');
}

export function placeCityDistrictTower(plan, occupied, side) {
  return placeOutward(plan, occupied, side, 8, 'district tower');
}

export function cityAscentGroundFlow(progress) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const t = Math.min(1, Math.max(0, (p - 0.1) / 0.42));
  const smooth = t * t * (3 - 2 * t);
  // The near-city motion settles during climb while atmosphere, aircraft
  // and distant landmarks retain their independent authored animation.
  return 1 - smooth;
}
