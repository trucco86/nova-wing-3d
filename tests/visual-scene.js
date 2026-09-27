import * as T from 'three';
import { createWorld, postProcessor, fighter } from '../src/visuals.js';
import { createBossModel, createSubboss } from '../src/bosses.js';
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
if (mode === 'tunnel' || mode === 'ground') {
  const tunnel = createObstacle(mode === 'tunnel' ? 'tunnel' : 'gantry');
  tunnel.position.z = mode === 'tunnel' ? 90 : -150;
  scene.add(tunnel);
  const tank = createGroundEnemy('tank'),
    walker = createGroundEnemy('walker');
  tank.position.set(12, -7, -33);
  walker.position.set(-15, -7, -67);
  scene.add(tank, walker);
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
  const sub = createSubboss();
  sub.position.set(0, 10, -85);
  scene.add(sub);
} else if (mode === 'collapse') {
  const fx = createCollapse(new T.Vector3(0, 10, -88));
  updateCollapse(fx, 5.8);
  scene.add(fx);
} else {
  const boss = createBossModel(SECTORS[index], index);
  boss.position.set(0, 10, -88);
  scene.add(boss);
}
const player = fighter();
player.position.set(0, 6, 9);
scene.add(player);
const lateral = Number(new URLSearchParams(location.search).get('lateral') ?? 0);
if (Number.isFinite(lateral) && Math.abs(lateral) <= 25) {
  player.position.x = lateral;
  const rig = createFlightCamera(camera);
  rig.reset(player.position);
}
const post = postProcessor(renderer, scene, camera);
post.resize(innerWidth, innerHeight);
world.update(0, 1, 48, false);
post.render();
document.querySelector('h1').textContent =
  mode === 'tunnel'
    ? 'TÚNEL INDUSTRIAL / DEFESA TERRESTRE'
    : mode === 'ground'
      ? 'CIDADE / TANQUES E SENTINELAS'
      : mode === 'equipment'
        ? 'PODS I / II / III · VERDE: VIDA · AZUL: ARMA'
        : mode === 'subboss'
          ? 'CRUZADOR DE INTERCEPTAÇÃO'
          : mode === 'collapse'
            ? 'COLAPSO / ONDA DE CHOQUE E DESTROÇOS'
            : SECTORS[index].boss;
document.body.dataset.ready = 'true';
