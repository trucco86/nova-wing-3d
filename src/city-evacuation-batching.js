import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All seven author-designed evacuation shuttles retain precisely the original
// hull, glass and engine geometry in local coordinates. Merging each material's
// small boxes once gives three draws per tile rather than 49 independent Mesh
// draws. Transform/scale/rotation remain owned by seven lightweight proxies.
const LAYERS = Object.freeze([
  {
    name: 'hull',
    parts: [
      [3.4, 1.4, 9.2, 0, 0, 0],
      [10, 0.45, 3.1, 0, -0.3, 0.8],
    ],
  },
  {
    name: 'glazing',
    parts: [
      [1.4, 0.8, 2, 0, 0.75, -2.5],
      [1.1, 0.35, 7, -4.3, -0.2, 0.8],
      [1.1, 0.35, 7, 4.3, -0.2, 0.8],
    ],
  },
  {
    name: 'engines',
    parts: [
      [1.4, 0.4, 1.1, -1.3, 0, 5],
      [1.4, 0.4, 1.1, 1.3, 0, 5],
    ],
  },
]);
const refs = new WeakMap();
function geometryFor(parts) {
  const shapes = parts.map(([w, h, d, x, y, z]) => {
    const geometry = new T.BoxGeometry(w, h, d);
    geometry.translate(x, y, z);
    return geometry;
  });
  const merged = mergeGeometries(shapes, false);
  for (const geometry of shapes) geometry.dispose();
  if (!merged) throw new Error('Cannot merge evacuation craft material geometry');
  merged.computeBoundingSphere();
  return merged;
}

export function createCityEvacuationFleet({ hull, glazing, engines }, total = 7) {
  if (![hull, glazing, engines].every((m) => m?.isMaterial) || total !== 7)
    throw new TypeError('Expected three original evacuation materials and seven ships');
  const group = new T.Group();
  group.name = 'city-evacuation-instanced-fleet';
  group.userData.visualOnly = true;
  group.userData.role = 'evacuation-renderer';
  const materials = { hull, glazing, engines };
  for (const layer of LAYERS) {
    const geometry = geometryFor(layer.parts);
    const mesh = new T.InstancedMesh(geometry, materials[layer.name], total);
    mesh.name = 'city-evacuation-batched-' + layer.name;
    mesh.userData.visualOnly = true;
    mesh.count = 3; // Medium default; higher instances are initialized on LOD switch.
    mesh.frustumCulled = false; // Independent vehicles travel across the long tile.
    mesh.castShadow = false;
    group.add(mesh);
  }
  return group;
}

function nodesFor(urbanLife) {
  let nodes = refs.get(urbanLife);
  if (nodes) return nodes;
  const fleet = urbanLife.getObjectByName('city-evacuation-instanced-fleet');
  if (!fleet) return null;
  const crafts = urbanLife.children.filter((c) => c.userData.role === 'evacuation');
  const meshes = LAYERS.map((layer) =>
    fleet.getObjectByName('city-evacuation-batched-' + layer.name),
  );
  if (crafts.length !== 7 || meshes.some((mesh) => !mesh?.isInstancedMesh))
    throw new Error('Invalid evacuation fleet layout');
  nodes = { crafts, meshes };
  refs.set(urbanLife, nodes);
  return nodes;
}

export function syncCityEvacuationFleet(urbanLife, high = null) {
  const nodes = nodesFor(urbanLife);
  if (!nodes) return;
  const { crafts, meshes } = nodes;
  if (typeof high === 'boolean') {
    const visibleCount = high ? crafts.length : 3;
    for (const craft of crafts) craft.visible = !craft.userData.highOnly || high;
    for (const mesh of meshes) mesh.count = visibleCount;
  }
  const count = meshes[0].count;
  for (let i = 0; i < count; i++) {
    const craft = crafts[i];
    craft.updateMatrix();
    for (const mesh of meshes) mesh.setMatrixAt(i, craft.matrix);
  }
  if (count) for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
}
