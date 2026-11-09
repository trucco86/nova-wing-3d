import * as T from 'three';

/**
 * Compute a conservative minimum altitude for a rotating multi-part boss.
 * This is calculated once from visible bounds, then evaluated in constant
 * time for each banking pose. Rotations around the vertical axis are covered
 * by a horizontal radius; no per-frame Box3 traversal of the boss hierarchy.
 */
export function marsBossAltitudeConstraint(boss, { groundY = -8, clearance = 5 } = {}) {
  if (!boss?.isObject3D) throw new TypeError('Expected a boss Object3D');
  boss.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(boss);
  if (box.isEmpty()) throw new Error('Mars boss has no visible geometry');
  const lowestY = box.min.y - boss.position.y;
  const farthestX = Math.max(
    Math.abs(box.min.x - boss.position.x),
    Math.abs(box.max.x - boss.position.x),
  );
  const farthestZ = Math.max(
    Math.abs(box.min.z - boss.position.z),
    Math.abs(box.max.z - boss.position.z),
  );
  // An arbitrary heading may bring a long arm/wing across the bank plane.
  const radialExtent = Math.hypot(farthestX, farthestZ);
  const upperY = box.max.y - boss.position.y;
  return (desiredY, bank = 0) => {
    const c = Math.cos(bank);
    const s = Math.abs(Math.sin(bank));
    const minimum = Math.min(lowestY * c, upperY * c) - radialExtent * s;
    return Math.max(desiredY, groundY + clearance - minimum);
  };
}
