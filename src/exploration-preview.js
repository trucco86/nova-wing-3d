import * as T from 'three';
import { developerToolsAllowed } from './developer-mode.js';
import {
  ORBIT9_EVIDENCE, createExplorationState, travelTo, inspectEvidence,
  talkToSurvivor, questStatus,
} from './exploration-quests.js';

// Small, independently disposable 3D exploration vertical slice. It is exposed
// exclusively through Developer/QA and deliberately never writes a save.
const INTERACT_RADIUS = 8.5;
const WALK_SPEED = 11;
const CLUE_POSITIONS = Object.freeze([
  Object.freeze([-12, -15]),
  Object.freeze([13, -37]),
  Object.freeze([-8, -59]),
]);
const SURVIVOR = Object.freeze([8, -77]);
const $ = (id) => document.getElementById(id);

export function installOrbit9ExplorationPreview(game, { hostname = window.location.hostname } = {}) {
  const launch = $('developerExplore');
  const root = $('explorationOverlay');
  if (!launch || !root || !developerToolsAllowed(hostname)) return { destroy() {} };

  launch.hidden = false;
  const viewport = $('explorationViewport');
  const objective = $('explorationObjective');
  const progress = $('explorationProgress');
  const status = $('explorationStatus');
  const choicePanel = $('explorationChoices');
  const launchCombat = $('exploreLaunchCombat');
  const scanButton = $('exploreScan');
  const talkButton = $('exploreTalk');
  const exitButton = $('exploreExit');
  const held = new Set();
  const listeners = [];
  let scene = null;
  let renderer = null;
  let camera = null;
  let pilot = null;
  let beacons = [];
  let npc = null;
  let rafId = 0;
  let state = createExplorationState();
  let playerX = 0;
  let playerZ = 12;
  let lastFrame = 0;
  let active = false;
  let elapsed = 0;

  function listen(el, event, handler, opts) {
    el.addEventListener(event, handler, opts);
    listeners.push([el, event, handler, opts]);
  }

  function notification(message) {
    status.textContent = message;
  }

  function near(x, z) {
    return Math.hypot(x - playerX, z - playerZ) <= INTERACT_RADIUS;
  }

  function updateUI() {
    const stats = questStatus(state);
    const need = ORBIT9_EVIDENCE.filter(({ id }) => !state.clues.includes(id));
    progress.textContent = 'ÓRBITA-9 · PISTAS ' + stats.found + '/' + stats.required;
    const closeClue = need.find((_, i) => {
      const position = CLUE_POSITIONS[ORBIT9_EVIDENCE.findIndex((e) => e.id === need[i].id)];
      return near(...position);
    });
    if (stats.missionUnlocked) {
      objective.textContent = 'ROTA FANTASMA DESCOBERTA · COMBATE DISPONÍVEL';
    } else if (stats.found < stats.required) {
      objective.textContent = closeClue
        ? 'SINAL PRÓXIMO · SCAN / E PARA INVESTIGAR'
        : 'RECUPERE AS 3 TRANSMISSÕES · USE WASD OU DIRECIONAL';
    } else {
      objective.textContent = near(...SURVIVOR)
        ? 'SOBREVIVENTE PRÓXIMO · INTERAGIR / E'
        : 'ENCONTRE O SOBREVIVENTE NO FINAL DO CORREDOR';
    }
    scanButton.disabled = !closeClue;
    talkButton.disabled = !stats.found || stats.found < stats.required || !near(...SURVIVOR) || stats.survivorSpokenTo;
    launchCombat.hidden = !stats.missionUnlocked;
    choicePanel.hidden = true;
    beacons.forEach((beacon, i) => {
      const acquired = state.clues.includes(ORBIT9_EVIDENCE[i].id);
      beacon.core.material.color.set(acquired ? '#478a84' : '#55f2ff');
      beacon.core.material.emissive.set(acquired ? '#164841' : '#106a9a');
    });
  }

  function scan() {
    const idx = ORBIT9_EVIDENCE.findIndex(({ id }, i) => !state.clues.includes(id) && near(...CLUE_POSITIONS[i]));
    if (idx < 0) {
      notification('Aproxime-se de uma transmissão luminosa.');
      return;
    }
    const result = inspectEvidence(state, ORBIT9_EVIDENCE[idx].id);
    state = result.state;
    notification(result.accepted
      ? 'PISTA RECUPERADA · ' + ORBIT9_EVIDENCE[idx].label.toUpperCase()
      : 'A TRANSMISSÃO JÁ FOI RECUPERADA.');
    updateUI();
  }

  function talk() {
    if (state.clues.length !== ORBIT9_EVIDENCE.length || !near(...SURVIVOR)) {
      notification('Colete todas as pistas e aproxime-se do sobrevivente.');
      return;
    }
    if (!state.conversation) {
      choicePanel.hidden = false;
      notification('SOBREVIVENTE: A rota está trancada. Restauramos energia ou abrimos a passagem oculta?');
    }
  }

  function choose(choice) {
    const result = talkToSurvivor(state, choice);
    if (result.accepted) {
      state = result.state;
      notification(choice === 'restore-power'
        ? 'ENERGIA RESTAURADA · ROTA FANTASMA ATIVA'
        : 'ROTA CLANDESTINA DETECTADA · MISSÃO LIBERADA');
    }
    updateUI();
  }

  function makeScene() {
    scene = new T.Scene();
    scene.background = new T.Color('#030b1a');
    scene.fog = new T.FogExp2('#030b1a', 0.0075);
    camera = new T.PerspectiveCamera(65, 1, 0.1, 300);
    renderer = new T.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.domElement.setAttribute('aria-label', 'Exploração 3D da estação Órbita-9');
    viewport.appendChild(renderer.domElement);
    scene.add(new T.HemisphereLight(0x8bcae8, 0x081222, 1.8));
    const key = new T.PointLight(0x55ccff, 55, 150);
    key.position.set(-15, 25, -40);
    scene.add(key);
    const mat = (color, emissive = '#000000') =>
      new T.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.56, emissive });
    const steel = mat('#27384c'), dark = mat('#0c1b2b');
    const line = mat('#14617f', '#0a344d');
    const makeBox = (w, h, d, material, x, y, z, parent = scene) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    makeBox(48, 1.4, 126, steel, 0, -0.9, -41);
    for (const side of [-1, 1]) {
      makeBox(2, 9, 128, dark, side * 24, 4, -41);
      for (let n = 0; n < 10; n++) {
        const z = 9 - n * 11;
        makeBox(2, 17, 3, steel, side * 22, 8, z);
        makeBox(0.6, 12, 1, line, side * 20.8, 8, z);
      }
      makeBox(2, 0.2, 119, line, side * 19, 0.15, -40);
    }
    for (let n = 0; n < 26; n++) {
      const z = 15 - n * 4.2;
      makeBox(47, 0.15, 0.22, n % 2 ? steel : line, 0, -0.1, z);
    }
    for (let n = 0; n < 8; n++) {
      const z = 6 - n * 14;
      makeBox(48, 1.8, 2, steel, 0, 16, z);
      makeBox(25, 0.45, 1, line, 0, 14.9, z);
    }
    beacons = CLUE_POSITIONS.map(([x, z], i) => {
      const ring = new T.Mesh(new T.TorusGeometry(2.8, 0.25, 8, 28), line);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.4, z);
      scene.add(ring);
      const core = new T.Mesh(new T.OctahedronGeometry(2.1, 1), mat('#55f2ff', '#106a9a'));
      core.position.set(x, 4, z);
      core.name = 'orbit9-clue-' + i;
      scene.add(core);
      makeBox(3.8, 1.5, 3.8, dark, x, 0.7, z);
      return { core, ring };
    });
    npc = new T.Group();
    const hologram = new T.Mesh(new T.CylinderGeometry(2.2, 2, 8, 10, 1, true),
      new T.MeshStandardMaterial({ color: '#65f8d4', emissive: '#237a70',
        opacity: 0.6, transparent: true, side: T.DoubleSide }));
    hologram.position.y = 5;
    npc.add(hologram);
    const head = new T.Mesh(new T.IcosahedronGeometry(2, 1), mat('#d2fff6', '#247a68'));
    head.position.y = 10;
    npc.add(head);
    npc.position.set(SURVIVOR[0], 0, SURVIVOR[1]);
    scene.add(npc);
    pilot = new T.Group();
    makeBox(2.5, 3.8, 1.5, mat('#162d44'), 0, 2.3, 0, pilot);
    const pilotHead = new T.Mesh(new T.SphereGeometry(1.35, 12, 10), mat('#272b3b'));
    pilotHead.position.y = 5.2;
    pilot.add(pilotHead);
    for (const side of [-1, 1]) {
      const ear = new T.Mesh(new T.ConeGeometry(0.6, 1.6, 4), mat('#272b3b'));
      ear.position.set(side * 0.8, 6.6, 0);
      pilot.add(ear);
    }
    scene.add(pilot);
    resize();
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(160, viewport.clientWidth);
    const height = Math.max(140, viewport.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function frame(stamp) {
    if (!active || !renderer) return;
    const dt = Math.min(0.04, (stamp - (lastFrame || stamp)) / 1000);
    lastFrame = stamp;
    elapsed += dt;
    const moveX = Number(held.has('right')) - Number(held.has('left'));
    const moveZ = Number(held.has('down')) - Number(held.has('up'));
    const len = Math.max(1, Math.hypot(moveX, moveZ));
    playerX = T.MathUtils.clamp(playerX + moveX * WALK_SPEED * dt / len, -18, 18);
    playerZ = T.MathUtils.clamp(playerZ + moveZ * WALK_SPEED * dt / len, -91, 13);
    pilot.position.set(playerX, 0, playerZ);
    if (moveX || moveZ) pilot.rotation.y = Math.atan2(-moveX, -moveZ);
    camera.position.lerp(new T.Vector3(playerX + 12, 19, playerZ + 22), Math.min(1, dt * 6));
    camera.lookAt(playerX, 3, playerZ - 17);
    for (const [i, beacon] of beacons.entries()) {
      beacon.core.rotation.y += dt * 0.8;
      beacon.core.position.y = 4 + Math.sin(elapsed * 2 + i * 2) * 0.45;
    }
    npc.children[0].scale.y = 1 + Math.sin(elapsed * 1.7) * 0.06;
    renderer.render(scene, camera);
    updateUI();
    rafId = requestAnimationFrame(frame);
  }

  function open() {
    if (active) return;
    active = true;
    state = travelTo(createExplorationState(), 'orbit-9-ruins').state;
    playerX = 0;
    playerZ = 12;
    elapsed = 0;
    lastFrame = 0;
    root.hidden = false;
    choicePanel.hidden = true;
    try {
      makeScene();
    } catch (error) {
      active = false;
      root.hidden = true;
      notification('WebGL indisponível: ' + String(error?.message || error));
      close();
      return;
    }
    notification('BIA: Investigue as três transmissões. Nenhum progresso será salvo.');
    updateUI();
    rafId = requestAnimationFrame(frame);
  }

  function close() {
    active = false;
    cancelAnimationFrame(rafId);
    held.clear();
    root.hidden = true;
    beacons = [];
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    }
    if (scene) {
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      });
    }
    renderer = scene = camera = pilot = npc = null;
    rafId = 0;
  }

  function launchMission() {
    if (!questStatus(state).missionUnlocked) {
      notification('Missão bloqueada: investigue e converse com o sobrevivente.');
      return;
    }
    const destination = travelTo(state, 'orion-ghost-route');
    if (!destination.accepted) return;
    // Sector 04 is Orbit-9; the existing Developer/QA game session keeps
    // ranking and campaign saves isolated. No mission completion is spoofed.
    const entered = game.startDeveloperScenario(3, 'boss');
    if (entered) close();
    else notification('Não foi possível iniciar o combate de QA.');
  }

  function keyDown(e) {
    if (!active) return;
    const direction = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' }[e.code];
    if (direction) {
      held.add(direction);
      e.preventDefault();
    } else if (e.code === 'KeyE' && !e.repeat) {
      if (state.clues.length === ORBIT9_EVIDENCE.length && near(...SURVIVOR)) talk();
      else scan();
      e.preventDefault();
    } else if (e.code === 'Escape') {
      close();
      e.preventDefault();
    }
  }

  function keyUp(e) {
    const direction = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' }[e.code];
    if (direction) held.delete(direction);
  }

  listen(launch, 'click', open);
  listen(exitButton, 'click', close);
  listen(scanButton, 'click', scan);
  listen(talkButton, 'click', talk);
  listen($('exploreChoiceRestore'), 'click', () => choose('restore-power'));
  listen($('exploreChoiceHidden'), 'click', () => choose('hidden-route'));
  listen(launchCombat, 'click', launchMission);
  listen(window, 'keydown', keyDown);
  listen(window, 'keyup', keyUp);
  listen(window, 'resize', resize);
  listen(window, 'blur', () => held.clear());
  for (const direction of ['up', 'down', 'left', 'right']) {
    const button = $('exploreMove' + direction[0].toUpperCase() + direction.slice(1));
    listen(button, 'pointerdown', (e) => {
      e.preventDefault();
      held.add(direction);
      button.setPointerCapture?.(e.pointerId);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      listen(button, event, () => held.delete(direction));
  }

  return {
    destroy() {
      close();
      for (const [el, name, handler, opts] of listeners) el.removeEventListener(name, handler, opts);
      launch.hidden = true;
    },
  };
}
