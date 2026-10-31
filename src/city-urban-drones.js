import * as T from 'three';

// Independent animated delivery, police and traffic-monitor drones. Their
// routes are tied to world travel, not wall time, so pause freezes the city.
const pods = new T.IcosahedronGeometry(2.5, 1);
const lights = new T.OctahedronGeometry(1.1, 0);
const hull = new T.MeshStandardMaterial({ color: '#acc6d4', metalness: 0.72, roughness: 0.3 });
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
    cursor.scale.setScalar(0.82);
    cursor.updateMatrix();
    beacon.setMatrixAt(i, cursor.matrix);
  }
  body.instanceMatrix.needsUpdate = true;
  beacon.instanceMatrix.needsUpdate = true;
}
