import * as T from 'three';

// City 3.5: real building-anchored micro-architecture and independent service
// motion. Nothing here participates in gameplay collision; all new details
// remain outside the ship's x=±72 flight envelope.
const boxGeometry = new T.BoxGeometry(1, 1, 1);
const discGeometry = new T.CylinderGeometry(1, 1, 0.3, 18);
const ringGeometry = new T.TorusGeometry(1, 0.068, 5, 24);
const smokeGeometry = new T.ConeGeometry(1, 1, 7, 1, true);
const cursor = new T.Object3D();
const animations = new WeakMap();
const metallic = (color, metalness = 0.72, roughness = 0.3) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
const paint = metallic('#a3b5c0', 0.7, 0.42);
const graphite = metallic('#334d5d', 0.77, 0.3);
const glazing = metallic('#4d8498', 0.42, 0.2);
const yellow = new T.MeshBasicMaterial({ color: '#ffd68e', toneMapped: false });
const blue = new T.MeshBasicMaterial({ color: '#78f2fa', toneMapped: false });
const vapour = new T.MeshBasicMaterial({
  color: '#c1e7ed', transparent: true, opacity: 0.11,
  depthWrite: false, side: T.DoubleSide,
});
const entry = (x, y, z, w, h, d, rx = 0) => ({ x, y, z, w, h, d, rx });
function batch(group, name, geometry, material, items) {
  const mesh = new T.InstancedMesh(geometry, material, items.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  items.forEach((p, i) => {
    cursor.position.set(p.x, p.y, p.z);
    cursor.rotation.set(p.rx, 0, 0);
    cursor.scale.set(p.w, p.h, p.d);
    cursor.updateMatrix();
    mesh.setMatrixAt(i, cursor.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  return mesh;
}
function moving(group, name, material, count, geometry = boxGeometry) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  mesh.count = 0;
  group.add(mesh);
  return mesh;
}
function serviceAnchors(buildings) {
  return buildings
    .filter((b, i) => i % 9 === 4 && b.h >= 37)
    .slice(0, 12)
    .map((b, i) => ({
      x: b.x - Math.sign(b.x) * (b.w * 0.5 + 1.4),
      z: b.z + b.depth * 0.5 + 1.1,
      low: 3.5, height: b.h - 15,
      phase: i * 1.57, speed: 0.65 + (i % 4) * 0.13,
      side: Math.sign(b.x),
    }));
}
function refs(root) {
  let found = animations.get(root);
  if (found) return found;
  const service = root.getObjectByName('city35-animated-building-services');
  const high = root.getObjectByName('city35-industrial-high');
  found = {
    lifts: root.userData.lifts,
    vents: root.userData.vents,
    cabins: service.getObjectByName('city35-facade-service-cabins'),
    glass: service.getObjectByName('city35-facade-service-glazing'),
    beacons: service.getObjectByName('city35-moving-lift-beacons'),
    exhaust: high.getObjectByName('city35-ventilated-vapour'),
  };
  animations.set(root, found);
  return found;
}
function transform(mesh, index, x, y, z, sx, sy, sz, rx = 0, ry = 0) {
  cursor.position.set(x, y, z);
  cursor.rotation.set(rx, ry, 0);
  cursor.scale.set(sx, sy, sz);
  cursor.updateMatrix();
  mesh.setMatrixAt(index, cursor.matrix);
}

export function createCity35LivedIn(buildings = []) {
  const root = new T.Group();
  root.name = 'city35-lived-in-metropolis';
  root.userData.visualOnly = true;
  root.userData.phase = 0;
  const medium = new T.Group();
  medium.name = 'city35-architecture-medium';
  const high = new T.Group();
  high.name = 'city35-industrial-high';
  high.visible = false;
  const services = new T.Group();
  services.name = 'city35-animated-building-services';

  const pads = [], rings = [], runwayLights = [], warningStripes = [];
  const conduits = [], roofMachines = [], ventStacks = [], serviceRails = [];
  const roofFans = [], fanBlades = [];
  const vents = [];
  const lifts = serviceAnchors(buildings);
  buildings.forEach((b, i) => {
    const side = Math.sign(b.x) || 1;
    const roofY = b.h - 3.0;
    const front = b.z + b.depth * 0.5;
    // Pads sit on the roof cap, not at arbitrary world heights.
    if (i % 10 === 3 && b.h >= 47) {
      const radius = Math.min(b.w * 0.21, b.depth * 0.25, 4.1);
      pads.push(entry(b.x, roofY + 0.18, b.z, radius, 1, radius));
      rings.push(entry(b.x, roofY + 0.46, b.z, radius * 0.75, radius * 0.75,
        radius * 0.75, -Math.PI / 2));
      warningStripes.push(entry(b.x, roofY + 0.48, b.z, radius * 0.34, 0.09, 0.3));
      for (const sign of [-1, 1]) {
        runwayLights.push(entry(b.x + sign * radius * 0.85, roofY + 0.52,
          b.z, 0.32, 0.32, 0.32));
        runwayLights.push(entry(b.x, roofY + 0.52, b.z + sign * radius * 0.85,
          0.32, 0.32, 0.32));
      }
    }
    if (i % 7 === 2 && b.h >= 31) {
      const x = b.x + side * b.w * 0.16;
      const z = b.z - b.depth * 0.09;
      roofMachines.push(entry(x, roofY + 1.15, z, b.w * 0.24, 2.2, b.depth * 0.28));
      ventStacks.push(entry(x, roofY + 3.3, z, 1.0, 3.3, 1.1));
      if (i % 2 === 0) {
        vents.push({ x, y: roofY + 5.2, z, phase: i * 0.81 });
        roofFans.push(entry(x - side * 1.7, roofY + 2.2, z, 2.15, 0.45, 2.15));
      }
    }
    // Electrical conduits and rooftop service cabinets share the exact
    // building position. These are NOT spans crossing the flight corridor.
    if (i % 5 === 1 && b.h >= 29) {
      conduits.push(entry(b.x - side * (b.w * 0.49), -7 + b.h * 0.43,
        front + 0.4, 0.28, b.h * 0.57, 0.4));
      conduits.push(entry(b.x - side * (b.w * 0.49), -7 + b.h * 0.73,
        front + 0.75, 2.1, 0.25, 1.0));
    }
  });
  for (const p of lifts) {
    for (const sign of [-1, 1])
      serviceRails.push(entry(p.x + sign * 1.7, 3.5 + p.height * 0.5,
        p.z - 1.1, 0.3, p.height, 0.35));
  }
  for (const v of vents) {
    fanBlades.push(entry(v.x - 1.7, v.y - 2.9, v.z, 2.35, 0.13, 0.36));
  }
  batch(medium, 'city35-rooftop-landing-pads', discGeometry, paint, pads);
  batch(medium, 'city35-landing-navigation-rings', ringGeometry, blue, rings);
  batch(medium, 'city35-landing-safety-lights', boxGeometry, yellow, runwayLights);
  batch(medium, 'city35-industrial-service-machinery', boxGeometry, graphite, roofMachines);
  batch(medium, 'city35-rooftop-vent-stacks', boxGeometry, paint, ventStacks);
  batch(medium, 'city35-facade-electrical-conduits', boxGeometry, paint, conduits);
  batch(medium, 'city35-facade-service-guide-rails', boxGeometry, paint, serviceRails);
  batch(high, 'city35-landing-runway-markers', boxGeometry, yellow, warningStripes);
  batch(high, 'city35-roof-fan-housings', boxGeometry, paint, roofFans);
  const blades = batch(high, 'city35-moving-turbine-rotors', boxGeometry, blue, fanBlades);
  blades.userData.fanAnchors = vents;
  const exhaust = moving(high, 'city35-ventilated-vapour', vapour, vents.length, smokeGeometry);
  const cabins = moving(services, 'city35-facade-service-cabins', graphite, lifts.length);
  const glass = moving(services, 'city35-facade-service-glazing', glazing, lifts.length);
  const beacons = moving(services, 'city35-moving-lift-beacons', yellow, lifts.length * 2);
  root.add(medium, high, services);
  root.userData.lifts = lifts;
  root.userData.vents = vents;
  setCity35LivedInQuality(root, 'medium');
  updateCity35LivedIn(root, 0);
  return root;
}

export function setCity35LivedInQuality(root, quality) {
  if (!root) return;
  root.userData.quality = quality === 'high' ? 'high' : 'medium';
  const high = root.getObjectByName('city35-industrial-high');
  high.visible = root.userData.quality === 'high';
  const { lifts, cabins, glass, beacons, exhaust } = refs(root);
  const count = root.userData.quality === 'high' ? lifts.length : Math.min(6, lifts.length);
  cabins.count = glass.count = count;
  beacons.count = count * 2;
  exhaust.count = high.visible ? root.userData.vents.length : 0;
}

export function updateCity35LivedIn(root, travel = 0) {
  if (!root || !Number.isFinite(travel)) return;
  const { lifts, vents, cabins, glass, beacons, exhaust } = refs(root);
  const phase = root.userData.phase || 0;
  for (let i = 0; i < cabins.count; i++) {
    const p = lifts[i];
    const cycle = Math.sin(travel * 0.009 * p.speed + p.phase + phase);
    const height = p.low + (p.height - p.low) * (0.5 + cycle * 0.5);
    transform(cabins, i, p.x, height, p.z, 3.0, 3.1, 2.8);
    transform(glass, i, p.x, height + 0.1, p.z + 1.48, 2.38, 1.8, 0.18);
    for (const sign of [-1, 1]) {
      const signal = i * 2 + (sign > 0 ? 1 : 0);
      transform(beacons, signal, p.x + sign * 1.18, height + 1.52,
        p.z + 0.5, 0.37, 0.24 + 0.08 * Math.sin(travel * 0.05 + p.phase), 0.34);
    }
  }
  if (cabins.count) for (const mesh of [cabins, glass, beacons]) mesh.instanceMatrix.needsUpdate = true;
  const fanMeshes = root.getObjectByName('city35-moving-turbine-rotors');
  if (root.getObjectByName('city35-industrial-high').visible) {
    for (let i = 0; i < vents.length; i++) {
      const v = vents[i];
      const pulse = 0.6 + 0.4 * Math.sin(travel * 0.012 + v.phase);
      const rise = (travel * 0.017 + v.phase * 5) % 7;
      transform(exhaust, i, v.x, v.y + rise, v.z,
        1.9 + pulse * 0.8, 5.4 + pulse * 2.1, 1.9 + pulse * 0.8, Math.PI);
      transform(fanMeshes, i, v.x - 1.7, v.y - 2.9, v.z,
        2.35, 0.13, 0.36, 0, travel * 0.025 + v.phase);
    }
    if (vents.length) {
      exhaust.instanceMatrix.needsUpdate = true;
      fanMeshes.instanceMatrix.needsUpdate = true;
    }
  }
}
export function city35LivedInSnapshot(root) {
  if (!root) return null;
  const { cabins, lifts, beacons } = refs(root);
  const mat = new T.Matrix4();
  const heights = [];
  for (let i = 0; i < cabins.count; i++) {
    cabins.getMatrixAt(i, mat);
    heights.push(mat.elements[13]);
  }
  return {
    tile: root.parent?.name ?? null,
    quality: root.userData.quality,
    pads: root.getObjectByName('city35-rooftop-landing-pads').count,
    lifts: cabins.count,
    beacons: beacons.count,
    vents: root.getObjectByName('city35-ventilated-vapour').count,
    heights,
  };
}
