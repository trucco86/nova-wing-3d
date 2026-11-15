import * as T from 'three';

// Medium+ real route geometry. Three skybridges arrive through normal city
// tile scrolling, unlike the distant skyline's decorative background spans.
// All steel pieces use one instance draw per tile; exposed walkway spans
// have colliders, while grounded supports are outside the flight corridor.
const unit = new T.BoxGeometry(1, 1, 1);
const steel = new T.MeshStandardMaterial({
  color: '#8c9a9d',
  metalness: 0.7,
  roughness: 0.32,
});
const glass = new T.MeshStandardMaterial({
  color: '#435d66',
  metalness: 0.5,
  roughness: 0.2,
  transparent: true,
  opacity: 0.84,
});
const neon = new T.MeshBasicMaterial({ color: '#c8e7e3', toneMapped: false });
const BRIDGES = Object.freeze([
  { z: -285, y: 92, width: 126, depth: 12 },
  { z: -605, y: 123, width: 134, depth: 16 },
  { z: -1005, y: 151, width: 138, depth: 11 },
]);
export function createCityUpperBridges() {
  const root = new T.Group();
  root.name = 'city-upper-playable-skybridges';
  root.userData.visualOnly = false;
  const structure = new T.InstancedMesh(unit, steel, 30);
  structure.name = 'city-upper-skybridge-solids';
  structure.userData.solidInstances = [];
  const glazing = new T.InstancedMesh(unit, glass, 6);
  glazing.name = 'city-upper-skybridge-glazing';
  const lights = new T.InstancedMesh(unit, neon, 15);
  lights.name = 'city-upper-skybridge-lights';
  const dummy = new T.Object3D();
  const add = (mesh, kind, x, y, z, width, height, depth) => {
    const index = mesh.count === 0 ? 0 : (mesh.userData.nextIndex ?? 0);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(width, height, depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.userData.nextIndex = index + 1;
    if (kind)
      mesh.userData.solidInstances.push({
        kind,
        x,
        y,
        z,
        halfX: width / 2,
        halfY: height / 2,
        halfZ: depth / 2,
      });
  };
  const groundedSupports = [];
  for (let i = 0; i < BRIDGES.length; i++) {
    const { z, y, width, depth } = BRIDGES[i];
    // Structural deck, side brackets, top beam. A pilot can go over, below,
    // or around each physical piece; no invisible tall collision plane.
    add(structure, 'upper-bridge-deck', 0, y, z, width, 4.2, depth);
    for (const side of [-1, 1])
      add(structure, 'upper-bridge-bracket', side * (width / 2 - 3), y - 8, z, 5, 15, depth * 0.8);
    add(structure, 'upper-bridge-truss', 0, y + 10, z, width * 0.73, 2, depth * 0.7);
    // The old centre spans terminated in midair at x≈63. Connect each end
    // to a visible grounded outer pylon without putting support colliders in
    // the player's x±72 flight envelope. The maglev platforms remain clear.
    for (const side of [-1, 1]) {
      const deckEdge = width / 2;
      const pierX = side * 105;
      // The west maglev station extends to z≈-630. Move its second
      // bridge footing beyond the terminal and connect it at deck height.
      const pierZ = i === 1 && side < 0 ? z - 57 : z;
      const connectorWidth = 105 - deckEdge;
      const pierHeight = y + 4.9; // base -7, roof at the underside y-2.1
      add(
        structure,
        'upper-bridge-extension',
        side * (deckEdge + connectorWidth / 2),
        y,
        z,
        connectorWidth,
        4.2,
        depth,
      );
      add(structure, null, pierX, -7 + pierHeight / 2, pierZ, 5, pierHeight, depth * 0.48);
      add(
        structure,
        null,
        pierX,
        y - 3.25,
        (z + pierZ) / 2,
        6,
        3.2,
        Math.abs(pierZ - z) + depth * 0.7,
      );
      groundedSupports.push({
        x: pierX,
        z: pierZ,
        footY: -7,
        topY: y - 2.1,
        deckZ: z,
        outsideFlightLane: true,
      });
    }
    add(glazing, null, 0, y + 3.3, z + depth * 0.43, width * 0.91, 1.3, 0.45);
    add(glazing, null, 0, y + 3.3, z - depth * 0.43, width * 0.91, 1.3, 0.45);
    for (const side of [-1, 1]) {
      add(lights, null, side * (width / 2 - 1), y + 2.6, z + depth * 0.46, 0.85, 0.9, 0.35);
      add(lights, null, side * (width / 2 - 1), y + 2.6, z - depth * 0.46, 0.85, 0.9, 0.35);
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
  root.userData.groundedSupports = groundedSupports;
  return root;
}
