import * as T from 'three';

// Exact world-space AABBs of the visible falling rigid boxes. This layer was
// previously marked visual-only and entirely missing from world.cityHazards().
const EPSILON = 0.015;
function rigidBoxes(node) {
  const result = [];
  node?.traverse((child) => {
    if (child.isMesh && child.geometry?.type === 'BoxGeometry') result.push(child);
  });
  return result;
}
function boundsFor(meshes, destination) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const mesh of meshes) {
    const m = mesh.matrixWorld.elements;
    // Each authored box in city-destruction.js uses BoxGeometry(1,1,1).
    // World-matrix column abs sums include all rotations and nested scales.
    const x = m[12], y = m[13], z = m[14];
    const hx = (Math.abs(m[0]) + Math.abs(m[4]) + Math.abs(m[8])) * 0.5;
    const hy = (Math.abs(m[1]) + Math.abs(m[5]) + Math.abs(m[9])) * 0.5;
    const hz = (Math.abs(m[2]) + Math.abs(m[6]) + Math.abs(m[10])) * 0.5;
    minX = Math.min(minX, x - hx); maxX = Math.max(maxX, x + hx);
    minY = Math.min(minY, y - hy); maxY = Math.max(maxY, y + hy);
    minZ = Math.min(minZ, z - hz); maxZ = Math.max(maxZ, z + hz);
  }
  if (!Number.isFinite(minX)) return false;
  destination.center.set((minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5);
  destination.half.set(
    Math.max(EPSILON, (maxX - minX) * 0.5),
    Math.max(EPSILON, (maxY - minY) * 0.5),
    Math.max(EPSILON, (maxZ - minZ) * 0.5),
  );
  return true;
}

export function createCityFallingSolids(root) {
  const nodes = [
    ['falling-billboard', root.getObjectByName('city-sign-structure')],
    ['falling-hovercar', root.getObjectByName('city-falling-hovercar')],
    ...Array.from(
      { length: 7 },
      (_, i) => ['falling-facade-' + i, root.getObjectByName('city-tower-damaged-crown')?.children[i]],
    ),
  ];
  const colliders = nodes.map(([kind, node]) => ({
    kind, node, meshes: rigidBoxes(node),
    center: new T.Vector3(), half: new T.Vector3(),
    previousX: 0, previousY: 0, previousZ: 0,
    active: false, solid: true,
  }));
  const active = [];
  function update() {
    active.length = 0;
    if (!root.visible) {
      for (const c of colliders) c.active = false;
      return active;
    }
    root.updateWorldMatrix(true, true);
    for (const c of colliders) {
      const wasActive = c.active;
      const lastX = c.center.x, lastY = c.center.y, lastZ = c.center.z;
      c.active = !!c.node?.visible && c.meshes.length > 0 && boundsFor(c.meshes, c);
      if (!c.active) continue;
      c.previousX = wasActive ? lastX : c.center.x;
      c.previousY = wasActive ? lastY : c.center.y;
      c.previousZ = wasActive ? lastZ : c.center.z;
      // Collision only near visible, reachable props; no world-wide box.
      if (c.center.z + c.half.z < -250 || c.center.z - c.half.z > 95) {
        c.active = false;
        continue;
      }
      active.push(c);
    }
    return active;
  }
  function reset() {
    active.length = 0;
    for (const c of colliders) c.active = false;
  }
  return {
    update, reset,
    colliders: () => active,
    snapshot: () => colliders.map((c) => ({
      kind: c.kind, active: c.active,
      center: c.center.toArray(), half: c.half.toArray(),
      previous: [c.previousX, c.previousY, c.previousZ],
    })),
  };
}
