import * as T from 'three';

// Selective, short-lived emissive lighting survives the mobile direct renderer
// without enabling full-screen bloom or adding dozens of dynamic lights.
const burstCore = new T.SphereGeometry(0.65, 12, 8);
const ringGeo = new T.RingGeometry(0.53, 1, 20);
const stripGeo = new T.PlaneGeometry(1, 1);
const baseColor = new T.Color('#71edff');
function glowMesh(parent, name, geometry, x, y, z, sx, sy, sz) {
  const material = new T.MeshBasicMaterial({
    color: baseColor,
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
    side: T.DoubleSide,
    toneMapped: false,
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.visible = false;
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}
export function createHeroWeaponEffects(player, robot) {
  const craft = new T.Group();
  craft.name = 'hero-weapon-glow';
  // Wing surface reflection: a bright, shallow strip that looks like the shot
  // is illuminating the paint. These remain inside the original silhouette.
  const strips = [-1, 1].map((side) =>
    glowMesh(craft, 'hero-wing-shot-reflection', stripGeo, side * 1.93, 0.34, -0.74,
      1.23, 2.45, 1));
  for (const [i, mesh] of strips.entries()) mesh.rotation.z = i ? -0.36 : 0.36;
  const flash = glowMesh(craft, 'hero-muzzle-flash', burstCore, 0, 0.12, -3.43, 0.65, 0.65, 1.55);
  const ring = glowMesh(craft, 'hero-muzzle-energy-ring', ringGeo, 0, 0.12, -3.48, 1.14, 1.14, 1);
  player.add(craft);
  const mechMuzzles = [
    robot.userData.mecha?.arms?.left?.muzzle,
    robot.userData.mecha?.arms?.right?.muzzle,
  ].filter(Boolean);
  const hands = mechMuzzles.map((muzzle) =>
    glowMesh(muzzle, 'mecha-arm-flash', burstCore, 0, 0, -0.95, 0.65, 0.65, 1.25));
  const chest = glowMesh(robot, 'mecha-chest-shot-reflection', stripGeo,
    0, 1.66, -1.42, 1.48, 1.0, 1);
  const light = new T.PointLight('#7cefff', 0, 9, 2);
  light.name = 'hero-shot-local-light';
  light.position.set(0, 0.28, -2.35);
  light.visible = false;
  player.add(light);
  let remaining = 0;
  let duration = 0.17;
  let robotMode = false;
  let precision = false;
  let useLight = false;
  let active = true;
  const visuals = [...strips, flash, ring, ...hands, chest];
  function setQuality(quality, coarsePointer = false) {
    useLight = !coarsePointer && quality === 'high';
    if (!useLight) light.visible = false;
  }
  function pulse({ robot: mecha = false, charged = false, precisionShot = false,
    color = '#71edff' } = {}) {
    robotMode = mecha;
    precision = precisionShot;
    duration = charged ? 0.3 : precisionShot ? 0.22 : 0.16;
    remaining = duration;
    baseColor.set(color);
    for (const mesh of visuals) mesh.material.color.copy(baseColor);
    light.color.copy(baseColor);
    active = true;
  }
  function tick(dt, visible = true) {
    if (!Number.isFinite(dt) || dt < 0) return;
    if (!visible || !active) remaining = 0;
    else remaining = Math.max(0, remaining - dt);
    const t = duration > 0 ? remaining / duration : 0;
    const lum = Math.sin(t * Math.PI) * (0.3 + 0.7 * t);
    for (const mesh of [...strips, flash, ring]) {
      mesh.visible = t > 0 && !robotMode;
      mesh.material.opacity = lum * (mesh === flash ? 0.9 : 0.52);
    }
    for (const [i, mesh] of hands.entries()) {
      mesh.visible = t > 0 && robotMode && (!precision || i === 0);
      mesh.material.opacity = lum * 0.95;
    }
    chest.visible = t > 0 && robotMode;
    chest.material.opacity = lum * 0.42;
    flash.scale.z = 1.55 * (0.8 + t * 0.55);
    ring.scale.setScalar(1.14 + (1 - t) * 0.55);
    light.visible = useLight && t > 0 && !robotMode;
    light.intensity = useLight ? lum * 7 : 0;
  }
  function reset() {
    active = false;
    remaining = 0;
    tick(0, false);
  }
  return { pulse, tick, reset, setQuality, snapshot: () => ({
    remaining, useLight, robotMode,
    activeMeshes: visuals.filter((mesh) => mesh.visible).length,
  }) };
}
