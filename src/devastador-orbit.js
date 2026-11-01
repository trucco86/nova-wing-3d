import * as T from 'three';

// Stage 4 is a real ship-side orbit, not a rotating reactor or backdrop.
// The local cockpit controls stay in a narrow lane, then map onto a circular
// player trajectory around the fixed reactor in world coordinates.
export const DEVASTADOR_ORBIT = Object.freeze({
  readyZ: -190,
  minRadius: 158,
  maxRadius: 189,
  cameraDistance: 39,
  cameraHeight: 15,
});

export function reactorOrbitReady(core) {
  return Number.isFinite(core?.z) && core.z >= DEVASTADOR_ORBIT.readyZ;
}

export function reactorOrbitPosition(core, local, angle) {
  const radius = T.MathUtils.clamp(
    local.z - core.z,
    DEVASTADOR_ORBIT.minRadius,
    DEVASTADOR_ORBIT.maxRadius,
  );
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  // Tangential steering remains independent of orbital direction.
  return new T.Vector3(
    core.x + sin * radius + cos * local.x,
    local.y,
    core.z + cos * radius - sin * local.x,
  );
}

export function reactorOrbitCamera(core, ship, angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    eye: new T.Vector3(
      ship.x + sin * DEVASTADOR_ORBIT.cameraDistance,
      ship.y + DEVASTADOR_ORBIT.cameraHeight,
      ship.z + cos * DEVASTADOR_ORBIT.cameraDistance,
    ),
    aim: new T.Vector3(core.x, core.y + 3, core.z),
  };
}

export function reactorShotDirection(core, from, fallbackAngle) {
  const direction = new T.Vector3().subVectors(core, from);
  if (direction.lengthSq() < 0.001)
    direction.set(-Math.sin(fallbackAngle), 0, -Math.cos(fallbackAngle));
  return direction.normalize().multiplyScalar(190);
}
