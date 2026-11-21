import * as T from 'three';
import { europaDescentAt } from './europa-descent.js';
import {
  createEuropaCrystalCanyon,
  setEuropaCrystalCanyonQuality,
} from './europa-crystal-canyon.js';

// Europe is a grounded frozen world after its fissure descent, not a second
// orbital globe. Keep the ice-floor swap deterministic in game time.
export function europaSurfaceAt(seconds, tunnelActive = false) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid Europa arrival time');
  const descent = europaDescentAt(seconds);
  const surface = descent.terrainReveal;
  // Planetary approach remains visible until the ice scenery has visibly
  // emerged; do not strand the player in black space for 5+ seconds.
  const orbital = descent.planetOpacity;
  return Object.freeze({
    surface,
    orbitalVisible: orbital > 0.01,
    orbitalOpacity: orbital,
    terrainLift: descent.terrainLift,
    // Clear, layered night-blue frost rather than a white-grey blurred wall.
    frostDensity: 0.001 + surface * 0.00038,
    fogTint: '#355b78',
    groundVisible: descent.terrainVisible && surface > 0.01 && !tunnelActive,
    tunnelActive: Boolean(tunnelActive),
  });
}

// Authored snow is episodic to avoid a continuous grey blur over combat.
// Three fixed windows cover canyon entry, a mid-route squall and pre-boss ice.
const EUROPA_SNOW_WINDOWS = Object.freeze([
  { start: 25, end: 39, intensity: 0.52 },
  { start: 47, end: 62, intensity: 0.95 },
  { start: 71, end: 84, intensity: 0.64 },
]);
const smoothSnow = (v) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
export function europaWeatherAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid Europa weather time');
  for (const window of EUROPA_SNOW_WINDOWS) {
    if (seconds < window.start || seconds >= window.end) continue;
    const fadeIn = smoothSnow((seconds - window.start) / 2);
    const fadeOut = smoothSnow((window.end - seconds) / 2);
    const intensity = window.intensity * Math.min(fadeIn, fadeOut);
    return {
      intensity,
      active: intensity > 0.05,
      phase: window.intensity > 0.9 ? 'ice-squall' : 'light-snow',
      wind: Math.sin(seconds * 0.31) * (1.8 + intensity * 5),
    };
  }
  return { intensity: 0, active: false, phase: 'clear', wind: 0 };
}

const europaSurfaceParts = new WeakMap();
const europaCanyonParts = new WeakMap();

const hash = (n) => {
  const t = Math.sin(n * 127.12 + 11.47) * 43758.5453;
  return t - Math.floor(t);
};

// A faceted *geological* profile, not a row of tall featureless cones.
// Every ridge shares this vertex-coloured indexed geometry and remains within
// the same existing InstancedMesh draw. Thin crest and wider fractured foot
// make each scaled glacier read as a broken wall rather than a spike.
export function createEuropaGlacialRidgeGeometry() {
  const sides = 7;
  const rings = [
    { y: -0.5, radius: 1 },
    { y: -0.22, radius: 0.93 },
    { y: 0.08, radius: 0.74 },
    { y: 0.34, radius: 0.38 },
    { y: 0.5, radius: 0.085 },
  ];
  const positions = [];
  const colors = [];
  const indices = [];
  const tints = ['#47758a', '#669caf', '#89bbca', '#c8e1e6', '#eff8f8'];
  for (let ring = 0; ring < rings.length; ring++) {
    const level = rings[ring];
    const tint = new T.Color(tints[ring]);
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      // Frozen faulting and wind-carved crests sculpt the same 35 vertices.
      const relief =
        1 +
        0.13 * Math.sin(side * 2.8 + ring * 1.7) +
        (ring > 0 && ring < rings.length - 1 ? 0.045 * Math.sin(side * 4.1 - ring * 3.2) : 0);
      positions.push(
        Math.cos(angle) * level.radius * relief,
        level.y + (ring === 0 || ring === 4 ? 0 : Math.sin(side * 3.7) * 0.028),
        Math.sin(angle) * level.radius * relief,
      );
      const frost = 0.88 + 0.12 * Math.sin(side * 2.7 + ring * 1.9);
      const crevasse = ring < 2 && side % 3 === 0 ? 0.78 : 1;
      colors.push(tint.r * frost * crevasse, tint.g * frost * crevasse, tint.b * frost);
    }
  }
  for (let ring = 0; ring < rings.length - 1; ring++)
    for (let side = 0; side < sides; side++) {
      const a = ring * sides + side;
      const b = ring * sides + ((side + 1) % sides);
      const c = (ring + 1) * sides + side;
      const d = (ring + 1) * sides + ((side + 1) % sides);
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
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.48,
    metalness: 0.06,
    flatShading: true,
    emissive: '#31596a',
    emissiveIntensity: 0.045,
  });
  // Broad eroded shelves replace rounded placeholder boulders.
  const floe = new T.CylinderGeometry(0.84, 1.12, 0.42, 7, 1);
  const shard = createEuropaGlacialRidgeGeometry();
  const dummy = new T.Object3D();
  for (const [name, count, geo, mat, center] of [
    ['europa-fractured-ice-shelves', 18, floe, ice, 151],
    ['europa-blue-crevasse-ridges', 18, shard, blue, 188],
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
      dummy.scale.set(12 + hash(i * 13) * 31, h, 18 + hash(i * 23) * 45);
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
  europaSurfaceParts.set(root, snow);
  // New frozen canyon and ruins share the surface's existing boss/tunnel
  // visibility contract. No extra shadows, hitboxes, textures or postpasses.
  const canyon = createEuropaCrystalCanyon();
  root.add(canyon);
  europaCanyonParts.set(root, canyon);
  root.visible = false;
  return root;
}

export function updateEuropaSurface(root, time, visible, highQuality = true) {
  if (!root) return;
  root.visible = Boolean(visible);
  // Mirror Mars's ground-rise transition: the same glacier comes into view
  // continuously while the orbital globe fades. No sudden scene swap.
  root.position.y = europaDescentAt(time).terrainLift;
  // Reuse a cached reference to avoid scene traversal on every rendered
  // frame. Cloned scenes get a one-time lookup into their own subtree.
  let canyon = europaCanyonParts.get(root);
  if (!canyon) {
    canyon = root.getObjectByName('europa-premium-crystal-canyon');
    if (canyon) europaCanyonParts.set(root, canyon);
  }
  setEuropaCrystalCanyonQuality(canyon, highQuality ? 'high' : 'medium');
  // The inactive glacier and Medium mode do not calculate invisible VFX
  // or walk the scene hierarchy. WeakMap keeps cloned worlds recoverable.
  let snow = europaSurfaceParts.get(root);
  if (!snow) {
    snow = root.getObjectByName('europa-windborne-ice-snow');
    europaSurfaceParts.set(root, snow);
  }
  if (snow) {
    const weather = europaWeatherAt(time);
    snow.visible = Boolean(visible && highQuality && weather.active);
    if (snow.visible) {
      // One existing Points draw, with wind and snowfall driven by mission
      // seconds. Medium keeps the optional layer disabled for mobile FPS.
      snow.material.opacity = 0.21 + weather.intensity * 0.48;
      snow.position.set(
        Math.sin(time * 0.19) * 7 + weather.wind,
        Math.sin(time * 0.23) * 2,
        -Math.min(25, (time % 8) * 3),
      );
    }
  }
}
