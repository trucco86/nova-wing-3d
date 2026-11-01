import * as T from 'three';

// Additional physical mechanical depth comparable to the player models.
// Decoration NEVER changes boss collision boxes, weak points or muzzle origins.
const TYPES = Object.freeze([
  'carrier-hydraulics', 'stingray-fins', 'drill-service-gears',
  'devastador-gantries', 'phoenix-articulators', 'glacial-actuators',
  'hydra-cooling-sacs', 'dreadnought-turret-rails', 'orion-gimbals',
  'marvin-thruster-armatures',
]);

export function createBossPremiumSystems(index = 0, tint = '#69cfff') {
  const root = new T.Group();
  root.name = 'boss-premium-systems-' + TYPES[Math.max(0, Math.min(index, 9))];
  root.userData.visualOnly = true;
  const material = new T.MeshStandardMaterial({ color: '#526a84', metalness: 0.89, roughness: 0.29 });
  const inner = new T.MeshStandardMaterial({ color: '#172338', metalness: 0.78, roughness: 0.38 });
  const light = new T.MeshBasicMaterial({ color: tint, toneMapped: false });
  const box = new T.BoxGeometry(1, 1, 1);
  const drum = new T.CylinderGeometry(1, 1, 1, 12);
  const parts = [];
  function add(parent, name, geometry, mat, position, scale) {
    const m = new T.Mesh(geometry, mat);
    m.name = name;
    m.position.set(...position);
    m.scale.set(...scale);
    m.userData.visualOnly = true;
    parent.add(m);
    return m;
  }
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const deck = Math.floor(i / 2);
    const actuator = new T.Group();
    actuator.name = 'boss-articulated-service-arm-' + i;
    actuator.position.set(side * (27 + deck * 9), 8 + deck * 13, -9 - deck * 12);
    actuator.rotation.y = side * (0.18 + deck * 0.12);
    actuator.userData.visualOnly = true;
    add(actuator, 'actuator-armored-housing', box, material, [0, 0, 0], [10 + deck * 2, 7, 24]);
    add(actuator, 'actuator-dark-servo', drum, inner, [0, 1, 11], [5, 3.4, 5]);
    add(actuator, 'actuator-energy-rail', box, light, [0, 4.4, -1], [2.2, 0.9, 22]);
    for (const jointSide of [-1, 1]) {
      add(actuator, 'actuator-hydraulic-rod', box, material, [jointSide * 4, -5, 0], [1.1, 11, 3]);
      add(actuator, 'actuator-radiator-fin', box, inner, [jointSide * 6, 2, -8], [1.8, 8, 13]);
    }
    root.add(actuator);
    parts.push(actuator);
  }
  // Tiny machined panels are instanced: each boss gains actual surface depth
  // without 70 additional individual draw calls.
  const bolts = new T.InstancedMesh(box, material, 72);
  bolts.name = 'boss-premium-hull-fasteners';
  bolts.userData.visualOnly = true;
  const dummy = new T.Object3D();
  for (let i = 0; i < bolts.count; i++) {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 12);
    const lane = Math.floor((i % 12) / 2);
    dummy.position.set(side * (13 + lane * 6.8), -13 + row * 5.2, -31 + (row % 3) * 9);
    dummy.scale.set(1.3, 1.9, 1.4);
    dummy.updateMatrix();
    bolts.setMatrixAt(i, dummy.matrix);
  }
  bolts.instanceMatrix.needsUpdate = true;
  root.add(bolts);
  root.userData.actuators = parts;
  root.userData.materials = [material, inner, light];
  root.userData.geometries = [box, drum];
  return root;
}

export function animateBossPremiumSystems(root, time, phase = 1, state = 'maneuver') {
  if (!root || !Number.isFinite(time)) return;
  const energy = state === 'attack' ? 1 : state === 'windup' ? 0.6 : 0.18;
  const amplitude = (0.05 + energy * 0.27) * (1 + Math.max(0, phase - 1) * 0.12);
  root.userData.actuators.forEach((actuator, index) => {
    const side = index % 2 ? 1 : -1;
    actuator.rotation.y = side * (0.18 + Math.floor(index / 2) * 0.12) +
      Math.sin(time * (0.73 + index * 0.08) + index) * amplitude;
    actuator.rotation.z = Math.sin(time * 1.6 + index * 0.6) * amplitude * 0.75;
  });
  root.userData.lastAnimation = { time, phase, state };
}
