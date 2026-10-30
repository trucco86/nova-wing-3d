import * as T from 'three';

/**
 * Graphics 3.0 urban dressing, rendered only in High.
 * GPU instancing and broad fog cards avoid per-object draw calls. Nothing is
 * registered with the physics/collision subsystem. The near tile is dressed,
 * the distant city retains the monumental skyline without the extra detail.
 */
export function createPremiumRoadDressing() {
  const group = new T.Group();
  group.name = 'premium-wet-road-dressing';
  const unit = new T.BoxGeometry(1, 1, 1);
  const cyan = new T.MeshBasicMaterial({ color: '#41e2f2', toneMapped: false });
  const amber = new T.MeshBasicMaterial({ color: '#f6aa6a', toneMapped: false });
  const darkMetal = new T.MeshStandardMaterial({
    color: '#243b48', metalness: 0.82, roughness: 0.3,
  });
  const createInstances = (name, geometry, material, count) => {
    const mesh = new T.InstancedMesh(geometry, material, count);
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };
  // 55 pairs of low-profile illuminated guardrails over the wet roadway.
  const rails = createInstances('premium-road-light-rails', unit, cyan, 110);
  const inlays = createInstances('premium-road-amber-inlays', unit, amber, 110);
  // Vertical art-direction and atmospheric haze along the outside edges.
  const pillars = createInstances('premium-road-architectural-pillars', unit, darkMetal, 52);
  const lamps = createInstances('premium-road-beacon-lights', unit, cyan, 52);
  const steamPixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const nx = (x - 15.5) / 15.5, ny = (y - 15.5) / 15.5;
    const density = Math.exp(-4.7 * (nx * nx * 0.7 + ny * ny));
    const p = (y * 32 + x) * 4;
    steamPixels[p] = 183; steamPixels[p + 1] = 222; steamPixels[p + 2] = 226;
    steamPixels[p + 3] = Math.round(density * 155);
  }
  const steamTexture = new T.DataTexture(steamPixels, 32, 32, T.RGBAFormat);
  steamTexture.name = 'premium-road-steam-falloff';
  steamTexture.magFilter = T.LinearFilter;
  steamTexture.minFilter = T.LinearFilter;
  steamTexture.needsUpdate = true;
  const steamMaterial = new T.MeshBasicMaterial({
    map: steamTexture, transparent: true, opacity: 0.34, depthWrite: false,
    blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false,
  });
  const steam = createInstances('premium-road-steam', new T.PlaneGeometry(1, 1), steamMaterial, 44);
  const dummy = new T.Object3D();
  const set = (mesh, i, x, y, z, sx, sy, sz) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  for (let i = 0; i < 55; i++) {
    const z = -35 - 33 * i;
    for (const side of [-1, 1]) {
      const index = i * 2 + (side > 0 ? 1 : 0);
      set(rails, index, side * 37.2, -6.74, z, 0.16, 0.095, 25.5);
      set(inlays, index, side * 23.6, -6.78, z - 4.3, 0.12, 0.07, 9.5);
    }
  }
  for (let i = 0; i < 26; i++) {
    const z = -75 - i * 66;
    for (const side of [-1, 1]) {
      const index = i * 2 + (side > 0 ? 1 : 0);
      // Side fixtures sit beyond the flight corridor (x=±87).
      set(pillars, index, side * 87, 1.5, z, 1.7, 17, 1.9);
      set(lamps, index, side * 87, 10.4, z, 2.3, 0.35, 2.5);
    }
  }
  for (let i = 0; i < 44; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -34 - Math.floor(i / 2) * 81;
    set(steam, i, side * 80, 5 + (i % 3) * 2.1, z, 16, 11 + (i % 4) * 3, 1);
  }
  for (const obj of group.children) obj.instanceMatrix.needsUpdate = true;
  group.visible = false;
  return { group, steamTexture };
}
