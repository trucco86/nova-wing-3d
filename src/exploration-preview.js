import * as T from 'three';
import { developerToolsAllowed } from './developer-mode.js';
import { createShowroomPilot } from './showroom-models.js';
import {
  orbit9CameraState,
  orbit9RotateCamera,
  orbit9ToggleCameraMode,
  orbit9CameraPose,
} from './orbit9-camera.js';
import { orbit9DialogueBeat, orbit9NextDialogue } from './orbit9-dialogue.js';
import {
  ORBIT9_BOUNDS,
  ORBIT9_DISTRICTS,
  ORBIT9_OBSTACLES,
  ORBIT9_CLUE_POSITIONS,
  ORBIT9_SURVIVOR,
  ORBIT9_SPAWN,
  orbit9Blocked,
  orbit9Move,
  orbit9MapPoint,
  orbit9District,
} from './orbit9-free-roam.js';
import {
  ORBIT9_EVIDENCE,
  createExplorationState,
  travelTo,
  inspectEvidence,
  talkToSurvivor,
  questStatus,
} from './exploration-quests.js';

// Small, independently disposable 3D exploration vertical slice. It is exposed
// exclusively through Developer/QA and deliberately never writes a save.
const INTERACT_RADIUS = 8.5;
const WALK_SPEED = 11;
const CLUE_POSITIONS = ORBIT9_CLUE_POSITIONS;
const SURVIVOR = ORBIT9_SURVIVOR;
const $ = (id) => document.getElementById(id);

export function installOrbit9ExplorationPreview(
  game,
  { hostname = window.location.hostname } = {},
) {
  const launch = $('developerExplore');
  const root = $('explorationOverlay');
  if (!launch || !root || !developerToolsAllowed(hostname)) return { destroy() {} };

  launch.hidden = false;
  const viewport = $('explorationViewport');
  const objective = $('explorationObjective');
  const progress = $('explorationProgress');
  const status = $('explorationStatus');
  const districtName = $('explorationDistrict');
  const mapPlayer = $('explorationMapPlayer');
  const mapSignals = $('explorationMapSignals');
  const choicePanel = $('explorationChoices');
  const launchCombat = $('exploreLaunchCombat');
  const scanButton = $('exploreScan');
  const talkButton = $('exploreTalk');
  const exitButton = $('exploreExit');
  const cameraLeft = $('exploreCameraLeft');
  const cameraRight = $('exploreCameraRight');
  const cameraZoom = $('exploreCameraZoom');
  const dialoguePanel = $('explorationDialogue');
  const dialogueSpeaker = $('exploreDialogueSpeaker');
  const dialogueText = $('exploreDialogueText');
  const dialogueNext = $('exploreDialogueNext');
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
  let playerX = ORBIT9_SPAWN.x;
  let playerZ = ORBIT9_SPAWN.z;
  const cameraGoal = new T.Vector3();
  const cameraTarget = new T.Vector3();
  let cameraState = orbit9CameraState();
  let cameraYawVisual = 0;
  let cameraPointer = null;
  let dialogueIndex = -1;
  let currentDistrict = '';
  let lastMapX = NaN;
  let lastMapZ = NaN;
  let lastClueCount = -1;
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
    const district = orbit9District(playerX, playerZ);
    if (district.id !== currentDistrict) {
      currentDistrict = district.id;
      districtName.textContent = district.name;
    }
    // Do not write CSS positions and marker classes on every WebGL frame.
    if (
      !Number.isFinite(lastMapX) ||
      Math.abs(playerX - lastMapX) > 0.2 ||
      Math.abs(playerZ - lastMapZ) > 0.2
    ) {
      const mapPosition = orbit9MapPoint(playerX, playerZ);
      mapPlayer.style.left = mapPosition.x + '%';
      mapPlayer.style.bottom = mapPosition.y + '%';
      lastMapX = playerX;
      lastMapZ = playerZ;
    }
    if (lastClueCount !== stats.found) {
      for (const mark of mapSignals.children)
        mark.classList.toggle('found', state.clues.includes(mark.dataset.clue));
      lastClueCount = stats.found;
    }
    const closeClue = need.find((_, i) => {
      const position = CLUE_POSITIONS[ORBIT9_EVIDENCE.findIndex((e) => e.id === need[i].id)];
      return near(...position);
    });
    if (stats.missionUnlocked) {
      objective.textContent = 'ROTA FANTASMA DESCOBERTA · COMBATE DISPONÍVEL';
    } else if (stats.found < stats.required) {
      objective.textContent = closeClue
        ? 'SINAL PRÓXIMO · SCAN / E PARA INVESTIGAR'
        : 'EXPLORE OS DISTRITOS · BUSQUE 3 PISTAS NO MAPA';
    } else {
      objective.textContent = near(...SURVIVOR)
        ? 'SOBREVIVENTE PRÓXIMO · INTERAGIR / E'
        : 'ENCONTRE O SOBREVIVENTE NO SETOR SUL DA ESTAÇÃO';
    }
    scanButton.disabled = !closeClue;
    talkButton.disabled =
      !stats.found ||
      stats.found < stats.required ||
      !near(...SURVIVOR) ||
      stats.survivorSpokenTo ||
      !choicePanel.hidden ||
      !dialoguePanel.hidden;
    launchCombat.hidden = !stats.missionUnlocked;
    if (stats.survivorSpokenTo) choicePanel.hidden = true;
    beacons.forEach((beacon, i) => {
      const acquired = state.clues.includes(ORBIT9_EVIDENCE[i].id);
      beacon.core.material.color.set(acquired ? '#478a84' : '#55f2ff');
      beacon.core.material.emissive.set(acquired ? '#164841' : '#106a9a');
    });
  }

  function scan() {
    const idx = ORBIT9_EVIDENCE.findIndex(
      ({ id }, i) => !state.clues.includes(id) && near(...CLUE_POSITIONS[i]),
    );
    if (idx < 0) {
      notification('Aproxime-se de uma transmissão luminosa.');
      return;
    }
    const result = inspectEvidence(state, ORBIT9_EVIDENCE[idx].id);
    state = result.state;
    notification(
      result.accepted
        ? 'PISTA RECUPERADA · ' + ORBIT9_EVIDENCE[idx].label.toUpperCase()
        : 'A TRANSMISSÃO JÁ FOI RECUPERADA.',
    );
    updateUI();
  }

  function showDialogueBeat(index) {
    const beat = orbit9DialogueBeat(index);
    if (!beat) return false;
    dialogueIndex = index;
    dialoguePanel.hidden = false;
    choicePanel.hidden = true;
    dialogueSpeaker.textContent = beat.speaker;
    dialogueText.textContent = beat.text;
    dialogueNext.textContent = orbit9NextDialogue(index) === null ? 'ESCOLHER ROTA' : 'CONTINUAR';
    return true;
  }

  function advanceDialogue() {
    if (dialoguePanel.hidden || dialogueIndex < 0) return;
    const next = orbit9NextDialogue(dialogueIndex);
    if (next === null) {
      dialoguePanel.hidden = true;
      dialogueIndex = -1;
      choicePanel.hidden = false;
      notification('SOBREVIVENTE: Qual acesso os Five Cats devem abrir?');
    } else showDialogueBeat(next);
    updateUI();
  }

  function talk() {
    if (state.clues.length !== ORBIT9_EVIDENCE.length || !near(...SURVIVOR)) {
      notification('Colete todas as pistas e aproxime-se do sobrevivente.');
      return;
    }
    if (!state.conversation && choicePanel.hidden && dialoguePanel.hidden) {
      showDialogueBeat(0);
      notification('TRANSMISSÃO SEGURA · SOBREVIVENTE LOCALIZADO');
      updateUI();
    }
  }

  function choose(choice) {
    const result = talkToSurvivor(state, choice);
    if (result.accepted) {
      state = result.state;
      notification(
        choice === 'restore-power'
          ? 'ENERGIA RESTAURADA · ROTA FANTASMA ATIVA'
          : 'ROTA CLANDESTINA DETECTADA · MISSÃO LIBERADA',
      );
      if (npc) {
        const lightColor = choice === 'restore-power' ? '#6ef7b5' : '#f3b36c';
        for (const mesh of npc.children) {
          mesh.material.color.set(lightColor);
          mesh.material.emissive.set(lightColor);
        }
      }
    }
    dialoguePanel.hidden = true;
    updateUI();
  }

  function makeScene() {
    scene = new T.Scene();
    scene.background = new T.Color('#030b1a');
    scene.fog = new T.FogExp2('#030b1a', 0.0075);
    camera = new T.PerspectiveCamera(65, 1, 0.1, 300);
    renderer = new T.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.domElement.setAttribute('aria-label', 'Exploração 3D da estação Órbita-9');
    viewport.appendChild(renderer.domElement);
    scene.add(new T.HemisphereLight(0x8bcae8, 0x081222, 1.8));
    const key = new T.PointLight(0x55ccff, 55, 150);
    key.position.set(-15, 25, -40);
    scene.add(key);
    const mat = (color, emissive = '#000000') =>
      new T.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.56, emissive });
    const steel = mat('#27384c'),
      dark = mat('#0c1b2b');
    const line = mat('#14617f', '#0a344d');
    const makeBox = (w, h, d, material, x, y, z, parent = scene) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    makeBox(112, 1.4, 126, steel, 0, -0.9, -41);
    // Connected free-roam districts replace the former mandatory corridor.
    const districtMats = [mat('#193c4c'), mat('#37404d'), mat('#283b43')];
    ORBIT9_DISTRICTS.slice(1).forEach((district, i) => {
      makeBox(district.width, 0.12, district.depth, districtMats[i], district.x, -0.08, district.z);
    });
    for (const side of [-1, 1]) {
      makeBox(2, 9, 128, dark, side * 58, 4, -41);
      for (let n = 0; n < 10; n++) {
        const z = 9 - n * 11;
        makeBox(2, 17, 3, steel, side * 57, 8, z);
        makeBox(0.6, 12, 1, line, side * 55.8, 8, z);
      }
      makeBox(2, 0.2, 119, line, side * 53, 0.15, -40);
    }
    for (let n = 0; n < 26; n++) {
      const z = 15 - n * 4.2;
      makeBox(111, 0.15, 0.22, n % 2 ? steel : line, 0, -0.1, z);
    }
    for (let n = 0; n < 8; n++) {
      const z = 6 - n * 14;
      // Overhead structure stays above the third-person camera, preserving
      // readable landmarks in both the plaza and side districts.
      makeBox(110, 1.8, 2, steel, 0, 26, z);
      makeBox(63, 0.45, 1, line, 0, 24.9, z);
    }
    // Collidable architectural landmarks give each district its own silhouette.
    ORBIT9_OBSTACLES.forEach((block, i) => {
      makeBox(
        block.halfX * 2,
        block.height,
        block.halfZ * 2,
        i % 2 ? dark : steel,
        block.x,
        block.height / 2,
        block.z,
      );
      makeBox(
        block.halfX * 1.5,
        0.35,
        block.halfZ * 1.5,
        line,
        block.x,
        block.height + 0.2,
        block.z,
      );
    });
    for (const side of [-1, 1]) {
      for (const z of [-12, -39, -70]) {
        makeBox(7, 7, 0.7, line, side * 47, 3.8, z);
      }
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
    const hologram = new T.Mesh(
      new T.CylinderGeometry(2.2, 2, 8, 10, 1, true),
      new T.MeshStandardMaterial({
        color: '#65f8d4',
        emissive: '#237a70',
        opacity: 0.6,
        transparent: true,
        side: T.DoubleSide,
      }),
    );
    hologram.position.y = 5;
    npc.add(hologram);
    const head = new T.Mesh(new T.IcosahedronGeometry(2, 1), mat('#d2fff6', '#247a68'));
    head.position.y = 10;
    npc.add(head);
    npc.position.set(SURVIVOR[0], 0, SURVIVOR[1]);
    scene.add(npc);
    // Use the same approved feline 3D character the current hangar and
    // stage-one opening already share; never build an unrelated cube avatar.
    const selectedPilot = game.snapshot?.().loadout?.pilot ?? 'bia';
    pilot = createShowroomPilot(selectedPilot);
    pilot.name = 'orbit9-player-' + selectedPilot;
    pilot.scale.multiplyScalar(1.2);
    scene.add(pilot);
    const initialCamera = orbit9CameraPose(playerX, playerZ, cameraState);
    camera.position.set(initialCamera.eye.x, initialCamera.eye.y, initialCamera.eye.z);
    camera.lookAt(initialCamera.aim.x, initialCamera.aim.y, initialCamera.aim.z);
    mapSignals.replaceChildren();
    CLUE_POSITIONS.forEach(([x, z], i) => {
      const mark = document.createElement('span');
      mark.className = 'exploration-map-signal';
      mark.dataset.clue = ORBIT9_EVIDENCE[i].id;
      const where = orbit9MapPoint(x, z);
      mark.style.left = where.x + '%';
      mark.style.bottom = where.y + '%';
      mapSignals.appendChild(mark);
    });
    const survivorMark = document.createElement('span');
    survivorMark.className = 'exploration-map-survivor';
    const where = orbit9MapPoint(...SURVIVOR);
    survivorMark.style.left = where.x + '%';
    survivorMark.style.bottom = where.y + '%';
    mapSignals.appendChild(survivorMark);
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
    const inputLocked = !dialoguePanel.hidden || !choicePanel.hidden;
    const moveX = inputLocked ? 0 : Number(held.has('right')) - Number(held.has('left'));
    const moveZ = inputLocked ? 0 : Number(held.has('down')) - Number(held.has('up'));
    const len = Math.max(1, Math.hypot(moveX, moveZ));
    const moved = orbit9Move(
      playerX,
      playerZ,
      (moveX * WALK_SPEED * dt) / len,
      (moveZ * WALK_SPEED * dt) / len,
    );
    playerX = moved.x;
    playerZ = moved.z;
    pilot.position.set(playerX, 2.2, playerZ);
    if (moveX || moveZ) pilot.rotation.y = Math.atan2(-moveX, -moveZ);
    const turn = Math.atan2(
      Math.sin(cameraState.yaw - cameraYawVisual),
      Math.cos(cameraState.yaw - cameraYawVisual),
    );
    cameraYawVisual += turn * Math.min(1, dt * 7);
    const pose = orbit9CameraPose(playerX, playerZ, {
      yaw: cameraYawVisual,
      mode: cameraState.mode,
    });
    cameraGoal.set(pose.eye.x, pose.eye.y, pose.eye.z);
    camera.position.lerp(cameraGoal, Math.min(1, dt * 9));
    cameraTarget.set(pose.aim.x, pose.aim.y, pose.aim.z);
    camera.lookAt(cameraTarget);
    if (Math.abs(camera.fov - pose.fov) > 0.03) {
      camera.fov += (pose.fov - camera.fov) * Math.min(1, dt * 8);
      camera.updateProjectionMatrix();
    }
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
    playerX = ORBIT9_SPAWN.x;
    playerZ = ORBIT9_SPAWN.z;
    currentDistrict = '';
    lastMapX = lastMapZ = NaN;
    lastClueCount = -1;
    elapsed = 0;
    lastFrame = 0;
    cameraState = orbit9CameraState();
    cameraYawVisual = 0;
    cameraPointer = null;
    dialogueIndex = -1;
    root.hidden = false;
    choicePanel.hidden = true;
    dialoguePanel.hidden = true;
    cameraZoom.setAttribute('aria-pressed', 'false');
    try {
      makeScene();
    } catch (error) {
      active = false;
      root.hidden = true;
      notification('WebGL indisponível: ' + String(error?.message || error));
      close();
      return;
    }
    const pilotName = game.snapshot?.().loadout?.pilotName ?? 'FIVE CATS';
    notification(pilotName + ': Investigue as três transmissões. Nenhum progresso será salvo.');
    updateUI();
    rafId = requestAnimationFrame(frame);
  }

  function close() {
    active = false;
    cancelAnimationFrame(rafId);
    held.clear();
    cameraPointer = null;
    dialogueIndex = -1;
    dialoguePanel.hidden = true;
    choicePanel.hidden = true;
    root.hidden = true;
    beacons = [];
    mapSignals.replaceChildren();
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
    const direction = {
      KeyW: 'up',
      ArrowUp: 'up',
      KeyS: 'down',
      ArrowDown: 'down',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    }[e.code];
    if (direction) {
      held.add(direction);
      e.preventDefault();
    } else if (e.code === 'KeyE' && !e.repeat) {
      if (state.clues.length === ORBIT9_EVIDENCE.length && near(...SURVIVOR)) talk();
      else scan();
      e.preventDefault();
    } else if (e.code === 'KeyQ' || e.code === 'KeyR') {
      cameraState = orbit9RotateCamera(cameraState, ((e.code === 'KeyQ' ? -1 : 1) * Math.PI) / 7);
      e.preventDefault();
    } else if (e.code === 'KeyC') {
      cameraState = orbit9ToggleCameraMode(cameraState);
      cameraZoom.setAttribute('aria-pressed', String(cameraState.mode === 'survey'));
      e.preventDefault();
    } else if (e.code === 'Escape') {
      if (!dialoguePanel.hidden || !choicePanel.hidden) {
        dialoguePanel.hidden = true;
        choicePanel.hidden = true;
        dialogueIndex = -1;
        updateUI();
      } else close();
      e.preventDefault();
    }
  }

  function keyUp(e) {
    const direction = {
      KeyW: 'up',
      ArrowUp: 'up',
      KeyS: 'down',
      ArrowDown: 'down',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    }[e.code];
    if (direction) held.delete(direction);
  }

  listen(launch, 'click', open);
  listen(exitButton, 'click', close);
  listen(scanButton, 'click', scan);
  listen(talkButton, 'click', talk);
  listen(dialogueNext, 'click', advanceDialogue);
  listen(cameraLeft, 'click', () => {
    cameraState = orbit9RotateCamera(cameraState, -Math.PI / 7);
  });
  listen(cameraRight, 'click', () => {
    cameraState = orbit9RotateCamera(cameraState, Math.PI / 7);
  });
  listen(cameraZoom, 'click', () => {
    cameraState = orbit9ToggleCameraMode(cameraState);
    cameraZoom.setAttribute('aria-pressed', String(cameraState.mode === 'survey'));
  });
  listen(viewport, 'pointerdown', (event) => {
    if (!active || event.target !== renderer?.domElement) return;
    cameraPointer = { id: event.pointerId, lastX: event.clientX };
    renderer.domElement.setPointerCapture?.(event.pointerId);
  });
  listen(viewport, 'pointermove', (event) => {
    if (!cameraPointer || event.pointerId !== cameraPointer.id) return;
    const delta = event.clientX - cameraPointer.lastX;
    cameraPointer.lastX = event.clientX;
    cameraState = orbit9RotateCamera(cameraState, delta * -0.008);
    event.preventDefault();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
    listen(viewport, name, (event) => {
      if (cameraPointer?.id === event.pointerId) cameraPointer = null;
    });
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

  // Developer-only teleport/inspection API supports deterministic browser QA.
  // It grants no rank, save, mission victory or privileged backend actions.
  window.__novaExploreQA = Object.freeze({
    moveTo(x, z) {
      if (!active || !Number.isFinite(x) || !Number.isFinite(z)) return false;
      if (
        x < ORBIT9_BOUNDS.minX ||
        x > ORBIT9_BOUNDS.maxX ||
        z < ORBIT9_BOUNDS.minZ ||
        z > ORBIT9_BOUNDS.maxZ ||
        orbit9Blocked(x, z)
      )
        return false;
      playerX = x;
      playerZ = z;
      updateUI();
      return true;
    },
    snapshot() {
      return {
        active,
        player: { x: playerX, z: playerZ },
        pilotModel: pilot?.name ?? null,
        district: orbit9District(playerX, playerZ).id,
        camera: { ...cameraState },
        dialogue: {
          open: !dialoguePanel.hidden,
          index: dialogueIndex,
          choicesVisible: !choicePanel.hidden,
        },
        quest: createExplorationState(state),
      };
    },
  });

  return {
    destroy() {
      close();
      if (window.__novaExploreQA) delete window.__novaExploreQA;
      for (const [el, name, handler, opts] of listeners)
        el.removeEventListener(name, handler, opts);
      launch.hidden = true;
    },
  };
}
