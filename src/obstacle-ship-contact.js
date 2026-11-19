import { resolveCitySolidContact } from './city-collision.js';

/**
 * Physical ship/obstacle contact for authored compound solids (tunnels,
 * stations, bridges and carriers). The existing shot collision remains in
 * flight.js. Reuse one descriptor per game to avoid hot-loop allocations.
 *
 * Obstacles move toward the camera each frame. Resolving with the *current*
 * obstacle alone allows tunneling on boosted frames; the previous relative
 * position must use its earlier Z. Meshes without solids are decoration only.
 */
export function createObstacleShipResolver() {
  const center = { x: 0, y: 0, z: 0 };
  const contact = {
    active: true,
    solid: true,
    kind: 'obstacle',
    center,
    half: null,
    previousX: 0,
    previousY: 0,
    previousZ: 0,
  };
  const clearance = { x: 1.3, y: 1.3, z: 1.3 };

  return function resolveObstacleShipContact(
    previous,
    next,
    obstacle,
    travel = 0,
    { radius = 1.3, laneLimit = 72, minY = -1, maxY = 96 } = {},
  ) {
    if (!obstacle?.userData?.solids?.length) return false;
    if (!Number.isFinite(travel) || !Number.isFinite(radius) || radius < 0)
      return false;
    clearance.x = radius;
    clearance.y = radius;
    clearance.z = radius;
    let collided = false;
    for (const volume of obstacle.userData.solids) {
      // Only solid parts of the compound object exist here. Europa's breach
      // removes its panel from this array when it breaks.
      center.x = obstacle.position.x + volume.center.x;
      center.y = obstacle.position.y + volume.center.y;
      center.z = obstacle.position.z + volume.center.z;
      // Wide shallow decks are approached vertically. Sliding onto a free
      // flank would teleport the pilot outside the tunnel through its roof.
      contact.kind =
        volume.half.x >= 18 && volume.half.y <= 3 && volume.half.z >= 2
          ? 'overpass-deck'
          : 'obstacle';
      contact.half = volume.half;
      contact.previousX = center.x;
      contact.previousY = center.y;
      contact.previousZ = center.z - travel;
      if (
        resolveCitySolidContact(previous, next, contact, {
          clearance,
          laneLimit,
          minY,
          maxY,
        })
      )
        collided = true;
    }
    return collided;
  };
}
