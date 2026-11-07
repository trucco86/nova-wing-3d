import * as T from 'three';

// Medium+ real route geometry. Three skybridges arrive through normal city
// tile scrolling, unlike the distant skyline's decorative background spans.
// All steel pieces use one instance draw per tile and have matching solids.
const unit = new T.BoxGeometry(1, 1, 1);
const steel = new T.MeshStandardMaterial({
  color: '#7794a9', metalness: 0.7, roughness: 0.32,
});
const glass = new T.MeshStandardMaterial({
  color: '#2c5870', metalness: 0.5, roughness: 0.2,
  transparent: true, opacity: 0.84,
});
const neon = new T.MeshBasicMaterial({ color: '#83e8f7', toneMapped: false });
const BRIDGES = Object.freeze([
  { z: -285, y: 92, width: 126, depth: 12 },
  { z: -605, y: 123, width: 134, depth: 16 },
  { z: -1005, y: 151, width: 138, depth: 11 },
]);
export function createCityUpperBridges() {
  const root = new T.Group();
  root.name = 'city-upper-playable-skybridges';
  root.userData.visualOnly = false;
  const structure = new T.InstancedMesh(unit, steel, 12);
  structure.name = 'city-upper-skybridge-solids';
  structure.userData.solidInstances = [];
  const glazing = new T.InstancedMesh(unit, glass, 6);
  glazing.name = 'city-upper-skybridge-glazing';
  const lights = new T.InstancedMesh(unit, neon, 15);
  lights.name = 'city-upper-skybridge-lights';
  const dummy = new T.Object3D();
  const add = (mesh, kind, x, y, z, width, height, depth) => {
    const index = mesh.count === 0 ? 0 : mesh.userData.nextIndex ?? 0;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(width, height, depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.userData.nextIndex = index + 1;
    if (kind) mesh.userData.solidInstances.push({
      kind, x, y, z, halfX: width / 2, halfY: height / 2, halfZ: depth / 2,
    });
  };
  for (let i = 0; i < BRIDGES.length; i++) {
    const { z, y, width, depth } = BRIDGES[i];
    // Structural deck, side brackets, top beam. A pilot can go over, below,
    // or around each physical piece; no invisible tall collision plane.
    add(structure, 'upper-bridge-deck', 0, y, z, width, 4.2, depth);
    for (const side of [-1, 1])
      add(structure, 'upper-bridge-bracket', side * (width / 2 - 3), y - 8, z,
        5, 15, depth * 0.8);
    add(structure, 'upper-bridge-truss', 0, y + 10, z, width * 0.73, 2, depth * 0.7);
    add(glazing, null, 0, y + 3.3, z + depth * 0.43, width * 0.91, 1.3, 0.45);
    add(glazing, null, 0, y + 3.3, z - depth * 0.43, width * 0.91, 1.3, 0.45);
    for (const side of [-1, 1]) {
      add(lights, null, side * (width / 2 - 1), y + 2.6,
        z + depth * 0.46, 0.85, 0.9, 0.35);
      add(lights, null, side * (width / 2 - 1), y + 2.6,
        z - depth * 0.46, 0.85, 0.9, 0.35);
    }
    add(lights, null, 0, y + 2.2, z + depth * 0.51, width * 0.68, 0.35, 0.25);
  }
  for (const mesh of [structure, glazing, lights]) {
    mesh.count = mesh.userData.nextIndex ?? 0;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.visualOnly = mesh !== structure;
    root.add(mesh);
  }
  root.userData.levels = BRIDGES.map(({ y, z }) => ({ y, z }));
  return root;
}
