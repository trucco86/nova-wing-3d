import * as T from 'three';

/**
 * Source-authored hero architectural modules for the City of Machines.
 * Intentional art-direction: multi-level facades, silhouette-breakers,
 * stepped roofs and emissive window bands, not random stacks of boxes.
 * Instanced for WebGL performance. Decorative only, no collision meshes.
 */
export function createHeroFacadeArchitecture() {
  const group = new T.Group();
  group.name = 'city-hero-facade-architecture';
  const alloy = new T.MeshPhysicalMaterial({
    color: '#294354', metalness: 0.78, roughness: 0.31,
    clearcoat: 0.35, clearcoatRoughness: 0.22,
  });
  const graphite = new T.MeshStandardMaterial({
    color: '#0d2230', metalness: 0.62, roughness: 0.41,
  });
  const cyan = new T.MeshBasicMaterial({ color: '#36dded', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#f3ab5a', toneMapped: false });
  const sign = new T.MeshBasicMaterial({
    color: '#167da4', side: T.DoubleSide, transparent: true,
    opacity: 0.72, depthWrite: false, toneMapped: false,
  });
  const unit = new T.BoxGeometry(1, 1, 1);
  const entries = [
    ['city-hero-octagonal-shell', new T.CylinderGeometry(8, 11.4, 1, 8), alloy, 20],
    ['city-hero-tiered-crowns', new T.CylinderGeometry(11.8, 13.7, 1, 8), graphite, 40],
    ['city-hero-exoskeleton-ribs', unit, alloy, 80],
    ['city-hero-illumination-slits', unit, cyan, 120],
    ['city-hero-warm-window-bands', unit, amber, 120],
    ['city-hero-hologram-panels', new T.PlaneGeometry(1, 1), sign, 20],
    ['city-hero-skyport-decks', new T.CylinderGeometry(7.5, 10, 1, 6), alloy, 20],
  ];
  const meshes = entries.map(([name, geometry, material, count]) => {
    const mesh = new T.InstancedMesh(geometry, material, count);
    mesh.name = name;
    // The whole set is in the near-only High LOD group.
    mesh.frustumCulled = true;
    group.add(mesh);
    return mesh;
  });
  const [shells, crowns, ribs, slits, windows, panels, decks] = meshes;
  const dummy = new T.Object3D();
  const place = (mesh, index, x, y, z, width, height, depth, rx = 0, ry = 0) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, 0);
    dummy.scale.set(width, height, depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  };

  // Mirrored architecture has a staggered rhythm. Towers differ in height,
  // rotation and treatment; the road's central flight corridor is untouched.
  for (let i = 0; i < 20; i++) {
    const side = i % 2 ? 1 : -1;
    const rank = Math.floor(i / 2);
    const reach = 127 + (rank % 4) * 16;
    const x = side * reach;
    const z = -106 - rank * 174 - (i % 3) * 10;
    const h = 72 + (rank % 4) * 16;
    const baseY = h / 2 - 7;
    const yaw = rank * 0.17 + side * 0.08;
    place(shells, i, x, baseY, z, 1, h, 1, 0, yaw);
    // Crown volumes deliberately break the silhouette instead of adding
    // an uninterrupted extruded facade from street to antenna.
    place(crowns, i * 2, x, h - 6, z, 1, 4.3, 1, 0, yaw);
    place(crowns, i * 2 + 1, x, h + 3, z, 0.71, 6.2, 0.71, 0, yaw);
    for (let j = 0; j < 4; j++) {
      const angle = yaw + j * Math.PI / 2 + Math.PI / 4;
      const dx = Math.sin(angle), dz = Math.cos(angle);
      const ribHeight = h * (j % 2 ? 0.64 : 0.83);
      place(ribs, i * 4 + j, x + dx * 10.7, ribHeight / 2 - 7,
        z + dz * 10.7, 0.75, ribHeight, 1.15, 0, angle);
    }
    // six narrow light apertures give a vertical rhythm from the pilot view.
    for (let j = 0; j < 6; j++) {
      const xFace = x - side * (9.75 + j % 2 * 0.12);
      const level = 8 + j * (h - 20) / 6;
      const zOffset = (j % 2 ? 2.5 : -2.5);
      place(slits, i * 6 + j, xFace, level, z + zOffset, 0.25, 5.6, 1.1);
      place(windows, i * 6 + j, xFace - side * 0.08,
        level - 2.7, z + zOffset, 0.3, 0.35, 4.3);
    }
    // Giant segmented glass lightboxes read clearly at speed in High.
    // The panel faces the road, not a billboard in the central flight area.
    place(panels, i, x - side * 11.45, h * .58, z,
      11, 17, 1, 0, side * Math.PI / 2);
    place(decks, i, x + side * 8.2, h * 0.58, z + 4.3,
      1, 1.1, 1, 0, yaw);
  }
  for (const mesh of meshes) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
  group.visible = false;
  return group;
}
