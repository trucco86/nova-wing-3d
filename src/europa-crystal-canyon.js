import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// QA168: authored scenery only. All collision and targeting remain in the
// existing world. A small number of instanced draws keeps mobile WebGL viable.
export const EUROPA_CANYON_BUDGET = Object.freeze({
  cliffInstances: 24,
  cyanCrystalInstances: 22,
  violetCrystalInstances: 14,
  ruinArchInstances: 8,
  decorativeDrawsHigh: 7,
  decorativeDrawsMedium: 6,
  corridorHalfWidth: 72,
});

function facetedIceCliff() {
  const rings = [
    { y: -0.5, radius: 1.0, tint: '#244969' },
    { y: -0.21, radius: 0.95, tint: '#2b587a' },
    { y: 0.06, radius: 0.82, tint: '#568da9' },
    { y: 0.34, radius: 0.64, tint: '#8bc4db' },
    { y: 0.5, radius: 0.59, tint: '#d4f3fb' },
  ];
  const sides = 9;
  const positions = [];
  const colors = [];
  const indices = [];
  for (let level = 0; level < rings.length; level++) {
    const ring = rings[level];
    const color = new T.Color(ring.tint);
    for (let side = 0; side < sides; side++) {
      const theta = (side / sides) * Math.PI * 2;
      const relief = 1 + 0.12 * Math.sin(side * 5.11 + level * 2.43);
      const ledge = level === 3 && side % 3 === 0 ? 0.11 : 0;
      positions.push(
        Math.cos(theta) * (ring.radius + ledge) * relief,
        ring.y + (level === 0 ? 0 : 0.025 * Math.sin(side * 3.7 + level)),
        Math.sin(theta) * ring.radius * (1 + 0.09 * Math.cos(side * 2.3 + level)),
      );
      const shade = 0.82 + 0.18 * Math.max(0, Math.sin(side * 1.71 + level));
      colors.push(color.r * shade, color.g * shade, color.b * shade);
    }
  }
  for (let row = 0; row < rings.length - 1; row++)
    for (let side = 0; side < sides; side++) {
      const a = row * sides + side;
      const b = row * sides + ((side + 1) % sides);
      const c = (row + 1) * sides + side;
      const d = (row + 1) * sides + ((side + 1) % sides);
      indices.push(a, c, b, b, c, d);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function crystallineShard(violet = false) {
  // A six-sided double tapered prism reads as a crystal rather than an
  // icosahedral bubble. Four colour layers create faceted internal depth.
  const radius = [0.18, 0.7, 0.55, 0.03];
  const height = [-0.5, -0.25, 0.16, 0.5];
  const colorsAt = violet
    ? ['#48257a', '#8e47d9', '#c58dff', '#f5dcff']
    : ['#265a85', '#2eb9e2', '#b0f5ff', '#e1faff'];
  const positions = [];
  const colors = [];
  const indices = [];
  for (let level = 0; level < radius.length; level++) {
    const c = new T.Color(colorsAt[level]);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * radius[level],
        height[level],
        Math.sin(angle) * radius[level],
      );
      const shade = 0.8 + 0.2 * Math.sin(angle * 2 + level);
      colors.push(c.r * shade, c.g * shade, c.b * shade);
    }
  }
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 6; i++) {
      const a = level * 6 + i;
      const b = level * 6 + ((i + 1) % 6);
      const c = (level + 1) * 6 + i;
      const d = (level + 1) * 6 + ((i + 1) % 6);
      indices.push(a, c, b, b, c, d);
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function alienAqueductArch() {
  // Build a readable load-bearing arch out of six pieces. Merging the pieces
  // once avoids a draw per pillar. It is anchored on Europa's LEFT cliff.
  const parts = [];
  const stone = (x, y, z, w, h, d, lean = 0) => {
    const geometry = new T.BoxGeometry(w, h, d);
    geometry.rotateZ(lean);
    geometry.translate(x, y, z);
    parts.push(geometry);
  };
  stone(-0.43, -0.08, 0, 0.2, 1.55, 0.26, -0.035);
  stone(0.43, -0.08, 0, 0.2, 1.55, 0.26, 0.035);
  stone(0, 0.64, 0, 1.07, 0.19, 0.33);
  stone(-0.25, 0.51, 0, 0.37, 0.13, 0.27, -0.22);
  stone(0.25, 0.51, 0, 0.37, 0.13, 0.27, 0.22);
  stone(0, 0.82, 0, 1.15, 0.1, 0.35);
  const g = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  if (!g || !g.index) throw new Error('Europa colonnade must be merged and indexed');
  g.computeBoundingSphere();
  return g;
}

function instanced(root, name, geometry, material, count, position) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  const t = new T.Object3D();
  const originalDepth = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = position(i);
    originalDepth[i] = p.z;
    t.position.set(p.x, p.y, p.z);
    t.rotation.set(0, p.yaw ?? 0, p.roll ?? 0);
    t.scale.set(p.w, p.h, p.d);
    t.updateMatrix();
    mesh.setMatrixAt(i, t.matrix);
  }
  mesh.userData.authoredDepth = originalDepth;
  mesh.instanceMatrix.needsUpdate = true;
  root.add(mesh);
  return mesh;
}

export function createEuropaCrystalCanyon() {
  const root = new T.Group();
  root.name = 'europa-premium-crystal-canyon';
  root.userData.visualOnly = true;
  root.userData.fixedSky = true;
  root.userData.europaForeground = true;
  const icyStone = new T.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.48,
    metalness: 0.06,
    flatShading: true,
    emissive: '#12364e',
    emissiveIntensity: 0.085,
  });
  const cliffs = instanced(
    root,
    'europa-canyon-grounded-cliffs',
    facetedIceCliff(),
    icyStone,
    EUROPA_CANYON_BUDGET.cliffInstances,
    (i) => {
      const side = i % 2 ? 1 : -1;
      const h = 55 + ((i * 7) % 5) * 9;
      return {
        x: side * (133 + (i % 3) * 13),
        y: -7 + h * 0.48,
        z: -250 - Math.floor(i / 2) * 118,
        w: 56 + (i % 3) * 7,
        h,
        d: 90 + (i % 2) * 10,
        yaw: side * 0.12,
      };
    },
  );
  cliffs.userData.layer = 'canyon';

  const shard = crystallineShard();
  for (const [name, count, tint, glow, highOnly] of [
    [
      'europa-canyon-crystal-cyan',
      EUROPA_CANYON_BUDGET.cyanCrystalInstances,
      '#9eebff',
      '#287bba',
      false,
    ],
    [
      'europa-canyon-crystal-violet',
      EUROPA_CANYON_BUDGET.violetCrystalInstances,
      '#dfa9ff',
      '#8431be',
      true,
    ],
  ]) {
    const crystal = instanced(
      root,
      name,
      highOnly ? crystallineShard(true) : shard,
      new T.MeshStandardMaterial({
        color: tint,
        vertexColors: true,
        roughness: 0.24,
        metalness: 0.1,
        flatShading: true,
        emissive: glow,
        emissiveIntensity: highOnly ? 0.9 : 0.68,
      }),
      count,
      (i) => {
        const side = i % 2 ? 1 : -1;
        const nearCluster = i < (highOnly ? 6 : 10);
        const h = nearCluster ? 37 + (i % 3) * 11 : 17 + (i % 5) * 5;
        return {
          // Close clusters now occupy the readable inside edge of the canyon.
          // Their full geometry stays outside the x +/-72 combat corridor.
          x: side * (nearCluster ? 98 + (i % 3) * 11 : 110 + (i % 4) * 14),
          y: -7 + h * 0.44,
          z: nearCluster
            ? -150 - Math.floor(i / 2) * (highOnly ? 124 : 94)
            : -545 - Math.floor((i - (highOnly ? 6 : 10)) / 2) * 145,
          w: nearCluster ? 14 + (i % 3) * 3 : 8 + (i % 3) * 2,
          h,
          d: nearCluster ? 13 + (i % 3) * 3 : 9 + (i % 3) * 2,
          yaw: (i * 0.9) % Math.PI,
          roll: (i % 2 ? 1 : -1) * 0.13,
        };
      },
    );
    crystal.userData.highOnly = highOnly;
    crystal.userData.layer = 'crystals';
  }

  const ruins = instanced(
    root,
    'europa-canyon-ancient-bridges',
    alienAqueductArch(),
    new T.MeshStandardMaterial({
      color: '#658eae',
      roughness: 0.69,
      metalness: 0.14,
      flatShading: true,
      emissive: '#403563',
      emissiveIntensity: 0.14,
    }),
    EUROPA_CANYON_BUDGET.ruinArchInstances,
    (i) => ({
      x: -134,
      y: 21,
      z: -245 - i * 146,
      w: 50,
      h: 47,
      d: 9,
      yaw: Math.PI / 2,
    }),
  );
  ruins.userData.layer = 'architecture';

  // One single, physically anchored alien portal. Unlike the old repeated
  // torus corridor, its arc is broken and has a visible engineered purpose.
  const gate = new T.Group();
  gate.name = 'europa-canyon-distant-alien-gateway';
  gate.position.set(132, 47, -610);
  gate.userData.visualOnly = true;
  gate.userData.fixedSky = true;
  const stone = new T.MeshStandardMaterial({
    color: '#5b7497',
    roughness: 0.56,
    metalness: 0.34,
    flatShading: true,
    emissive: '#261b4e',
    emissiveIntensity: 0.08,
  });
  const arcGeometries = [];
  for (const angle of [0.1, Math.PI + 0.12]) {
    const arc = new T.TorusGeometry(1, 0.075, 6, 26, Math.PI * 0.83);
    arc.rotateZ(angle);
    arcGeometries.push(arc);
  }
  const combinedArc = mergeGeometries(arcGeometries);
  for (const arc of arcGeometries) arc.dispose();
  if (!combinedArc) throw new Error('Europa gateway must be a merged broken arch');
  const ring = new T.Mesh(combinedArc, stone);
  ring.name = 'europa-canyon-anchored-broken-gateway';
  ring.scale.set(45, 53, 12);
  ring.userData.visualOnly = true;
  gate.add(ring);
  const reactor = new T.Mesh(
    new T.OctahedronGeometry(12, 0),
    new T.MeshStandardMaterial({
      color: '#d4b9ff',
      roughness: 0.25,
      metalness: 0.25,
      emissive: '#733cc1',
      emissiveIntensity: 0.78,
      flatShading: true,
    }),
  );
  reactor.name = 'europa-canyon-suspended-reactor';
  reactor.userData.visualOnly = true;
  gate.add(reactor);
  root.add(gate);
  // Frozen cloud banks sit above the cliffs, NOT across the targeting lane.
  // All ten volumes share one translucent draw with soft procedural edges.
  const frostClouds = instanced(
    root,
    'europa-frozen-cloud-banks',
    new T.PlaneGeometry(1, 1),
    new T.ShaderMaterial({
      uniforms: { tint: { value: new T.Color('#b3ddef') } },
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 vUv;uniform vec3 tint;void main(){vec2 q=(vUv-.5)*vec2(1.1,1.7);float r=length(q);float n=sin(vUv.x*17.)*sin(vUv.y*23.)*.07+sin(vUv.x*37.+vUv.y*13.)*.04;float a=(1.-smoothstep(.3,.78,r+n))*.16;gl_FragColor=vec4(tint,a);}',
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    }),
    10,
    (i) => ({
      x: (i % 2 ? 1 : -1) * (152 + (i % 3) * 13),
      y: 82 + (i % 4) * 9,
      z: -265 - Math.floor(i / 2) * 270,
      w: 104 + (i % 3) * 22,
      h: 42 + (i % 3) * 10,
      d: 1,
    }),
  );
  frostClouds.userData.layer = 'frozen-clouds';
  setEuropaCrystalCanyonQuality(root, 'high');
  return root;
}

export function setEuropaCrystalCanyonQuality(root, quality = 'high') {
  if (!root) return;
  // High-only crystal batches are direct root children. No per-frame tree
  // traversal or geometry/material recreation during adaptive FPS changes.
  for (const child of root.children) {
    if (child.userData.highOnly) child.visible = quality === 'high';
  }
}

// Europa's canyon is WORLD SPACE, not a static sky painting. Real flight moves
// each ice landmark toward/behind the camera, with different depth rates to
// preserve parallax. Batched decorations recycle only once well behind the
// player. The unique architectural gate must never respawn.
const CANYON_FAR = -1900;
const CANYON_NEAR = 160;
const CANYON_SPAN = CANYON_NEAR - CANYON_FAR;
export function europaCanyonDepth(base, travel, speed = 0.6) {
  if (![base, travel, speed].every(Number.isFinite) || speed < 0 || travel < 0)
    throw new RangeError('Invalid Europa canyon travel');
  const z = base + travel * speed;
  return z < CANYON_NEAR ? z : CANYON_FAR + ((z - CANYON_FAR) % CANYON_SPAN);
}
export function updateEuropaCrystalCanyonMotion(root, travel) {
  if (!root || !Number.isFinite(travel) || travel < 0) return false;
  for (const mesh of root.children) {
    const depth = mesh.userData.authoredDepth;
    if (!mesh.isInstancedMesh || !depth) continue;
    const speed =
      mesh.userData.layer === 'frozen-clouds'
        ? 0.27
        : mesh.userData.layer === 'architecture'
          ? 0.48
          : mesh.userData.layer === 'crystals'
            ? 0.72
            : 0.59;
    const matrices = mesh.instanceMatrix.array;
    for (let i = 0; i < depth.length; i++)
      matrices[i * 16 + 14] = europaCanyonDepth(depth[i], travel, speed);
    mesh.instanceMatrix.needsUpdate = true;
  }
  const gateway = root.getObjectByName('europa-canyon-distant-alien-gateway');
  if (gateway) {
    // A distinct destination flies past ONCE, not stuck at the horizon nor
    // recreated after the camera passes it.
    gateway.position.z = Math.min(160, -610 + travel * 0.42);
  }
  root.userData.motionTravel = travel;
  return true;
}
