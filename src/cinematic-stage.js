import * as T from 'three';
import { CINEMATIC_FLEET, cinematicFormationPosition } from './cinematic-formation.js';
import { createFlyingRobot } from './visuals.js';
import { updateMechaPose } from './mecha-motion.js';
import {
  createShowroomPilot,
  createShowroomShip,
  disposeShowroomModel,
} from './showroom-models.js';

const POSITIONS = [
  [-5, -1.3, 0],
  [-2.4, -1.3, 0],
  [0, -1.3, 0],
  [2.4, -1.3, 0],
  [5, -1.3, 0],
];
const PILOTS = CINEMATIC_FLEET.map(({ id }) => id);
export const cinematicShot = (elapsed) =>
  elapsed < 4 ? 'arrival' : elapsed < 8 ? 'escape' : elapsed < 16 ? 'squad' : 'pursuit';

// An optional realtime background. Failure leaves the original captioned intro functional.
export function createCinematicStage(canvas) {
  if (!canvas) return null;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: false, alpha: true });
  } catch {
    return null;
  }
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, 1, 0.1, 150);
  camera.position.set(0, 2.5, 18);
  scene.add(new T.HemisphereLight('#86caff', '#1a1728', 2.6));
  const key = new T.DirectionalLight('#ffe0a0', 3);
  key.position.set(-5, 8, 12);
  scene.add(key);

  const sphere = new T.Mesh(
    new T.SphereGeometry(8, 24, 16),
    new T.MeshStandardMaterial({ color: '#16366a', emissive: '#071e4d', roughness: 0.9 }),
  );
  sphere.position.set(-8, -7, -35);
  scene.add(sphere);

  const pilots = PILOTS.map((id, index) => {
    const model = createShowroomPilot(id);
    model.position.set(...POSITIONS[index]);
    scene.add(model);
    return model;
  });
  const ships = CINEMATIC_FLEET.map(({ id, model: modelId, color }) => {
    const model = createShowroomShip(modelId, color);
    model.name = 'cinematic-ship-' + id;
    model.scale.setScalar(id === 'bia' ? 1.12 : 0.96);
    scene.add(model);
    return model;
  });
  // The actual in-game mecha asset replaces a generic opening placeholder.
  // Only shown briefly in pursuit; all five ships remain the normal formation.
  const mecha = createFlyingRobot();
  mecha.name = 'cinematic-heavy-mecha';
  mecha.visible = false;
  scene.add(mecha);
  const cargo = new T.Group();
  const crateMaterial = new T.MeshStandardMaterial({
    color: '#eac17a',
    metalness: 0.45,
    roughness: 0.38,
  });
  for (let i = 0; i < 3; i++) {
    const crate = new T.Mesh(new T.BoxGeometry(0.85, 0.85, 0.85), crateMaterial);
    crate.position.set((i - 1) * 1.2, -2.5, -1);
    cargo.add(crate);
  }
  scene.add(cargo);
  let disposed = false;
  function update(elapsed, width, height) {
    if (disposed) return;
    const w = Math.max(1, Math.min(1200, width || 800));
    const h = Math.max(1, Math.min(900, height || 600));
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const shot = cinematicShot(elapsed);
    pilots.forEach((pilot, index) => {
      pilot.visible = shot === 'squad';
      pilot.rotation.y = Math.sin(elapsed * 0.35 + index * 0.6) * 0.12;
    });
    const mechaShot = shot === 'pursuit' && elapsed >= 20 && elapsed < 24;
    ships.forEach((ship, index) => {
      const profile = CINEMATIC_FLEET[index];
      const pos = cinematicFormationPosition(profile.slot, elapsed, camera.aspect);
      ship.visible = shot !== 'squad' && !(mechaShot && profile.id === 'bia');
      ship.scale.setScalar(
        (profile.id === 'bia' ? 1.12 : 0.96) * (camera.aspect < 0.65 ? 0.76 : 1),
      );
      ship.position.set(pos.x, pos.y, pos.z);
      ship.rotation.set(0.12, Math.PI + Math.sin(elapsed * 0.2 + index) * 0.09, pos.bank);
      if (shot === 'escape')
        ship.position.x +=
          Math.min(5, Math.max(0, elapsed - 4)) * 0.6 * Math.max(0.43, Math.min(1, camera.aspect));
      if (shot === 'pursuit') ship.position.z -= (elapsed - 16) * 0.35;
    });
    mecha.visible = mechaShot;
    if (mechaShot) {
      const lead = cinematicFormationPosition(0, elapsed, camera.aspect);
      mecha.position.set(lead.x, lead.y - 0.9, lead.z - 1);
      updateMechaPose(mecha, {
        dt: 1 / 30,
        time: elapsed,
        boosting: true,
        firing: true,
        recoil: 0.22,
      });
      mecha.rotation.y = Math.PI;
    }
    cargo.visible = shot === 'arrival' || shot === 'escape';
    cargo.rotation.y = elapsed * 0.2;
    sphere.rotation.y = elapsed * 0.012;
    camera.position.z = shot === 'pursuit' ? 18 + Math.min(8, (elapsed - 16) * 0.4) : 18;
    camera.lookAt(0, -0.4, -4);
    renderer.render(scene, camera);
  }
  return {
    update,
    destroy() {
      if (disposed) return;
      disposed = true;
      for (const model of [...pilots, ...ships, mecha]) disposeShowroomModel(model);
      sphere.geometry.dispose();
      sphere.material.dispose();
      cargo.children.forEach((mesh) => mesh.geometry.dispose());
      crateMaterial.dispose();
      renderer.dispose();
    },
  };
}
