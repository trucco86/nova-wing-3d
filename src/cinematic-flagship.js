import * as T from 'three';
import { createPbrSurfaceMaps } from './pbr-materials.js';

/**
 * The Devastador is the mission's primary silhouette landmark. This authored
 * hard-surface mesh replaces flat box hulls only at High, without any collision
 * or encounter changes. All units are in the existing carrier's local space.
 */
const armor = new T.MeshPhysicalMaterial({
  color: '#728da6',
  metalness: 0.86,
  roughness: 0.3,
  clearcoat: 0.55,
  clearcoatRoughness: 0.18,
  ...createPbrSurfaceMaps('armor'),
  normalScale: new T.Vector2(0.5, 0.5),
});
const graphite = new T.MeshStandardMaterial({
  color: '#182437',
  metalness: 0.76,
  roughness: 0.43,
  ...createPbrSurfaceMaps('ceramic'),
  normalScale: new T.Vector2(0.28, 0.28),
});
const titanium = new T.MeshStandardMaterial({
  color: '#b1c5cc',
  metalness: 0.82,
  roughness: 0.29,
  ...createPbrSurfaceMaps('titanium'),
  normalScale: new T.Vector2(0.36, 0.36),
});
const glass = new T.MeshPhysicalMaterial({
  color: '#154561',
  metalness: 0.55,
  roughness: 0.12,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  emissive: '#0a3344',
  emissiveIntensity: 0.4,
});
const neon = new T.MeshBasicMaterial({ color: '#54e5ed', toneMapped: false });
const warning = new T.MeshBasicMaterial({ color: '#f59862', toneMapped: false });

function piece(group, geometry, material, name, x = 0, y = 0, z = 0) {
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function seamlessHull(rings, sides = 10) {
  const positions = [], uvs = [], indices = [];
  rings.forEach(({ z, x = 0, y = 0, width, height }, i) => {
    for (let edge = 0; edge < sides; edge++) {
      const angle = (edge * Math.PI * 2) / sides;
      positions.push(x + width * Math.cos(angle), y + height * Math.sin(angle), z);
      uvs.push(edge / (sides - 1), i / (rings.length - 1));
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let edge = 0; edge < sides; edge++) {
      const b = (edge + 1) % sides;
      const a = i * sides + edge, next = (i + 1) * sides + edge;
      indices.push(a, next, i * sides + b, next, (i + 1) * sides + b, i * sides + b);
    }
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j + 1, j);
    const start = (rings.length - 1) * sides;
    indices.push(start, start + j, start + j + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function armoredFin(side, sweep = 1) {
  const s = side;
  const shape = new T.Shape();
  for (const [index, [x, z]] of [
    [s * 13, -40], [s * 36, -31], [s * 91, -17],
    [s * 107, 10 * sweep], [s * 91, 27], [s * 66, 15],
    [s * 42, 39], [s * 18, 36],
  ].entries()) {
    if (index === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  shape.closePath();
  const mesh = new T.ExtrudeGeometry(shape, {
    depth: 3.8, steps: 1, bevelEnabled: true,
    bevelSize: 0.85, bevelThickness: 0.7, bevelSegments: 2,
  });
  mesh.rotateX(Math.PI / 2);
  return mesh;
}

function instanced(group, name, count, material, geometry = new T.BoxGeometry()) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.userData.premiumDecoration = true;
  // Carrier moves with scenery: bounding sphere culling is unsafe for some props.
  mesh.frustumCulled = false;
  group.add(mesh);
  return mesh;
}
function locate(mesh, i, x, y, z, sx, sy, sz, dummy) {
  dummy.position.set(x, y, z);
  dummy.scale.set(sx, sy, sz);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

export function createCinematicFlagship() {
  const group = new T.Group();
  group.name = 'cinematic-flagship-hull';
  group.visible = false;
  group.userData.visualOnly = true;
  const spine = [
    { z: -67, width: 0.6, height: 0.7, y: 1 },
    { z: -54, width: 9, height: 3, y: 1.2 },
    { z: -40, width: 17, height: 6, y: 1 },
    { z: -25, width: 24, height: 9, y: 0 },
    { z: -4, width: 29, height: 11, y: 0 },
    { z: 18, width: 27, height: 10, y: -1 },
    { z: 36, width: 20, height: 8, y: 0 },
    { z: 48, width: 12, height: 5, y: 0 },
  ];
  piece(group, seamlessHull(spine, 12), armor, 'flagship-hero-sculpted-keel');
  piece(group, seamlessHull([
    { z: -28, width: 8, height: 2, y: 11 },
    { z: -18, width: 13, height: 5, y: 14 },
    { z: 4, width: 14, height: 7, y: 13 },
    { z: 25, width: 8, height: 4, y: 11 },
  ], 10), graphite, 'flagship-central-dorsal-armor');
  piece(group, seamlessHull([
    { z: -29, width: 3, height: 1, y: 21 },
    { z: -21, width: 7, height: 4, y: 25 },
    { z: -8, width: 7, height: 5, y: 26 },
    { z: 1, width: 4, height: 2, y: 24 },
  ], 12), glass, 'flagship-armored-command-cockpit');
  for (const side of [-1, 1]) {
    piece(group, armoredFin(side), armor, 'flagship-swept-wing-' + side, 0, 3, 0);
    const under = piece(group, armoredFin(side, 0.72), graphite, 'flagship-shadow-wing-' + side, 0, -1.6, 5);
    under.scale.set(0.94, 0.55, 0.82);
    piece(group, seamlessHull([
      { z: -41, x: side * 76, width: 0.6, height: 0.5 },
      { z: -32, x: side * 75, width: 4.5, height: 4 },
      { z: -8, x: side * 74, width: 6.2, height: 5 },
      { z: 16, x: side * 72, width: 5.3, height: 4 },
      { z: 40, x: side * 70, width: 4.8, height: 4 },
    ], 10), titanium, 'flagship-hero-engine-pod-' + side);
    const nozzle = piece(group,
      new T.TorusGeometry(4.7, 0.52, 8, 26),
      neon, 'flagship-hero-engine-emitter-' + side,
      side * 70, 0, 40.2);
    nozzle.userData.emitter = true;
    piece(group,
      new T.CylinderGeometry(2.8, 2.4, 1, 24),
      glass, 'flagship-engine-core-' + side,
      side * 70, 0, 40.7).rotation.x = Math.PI / 2;
  }
  const dummy = new T.Object3D();
  const vents = instanced(group, 'flagship-hero-intake-arrays', 18, graphite);
  const lightRails = instanced(group, 'flagship-hero-running-lights', 26, neon);
  const armorPanels = instanced(group, 'flagship-hero-hull-plates', 20, titanium);
  for (let i = 0; i < 9; i++) {
    for (const side of [-1, 1]) {
      const n = i * 2 + (side === -1 ? 0 : 1);
      locate(vents, n, side * (26 + i * 7), 5.5, -18 + i * 4.2, 2.1, 0.4, 5.8, dummy);
    }
  }
  for (let i = 0; i < 13; i++) {
    for (const side of [-1, 1]) {
      const n = i * 2 + (side === -1 ? 0 : 1);
      locate(lightRails, n, side * (25 + i * 5.9), 6.2, -25 + i * 3.2, 0.55, 0.19, 2.8, dummy);
    }
  }
  for (let i = 0; i < 10; i++) {
    for (const side of [-1, 1]) {
      const n = i * 2 + (side === -1 ? 0 : 1);
      locate(armorPanels, n, side * (7.2 + i * 1.4), 12.5, -31 + i * 6.3, 2, 0.6, 5.5, dummy);
    }
  }
  const hangar = piece(group,
    new T.TorusGeometry(18, 2.25, 8, 36),
    warning, 'flagship-hero-launch-bay', 0, -5, 49);
  hangar.scale.set(1.1, 0.55, 1);
  for (const mesh of [vents, lightRails, armorPanels])
    mesh.instanceMatrix.needsUpdate = true;
  group.userData.drawCallBudget = 17;
  return group;
}

/** Visual-only engine motion for a flagship slowly entering the player's frame. */
export function animateCinematicFlagship(group, time) {
  if (!group?.visible || !Number.isFinite(time)) return;
  let offset = 0;
  group.traverse((child) => {
    if (child.userData.emitter) {
      const pulse = 0.95 + 0.08 * Math.sin(time * 5.2 + offset);
      child.scale.set(pulse, pulse, 1);
      offset += 0.7;
    }
  });
}
