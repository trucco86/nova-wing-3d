import * as T from 'three';

// Non-combat traffic for City 2.7. All details are batched on the GPU.
// Positions are reproducible from travelled distance so Pause never drifts.
const cube = new T.BoxGeometry(1, 1, 1);
// Shared faceted hood and cockpit replacing the squared vehicle silhouette.
// Local +Z is the rear; the leading -Z end narrows down toward the road.
function aerodynamicWedge(frontHeight = 0.15, backHeight = 0.45) {
  const v = [
    [-0.34, -0.44, -0.5], [0.34, -0.44, -0.5],
    [-0.34, frontHeight, -0.5], [0.34, frontHeight, -0.5],
    [-0.5, -0.44, 0.5], [0.5, -0.44, 0.5],
    [-0.5, backHeight, 0.5], [0.5, backHeight, 0.5],
  ].flat();
  const indices = [
    0, 1, 3, 0, 3, 2, // nose
    4, 6, 7, 4, 7, 5, // stern
    2, 3, 7, 2, 7, 6, // beveled top
    0, 4, 5, 0, 5, 1, // underside
    0, 2, 6, 0, 6, 4, // port
    1, 5, 7, 1, 7, 3, // starboard
  ];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(v, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
const aerodynamicHull = aerodynamicWedge(0.10, 0.46);
const panoramicGlass = aerodynamicWedge(0.08, 0.45);
const materials = {
  hull: new T.MeshStandardMaterial({ color: '#77a9b9', metalness: 0.72, roughness: 0.27 }),
  prow: new T.MeshPhysicalMaterial({ color: '#adc6d2', metalness: 0.8, roughness: 0.23, clearcoat: 0.65 }),
  taxi: new T.MeshStandardMaterial({ color: '#b9c2d1', metalness: 0.75, roughness: 0.26 }),
  escape: new T.MeshStandardMaterial({ color: '#6d86a4', metalness: 0.8, roughness: 0.28 }),
  glazing: new T.MeshStandardMaterial({ color: '#214c65', metalness: 0.43, roughness: 0.1 }),
  cyan: new T.MeshBasicMaterial({ color: '#77efff', toneMapped: false }),
  orange: new T.MeshBasicMaterial({ color: '#ffae6f', toneMapped: false }),
  red: new T.MeshBasicMaterial({ color: '#ff6481', toneMapped: false }),
};
const PROFILES = Object.freeze([
  {
    role: 'road',
    count: 12,
    medium: 8,
    parts: [
      ['hull', 0, 0, 0, 5.8, 2.1, 11.6],
      ['prow', 0, 0.15, -5.5, 5.2, 2.0, 3.8],
      ['glazing', 0, 1.25, -0.5, 4.4, 1.1, 5.9],
      ['cyan', 0, -1.1, 0, 5.5, 0.3, 9.6],
      ['cyan', 0, 0.05, -5.95, 4.2, 0.65, 0.3],
      ['red', 0, 0.1, 5.95, 4.2, 0.52, 0.3],
    ],
  },
  {
    role: 'flycar',
    count: 7,
    medium: 4,
    parts: [
      ['taxi', 0, 0, 0, 7, 2.5, 14],
      ['prow', 0, 0.15, -6.5, 6.1, 2.0, 5.4],
      ['glazing', 0, 1.4, -1.7, 5.4, 1.1, 7.3],
      ['taxi', 0, -0.25, 1.2, 15, 0.65, 3.2],
      ['cyan', 0, -1.55, -2, 5.6, 0.4, 8],
      ['orange', 0, -0.05, 7.25, 4, 0.6, 0.5],
    ],
  },
  {
    role: 'escape',
    count: 6,
    medium: 3,
    parts: [
      ['escape', 0, 0, 0, 8.5, 3.9, 24],
      ['prow', 0, 0.35, -11.6, 7.3, 3.2, 8.1],
      ['glazing', 0, 2.3, -5.5, 5.4, 1.6, 7],
      ['escape', 0, -0.6, 2.0, 21, 0.85, 8.5],
      ['cyan', 0, 0.8, -10.7, 4.9, 0.5, 1.7],
      ['orange', -3.1, -0.35, 12.3, 2.1, 1.15, 3.6],
      ['orange', 3.1, -0.35, 12.3, 2.1, 1.15, 3.6],
    ],
  },
]);
const template = new T.Object3D();
const root = new T.Object3D();
const tempMatrix = new T.Matrix4();

function positionFor(role, i, travel, phase) {
  const side = i % 2 ? 1 : -1;
  if (role === 'road') {
    const direction = i % 3 === 0 ? -1 : 1;
    const step = (i * 147 + phase + travel * (0.24 + (i % 4) * 0.09)) % 1800;
    return {
      x: side * (18 + (i % 3) * 4),
      y: -4.4 + Math.sin(travel * 0.018 + i) * 0.15,
      z: -55 - (direction === 1 ? step : 1800 - step),
      rx: 0,
      rz: 0,
      ry: direction === 1 ? 0 : Math.PI,
    };
  }
  if (role === 'flycar') {
    const phaseValue = (i * 251 + phase + travel * (0.34 + i * 0.027)) % 1820;
    const bank = Math.sin(travel * 0.01 + i * 1.9) * 0.09;
    return {
      x: side * (110 + i * 4 + 15 * Math.sin(travel * 0.006 + i)),
      y: 41 + (i % 4) * 15 + Math.sin(travel * 0.017 + i) * 4,
      z: -75 - phaseValue,
      rx: -0.055,
      ry: side * 0.17,
      rz: bank,
    };
  }
  const climb = ((i * 343 + phase + travel * (0.2 + i * 0.018)) % 1800) / 1800;
  return {
    x: side * (66 + (i % 3) * 23 + climb * 60),
    y: 50 + climb * 380,
    z: -170 - i * 223 - climb * 110,
    rx: -0.12 - climb * 0.52,
    ry: side * 0.08,
    rz: side * (-0.05 - climb * 0.11),
  };
}

export function createCityTraffic() {
  const traffic = new T.Group();
  traffic.name = 'city-active-traffic';
  traffic.userData.visualOnly = true;
  traffic.userData.trafficPhase = 0;
  traffic.userData.quality = 'medium';
  traffic.userData.roleCounts = Object.fromEntries(PROFILES.map((p) => [p.role, p.count]));
  for (const p of PROFILES) {
    const group = new T.Group();
    group.name = 'city-traffic-' + p.role;
    group.userData.visualOnly = true;
    group.userData.role = p.role;
    group.userData.mediumCount = p.medium;
    group.userData.totalCount = p.count;
    for (const [materialName, ...parameters] of p.parts) {
      const geometry = materialName === 'prow' ? aerodynamicHull : materialName === 'glazing' ? panoramicGlass : cube;
      const mesh = new T.InstancedMesh(geometry, materials[materialName], p.count);
      mesh.name = 'city-traffic-' + p.role + '-' + materialName;
      mesh.frustumCulled = false; // Vehicles move independently within each tile.
      mesh.userData.visualOnly = true;
      mesh.userData.part = parameters;
      mesh.count = p.medium;
      group.add(mesh);
    }
    traffic.add(group);
  }
  animateCityTraffic(traffic, 0);
  return traffic;
}

export function setCityTrafficQuality(traffic, quality) {
  if (!traffic) return;
  const high = quality === 'high';
  traffic.userData.quality = high ? 'high' : 'medium';
  traffic.children.forEach((group) => {
    const count = high ? group.userData.totalCount : group.userData.mediumCount;
    group.children.forEach((mesh) => {
      mesh.count = count;
    });
  });
}

export function animateCityTraffic(traffic, travel) {
  if (!traffic || !Number.isFinite(travel)) return;
  const phase = traffic.userData.trafficPhase || 0;
  for (const p of PROFILES) {
    const group = traffic.getObjectByName('city-traffic-' + p.role);
    if (!group) continue;
    for (let i = 0; i < p.count; i++) {
      const pos = positionFor(p.role, i, travel, phase);
      root.position.set(pos.x, pos.y, pos.z);
      root.rotation.set(pos.rx, pos.ry, pos.rz);
      root.scale.setScalar(1);
      root.updateMatrix();
      for (const mesh of group.children) {
        const [x, y, z, w, h, d] = mesh.userData.part;
        template.position.set(x, y, z);
        template.rotation.set(0, 0, 0);
        template.scale.set(w, h, d);
        template.updateMatrix();
        tempMatrix.multiplyMatrices(root.matrix, template.matrix);
        mesh.setMatrixAt(i, tempMatrix);
      }
    }
    for (const mesh of group.children) mesh.instanceMatrix.needsUpdate = true;
  }
}
