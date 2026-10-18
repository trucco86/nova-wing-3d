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
  block(0, -1.65, -3.2, 5.5, 0.45, 1.2);
  for (const side of [-1, 1]) {
    block(side * 0.92, -1.36, -2.65, 1.1, 0.55, 0.08);
    block(side * 0.92, -1.35, -2.59, 0.94, 0.4, 0.03, edge);
    for (let i = 0; i < 5; i++)
      block(side * 0.92 - 0.35 + i * 0.17, -1.35, -2.56, 0.08, 0.09 + i * 0.04, 0.02);
    for (let i = 0; i < 3; i++)
      block(side * (1.65 + i * 0.16), -1.45, -2.55, 0.08, 0.08, 0.04, edge);
  }
  block(0, -1.4, -2.58, 0.48, 0.3, 0.06, edge);
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
    update(dt, visible, charge = 0) {
      group.visible = visible;
      pulse = Math.max(0, pulse - dt);
      flashMat.opacity = pulse > 0 ? 0.85 : Math.min(0.7, charge * 0.45);
      flashes.forEach((mesh) => {
        mesh.visible = pulse > 0 || charge > 0.15;
        mesh.scale.setScalar(1 + charge * 2);
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
