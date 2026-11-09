import * as T from 'three';

// Gameplay remains in the stable local collision frame. During presentation we
// express that same encounter in an inertial room frame: the ship and camera
// physically orbit the stationary reactor, not the Devastador walls.
// This is a rigid coordinate change, so targets and projectile hit tests retain
// exactly the same local positions and damage rules.
const UP = new T.Vector3(0, 1, 0);

export function reactorOrbitalPosition(localPosition, center, angle) {
  return localPosition.clone().sub(center).applyAxisAngle(UP, angle).add(center);
}

export function withReactorOrbitPresentation(scene, center, angle, draw) {
  if (typeof draw !== 'function') throw new TypeError('Orbit presentation requires renderer');
  if (!scene || !Number.isFinite(angle) || !center) return draw();
  const oldPosition = scene.position.clone();
  const oldOrientation = scene.quaternion.clone();
  const turn = new T.Quaternion().setFromAxisAngle(UP, angle);
  const rotatedCenter = center.clone().applyQuaternion(turn);
  try {
    scene.position.copy(oldPosition).add(center).sub(rotatedCenter);
    scene.quaternion.premultiply(turn);
    // The scene's camera and player are children of this stage frame; the
    // chamber's existing inverse orbit plus the presentation turn cancels.
    return draw();
  } finally {
    scene.position.copy(oldPosition);
    scene.quaternion.copy(oldOrientation);
  }
}
