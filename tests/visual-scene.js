import * as T from 'three';
import { createWorld, postProcessor, fighter, createFlyingRobot } from '../src/visuals.js';
import { createBossModel, createSubboss, SUBBOSS_NAMES } from '../src/bosses.js';
import { createGroundEnemy, createObstacle } from '../src/encounters.js';
import { createFlightCamera } from '../src/flight.js';
import { createPod, createPickup } from '../src/equipment.js';
import { createCollapse, updateCollapse } from '../src/finale.js';
import { SECTORS } from '../src/campaign.js';
const n = Number(new URLSearchParams(location.search).get('sector') ?? 0);
const index = Number.isInteger(n) && n >= 0 && n < 10 ? n : 0;
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(1);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.append(renderer.domElement);
const scene = new T.Scene(),
  camera = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2500);
camera.position.set(0, 10, 32);
camera.lookAt(0, 8, -70);
const world = createWorld(scene);
world.setSector(SECTORS[index]);
const mode = new URLSearchParams(location.search).get('mode');
const variant = Number(new URLSearchParams(location.search).get('variant') ?? -1);
if (mode === 'mecha') {
  // Static inspection of the actual production geometry, separate from gameplay captures.
  for (const child of scene.children) if (!child.isLight) child.visible = false;
  scene.background = new T.Color('#07121e');
  scene.fog = null;
  const robot = createFlyingRobot();
  scene.add(robot);
  robot.updateWorldMatrix(true, true);
  const bounds = new T.Box3().setFromObject(robot);
  const radius = bounds.getBoundingSphere(new T.Sphere()).radius;
  const center = bounds.getCenter(new T.Vector3());
  const views = { front: [0, 0, -1], profile: [1, 0, 0], rear: [0, 0, 1] };
  const requested = new URLSearchParams(location.search).get('view');
  const view = Object.hasOwn(views, requested) ? requested : 'front';
  camera.fov = 45;
  camera.updateProjectionMatrix();
  const verticalHalfAngle = T.MathUtils.degToRad(camera.fov / 2);
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * camera.aspect);
  const distance = (radius / Math.sin(Math.min(verticalHalfAngle, horizontalHalfAngle))) * 1.12;
  camera.position.copy(center).addScaledVector(new T.Vector3(...views[view]), distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  const projected = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z])
        projected.push(new T.Vector3(x, y, z).project(camera).toArray());
  window.modelInspection = { view, projected };
} else if (mode === 'tunnel' || mode === 'ground') {
  const tunnel = createObstacle(mode === 'tunnel' ? 'tunnel' : 'gantry');
  tunnel.position.z = mode === 'tunnel' ? 90 : -150;
  scene.add(tunnel);
  const tank = createGroundEnemy('tank', variant),
    walker = createGroundEnemy('walker', variant);
  tank.position.set(12, -7, -33);
  walker.position.set(-15, -7, -67);
  scene.add(tank, walker);
  if (variant >= 0) {
    const enemy = fighter(true, variant);
    enemy.scale.setScalar(2);
    enemy.position.set(0, 16, -38);
    enemy.rotation.y = Math.PI;
    scene.add(enemy);
  }
} else if (mode === 'equipment') {
  for (let i = 1; i <= 3; i++) {
    const p = createPod(i);
    p.scale.setScalar(2);
    p.position.set((i - 2) * 15, 7, -25);
    scene.add(p);
  }
  for (const [kind, x] of [
    ['shield', -8],
    ['blue', 8],
  ]) {
    const r = createPickup(kind);
    r.position.set(x, 20, -35);
    scene.add(r);
  }
} else if (mode === 'subboss') {
  const sub = createSubboss(index);
  sub.position.set(0, 10, -85);
  scene.add(sub);
} else if (mode === 'collapse') {
  const fx = createCollapse(new T.Vector3(0, 10, -88));
  updateCollapse(fx, 5.8);
  scene.add(fx);
} else if (mode === 'marvin-finale') {
  const fx = createCollapse(new T.Vector3(0, 10, -88), { final: true });
  updateCollapse(fx, 5.8);
  scene.add(fx);
} else {
  const boss = createBossModel(SECTORS[index], index, true);
  boss.position.set(0, 10, -88);
  scene.add(boss);
}
const player = fighter();
player.position.set(0, 6, 9);
if (mode !== 'mecha') scene.add(player);
const lateral = Number(new URLSearchParams(location.search).get('lateral') ?? 0);
if (mode !== 'mecha' && Number.isFinite(lateral) && Math.abs(lateral) <= 25) {
  player.position.x = lateral;
  const rig = createFlightCamera(camera);
  rig.reset(player.position);
}
const post = postProcessor(renderer, scene, camera);
post.resize(innerWidth, innerHeight);
if (mode !== 'mecha') world.update(0, 1, 48, false);
post.render();
document.querySelector('h1').textContent =
  mode === 'mecha'
    ? 'MECHA / ' +
      { front: 'FRENTE', profile: 'PERFIL', rear: 'COSTAS' }[window.modelInspection.view]
    : mode === 'tunnel'
      ? 'TÚNEL INDUSTRIAL / DEFESA TERRESTRE'
      : mode === 'ground'
        ? 'CIDADE / TANQUES E SENTINELAS'
        : mode === 'equipment'
          ? 'PODS I / II / III · VERDE: VIDA · AZUL: ARMA'
          : mode === 'subboss'
            ? SUBBOSS_NAMES[index]
            : mode === 'collapse'
              ? 'COLAPSO / ONDA DE CHOQUE E DESTROÇOS'
              : mode === 'marvin-finale'
                ? 'MARVIN DERROTADO / SUPRIMENTOS RECUPERADOS'
                : SECTORS[index].boss;
document.body.dataset.ready = 'true';
