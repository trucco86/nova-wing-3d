import * as T from 'three';
import {
  animateMechPower,
  createFlyingRobot,
  createShipModule,
  createWorld,
  fighter,
  postProcessor,
  setFighterEvolution,
} from '../src/visuals.js';
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
if (mode === 'mecha-review') {
  // Dedicated close-up inspection: identical environment, scale and camera for both forms.
  const params = new URLSearchParams(location.search);
  const view = params.get('view') ?? 'front';
  const tier = [0, 3, 6].includes(Number(params.get('tier'))) ? Number(params.get('tier')) : 6;
  const mecha = createFlyingRobot();
  const ship = createShipModule('nova7');
  mecha.position.set(-7.2, 13, -46);
  ship.position.set(7.2, 13, -46);
  mecha.name = 'review-mecha';
  ship.name = 'review-ship';
  animateMechPower(mecha, 1.25, true, tier);
  setFighterEvolution(ship, tier);
  scene.add(mecha, ship);
  if (view === 'rear') {
    camera.position.set(0, 17, -78);
    camera.lookAt(0, 13, -46);
  } else if (view === 'side') {
    camera.position.set(-32, 19, -32);
    camera.lookAt(0, 13, -46);
  } else {
    camera.position.set(0, 17, -15);
    camera.lookAt(0, 13, -46);
  }
  // Expose deterministic render metadata so screenshot validation catches wrong frames.
  document.body.dataset.reviewView = view;
  document.body.dataset.reviewTier = String(tier);
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
player.visible = mode !== 'mecha-review';
scene.add(player);
const lateral = Number(new URLSearchParams(location.search).get('lateral') ?? 0);
if (mode !== 'mecha-review' && Number.isFinite(lateral) && Math.abs(lateral) <= 25) {
  player.position.x = lateral;
  const rig = createFlightCamera(camera);
  rig.reset(player.position);
}
const post = postProcessor(renderer, scene, camera);
post.resize(innerWidth, innerHeight);
world.update(0, 1, 48, false);
post.render();
document.querySelector('h1').textContent =
  mode === 'mecha-review'
    ? 'REVISÃO DE DESIGN / ROBÔ × NAVE / ÂNGULOS E NEONS'
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
