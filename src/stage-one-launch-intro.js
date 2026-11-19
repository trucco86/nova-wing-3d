import * as T from 'three';

// Inspired by the dramatic hangar-to-flight rhythm of early rail shooters.
// Original Nova Wing hangar, geometry, colors and Five Cats formation.
export const FIRST_STAGE_LAUNCH_SECONDS = 5;

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const ease = (n) => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

export function firstStageLaunchAt(seconds, aspect = 16 / 9) {
  const t = Math.min(
    FIRST_STAGE_LAUNCH_SECONDS,
    Math.max(0, Number.isFinite(seconds) ? seconds : 0),
  );
  const doors = ease(t / 1.05);
  const departure = ease((t - 1.05) / 3.15);
  const handoff = ease((t - 3.8) / 1.2);
  const portrait = Math.max(0.46, Math.min(1, Number.isFinite(aspect) ? aspect : 1));
  const cameraX = (1 - handoff) * 9.6 * (1 - departure * 0.82);
  return {
    t,
    beat: t < 1.05 ? 'doors' : t < 2.25 ? 'ignition' : t < 3.8 ? 'departure' : 'handoff',
    doors,
    departure,
    handoff,
    corridorShift: departure * 245,
    camera: {
      x: cameraX * portrait,
      y: 12 - (1 - departure) * 1.6,
      z: 43 + (1 - departure) * 8,
      aimX: 0,
      aimY: 7,
      aimZ: -94 + (1 - departure) * 52,
    },
  };
}

/** The lead ship settles exactly on the gameplay ship before the handoff. */
export function firstStageLaunchWingPose(slot, seconds, aspect = 16 / 9) {
  const s = firstStageLaunchAt(seconds, aspect);
  const wing = Math.abs(slot);
  const squeeze = Math.max(0.48, Math.min(1, Number.isFinite(aspect) ? aspect : 1));
  const separation = 5.2 + 3 * s.departure;
  const release = s.handoff * s.handoff;
  return {
    x: slot * separation * squeeze + Math.sign(slot) * release * 65 * squeeze,
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
  root.visible = false;
  scene.add(root);
  let active = false;
  return {
    reset(enabled) {
      active = Boolean(enabled);
      root.visible = active;
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
      // Chase camera converges on the real playable rig at the end.
      camera.position.set(frame.camera.x, frame.camera.y, frame.camera.z);
      camera.lookAt(frame.camera.aimX, frame.camera.aimY, frame.camera.aimZ);
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
