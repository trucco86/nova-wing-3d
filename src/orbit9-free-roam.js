// Orbit-9 free-roam district layout. No browser, renderer or campaign dependency.
export const ORBIT9_BOUNDS = Object.freeze({ minX: -56, maxX: 56, minZ: -100, maxZ: 18 });
export const ORBIT9_PLAYER_RADIUS = 1.65;
export const ORBIT9_SPAWN = Object.freeze({ x: 0, z: 12 });

export const ORBIT9_DISTRICTS = Object.freeze([
  Object.freeze({ id: 'central', name: 'ÁTRIO DA DEVASTADOR', x: 0, z: -38, width: 112, depth: 116 }),
  Object.freeze({
    id: 'science',
    name: 'LABORATÓRIO DE SINAIS',
    x: -34,
    z: -28,
    width: 43,
    depth: 55,
  }),
  Object.freeze({ id: 'reactor', name: 'PRAÇA DO REATOR', x: 34, z: -56, width: 43, depth: 65 }),
  Object.freeze({
    id: 'archive',
    name: 'ARQUIVOS DA DEVASTADOR',
    x: -33,
    z: -81,
    width: 42,
    depth: 29,
  }),
]);

// Visual landmark bodies are physical, but decorations and clues are not.
export const ORBIT9_OBSTACLES = Object.freeze([
  Object.freeze({ id: 'core', x: 0, z: -44, halfX: 7.5, halfZ: 10, height: 15 }),
  Object.freeze({ id: 'research-pillar', x: -22, z: -44, halfX: 4.5, halfZ: 5, height: 8 }),
  Object.freeze({ id: 'reactor-pillar', x: 27, z: -40, halfX: 5, halfZ: 7, height: 10 }),
  Object.freeze({ id: 'cargo-west', x: -18, z: -72, halfX: 4.5, halfZ: 4.5, height: 6 }),
  Object.freeze({ id: 'cargo-east', x: 19, z: -70, halfX: 4.5, halfZ: 5, height: 6 }),
]);

export const ORBIT9_CLUE_POSITIONS = Object.freeze([
  Object.freeze([-38, -18]),
  Object.freeze([39, -55]),
  Object.freeze([-37, -82]),
]);
export const ORBIT9_SURVIVOR = Object.freeze([9, -92]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function orbit9Blocked(x, z, radius = ORBIT9_PLAYER_RADIUS) {
  return ORBIT9_OBSTACLES.some(
    (solid) =>
      Math.abs(x - solid.x) < solid.halfX + radius && Math.abs(z - solid.z) < solid.halfZ + radius,
  );
}
export function orbit9Move(x, z, dx, dz, radius = ORBIT9_PLAYER_RADIUS) {
  if (![x, z, dx, dz, radius].every(Number.isFinite) || radius < 0)
    return { x: ORBIT9_SPAWN.x, z: ORBIT9_SPAWN.z };
  const nextX = clamp(x + dx, ORBIT9_BOUNDS.minX + radius, ORBIT9_BOUNDS.maxX - radius);
  const nextZ = clamp(z + dz, ORBIT9_BOUNDS.minZ + radius, ORBIT9_BOUNDS.maxZ - radius);
  // Slide independently along obstacles rather than sticking at corners.
  let px = x;
  let pz = z;
  if (!orbit9Blocked(nextX, pz, radius)) px = nextX;
  if (!orbit9Blocked(px, nextZ, radius)) pz = nextZ;
  return { x: px, z: pz };
}
export function orbit9District(x, z) {
  if (x < -20 && z < -61) return ORBIT9_DISTRICTS[3];
  if (x < -20) return ORBIT9_DISTRICTS[1];
  if (x > 20) return ORBIT9_DISTRICTS[2];
  return ORBIT9_DISTRICTS[0];
}
export function orbit9MapPoint(x, z) {
  return {
    x: clamp(((x - ORBIT9_BOUNDS.minX) / (ORBIT9_BOUNDS.maxX - ORBIT9_BOUNDS.minX)) * 100, 0, 100),
    y: clamp(((z - ORBIT9_BOUNDS.minZ) / (ORBIT9_BOUNDS.maxZ - ORBIT9_BOUNDS.minZ)) * 100, 0, 100),
  };
}
