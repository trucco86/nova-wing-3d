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
  const shot = FIRST_STAGE_SHOTS.reduce((current, entry) => (t >= entry.at ? entry : current)).name;
  // All camera poses face THROUGH the same hangar gate. Avoid disorienting
  // frontal cuts and interpolate both camera position and look-at direction.
  const views = [
    { eye: [8 * squeeze, 12, 30], aim: [0, 6, -40], fov: 68 },
    { eye: [6 * squeeze, 12, 36], aim: [0, 7, -62], fov: 64 },
    { eye: [0, 12, 43], aim: [0, 7, -90], fov: 60 },
  ];
  const firstBlend = ease((t - 1.1) / 1.0);
  const secondBlend = ease((t - 4.1) / 2.4);
  const interpolate = (field, index) => {
    const first = views[0][field][index] + (views[1][field][index] - views[0][field][index]) * firstBlend;
    return first + (views[2][field][index] - first) * secondBlend;
  };
  const fovBlend = views[0].fov + (views[1].fov - views[0].fov) * firstBlend;
  return {
    t,
    shot,
    beat: t < 1.6 ? 'hangar' : t < 4.4 ? 'exit' : 'approach',
    doors,
    departure,
    handoff,
    // The bay retreats behind the real stationary fighter during takeoff.
    corridorShift: departure * 245,
    camera: {
      x: interpolate('eye', 0),
      y: interpolate('eye', 1),
      z: interpolate('eye', 2),
      aimX: interpolate('aim', 0),
      aimY: interpolate('aim', 1),
      aimZ: interpolate('aim', 2),
      fov: fovBlend + (views[2].fov - fovBlend) * secondBlend,
    },
  };
}

export function firstStageLaunchWingPose(slot, seconds, aspect = 16 / 9) {
  const s = firstStageLaunchAt(seconds, aspect);
  const wing = Math.abs(slot);
  const squeeze = Math.max(0.48, Math.min(1, Number.isFinite(aspect) ? aspect : 1));
  const release = s.handoff * s.handoff;
  return {
    x: slot * (8.2 + 2.1 * s.departure) * squeeze + Math.sign(slot) * release * 75 * squeeze,
    y: 6 + wing * 0.65 + s.departure * 2.4 * (1 - s.handoff) + release * wing * 7,
    z: 9 + wing * 5.5 - s.departure * wing * 3 - release * wing * 28,
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
  const cyan = new T.MeshBasicMaterial({ color: '#6bf5ff', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#ffae69', toneMapped: false });
  const materials = [metal, panel, cyan, amber];
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
  // The player faces negative Z, passing out through the outward doors.
  add('launch-deck', [42, 1.2, 130], [0, -6.85, -13], metal);
  for (const side of [-1, 1]) {
    add('bay-wall', [1.5, 20, 110], [side * 22, 4.5, -15], metal);
    add('bay-ceiling-rail', [2, 0.9, 117], [side * 16, 15.3, -15], panel);
    add('runway-cyan-guide', [0.4, 0.12, 111], [side * 8.6, -6.1, -13], cyan);
    add('runway-amber-guide', [0.3, 0.1, 104], [side * 18.2, -6.06, -13], amber);
    for (const z of [-44, -9, 26]) {
      add('bay-arch-side', [1.4, 20, 2], [side * 19, 4, z], panel);
      add('bay-arch-light', [0.55, 14, 2.1], [side * 17.9, 4, z], cyan);
    }
  }
  for (const z of [-44, -9, 26]) add('bay-arch-top', [39, 1.8, 2.5], [0, 14.2, z], metal);
  const leftDoor = add('launch-door-left', [9, 15.5, 1.8], [-4.5, 1.5, -50], panel);
  const rightDoor = add('launch-door-right', [9, 15.5, 1.8], [4.5, 1.5, -50], panel);
  add('launch-bay-beacon', [13, 0.4, 1], [0, 14, -50], amber);
  // Close the rear bulkhead and the roof; no open sky behind the fighters.
  // The camera stays INSIDE the bay and points toward the front gate.
  for (const side of [-1, 1]) {
    add('launch-roof-bay', [14, 0.75, 113], [side * 13.2, 16.3, -15], panel);
    add('launch-roof-strip', [0.6, 0.22, 106], [side * 8, 16.0, -15], cyan);
    add('launch-hangar-side-beacon', [1.9, 0.4, 1.3], [side * 18, 10, -46], amber);
    add('launch-door-sill-light', [0.7, 0.2, 5.5], [side * 13, -6, -48], cyan);
    for (const z of [-34, -15, 6, 24]) {
      add('launch-deck-chevron', [2.3, 0.08, 0.45], [side * 12.8, -6.14, z], cyan);
    }
  }
  add('launch-roof-center', [13.2, 0.8, 112], [0, 16.35, -15], metal);
  add('launch-rear-bulkhead', [42, 23.4, 2.2], [0, 4.7, 43], panel);
  add('launch-rear-rib', [41, 1.3, 2.5], [0, 14.5, 41.6], metal);
  for (const side of [-1, 1]) {
    add('launch-rear-navigation-light', [0.7, 10, 0.45], [side * 17, 5, 41.65], cyan);
  }
  add('launch-exit-threshold', [38, 0.32, 2.2], [0, -6.12, -49], amber);
  // The launch doors are framed by a separate external threshold, so the
  // side and frontal cuts make it obvious that the formation leaves a hangar.
  add('launch-exterior-gate-header', [39, 1.5, 2.1], [0, 15.5, -55], panel);
  for (const side of [-1, 1]) {
    add('launch-exterior-gate-pillar', [1.35, 22, 2.1], [side * 19, 4, -55], panel);
    add('launch-exterior-gate-beacon', [0.8, 12, 1.1], [side * 17.5, 3, -54.5], cyan);
    add('launch-exit-lane-marker', [1.25, 0.25, 4], [side * 12, -5.95, -55], amber);
  }
  root.visible = false;
  scene.add(root);
  let active = false;
  return {
    reset(enabled, pilotId = 'bia') {
      active = Boolean(enabled);
      root.visible = active;
      root.userData.pilotId = active ? pilotId : null;
      root.position.set(0, 0, 0);
      leftDoor.position.x = -4.5;
      rightDoor.position.x = 4.5;
    },
    update(seconds, aspect = 16 / 9) {
      if (!active) return firstStageLaunchAt(seconds, aspect);
      const frame = firstStageLaunchAt(seconds, aspect);
      leftDoor.position.x = -4.5 - frame.doors * 12.4;
      rightDoor.position.x = 4.5 + frame.doors * 12.4;
      root.position.z = frame.corridorShift;
      root.userData.shot = frame.shot;
      camera.position.set(frame.camera.x, frame.camera.y, frame.camera.z);
      camera.lookAt(frame.camera.aimX, frame.camera.aimY, frame.camera.aimZ);
      camera.fov = frame.camera.fov;
      camera.updateProjectionMatrix();
      return frame;
    },
    finish() {
      active = false;
      root.visible = false;
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
