import * as T from 'three';
import { SQUAD_PILOTS } from './five-cats-squad.js';

// Three continuous views: hangar, crossing front gate and flying toward mission.
// No pilot close-ups, reverse angles or second protagonist.
export const FIRST_STAGE_LAUNCH_SECONDS = 6.5;
export const FIRST_STAGE_SHOTS = Object.freeze([
  { at: 0, name: 'hangar' },
  { at: 1.6, name: 'exit' },
  { at: 4.4, name: 'approach' },
]);
const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ease = (n) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

// The selected pilot ALWAYS occupies the center. Only the other four get
// wingman meshes; no second hero ship is ever constructed for the launch.
export function firstStageWingSlots(activePilot = 'bia') {
  const slots = [-2, -1, 1, 2];
  return SQUAD_PILOTS.filter(({ id }) => id !== activePilot).map((pilot, index) => ({
    ...pilot,
    slot: slots[index],
  }));
}

export function firstStageLaunchAt(seconds, aspect = 16 / 9) {
  const t = Math.min(
    FIRST_STAGE_LAUNCH_SECONDS,
    Math.max(0, Number.isFinite(seconds) ? seconds : 0),
  );
  const doors = ease(t / 1.6);
  const departure = ease((t - 1.6) / 2.8);
  const handoff = ease((t - 4.4) / 2.1);
  const squeeze = Math.max(0.46, Math.min(1, Number.isFinite(aspect) ? aspect : 1));
  const portrait = squeeze < 0.75;
  const portraitCameraOffset = portrait ? 9 : 0;
  const shot = FIRST_STAGE_SHOTS.reduce((current, entry) => (t >= entry.at ? entry : current)).name;
  // All camera poses face THROUGH the same hangar gate. Avoid disorienting
  // frontal cuts and interpolate both camera position and look-at direction.
  const views = [
    // Wider stage establishment: the fully enclosed hangar is visible as a
    // long tunnel instead of reading as a flat wall behind the wingmates.
    {
      eye: [portrait ? 0 : 4.8 * squeeze, 7.4, 31 + portraitCameraOffset],
      aim: [0, 5.6, -43],
      fov: 74,
    },
    // Zoom/dolly-in through the open gate, still looking forward, not a cut.
    {
      eye: [portrait ? 0 : 2.6 * squeeze, 8.2, 35 + portraitCameraOffset],
      aim: [0, 5.8, -67],
      fov: 62,
    },
    // Exact approved chase camera: preserve the original gameplay handoff.
    { eye: [0, 12, 43], aim: [0, 7, -90], fov: 60 },
  ];
  const firstBlend = ease((t - 1.1) / 1.65);
  const secondBlend = ease((t - 4.1) / 2.4);
  const interpolate = (field, index) => {
    const first =
      views[0][field][index] + (views[1][field][index] - views[0][field][index]) * firstBlend;
    return first + (views[2][field][index] - first) * secondBlend;
  };
  const fovBlend = views[0].fov + (views[1].fov - views[0].fov) * firstBlend;
  // Optical push at the fastest part of launch. This is a FOV/dolly effect,
  // not a new camera cut or a costly post-processing pass.
  const zoom = Math.sin(Math.PI * ease((t - 1.1) / 5.4));
  const engineVibration = departure * (1 - handoff);
  return {
    t,
    shot,
    beat: t < 1.6 ? 'hangar' : t < 4.4 ? 'exit' : 'approach',
    doors,
    departure,
    handoff,
    // The bay retreats behind the real stationary fighter during takeoff.
    corridorShift: departure * 190,
    camera: {
      x: interpolate('eye', 0),
      y: interpolate('eye', 1) + Math.sin(t * 14) * 0.08 * engineVibration,
      z: interpolate('eye', 2) - 2.8 * zoom,
      aimX: interpolate('aim', 0),
      aimY: interpolate('aim', 1),
      aimZ: interpolate('aim', 2),
      fov: fovBlend + (views[2].fov - fovBlend) * secondBlend - 6 * zoom,
      roll: engineVibration > 1e-8 ? Math.sin(t * 4.5) * 0.009 * engineVibration : 0,
    },
  };
}

export function firstStageLaunchWingPose(slot, seconds, aspect = 16 / 9) {
  const s = firstStageLaunchAt(seconds, aspect);
  const wing = Math.abs(slot);
  const validAspect = Number.isFinite(aspect) ? aspect : 1;
  const squeeze = validAspect < 0.75 ? Math.max(0.32, validAspect * 0.8) : Math.min(1, validAspect);
  const release = s.handoff * s.handoff;
  return {
    x: slot * (6.2 + 1.1 * s.departure) * squeeze + Math.sign(slot) * release * 28 * squeeze,
    y: 6 + wing * 0.65 + s.departure * 2.4 * (1 - s.handoff) + release * wing * 7,
    z: 9 + wing * 2.4 - s.departure * wing * 2 - release * wing * 50,
    bank: -slot * (0.02 + 0.13 * s.departure + 0.35 * release),
  };
}

/**
 * Lightweight, visual-only launch bay. It scrolls behind the Five Cats and
 * is hidden after takeoff, leaving the real city, flight controls and collision
 * system unchanged. No new render loop or GPU resources per frame.
 */
export function createFirstStageLaunchIntro(scene, camera) {
  const root = new T.Group();
  root.name = 'first-stage-launch-bay';
  root.userData.visualOnly = true;
  const metal = new T.MeshStandardMaterial({
    color: '#182c39',
    metalness: 0.8,
    roughness: 0.38,
  });
  const panel = new T.MeshStandardMaterial({
    color: '#314d60',
    metalness: 0.72,
    roughness: 0.32,
  });
  const ceiling = new T.MeshBasicMaterial({ color: '#243d50' });
  const cyan = new T.MeshBasicMaterial({ color: '#6bf5ff', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#ffae69', toneMapped: false });
  const glass = new T.MeshBasicMaterial({
    color: '#4ebad2',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const beamGlow = new T.MeshBasicMaterial({
    color: '#6bf5ff',
    transparent: true,
    opacity: 0.065,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const pulseAmber = new T.MeshBasicMaterial({
    color: '#ff9f5b',
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  });
  const exteriorCyan = new T.MeshBasicMaterial({
    color: '#89eaff',
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  });
  const exteriorAmber = new T.MeshBasicMaterial({
    color: '#ffd290',
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    toneMapped: false,
  });
  const materials = [
    metal,
    panel,
    ceiling,
    cyan,
    amber,
    glass,
    beamGlow,
    pulseAmber,
    exteriorCyan,
    exteriorAmber,
  ];
  const meshes = [];
  const add = (name, size, at, material = metal) => {
    const mesh = new T.Mesh(new T.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...at);
    mesh.userData.visualOnly = true;
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  };
  // One draw call per repeating fixture family; no new meshes or allocations
  // in the per-frame animation. This preserves headroom on portrait phones.
  const matrix = new T.Matrix4();
  const position = new T.Vector3();
  const scale = new T.Vector3();
  const quaternion = new T.Quaternion();
  function repeat(name, size, placements, material = metal) {
    const mesh = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), material, placements.length);
    mesh.name = name;
    mesh.userData.visualOnly = true;
    placements.forEach(([x, y, z], i) => {
      position.set(x, y, z);
      scale.set(...size);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
    meshes.push(mesh);
    return mesh;
  }
  // The player faces negative Z, passing out through the outward doors.
  add('launch-deck', [42, 1.2, 130], [0, -6.85, -13], metal);
  for (const side of [-1, 1]) {
    add('bay-wall', [1.5, 27, 110], [side * 22, 7.6, -15], metal);
    add('bay-ceiling-rail', [2, 0.9, 117], [side * 16, 15.3, -15], panel);
    add('runway-cyan-guide', [0.4, 0.12, 111], [side * 8.6, -6.1, -13], cyan);
    add('runway-amber-guide', [0.3, 0.1, 104], [side * 18.2, -6.06, -13], amber);
    for (const z of [-44, -9, 26]) {
      add('bay-arch-side', [1.4, 26, 2], [side * 19, 7, z], panel);
      add('bay-arch-light', [0.55, 14, 2.1], [side * 17.9, 4, z], cyan);
    }
  }
  for (const z of [-44, -9, 26]) add('bay-arch-top', [39, 1.8, 2.5], [0, 19.2, z], metal);
  const leftDoor = add('launch-door-left', [18, 21, 1.8], [-9, 4.2, -50], panel);
  const rightDoor = add('launch-door-right', [18, 21, 1.8], [9, 4.2, -50], panel);
  add('launch-bay-beacon', [13, 0.4, 1], [0, 17.1, -50], amber);
  add('launch-front-gate-lintel', [36, 0.6, 0.8], [0, 15.8, -49], cyan);
  for (const side of [-1, 1])
    add('launch-front-gate-guide', [0.6, 21, 0.8], [side * 18.1, 4.2, -49], cyan);
  // Close the rear bulkhead and the roof; no open sky behind the fighters.
  // The camera stays INSIDE the bay and points toward the front gate.
  for (const side of [-1, 1]) {
    add('launch-roof-bay', [14, 0.75, 113], [side * 13.2, 20.15, -15], ceiling);
    add('launch-roof-strip', [0.6, 0.22, 106], [side * 8, 19.75, -15], cyan);
    add('launch-hangar-side-beacon', [1.9, 0.4, 1.3], [side * 18, 10, -46], amber);
    add('launch-door-sill-light', [0.7, 0.2, 5.5], [side * 13, -6, -48], cyan);
    for (const z of [-34, -15, 6, 24]) {
      add('launch-deck-chevron', [2.3, 0.08, 0.45], [side * 12.8, -6.14, z], cyan);
    }
  }
  add('launch-roof-center', [13.2, 0.8, 112], [0, 20.2, -15], ceiling);
  add('launch-rear-bulkhead', [42, 30, 2.2], [0, 8.1, 43], panel);
  add('launch-rear-rib', [41, 1.3, 2.5], [0, 19.5, 41.6], metal);
  for (const side of [-1, 1]) {
    add('launch-rear-navigation-light', [0.7, 10, 0.45], [side * 17, 5, 41.65], cyan);
  }
  // Repeating architectural rhythm: high gantries, upper observation galleries,
  // side columns and floor slabs create a long, enclosed perspective.
  const ribs = [-44, -32, -20, -8, 4, 16, 28, 39];
  repeat(
    'launch-ceiling-crossbeams',
    [39, 0.85, 1.35],
    ribs.map((z) => [0, 19.1, z]),
    panel,
  );
  repeat(
    'launch-ceiling-light-grid',
    [18, 0.16, 0.62],
    ribs.map((z) => [0, 18.55, z - 1]),
    cyan,
  );
  repeat(
    'launch-side-gantry-walkways',
    [4.2, 0.58, 91],
    [
      [-18.8, 5.7, -8],
      [18.8, 5.7, -8],
    ],
    panel,
  );
  repeat(
    'launch-side-gantry-rail',
    [0.21, 2.2, 91],
    [
      [-17.4, 7.2, -8],
      [17.4, 7.2, -8],
    ],
    amber,
  );
  repeat(
    'launch-side-deck-glass',
    [0.12, 4.1, 78],
    [
      [-20.88, 6.2, -10],
      [20.88, 6.2, -10],
    ],
    glass,
  );
  repeat(
    'launch-side-observation-columns',
    [1.6, 9.5, 1.25],
    ribs.flatMap((z) => [
      [-20.5, 6.8, z],
      [20.5, 6.8, z],
    ]),
    panel,
  );
  repeat(
    'launch-observation-led-stripes',
    [0.34, 5.8, 0.5],
    ribs.flatMap((z) => [
      [-20.13, 6.4, z + 1],
      [20.13, 6.4, z + 1],
    ]),
    cyan,
  );
  repeat(
    'launch-floor-depth-seams',
    [39, 0.045, 0.2],
    [...ribs, ...ribs.map((z) => z - 5.5)].map((z) => [0, -6.21, z]),
    panel,
  );
  repeat(
    'launch-gate-approach-markers',
    [4.5, 0.08, 0.28],
    [-42, -38, -34, -30, -26, -22, -18, -14, -10, -6, -2, 2].flatMap((z) => [
      [-11, -6.08, z],
      [11, -6.08, z],
    ]),
    amber,
  );
  repeat(
    'launch-ignition-beacons',
    [1.2, 0.46, 0.7],
    ribs.flatMap((z) => [
      [-18.4, 13.8, z],
      [18.4, 13.8, z],
    ]),
    pulseAmber,
  );
  // Fake soft volumetric spill using three translucent geometry cones.
  // No expensive shadow-casting spotlights or realtime post-processing.
  const shafts = new T.InstancedMesh(new T.ConeGeometry(3.2, 16, 8, 1, true), beamGlow, 3);
  shafts.name = 'launch-roof-volumetric-light-shafts';
  shafts.userData.visualOnly = true;
  [-32, -5, 21].forEach((z, i) => {
    matrix.compose(position.set(i === 1 ? -4 : 4, 8, z), quaternion, scale.set(1, 1, 1));
    shafts.setMatrixAt(i, matrix);
  });
  shafts.instanceMatrix.needsUpdate = true;
  shafts.computeBoundingSphere();
  root.add(shafts);
  meshes.push(shafts);
  // Decorative details never enter the direct flight corridor.
  add('launch-exit-threshold', [38, 0.32, 2.2], [0, -6.12, -49], amber);
  // The launch doors are framed by a separate external threshold, so the
  // side and frontal cuts make it obvious that the formation leaves a hangar.
  add('launch-exterior-gate-header', [39, 1.5, 2.1], [0, 15.5, -55], panel);
  for (const side of [-1, 1]) {
    add('launch-exterior-gate-pillar', [1.35, 22, 2.1], [side * 19, 4, -55], panel);
    add('launch-exterior-gate-beacon', [0.8, 12, 1.1], [side * 17.5, 3, -54.5], cyan);
    add('launch-exit-lane-marker', [1.25, 0.25, 4], [side * 12, -5.95, -55], amber);
  }
  // Outside the gate, moving light references continue the launch trajectory.
  // Without these markers the ship appears to stop once the hangar retreats.
  // They are visual only, far from the player lane, and fade before gameplay.
  repeat(
    'launch-exterior-flight-lights',
    [1.1, 0.14, 3.6],
    [-82, -111, -140, -169, -198, -227, -256, -285].flatMap((z) => [
      [-16, -5.45, z],
      [16, -5.45, z],
    ]),
    exteriorCyan,
  );
  repeat(
    'launch-exterior-approach-beacons',
    [0.75, 4.5, 0.85],
    [-84, -131, -178, -225, -272].flatMap((z) => [
      [-27, 3.4, z],
      [27, 3.4, z],
    ]),
    exteriorAmber,
  );
  root.visible = false;
  scene.add(root);
  let active = false;
  return {
    reset(enabled, pilotId = 'bia') {
      active = Boolean(enabled);
      root.visible = active;
      root.userData.pilotId = active ? pilotId : null;
      root.position.set(0, 0, 0);
      leftDoor.position.x = -9;
      rightDoor.position.x = 9;
      exteriorCyan.opacity = 0.9;
      exteriorAmber.opacity = 0.78;
    },
    update(seconds, aspect = 16 / 9) {
      if (!active) return firstStageLaunchAt(seconds, aspect);
      const frame = firstStageLaunchAt(seconds, aspect);
      leftDoor.position.x = -9 - frame.doors * 20.5;
      rightDoor.position.x = 9 + frame.doors * 20.5;
      root.position.z = frame.corridorShift;
      root.userData.shot = frame.shot;
      pulseAmber.opacity = 0.72 + 0.22 * Math.sin(frame.t * 9);
      beamGlow.opacity = 0.05 + 0.025 * frame.departure;
      exteriorCyan.opacity = 0.9 * (1 - frame.handoff);
      exteriorAmber.opacity = 0.78 * (1 - frame.handoff);
      camera.position.set(frame.camera.x, frame.camera.y, frame.camera.z);
      camera.lookAt(frame.camera.aimX, frame.camera.aimY, frame.camera.aimZ);
      camera.rotateZ(frame.camera.roll);
      if (Math.abs(camera.fov - frame.camera.fov) > 0.015) {
        camera.fov = frame.camera.fov;
        camera.updateProjectionMatrix();
      }
      return frame;
    },
    finish() {
      active = false;
      root.visible = false;
      // Skipping during the optical push must not leave gameplay permanently
      // zoomed-in or slightly banked.
      camera.rotation.z = 0;
      if (Math.abs(camera.fov - 60) > 0.001) {
        camera.fov = 60;
        camera.updateProjectionMatrix();
      }
    },
    destroy() {
      scene.remove(root);
      for (const mesh of meshes) mesh.geometry.dispose();
      for (const material of materials) material.dispose();
    },
    get active() {
      return active;
    },
    get root() {
      return root;
    },
  };
}
