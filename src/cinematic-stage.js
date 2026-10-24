import * as T from 'three';
import { createShowroomPilot, createShowroomShip, disposeShowroomModel } from './showroom-models.js';

const POSITIONS = [
  [-5, -1.3, 0],
  [-2.4, -1.3, 0],
  [0, -1.3, 0],
  [2.4, -1.3, 0],
  [5, -1.3, 0],
];
const PILOTS = ['bia', 'jenifer', 'christopher', 'bob', 'calvin'];
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
  const ships = [0, 1, 2].map((id) => {
    const model = createShowroomShip(id, id);
    model.scale.setScalar(1.2);
    scene.add(model);
    return model;
  });
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
    ships.forEach((ship, index) => {
      ship.visible = shot !== 'squad';
      ship.position.set((index - 1) * 5, -1 + Math.sin(elapsed * 0.9 + index) * 0.4, -3);
      ship.rotation.set(0.1, Math.PI + Math.sin(elapsed * 0.3) * 0.16, -0.05);
      if (shot === 'escape') ship.position.x += elapsed * 1.15;
      if (shot === 'pursuit') ship.position.z -= (elapsed - 16) * 0.5;
    });
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
      for (const model of [...pilots, ...ships]) disposeShowroomModel(model);
      sphere.geometry.dispose();
      sphere.material.dispose();
      cargo.children.forEach((mesh) => mesh.geometry.dispose());
      crateMaterial.dispose();
      renderer.dispose();
    },
  };
}
