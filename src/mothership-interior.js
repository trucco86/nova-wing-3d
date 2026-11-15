import * as T from 'three';
import { BOARDING, mothershipApproachAt } from './mothership-approach.js';

// Sector 4: an actual carrier interior, not generic luminous rings.
// All structures are decorative; the flight corridor, aiming, reactor-grid
// mission, collision geometry and camera controls remain unchanged.
const WINDOW_START = 17;
const TRAVEL_SPEED = 34;
const SPAN = 1080;
const SECTION_COUNT = 6;
const BASE_Z = -165;
const STEP_Z = 180;

function material(color, emissive = false) {
  return emissive
    ? new T.MeshBasicMaterial({ color, toneMapped: false })
    : new T.MeshStandardMaterial({ color, metalness: 0.78, roughness: 0.36 });
}
function block(parent, name, geo, mat, x, y, z, w, h, d) {
  const object = new T.Mesh(geo, mat);
  object.name = name;
  object.position.set(x, y, z);
  object.scale.set(w, h, d);
  object.castShadow = false;
  object.receiveShadow = false;
  parent.add(object);
  return object;
}
// Static GPU instancing for existing carrier architecture. No new colliders,
// frame allocations or CPU animation loops.
function batchParts(parent, name, geometry, finish, definitions) {
  const mesh = new T.InstancedMesh(geometry, finish, definitions.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  const dummy = new T.Object3D();
  for (let i = 0; i < definitions.length; i++) {
    const { position, scale, rotation = [0, 0, 0], color = null } = definitions[i];
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.rotation.set(...rotation);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (color) mesh.setColorAt(i, new T.Color(color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}
export function carrierInteriorState(elapsed) {
  const time = Math.max(0, Number.isFinite(elapsed) ? elapsed - WINDOW_START : 0);
  return {
    visible: elapsed >= WINDOW_START,
    time,
    zone: time < 18 ? 'hangar' : time < 43 ? 'industrial' : 'reactor',
    offset: time * TRAVEL_SPEED,
  };
}
export function createMothershipInterior() {
  const root = new T.Group();
  root.name = 'marvin-mothership-interior';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.sector = 3;
  const hull = material('#34475b');
  const armor = material('#677a91');
  const plating = material('#151f33');
  const hazard = material('#fa755c', true);
  const cyan = material('#73e8ff', true);
  const warm = material('#e4b572', true);
  const hangarGlass = new T.MeshStandardMaterial({
    color: '#87b4bd',
    metalness: 0.46,
    roughness: 0.31,
    emissive: '#2b5261',
    emissiveIntensity: 0.14,
  });
  const driveMetal = new T.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 0.78,
    roughness: 0.34,
    emissive: '#283c4b',
    emissiveIntensity: 0.08,
  });
  const driveCoil = new T.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 0.62,
    roughness: 0.3,
    emissive: '#6d4138',
    emissiveIntensity: 0.16,
  });
  const coilGeometry = new T.CylinderGeometry(16, 16, 1.2, 24, 1, true);
  const cube = new T.BoxGeometry(1, 1, 1);
  const sections = [];
  const animatedMachines = [];
  const corridorKinds = [
    'hangar-landing',
    'maintenance-bays',
    'rail-foundry',
    'armory-forge',
    'reactor-cooling',
    'drive-core',
  ];
  for (let i = 0; i < SECTION_COUNT; i++) {
    const section = new T.Group();
    section.name = 'carrier-interior-module-' + i;
    section.userData.baseZ = BASE_Z - i * STEP_Z;
    for (const side of [-1, 1]) {
      // Vast walls, tall ribs and separate observation decks define scale.
      block(section, 'carrier-side-hull', cube, hull, side * 81, 13, 0, 11, 95, 174);
      block(section, 'carrier-side-bulkhead', cube, armor, side * 73, 20, -60, 4, 83, 9);
      block(section, 'carrier-service-balcony', cube, plating, side * 63, -10, 0, 29, 5, 150);
      block(section, 'carrier-ceiling-rail', cube, cyan, side * 58, 64, -5, 1.1, 1.2, 150);
      block(section, 'carrier-deck-runway', cube, warm, side * 42, -21, 0, 1.4, 1.3, 150);
      // Visible ships in maintenance bays: not duplicates of enemy fighters.
      for (let j = 0; j < 3; j++) {
        const z = -56 + j * 53;
        block(section, 'carrier-docking-crane', cube, armor, side * 63, 38, z, 3, 48, 5);
        block(section, 'carrier-docking-arm', cube, plating, side * 51, 43, z, 20, 4, 5);
        block(
          section,
          'carrier-docking-beacon',
          cube,
          j % 2 ? hazard : cyan,
          side * 60,
          53,
          z,
          2,
          5,
          1.3,
        );
      }
      // Four neon quads become real recessed glazing and physically attached
      // mullions in just two instanced batches per wall.
      const frames = [];
      const windows = [];
      for (let j = 0; j < 4; j++) {
        const y = 20 + j * 10;
        frames.push({ position: [side * 70.8, y, -42], scale: [2.6, 6.2, 18.6] });
        windows.push({ position: [side * 69.4, y, -42], scale: [0.9, 4.3, 15.9] });
      }
      batchParts(section, 'carrier-hangar-window-armored-frame', cube, plating, frames);
      batchParts(section, 'carrier-hangar-window', cube, hangarGlass, windows);
    }
    block(section, 'carrier-ceiling-armored-spine', cube, plating, 0, 73, 0, 160, 13, 160);
    block(section, 'carrier-floor-armored-grid', cube, hull, 0, -32, 0, 156, 9, 160);
    for (let lane = -2; lane <= 2; lane++) {
      block(
        section,
        'carrier-hangar-runway-lights',
        cube,
        lane % 2 ? cyan : warm,
        lane * 23,
        -26,
        -56,
        2,
        1,
        114,
      );
    }
    // A distinct reactor and exposed machinery at the far end, never across
    // the center aiming line or the navigable floor.
    if (i >= 3) {
      for (const side of [-1, 1]) {
        const core = new T.Mesh(new T.CylinderGeometry(8, 9, 40, 14), hazard);
        core.name = 'carrier-reactor-coolant-core';
        core.position.set(side * 68, 10, -30);
        section.add(core);
        block(section, 'carrier-reactor-shield-frame', cube, armor, side * 68, 10, -55, 23, 51, 4);
      }
    }
    // Distinct room architecture every 180 units. The aiming corridor stays
    // open: equipment is recessed into the side bays or high overhead.
    section.userData.kind = corridorKinds[i];
    const industrial = i >= 2 && i <= 3;
    const driveRoom = i >= 4;
    if (i <= 1) {
      for (const side of [-1, 1]) {
        // Docked alien shuttles under gantry cranes, visible beyond rails.
        block(
          section,
          'carrier-maintenance-shuttle-hull',
          cube,
          armor,
          side * 59,
          1,
          -14,
          17,
          9,
          37,
        );
        block(section, 'carrier-shuttle-cockpit', cube, plating, side * 59, 5, -33, 10, 6, 11);
        for (let rail = 0; rail < 3; rail++)
          block(
            section,
            'carrier-hangar-service-stripe',
            cube,
            rail === 1 ? hazard : cyan,
            side * (52 + rail * 3.2),
            -22,
            -9,
            1.25,
            0.8,
            43,
          );
        const clamp = block(
          section,
          'carrier-mobile-docking-clamp',
          cube,
          armor,
          side * 52,
          43,
          -18,
          13,
          22,
          5,
        );
        animatedMachines.push({ mesh: clamp, axis: 'y', base: 43, amplitude: 6, phase: side + i });
      }
    }
    if (industrial) {
      for (const side of [-1, 1]) {
        // A foundry/armory: heavy pistons above enclosed maintenance shafts.
        for (let pipe = 0; pipe < 3; pipe++) {
          const z = -56 + pipe * 53;
          const piston = block(
            section,
            'carrier-foundry-press-' + pipe,
            cube,
            pipe % 2 ? armor : plating,
            side * 52,
            41,
            z,
            11,
            34,
            10,
          );
          animatedMachines.push({
            mesh: piston,
            axis: 'y',
            base: 41,
            amplitude: 10,
            phase: pipe * 1.2 + side,
          });
          block(
            section,
            'carrier-hot-forge-conduit',
            cube,
            pipe % 2 ? hazard : warm,
            side * 52,
            63,
            z,
            2,
            3,
            30,
          );
        }
        block(section, 'carrier-conveyor-channel', cube, plating, side * 58, -25, -7, 34, 5, 142);
        block(section, 'carrier-red-moving-rail', cube, hazard, side * 60, -20, -7, 4, 1.3, 138);
      }
      // Overhead gantry traverses without hiding the flight center.
      block(section, 'carrier-industrial-overhead-truss', cube, armor, 0, 55, -13, 142, 7, 12);
    }
    if (driveRoom) {
      for (const side of [-1, 1]) {
        const engine = new T.Group();
        engine.name =
          i === SECTION_COUNT - 1
            ? 'devastador-main-drive-engine'
            : 'devastador-reactor-coolant-pump';
        engine.position.set(side * 54, 9, -46);
        engine.userData.visualOnly = true;
        const drum = new T.Mesh(new T.CylinderGeometry(19, 21, 36, 18), hull);
        drum.rotation.x = Math.PI / 2;
        engine.add(drum);
        batchParts(
          engine,
          'devastador-drive-coil-arrays',
          coilGeometry,
          driveCoil,
          Array.from({ length: 4 }, (_, ring) => ({
            position: [0, 0, 10 - ring * 8],
            rotation: [Math.PI / 2, 0, 0],
            scale: [1, 1, 1],
            color: ring === 3 ? '#c7786b' : '#8aaebb',
          })),
        );
        const turbine = new T.Group();
        turbine.name = 'carrier-destroyable-drive-fan-visual';
        turbine.position.z = 19;
        batchParts(
          turbine,
          'carrier-drive-fan-blade',
          cube,
          driveMetal,
          Array.from({ length: 5 }, (_, blade) => {
            const angle = (blade * Math.PI * 2) / 5;
            return {
              position: [Math.cos(angle) * 7, Math.sin(angle) * 7, 0],
              rotation: [0, 0, angle],
              scale: [4, 13, 2],
              color: blade % 2 ? '#40536a' : '#a4b3c1',
            };
          }),
        );
        engine.add(turbine);
        animatedMachines.push({
          mesh: turbine,
          axis: 'rotationZ',
          phase: side + i,
          base: 0,
          amplitude: side * 1.3,
        });
        section.add(engine);
        block(
          section,
          'carrier-engine-exhaust-spine',
          cube,
          plating,
          side * 54,
          38,
          -45,
          23,
          17,
          65,
        );
      }
      block(
        section,
        i === 5 ? 'devastador-drive-core-upper-gantry' : 'carrier-reactor-overhead',
        cube,
        armor,
        0,
        61,
        0,
        132,
        12,
        30,
      );
    }
    // High-density machine detail using instancing, not hundreds of draw calls.
    // Recessed wall panels and luminous bus lines keep the flight lane clear.
    const machineMatrix = new T.Object3D();
    for (const [label, itemMaterial, count, width] of [
      ['circuit-boards', plating, 42, 4.8],
      ['power-traces', cyan, 42, 0.65],
      ['heat-exchangers', armor, 24, 3.2],
    ]) {
      const panels = new T.InstancedMesh(cube, itemMaterial, count);
      panels.name = 'devastador-' + corridorKinds[i] + '-' + label;
      panels.userData.visualOnly = true;
      panels.frustumCulled = false;
      for (let k = 0; k < count; k++) {
        const side = k % 2 ? 1 : -1;
        const depth = -70 + (Math.floor(k / 2) % 21) * 7;
        const height = label === 'heat-exchangers' ? 30 + (k % 4) * 7 : 2 + (k % 7) * 7;
        const offset = label === 'power-traces' ? 1.3 : label === 'heat-exchangers' ? -2.1 : 0;
        machineMatrix.position.set(side * (71.5 + offset), height, depth);
        machineMatrix.scale.set(
          label === 'power-traces' ? 0.55 : width,
          label === 'power-traces' ? 6.3 : label === 'heat-exchangers' ? 9 : 6.1,
          label === 'heat-exchangers' ? 7 : 4.3,
        );
        machineMatrix.rotation.set(0, 0, 0);
        machineMatrix.updateMatrix();
        panels.setMatrixAt(k, machineMatrix.matrix);
      }
      panels.instanceMatrix.needsUpdate = true;
      section.add(panels);
    }
    for (const side of [-1, 1]) {
      const trunk = new T.Mesh(new T.CylinderGeometry(2.3, 2.3, 146, 10), plating);
      trunk.name = 'devastador-hydraulic-coolant-pipeline';
      trunk.rotation.x = Math.PI / 2;
      trunk.position.set(side * 66, 51, -4);
      section.add(trunk);
      for (let j = 0; j < 4; j++) {
        const coupler = new T.Mesh(new T.CylinderGeometry(3.6, 3.6, 3.8, 12), armor);
        coupler.name = 'devastador-conduit-servo-coupler';
        coupler.rotation.x = Math.PI / 2;
        coupler.position.set(side * 66, 51, -56 + j * 36);
        section.add(coupler);
        block(
          section,
          'devastador-engine-diagnostic-screen',
          cube,
          i >= 4 ? hazard : cyan,
          side * 68,
          33,
          -62 + j * 33,
          2,
          7,
          11,
        );
      }
    }
    section.position.z = section.userData.baseZ;
    sections.push(section);
    root.add(section);
  }
  // Entrance silhouette remains distant during orbital approach.
  const threshold = new T.Group();
  threshold.name = 'carrier-boarding-gate';
  for (const side of [-1, 1]) {
    block(threshold, 'carrier-gate-pillar', cube, armor, side * 67, 14, 0, 10, 96, 13);
    block(threshold, 'carrier-gate-edge', cube, hazard, side * 60, 11, 3, 2, 60, 3);
  }
  block(threshold, 'carrier-gate-top', cube, plating, 0, 62, 0, 136, 12, 14);
  threshold.position.z = -240;
  root.add(threshold);
  root.userData.sections = sections;
  root.userData.corridorKinds = corridorKinds;
  root.userData.animatedMachines = animatedMachines;
  root.userData.threshold = threshold;
  root.visible = false;
  return root;
}

export function updateMothershipInterior(root, elapsed) {
  if (!root) return null;
  const s = carrierInteriorState(elapsed);
  root.visible = s.visible;
  root.userData.zone = s.zone;
  root.userData.time = s.time;
  if (!s.visible) return s;
  for (const section of root.userData.sections) {
    const distance = section.userData.baseZ + s.offset;
    // Deterministic recycled modules: there is never a missing wall when the
    // pilot moves through the 3D interior at a variable frame rate.
    section.position.z = ((((distance - 85) % SPAN) + SPAN) % SPAN) - (SPAN - 85);
  }
  for (const item of root.userData.animatedMachines) {
    if (item.axis === 'rotationZ') item.mesh.rotation.z = item.base + s.time * item.amplitude;
    else if (item.axis === 'y')
      item.mesh.position.y = item.base + Math.sin(s.time * 1.35 + item.phase) * item.amplitude;
  }
  // Interior gate is at a stable depth directly beyond the same hangar
  // entrance seen from orbit; it does not jump to a different corridor.
  const exterior = mothershipApproachAt(elapsed);
  root.userData.threshold.position.z = exterior.frontZ - 48;
  root.userData.threshold.visible = elapsed < BOARDING.clear + 3;
  return s;
}
