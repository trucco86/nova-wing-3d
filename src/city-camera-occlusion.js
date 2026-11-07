// Only render-surface fading. Never changes mesh visibility, world solids,
// collision response, projectiles, scene transforms or enemy targeting.
// Wide structures can cover the upper half of the chase camera even though
// their gameplay collision volumes are physically correct.
const FADE_OPACITY = 0.17;
const RESPONSE_SPEED = 13;
const BRIDGE_GROUPS = [
  {
    key: 'lower',
    meshes: ['city-elevated-crossings', 'city-elevated-crossings-lights'],
    kinds: new Set(['overpass-deck', 'overpass-underbrace', 'overpass-upperbeam']),
  },
  {
    key: 'transit',
    meshes: ['city32-maglev-crossing-guideway'],
    kinds: new Set(['cross-city-guideway']),
  },
  {
    key: 'upper',
    meshes: [
      'city-upper-skybridge-solids',
      'city-upper-skybridge-glazing',
      'city-upper-skybridge-lights',
    ],
    kinds: new Set(['upper-bridge-deck', 'upper-bridge-truss']),
  },
];

export function bridgeOccludesSight(camera, pilot, obstacle) {
  if (!obstacle?.active || !obstacle.solid || !obstacle.half || !obstacle.center) return false;
  const c = obstacle.center;
  const half = obstacle.half;
  // Small extra Y margin covers a slab that fills the upper screen without
  // touching the exact center-to-center line of sight.
  const padding = { x: 4, y: 6.5, z: 3 };
  let enter = 0;
  let exit = 1;
  for (const axis of ['x', 'y', 'z']) {
    const start = camera[axis];
    const move = pilot[axis] - camera[axis];
    const extent = half[axis] + padding[axis];
    const low = c[axis] - extent;
    const high = c[axis] + extent;
    if (Math.abs(move) < 1e-8) {
      if (start < low || start > high) return false;
      continue;
    }
    const a = (low - start) / move;
    const b = (high - start) / move;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (enter > exit) return false;
  }
  // A bridge behind both the camera and the ship is not an occluder.
  return exit >= 0 && enter <= 1;
}

export function createCityBridgeCameraFade(tiles) {
  const groups = tiles.flatMap((tile) =>
    BRIDGE_GROUPS.map((entry) => {
      const meshes = entry.meshes
        .map((name) => tile.getObjectByName(name))
        .filter((mesh) => mesh && mesh.material && !Array.isArray(mesh.material));
      // Distant tile clones share material instances by default. Clone only
      // these nine (max) small groups so a nearby structure cannot fade both
      // distant and local geometry or change unrelated metal materials.
      for (const mesh of meshes) mesh.material = mesh.material.clone();
      return { tile, key: entry.key, kinds: entry.kinds, meshes, blend: 0 };
    }),
  );
  const apply = (group) => {
    const fade = Math.max(0, Math.min(1, group.blend));
    for (const mesh of group.meshes) {
      const mat = mesh.material;
      // Opaque most of the time; transparency and depth-writing change only
      // while the actual camera sightline is blocked by a physical deck.
      const transparent = fade > 0.01;
      const depthWrite = !transparent;
      if (mat.transparent !== transparent || mat.depthWrite !== depthWrite) {
        mat.transparent = transparent;
        mat.depthWrite = depthWrite;
        mat.needsUpdate = true;
      }
      mat.opacity = 1 - fade * (1 - FADE_OPACITY);
    }
  };
  function reset() {
    for (const group of groups) {
      group.blend = 0;
      apply(group);
    }
  }
  function update(camera, pilot, colliders, dt, enabled = true) {
    if (!enabled) {
      reset();
      return snapshot();
    }
    const strength = 1 - Math.exp(-RESPONSE_SPEED * Math.max(0, dt));
    for (const group of groups) {
      let occluded = false;
      if (group.meshes.some((mesh) => mesh.visible)) {
        for (const collider of colliders ?? []) {
          if (collider.tile !== group.tile || !group.kinds.has(collider.kind)) continue;
          if (bridgeOccludesSight(camera, pilot, collider)) {
            occluded = true;
            break;
          }
        }
      }
      group.blend += ((occluded ? 1 : 0) - group.blend) * strength;
      if (group.blend < 0.005) group.blend = 0;
      apply(group);
    }
    return snapshot();
  }
  function snapshot() {
    return groups.map((group) => ({
      tile: group.tile.name,
      kind: group.key,
      fade: group.blend,
      opacity: group.meshes[0]?.material.opacity ?? 1,
      occluding: group.blend > 0.1,
      materialCount: group.meshes.length,
    }));
  }
  reset();
  return { update, reset, snapshot };
}
