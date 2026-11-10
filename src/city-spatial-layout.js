// Pure stage-1 layout math. Buildings are rectangles on the X/Z plane;
// details such as windows and rooftop machinery stay anchored to their tower.
export const CITY_BUILDING_CLEARANCE = 2;

export function cityFootprintsOverlap(a, b, clearance = CITY_BUILDING_CLEARANCE) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w + clearance * 2 &&
    Math.abs(a.z - b.z) * 2 < a.depth + b.depth + clearance * 2
  );
}

export function placeCityDistrictTower(plan, occupied, side) {
  const outward = side < 0 ? -1 : 1;
  // Moving only X preserves the authored progression and keeps every
  // attached facade/roof feature on the same tower transform.
  for (let step = 0; step <= 48; step++) {
    const candidate = { ...plan, x: plan.x + outward * step * 10 };
    if (!occupied.some((building) => cityFootprintsOverlap(candidate, building))) {
      return candidate;
    }
  }
  throw new Error('Cannot fit district tower without intersecting nearby buildings');
}

export function cityAscentGroundFlow(progress) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const t = Math.min(1, Math.max(0, (p - 0.1) / 0.42));
  const smooth = t * t * (3 - 2 * t);
  // The near-city motion settles during climb while atmosphere, aircraft
  // and distant landmarks retain their independent authored animation.
  return 1 - smooth;
}
