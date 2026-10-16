import * as T from 'three';

/** Camera-mounted cockpit geometry; never participates in world collision or route bending. */
export function createCockpit(camera) {
  const group = new T.Group();
  const hull = new T.MeshBasicMaterial({ color: '#142f40' });
  const edge = new T.MeshBasicMaterial({ color: '#51cbb8' });
  const flashMat = new T.MeshBasicMaterial({ color: '#baffec', transparent: true, opacity: 0 });
  const flashes = [];
  function block(x, y, z, w, h, d, material = hull) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.userData.fixedSky = true;
    group.add(mesh);
    return mesh;
  }
  // Lower instrument deck and slanted canopy pillars leave the forward view open.
  block(0, -2.1, -3.2, 5.5, 0.35, 1.2);
  block(0, -1.91, -3.5, 2, 0.04, 0.35, edge);
  for (const side of [-1, 1]) {
    const pillar = block(side * 2.5, 0.1, -3.6, 0.11, 4.6, 0.16);
    pillar.rotation.z = side * -0.28;
    block(side * 0.45, -1.4, -4.2, 0.22, 0.25, 1.4);
    block(side * 0.45, -1.4, -4.93, 0.25, 0.28, 0.08, edge);
    flashes.push(block(side * 0.45, -1.4, -5.08, 0.35, 0.35, 0.2, flashMat));
  }
  camera.add(group);
  group.visible = false;
  let pulse = 0;
  return {
    fire() {
      pulse = 0.09;
    },
    update(dt, visible) {
      group.visible = visible;
      pulse = Math.max(0, pulse - dt);
      flashMat.opacity = pulse > 0 ? 0.85 : 0;
      flashes.forEach((mesh) => {
        mesh.visible = pulse > 0;
      });
    },
    destroy() {
      group.traverse((mesh) => mesh.geometry?.dispose());
      hull.dispose();
      edge.dispose();
      flashMat.dispose();
      camera.remove(group);
    },
  };
}
