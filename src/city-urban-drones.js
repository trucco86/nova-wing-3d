import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Animated delivery, police and traffic-monitor drones stay GPU-instanced.
// Give each drone a recognisable aircraft silhouette without extra draw calls.
function serviceDroneHull() {
  const parts = [];
  const add = (geometry, color, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) => {
    const copy = geometry.clone();
    // IcosahedronGeometry is non-indexed while wings/engines are indexed.
    // BufferGeometryUtils requires a consistent representation across parts.
    if (!copy.index)
      copy.setIndex(Array.from({ length: copy.getAttribute('position').count }, (_, i) => i));
    const transform = new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(0, 0, rz)),
      new T.Vector3(sx, sy, sz),
    );
    copy.applyMatrix4(transform);
    const c = new T.Color(color);
    const rgb = [];
    for (let i = 0; i < copy.getAttribute('position').count; i++) rgb.push(c.r, c.g, c.b);
    copy.setAttribute('color', new T.Float32BufferAttribute(rgb, 3));
    parts.push(copy);
  };
  const cube = new T.BoxGeometry(1, 1, 1);
  const fuselage = new T.IcosahedronGeometry(1, 1);
  const thruster = new T.CylinderGeometry(0.5, 0.7, 1.3, 10);
  add(fuselage, '#9fbdce', 0, 0, 0, 2.3, 0.56, 3.1);
  add(cube, '#203b54', 0, 0.42, -0.7, 1.64, 0.24, 2.0);
  add(cube, '#6e8c9f', 0, -0.45, 0.7, 1.3, 0.6, 1.6);
  for (const side of [-1, 1]) {
    add(cube, '#a6c1d0', side * 2.5, 0, 0.36, 3.5, 0.2, 1.3, side * 0.12);
    add(cube, '#244457', side * 3.7, -0.13, 0.75, 0.5, 0.48, 1.8);
    add(thruster, '#334b60', side * 2.7, -0.45, 1.05, 1.04, 0.9, 1.04);
    add(cube, '#6bd6db', side * 2.8, 0.14, -0.55, 0.13, 0.1, 1.3);
    add(cube, '#c1d6df', side * 1.2, 0.66, -1.35, 0.25, 0.18, 0.92);
  }
  add(cube, '#364c61', 0, 0.58, 0.55, 0.55, 0.15, 1.75);
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('service drone hull merge failed');
  for (const part of parts) part.dispose();
  merged.computeBoundingSphere();
  return merged;
}
const pods = serviceDroneHull();
const lights = new T.OctahedronGeometry(1.1, 0);
const hull = new T.MeshStandardMaterial({
  color: '#ffffff',
  metalness: 0.72,
  roughness: 0.3,
  vertexColors: true,
});
const glow = new T.MeshBasicMaterial({ color: '#5cf1f0', toneMapped: false });
const cursor = new T.Object3D();
const count = 12;
export function createCityUrbanDrones(phase = 0) {
  const group = new T.Group();
  group.name = 'city-urban-drones';
  group.userData.visualOnly = true;
  group.userData.phase = phase;
  const bodies = new T.InstancedMesh(pods, hull, count);
  bodies.name = 'city-moving-service-drones';
  const beacons = new T.InstancedMesh(lights, glow, count);
  beacons.name = 'city-moving-drone-beacons';
  for (const mesh of [bodies, beacons]) {
    mesh.frustumCulled = false;
    mesh.count = 6;
    mesh.userData.visualOnly = true;
    group.add(mesh);
  }
  animateCityUrbanDrones(group, 0);
  return group;
}
export function setCityUrbanDronesQuality(group, quality) {
  if (!group) return;
  for (const mesh of group.children) mesh.count = quality === 'high' ? count : 6;
}
export function animateCityUrbanDrones(group, travel) {
  if (!group || !Number.isFinite(travel)) return;
  const base = group.userData.phase || 0;
  const body = group.getObjectByName('city-moving-service-drones');
  const beacon = group.getObjectByName('city-moving-drone-beacons');
  for (let i = 0; i < count; i++) {
    const phase = i * 1.83 + base;
    const distance = (travel * (0.27 + (i % 3) * 0.055) + i * 171) % 1880;
    // Separate local paths at stations, retail entrances and towers. Smooth
    // oscillations add obvious lateral motion without entering low corridors.
    const side = i % 2 ? -1 : 1;
    const x = side * (65 + (i % 4) * 18 + 17 * Math.sin(phase + travel * 0.009));
    const y = 64 + (i % 5) * 13 + 8 * Math.sin(phase + travel * 0.014);
    const z = -35 - distance;
    cursor.position.set(x, y, z);
    cursor.rotation.set(
      Math.sin(phase + travel * 0.013) * 0.2,
      0.2 * Math.sin(phase + travel * 0.008),
      side * 0.16 * Math.sin(phase + travel * 0.02),
    );
    cursor.scale.set(1.2, 0.62, 1.85);
    cursor.updateMatrix();
    body.setMatrixAt(i, cursor.matrix);
    cursor.position.y -= 1.8;
    // Alternate courier and emergency-service beacons; no new geometry/pass.
    const pulse = 0.73 + 0.27 * Math.sin(travel * 0.046 + i * 1.7);
    cursor.scale.setScalar((i % 4 === 0 ? 1.12 : 0.76) * (0.88 + pulse * 0.25));
    cursor.updateMatrix();
    beacon.setMatrixAt(i, cursor.matrix);
  }
  body.instanceMatrix.needsUpdate = true;
  beacon.instanceMatrix.needsUpdate = true;
}
