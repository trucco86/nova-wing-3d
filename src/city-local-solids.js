import * as T from 'three';

// Colliders follow tangible geometry, NOT the city's road area.
// Rails are low (the pilot can fly over them); elevated support columns,
// suspended guideways and moving maglevs occupy only their actual volumes.
// Objects are preallocated and their world positions are updated in place.
const NEAR_Z = -178;
const REAR_Z = 52;

function solid(tile, kind, x, y, z, halfX, halfY, halfZ, node = null, highOnly = false) {
  const center = new T.Vector3(x, y, z);
  return {
    tile,
    node,
    highOnly,
    kind,
    center,
    half: new T.Vector3(halfX, halfY, halfZ),
    localX: x,
    localY: y,
    localZ: z,
    previousX: x,
    previousY: y,
    previousZ: z,
    active: false,
    solid: true,
  };
}

export function createCityLocalSolids(tiles) {
  const objects = [];
  for (const tile of tiles) {
    for (const side of [-1, 1]) {
      // Exact visible street-furniture location: x=±47, y roughly -7..-2.
      // This is NOT a vertical wall. At normal altitude (y≈6) the fighter
      // crosses freely; at road level the guardrail is physically solid.
      objects.push(solid(tile, 'avenue-rail', side * 47, -4.34, -959.5, 0.9, 2.38, 950));
      // Suspended transit guideway: only obstructs high-altitude flight.
      objects.push(solid(tile, 'elevated-rail', side * 80, 32.1, -948, 4, 2.6, 947));
    }
    // These real pillars are rendered only on the High graphics profile.
    for (let i = 0; i < 9; i++) {
      const z = -160 - i * 204;
      const y = 59 + (i % 3) * 7;
      for (const side of [-1, 1])
        objects.push(
          solid(
            tile,
            'overpass-pillar',
            side * 70,
            (y - 7) / 2,
            z,
            2.5,
            (y + 7) / 2,
            2.5,
            null,
            true,
          ),
        );
    }
    const life = tile.getObjectByName('city-urban-life');
    for (const node of life?.children ?? []) {
      if (node.userData.role !== 'maglev') continue;
      // Three carriages with ends and fins, actual width ~13 and length ~108.
      objects.push(
        solid(
          tile,
          'maglev-train',
          node.position.x,
          node.position.y,
          node.position.z,
          6.8,
          4.6,
          55,
          node,
          !!node.userData.highOnly,
        ),
      );
    }
  }
  const active = [];
  function reset() {
    active.length = 0;
    for (const o of objects) {
      o.active = false;
      o.center.set(
        (o.node?.position.x ?? o.localX) + o.tile.position.x,
        (o.node?.position.y ?? o.localY) + o.tile.position.y,
        (o.node?.position.z ?? o.localZ) + o.tile.position.z,
      );
      o.previousX = o.center.x;
      o.previousY = o.center.y;
      o.previousZ = o.center.z;
    }
  }
  function update(enabled = true) {
    active.length = 0;
    if (!enabled) {
      for (const o of objects) o.active = false;
      return;
    }
    for (const o of objects) {
      const oldX = o.center.x,
        oldY = o.center.y,
        oldZ = o.center.z;
      const { tile, node } = o;
      o.center.set(
        (node?.position.x ?? o.localX) + tile.position.x,
        (node?.position.y ?? o.localY) + tile.position.y,
        (node?.position.z ?? o.localZ) + tile.position.z,
      );
      // Road tiles and trains wrap far away. Never sweep the invisible jump
      // across the playfield as though it were a physical moving object.
      const wrapped = Math.abs(o.center.z - oldZ) > 130 || Math.abs(o.center.x - oldX) > 130;
      o.previousX = wrapped ? o.center.x : oldX;
      o.previousY = wrapped ? o.center.y : oldY;
      o.previousZ = wrapped ? o.center.z : oldZ;
      const visible =
        tile.visible &&
        (!o.highOnly || (node ? node.visible : tile.getObjectByName('city-high-details')?.visible));
      o.active = !!visible && o.center.z + o.half.z >= NEAR_Z && o.center.z - o.half.z <= REAR_Z;
      if (o.active) active.push(o);
    }
  }
  reset();
  return {
    update,
    reset,
    colliders: () => active,
    snapshot: () =>
      objects.map((o) => ({
        kind: o.kind,
        active: o.active,
        x: o.center.x,
        y: o.center.y,
        z: o.center.z,
        halfX: o.half.x,
        halfY: o.half.y,
        halfZ: o.half.z,
      })),
  };
}
