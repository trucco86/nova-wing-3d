import * as T from 'three';

// Authored landmarks outside the flight corridor. Draw calls stay bounded by
// InstancedMesh; these never participate in collision, targeting or scoring.
const hash = (n) => {
  const x = Math.sin(n * 127.13 + 15.78) * 43758.5453;
  return x - Math.floor(x);
};
const palette = {
  4: ['#9c7147', '#edc28c', '#ba8550', '#e9aa67'], // Venus acid-cloud stacks
  5: ['#78b0ca', '#e3f5fc', '#8dbccd', '#bedee7'], // Europa ice plates
  6: ['#1a4c9c', '#397ed1', '#71b1ed', '#1e3877'], // Neptune vortex clouds
  9: ['#875736', '#d0a06a', '#aa8051', '#354e55'], // Titan mineral ice / methane
};
const materialFor = (index, opacity = 1) =>
  new T.MeshStandardMaterial({
    color: '#ffffff',
    roughness: index === 5 ? 0.77 : 0.94,
    metalness: index === 5 ? 0.06 : 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    flatShading: index === 5 || index === 9,
  });
const mark = (node, name, highOnly = false) => {
  node.name = name;
  node.userData.visualOnly = true;
  node.userData.destinationDetail = true;
  node.userData.highOnly = highOnly;
  node.castShadow = false;
  node.receiveShadow = false;
  return node;
};

function makeInstanced(index, count, geometry, material, name, positioner, highOnly = false) {
  const mesh = mark(new T.InstancedMesh(geometry, material, count), name, highOnly);
  const dummy = new T.Object3D();
  const colors = palette[index];
  for (let i = 0; i < count; i++) {
    const { position, scale, rotation = [0, 0, 0] } = positioner(i);
    dummy.position.set(...position);
    dummy.rotation.set(...rotation);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new T.Color(colors[i % colors.length]));
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.userData.fullCount = count;
  return mesh;
}

export function createDestinationLandmarks(index) {
  if (!palette[index]) return null;
  const group = mark(new T.Group(), 'destination-landmarks');
  group.userData.world = index;
  // The destination is part of the horizon, not a spinning obstacle.
  // Only authored clouds move, driven by simulated mission time.
  group.userData.fixedSky = true;
  const cloud = index === 4 || index === 6;
  if (cloud) {
    const geometry = new T.SphereGeometry(1, 14, 9);
    const count = index === 4 ? 38 : 34;
    const fog = makeInstanced(
      index,
      count,
      geometry,
      materialFor(index, 0.28),
      index === 4 ? 'venus-sulfur-cloud-columns' : 'neptune-turbulent-cloud-columns',
      (i) => {
        const side = i % 2 ? 1 : -1;
        const x = side * (90 + hash(i * 7 + 2) * 200);
        const y = -13 + hash(i * 17 + 7) * 125;
        const z = -115 - i * 31;
        return {
          position: [x, y, z],
          scale: [35 + hash(i * 13) * 56, 22 + hash(i * 21) * 43, 42 + hash(i * 3) * 52],
          rotation: [0, hash(i * 5) * 2.7, i * 0.05],
        };
      },
    );
    group.add(fog);
    const high = makeInstanced(
      index,
      18,
      new T.SphereGeometry(1, 16, 10),
      materialFor(index, 0.16),
      'destination-cloud-depth-high',
      (i) => ({
        position: [
          (i % 2 ? 1 : -1) * (125 + hash(i * 7) * 170),
          25 + hash(i * 3) * 105,
          -260 - i * 62,
        ],
        scale: [56 + hash(i * 4) * 75, 22 + hash(i * 5) * 34, 80],
      }),
      true,
    );
    group.add(high);
    if (index === 4) {
      // Forked electrical discharges remain near distant lateral cloud banks.
      const points = [];
      for (let side of [-1, 1]) {
        const x = side * 148;
        for (let i = 0; i < 7; i++) {
          points.push(x + Math.sin(i * 2.3) * 14, 100 - i * 15, -550);
          points.push(x + Math.sin((i + 1) * 2.3) * 14, 100 - (i + 1) * 15, -550);
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      const lightning = mark(
        new T.LineSegments(
          geometry,
          new T.LineBasicMaterial({
            color: '#f9dfb6',
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
          }),
        ),
        'venus-lightning-at-cloud-horizon',
        true,
      );
      group.add(lightning);
    }
  } else if (index === 5) {
    const ice = makeInstanced(
      index,
      54,
      new T.ConeGeometry(1, 1, 6),
      materialFor(index),
      'europa-fractured-glacial-spires',
      (i) => {
        const x = (i % 2 ? 1 : -1) * (85 + hash(i * 3) * 175);
        const h = 12 + hash(i * 11) * 65;
        return {
          position: [x, h * 0.43 - 8, -130 - i * 30],
          scale: [9 + hash(i * 8) * 22, h, 10 + hash(i * 13) * 26],
          rotation: [hash(i * 4) * 0.22, hash(i * 7) * 6, (i % 2 ? 1 : -1) * hash(i * 6) * 0.33],
        };
      },
    );
    group.add(ice);
    const plates = makeInstanced(
      index,
      18,
      new T.IcosahedronGeometry(1, 1),
      materialFor(index),
      'europa-rift-ice-plates-high',
      (i) => ({
        position: [(i % 2 ? 1 : -1) * (128 + hash(i * 4) * 150), -13, -210 - i * 53],
        scale: [27 + hash(i * 12) * 33, 3 + hash(i * 13) * 7, 36 + hash(i * 15) * 38],
        rotation: [0, hash(i * 6) * 2, 0],
      }),
      true,
    );
    group.add(plates);
  } else if (index === 9) {
    const rocks = makeInstanced(
      index,
      46,
      new T.DodecahedronGeometry(1, 1),
      materialFor(index),
      'titan-icy-mineral-monoliths',
      (i) => {
        const x = (i % 2 ? 1 : -1) * (135 + hash(i * 7) * 165);
        const h = 8 + hash(i * 13) * 48;
        return {
          position: [x, h * 0.45 - 10, -170 - i * 28],
          scale: [6 + hash(i * 5) * 18, h, 9 + hash(i * 3) * 22],
          rotation: [hash(i * 2) * 0.5, hash(i * 11) * 6, hash(i * 17) * 0.25],
        };
      },
    );
    group.add(rocks);
    const lakes = makeInstanced(
      index,
      10,
      new T.SphereGeometry(1, 18, 8),
      new T.MeshStandardMaterial({
        color: '#3a5c60',
        roughness: 0.18,
        metalness: 0.11,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      }),
      'titan-methane-lake-shores',
      (i) => ({
        position: [(i % 2 ? 1 : -1) * (205 + hash(i * 12) * 130), -13, -250 - i * 92],
        scale: [45 + hash(i * 6) * 34, 0.6, 55 + hash(i * 19) * 29],
        rotation: [0, hash(i * 3) * 2, 0],
      }),
    );
    group.add(lakes);
  }
  group.traverse((node) => {
    node.userData.visualOnly = true;
  });
  return group;
}

export function updateDestinationLandmarks(root, seconds) {
  if (!root) return;
  const clouds =
    root.getObjectByName('venus-sulfur-cloud-columns') ||
    root.getObjectByName('neptune-turbulent-cloud-columns');
  if (clouds) {
    clouds.position.x = Math.sin(seconds * (root.userData.world === 6 ? 0.13 : 0.07)) * 8;
    clouds.material.opacity =
      root.userData.world === 6
        ? 0.28 + 0.055 * Math.sin(seconds * 0.17)
        : 0.26 + 0.035 * Math.sin(seconds * 0.11);
  }
  const lightning = root.getObjectByName('venus-lightning-at-cloud-horizon');
  if (lightning) {
    const flash = Math.sin(seconds * 1.3) * Math.sin(seconds * 0.27 + 1);
    lightning.material.opacity = Math.max(0, flash - 0.72) * 1.4;
  }
}

export function setDestinationLandmarkQuality(root, quality) {
  if (!root) return;
  const high = quality === 'high';
  root.traverse((node) => {
    if (node.userData.highOnly) node.visible = high;
  });
}
