import * as T from 'three';

// Sculpted hero geometry for the user's craft, separate from authoritative
// flight hitboxes and the lighter model. No collision / simulation code here.
const paint = () => {
  const material = new T.MeshPhysicalMaterial({
    color: '#abcfe2',
    metalness: 0.74,
    roughness: 0.25,
    clearcoat: 0.82,
    clearcoatRoughness: 0.17,
  });
  material.userData.paintModule = true;
  return material;
};
const ceramic = () => new T.MeshPhysicalMaterial({
  color: '#152c42',
  metalness: 0.68,
  roughness: 0.32,
  clearcoat: 0.5,
  clearcoatRoughness: 0.2,
});
const titanium = () => new T.MeshStandardMaterial({
  color: '#6c90a5',
  metalness: 0.88,
  roughness: 0.28,
});
const luminous = () => new T.MeshBasicMaterial({
  color: '#5be5f8',
  toneMapped: false,
});

function addMesh(group, geometry, material, name, position = [0, 0, 0]) {
  const part = new T.Mesh(geometry, material);
  part.name = name;
  part.position.set(...position);
  part.castShadow = false; // Keep a bounded WebGL budget without shadow maps.
  part.receiveShadow = false;
  group.add(part);
  return part;
}

function loft(rings, sides = 10) {
  const points = [], uv = [], indices = [];
  for (let i = 0; i < rings.length; i++) {
    const { z, width, height, y = 0 } = rings[i];
    for (let j = 0; j < sides; j++) {
      const angle = (j * Math.PI * 2) / sides;
      points.push(width * Math.cos(angle), y + height * Math.sin(angle), z);
      uv.push(j / (sides - 1), i / (rings.length - 1));
    }
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const next = (j + 1) % sides, a = i * sides + j, b = i * sides + next;
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  for (let j = 1; j < sides - 1; j++) {
    indices.push(0, j, j + 1);
    const end = (rings.length - 1) * sides;
    indices.push(end, end + j + 1, end + j);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function sculptedPlate(points, thickness = 0.13) {
  const shape = new T.Shape();
  points.forEach(([x, z], i) => i ? shape.lineTo(x, z) : shape.moveTo(x, z));
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 2,
    steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function ledRail(parent, points, material, name) {
  // Tapered 3D line, not a z-fighting painted overlay.
  const spline = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
  return addMesh(parent, new T.TubeGeometry(spline, 10, 0.055, 5, false), material, name);
}

export function createHeroFighter(model = 'nova7') {
  const ship = new T.Group();
  ship.name = 'hero-fighter-hull';
  ship.visible = false;
  const primary = paint(), dark = ceramic(), trim = titanium(), glow = luminous();
  const proportions = model === 'specter'
    ? { span: 6.2, body: 0.8, wingY: 0.23, keel: 0.7 }
    : model === 'aegis'
      ? { span: 4.85, body: 1.25, wingY: 0.42, keel: 1.18 }
      : { span: 5.55, body: 1, wingY: 0.34, keel: 1 };
  const { span, body, wingY, keel } = proportions;
  const bodyRings = [
    { z: -5, width: 0.025, height: 0.035, y: 0.1 },
    { z: -4.15, width: 0.19 * body, height: 0.16, y: 0.14 },
    { z: -3.25, width: 0.43 * body, height: 0.31, y: 0.16 },
    { z: -1.85, width: 0.82 * body, height: 0.52, y: 0.17 },
    { z: -0.5, width: 1.08 * body, height: 0.64, y: 0.14 },
    { z: 1.25, width: 1.1 * body, height: 0.55, y: 0.08 },
    { z: 2.8, width: 0.72 * body, height: 0.36, y: 0 },
    { z: 3.32, width: 0.35 * body, height: 0.23, y: 0 },
  ];
  addMesh(ship, loft(bodyRings, 12), primary, 'hero-sculpted-fuselage');
  addMesh(ship,
    loft([
      { z: -2.48, width: 0.21 * body, height: 0.05, y: 0.57 },
      { z: -1.9, width: 0.48 * body, height: 0.29, y: 0.74 },
      { z: -0.8, width: 0.58 * body, height: 0.3, y: 0.77 },
      { z: 0.35, width: 0.4 * body, height: 0.12, y: 0.65 },
      { z: 0.85, width: 0.22 * body, height: 0.035, y: 0.52 },
    ], 12),
    new T.MeshPhysicalMaterial({
      color: '#143e5d', metalness: 0.48, roughness: 0.1,
      clearcoat: 1, clearcoatRoughness: 0.065,
      emissive: '#072136', emissiveIntensity: 0.65,
    }),
    'hero-multifaceted-canopy');
  // Two swept, beveled wing shells dramatically change silhouette at chase distance.
  for (const side of [-1, 1]) {
    const wing = [
      [side * 0.58, -2.25], [side * (span * 0.36), -1.15],
      [side * (span * 0.94), 0.65], [side * span, 1.3],
      [side * (span * 0.81), 1.66], [side * (span * 0.59), 1.22],
      [side * 1.35, 2.65], [side * 0.73, 2.52],
    ];
    addMesh(ship, sculptedPlate(wing, 0.22 * keel), primary,
      'hero-swept-wing-' + side, [0, wingY, 0]);
    const inner = [
      [side * 1.35, -0.68], [side * (span * 0.65), 0.74],
      [side * (span * 0.69), 1.08], [side * 1.9, 0.72],
    ];
    addMesh(ship, sculptedPlate(inner, 0.08), dark,
      'hero-wing-inset-' + side, [0, wingY + 0.09, 0]);
    addMesh(ship, sculptedPlate([
      [side * 1.33, 1.4], [side * (span * 0.82), 1.6],
      [side * (span * 0.77), 2.33], [side * 1.52, 2.1],
    ], 0.16), trim, 'hero-wing-flap-' + side, [0, wingY + 0.12, 0]);
    // Vertical tail fins and engine armor create a recognizable rear profile.
    const fin = addMesh(ship,
      sculptedPlate([[0, -0.98], [0.65, -0.58], [0.85, 0.78], [0.12, 1.25]], 0.09),
      primary, 'hero-vertical-tail-' + side, [side * 1.55, 0.67, 1.35]);
    fin.rotation.z = side * 1.05;
    const nacelle = addMesh(ship,
      new T.CylinderGeometry(0.55 * keel, 0.47 * keel, 2.45, 16),
      dark, 'hero-armored-engine-' + side, [side * 1.2, -0.1, 1.55]);
    nacelle.rotation.x = Math.PI / 2;
    for (let i = 0; i < 2; i++) {
      const ring = addMesh(ship, new T.TorusGeometry(0.51 * keel, 0.065, 8, 24),
        trim, 'hero-engine-ring-' + side + '-' + i, [side * 1.2, -0.1, 1.8 + i * 0.65]);
      ring.rotation.y = 0;
    }
    ledRail(ship, [
      [side * 1.18, wingY + 0.27, -0.62],
      [side * (span * 0.65), wingY + 0.24, 0.83],
      [side * (span * 0.85), wingY + 0.23, 1.23],
    ], glow, 'hero-wing-running-light-' + side);
    for (let i = 0; i < 3; i++) {
      const vent = addMesh(ship, sculptedPlate([
        [side * (1.45 + i * 0.4), 0.18],
        [side * (1.7 + i * 0.4), 0.43],
        [side * (1.72 + i * 0.4), 0.61],
        [side * (1.46 + i * 0.4), 0.38],
      ], 0.028), dark, 'hero-intake-gill-' + side + '-' + i,
      [0, wingY + 0.25, 0]);
      vent.material.side = T.DoubleSide;
    }
  }
  addMesh(ship, sculptedPlate([
    [-0.32 * body, -3.8], [0, -4.32],
    [0.32 * body, -3.8], [0.55 * body, -2.3],
    [-0.55 * body, -2.3],
  ], 0.035), trim, 'hero-nose-armor', [0, 0.39, 0]);
  // Unique visible mass, not another collection of decorative city cubes.
  ship.userData.heroModel = model;
  ship.userData.visualOnly = true;
  ship.userData.materialCount = 4 + 1;
  return ship;
}

/** Armored mecha torso upgrade. Parent at robot root; existing arm pivots survive. */
export function createHeroMechaArmor() {
  const group = new T.Group();
  group.name = 'hero-mecha-armor';
  group.visible = false;
  const primary = paint(), dark = ceramic(), trim = titanium(), glow = luminous();
  const chest = loft([
    { z: -1.12, width: 0.84, height: 0.44, y: 1.52 },
    { z: -0.92, width: 1.22, height: 0.9, y: 1.6 },
    { z: -0.3, width: 1.38, height: 1.1, y: 1.65 },
    { z: 0.45, width: 1.06, height: 0.91, y: 1.62 },
  ], 10);
  addMesh(group, chest, primary, 'hero-mecha-chest-chassis');
  addMesh(group, sculptedPlate([
    [-0.7, -1.12], [0, -1.4], [0.7, -1.12], [0.47, -0.78],
    [0, -0.89], [-0.47, -0.78],
  ], 0.08), dark, 'hero-mecha-pectoral', [0, 2.05, 0]);
  for (const side of [-1, 1]) {
    const shoulder = addMesh(group, sculptedPlate([
      [side * 1.1, -0.98], [side * 2.17, -0.82],
      [side * 2.55, 0.25], [side * 1.38, 0.67],
    ], 0.24), primary, 'hero-mecha-swept-shoulder-' + side,
    [0, 2.6, 0]);
    shoulder.rotation.x = -0.12;
    ledRail(group, [
      [side * 0.76, 1.9, -1.19],
      [side * 1.14, 1.5, -1.22],
      [side * 0.8, 1.02, -1.1],
    ], glow, 'hero-mecha-reactor-rail-' + side);
    addMesh(group, new T.TorusGeometry(0.44, 0.065, 8, 24),
      trim, 'hero-mecha-shoulder-turbine-rim-' + side, [side * 1.65, 2.4, 1.2]);
  }
  addMesh(group, new T.OctahedronGeometry(0.47, 1),
    glow, 'hero-mecha-core', [0, 1.55, -1.34]);
  group.userData.visualOnly = true;
  return group;
}
