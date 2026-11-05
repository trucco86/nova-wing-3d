import * as T from 'three';

const smooth = (value) => {
  const v = Math.max(0, Math.min(1, value));
  return v * v * (3 - 2 * v);
};

// Europe is a grounded frozen world after its fissure descent, not a second
// orbital globe. Keep the ice-floor swap deterministic in game time.
export function europaSurfaceAt(seconds, tunnelActive = false) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('Invalid Europa arrival time');
  const surface = smooth((seconds - 16) / 7);
  const orbital = 1 - smooth((seconds - 15.5) / 4);
  return Object.freeze({
    surface,
    orbitalVisible: orbital > 0.01,
    orbitalOpacity: orbital,
    frostDensity: 0.00135 + surface * 0.00135,
    fogTint: '#b3d5e0',
    groundVisible: surface > 0.07 && !tunnelActive,
    tunnelActive: Boolean(tunnelActive),
  });
}

const hash = (n) => {
  const t = Math.sin(n * 127.12 + 11.47) * 43758.5453;
  return t - Math.floor(t);
};

// One low-cost glacial vista, not a repeated row of primitive cones. All
// geometry stays OUTSIDE the flight corridor; the boss arena hides this
// near/mid layer when the Colossus appears.
export function createEuropaSurface() {
  const root = new T.Group();
  root.name = 'europa-frozen-surface';
  root.userData.europaForeground = true;
  root.userData.visualOnly = true;
  root.userData.fixedSky = true;

  const ice = new T.MeshStandardMaterial({
    color: '#d0e7e9',
    roughness: 0.62,
    metalness: 0.04,
    flatShading: true,
    emissive: '#24455c',
    emissiveIntensity: 0.09,
  });
  const blue = new T.MeshStandardMaterial({
    color: '#5d92ac',
    roughness: 0.52,
    metalness: 0.08,
    flatShading: true,
  });
  const floe = new T.IcosahedronGeometry(1, 0);
  const shard = new T.ConeGeometry(1, 1, 5);
  const dummy = new T.Object3D();
  for (const [name, count, geo, mat, center] of [
    ['europa-fractured-ice-shelves', 32, floe, ice, 105],
    ['europa-blue-crevasse-ridges', 26, shard, blue, 175],
  ]) {
    const mesh = new T.InstancedMesh(geo, mat, count);
    mesh.name = name;
    mesh.userData.visualOnly = true;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const h = (name.includes('ridges') ? 28 : 7) + hash(i * 19) * 32;
      dummy.position.set(
        side * (center + hash(i * 5 + 3) * 104),
        -11 + h * (name.includes('ridges') ? 0.48 : 0.21),
        -115 - i * (name.includes('ridges') ? 65 : 45),
      );
      dummy.rotation.set(0, hash(i * 17) * 2.9, side * hash(i * 7) * 0.14);
      dummy.scale.set(
        12 + hash(i * 13) * 31,
        h,
        18 + hash(i * 23) * 45,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    root.add(mesh);
  }

  // Wind-blown ice crystals sit in the distant two side lanes. Points are
  // cheaper than dozens of transparent billboards on Medium/mobile.
  const count = 84;
  const coords = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? -1 : 1;
    coords[i * 3] = side * (57 + hash(i * 13) * 200);
    coords[i * 3 + 1] = -3 + hash(i * 31) * 78;
    coords[i * 3 + 2] = -90 - hash(i * 47) * 1250;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(coords, 3));
  const snow = new T.Points(
    geometry,
    new T.PointsMaterial({
      color: '#ecfbff',
      transparent: true,
      opacity: 0.53,
      size: 2.4,
      sizeAttenuation: false,
      depthWrite: false,
    }),
  );
  snow.name = 'europa-windborne-ice-snow';
  snow.userData.visualOnly = true;
  root.add(snow);
  root.visible = false;
  return root;
}

export function updateEuropaSurface(root, time, visible, highQuality = true) {
  if (!root) return;
  root.visible = Boolean(visible);
  const snow = root.getObjectByName('europa-windborne-ice-snow');
  if (snow) {
    snow.visible = Boolean(visible && highQuality);
    // Sinusoidal drift is stable across pause/reset and cannot jump a seam.
    snow.position.set(Math.sin(time * 0.19) * 7, 0, 0);
  }
}
