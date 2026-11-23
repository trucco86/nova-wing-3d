import * as T from 'three';
import { developerToolsAllowed } from './developer-mode.js';
import { DEVASTADOR_ACCESS_MODULES, reactorModulesComplete } from './devastador-reactor-access.js';
import { createShowroomPilot } from './showroom-models.js';
import { createShipModule } from './visuals.js';
import {
  reactorCinematicPose,
  reactorGateStatus,
  REACTOR_ARRIVAL_SECONDS,
} from './reactor-access-cinematic.js';
import {
  createOrbit9WalkRig,
  orbit9StickAxes,
  orbit9CameraRelativeAxes,
  createOrbit9MotionFilter,
} from './orbit9-locomotion.js';
import { createOrbit9StageArt, updateOrbit9StageArt } from './orbit9-stage-art.js';
import {
  orbit9CameraState,
  orbit9RotateCamera,
  orbit9ToggleCameraMode,
  orbit9CameraPose,
  orbit9CameraIntersectsSolid,
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

// Stage-04 Devastador disembark: disposable WebGL exploration owned by the same
// campaign sector. Developer/QA can enter via an isolated test; never writes a save.
const INTERACT_RADIUS = 8.5;
const WALK_SPEED = 11;
const RUN_MULTIPLIER = 1.65;
const SPIN_SECONDS = 0.72;
const CLUE_POSITIONS = ORBIT9_CLUE_POSITIONS;
const SURVIVOR = ORBIT9_SURVIVOR;
const DOCK_RETURN = Object.freeze({ x: 17, z: 12, radius: 13 });
const $ = (id) => document.getElementById(id);

export function installOrbit9ExplorationPreview(
  game,
  { hostname = window.location.hostname } = {},
) {
  const root = $('explorationOverlay');
  if (!root) return { openIntegrated: () => false, destroy() {} };
  const qaAllowed = developerToolsAllowed(hostname);
  const viewport = $('explorationViewport');
  const objective = $('explorationObjective');
  const gateBeat = $('explorationGateBeat');
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
  const stick = $('exploreStick');
  const nub = $('exploreNub');
  const boostButton = $('exploreBoost');
  const cameraLeft = $('exploreCameraLeft');
  const cameraRight = $('exploreCameraRight');
  const cameraZoom = $('exploreCameraZoom');
  const spinButton = $('exploreSpin');
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
  let stageArt = null;
  let dockingShip = null;
  let walkRig = null;
  const motion = createOrbit9MotionFilter();
  let cinematicPhase = 'none';
  let cinematicStarted = 0;
  let departureCameraStart = null;
  let facingYaw = Math.PI;
  let spinElapsed = -1;
  const stickInput = { x: 0, z: 0, pointerId: null };
  let boostTouchHeld = false;
  let beacons = [];
  let npc = null;
  let rafId = 0;
  let state = createExplorationState();
  let integratedRequest = null;
  let playerX = ORBIT9_SPAWN.x;
  let playerZ = ORBIT9_SPAWN.z;
  const cameraGoal = new T.Vector3();
  const cameraTarget = new T.Vector3();
  const cameraAimSmooth = new T.Vector3();
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
  let statusUntil = 0;

  function listen(el, event, handler, opts) {
    el.addEventListener(event, handler, opts);
    listeners.push([el, event, handler, opts]);
  }

  function notification(message) {
    status.textContent = message;
    status.hidden = false;
    statusUntil = elapsed + 4.5;
  }

  function endArrival(force = false) {
    if (cinematicPhase !== 'arrival') return;
    if (!force && (performance.now() - cinematicStarted) / 1000 < REACTOR_ARRIVAL_SECONDS) return;
    cinematicPhase = 'none';
    root.dataset.reactorBeat = 'walk';
    gateBeat.hidden = true;
    if (pilot) pilot.visible = true;
    // Park the selected real ship in the side docking bay. Leaving it on the
    // center aisle would clip through the cat's head in third-person view.
    dockingShip?.position.set(17, 3.3, 20);
    // Resume from the real player camera, not the station-wide cinematic.
    const pose = orbit9CameraPose(playerX, playerZ, {
      ...cameraState,
      aspect: camera?.aspect,
    });
    camera?.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
    cameraAimSmooth.set(pose.aim.x, pose.aim.y, pose.aim.z);
    camera?.lookAt(cameraAimSmooth);
  }

  function near(x, z) {
    return Math.hypot(x - playerX, z - playerZ) <= INTERACT_RADIUS;
  }

  function updateUI() {
    const stats = questStatus(state);
    const need = ORBIT9_EVIDENCE.filter(({ id }) => !state.clues.includes(id));
    progress.textContent = 'DEVASTADOR · MÓDULOS ' + stats.found + '/' + stats.required;
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
    const gate = reactorGateStatus(stats.found);
    const dockDistance = Math.hypot(playerX - DOCK_RETURN.x, playerZ - DOCK_RETURN.z);
    const nearest = need
      .map(({ id }) => {
        const idx = ORBIT9_EVIDENCE.findIndex((item) => item.id === id);
        const [x, z] = CLUE_POSITIONS[idx];
        return { id, distance: Math.hypot(x - playerX, z - playerZ) };
      })
      .sort((a, b) => a.distance - b.distance)[0];
    if (cinematicPhase !== 'none') {
      gateBeat.hidden = false;
      gateBeat.textContent =
        cinematicPhase === 'departure'
          ? 'PORTÃO ABERTO · NAVE RETORNANDO PELO TÚNEL INTERNO'
          : gate.text;
    }
    if (stats.found === stats.required) {
      objective.textContent =
        dockDistance <= DOCK_RETURN.radius
          ? 'PORTÃO LIBERADO · EMBARQUE NA NAVE PARA ENTRAR NO REATOR'
          : '3/3 ATIVADOS · VOLTE AO HANGAR (' + Math.round(dockDistance) + 'm)';
    } else if (closeClue) {
      const moduleName = DEVASTADOR_ACCESS_MODULES.find(({ id }) => id === closeClue.id)?.name;
      objective.textContent = moduleName + ' · PRESSIONE ATIVAR / E';
    } else if (nearest) {
      const moduleName = DEVASTADOR_ACCESS_MODULES.find(({ id }) => id === nearest.id)?.name;
      objective.textContent =
        'SIGA O SINAL ' + moduleName + ' · ' + Math.round(nearest.distance) + 'm';
    }
    scanButton.disabled = !closeClue || cinematicPhase !== 'none';
    talkButton.hidden = true;
    talkButton.disabled = true;
    launchCombat.hidden = stats.found !== stats.required;
    launchCombat.disabled = cinematicPhase !== 'none' || dockDistance > DOCK_RETURN.radius;
    beacons.forEach((beacon, i) => {
      const acquired = state.clues.includes(ORBIT9_EVIDENCE[i].id);
      beacon.core.material.color.set(acquired ? '#478a84' : '#55f2ff');
      beacon.core.material.emissive.set(acquired ? '#164841' : '#106a9a');
      beacon.column.material.opacity = acquired ? 0.08 : 0.22;
      beacon.label.material.opacity = acquired ? 0.35 : 1;
      beacon.label.visible =
        acquired || Math.hypot(CLUE_POSITIONS[i][0] - playerX, CLUE_POSITIONS[i][1] - playerZ) < 65;
    });
  }

  function scan() {
    endArrival();
    const idx = ORBIT9_EVIDENCE.findIndex(
      ({ id }, i) => !state.clues.includes(id) && near(...CLUE_POSITIONS[i]),
    );
    if (idx < 0) {
      notification('Aproxime-se de um dos três módulos de acesso.');
      return;
    }
    const result = inspectEvidence(state, ORBIT9_EVIDENCE[idx].id);
    state = result.state;
    notification(
      result.accepted
        ? 'MÓDULO ATIVADO · ' +
            DEVASTADOR_ACCESS_MODULES[idx].name +
            ' · PORTÃO ' +
            state.clues.length +
            '/3'
        : 'MÓDULO JÁ ATIVADO.',
    );
    if (result.accepted && state.clues.length === 3)
      notification('PORTÃO DE SEGURANÇA LIBERADO · RETORNE À NAVE');
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
    scene.background = new T.Color('#071524');
    scene.fog = new T.FogExp2('#071524', 0.0058);
    camera = new T.PerspectiveCamera(65, 1, 0.1, 300);
    renderer = new T.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.domElement.setAttribute('aria-label', 'Exploração 3D da nave-mãe Devastador');
    viewport.appendChild(renderer.domElement);
    scene.add(new T.HemisphereLight(0xb4d5ec, 0x17273a, 2.05));
    // Carrier armor uses metallic PBR. Fill light is essential because the
    // QA preview has no reflection cubemap, especially on low-end mobile GPUs.
    const hangarKey = new T.DirectionalLight(0xe2f0ff, 2.0);
    hangarKey.position.set(-18, 45, 22);
    scene.add(hangarKey);
    const hangarRim = new T.DirectionalLight(0x7ac8ff, 0.85);
    hangarRim.position.set(44, 20, -85);
    scene.add(hangarRim);
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
    // The portrait follow camera is pulled back beyond the old deck edge.
    // Extend only the cosmetic landing floor so no unbuilt void enters view.
    makeBox(112, 1.4, 28, steel, 0, -0.9, 29);
    // Connected free-roam districts replace the former mandatory corridor.
    const districtMats = [mat('#193c4c'), mat('#37404d'), mat('#283b43')];
    ORBIT9_DISTRICTS.slice(1).forEach((district, i) => {
      makeBox(district.width, 0.12, district.depth, districtMats[i], district.x, -0.08, district.z);
    });
    for (const side of [-1, 1]) {
      makeBox(2, 9, 128, dark, side * 58, 4, -41);
      makeBox(2, 9, 28, dark, side * 58, 4, 29);
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
    // Stage 04 Devastador design language: armored carrier panels, distinct
    // labs/reactor/archive silhouettes and GPU-instanced ambient detail.
    // This is purely visual and leaves every existing interaction collider intact.
    stageArt = createOrbit9StageArt();
    scene.add(stageArt);
    // The exact selectable flight chassis is also used in this short
    // docking scene. Never replace it with a generic cinematic fighter.
    const loadout = game.snapshot?.().loadout ?? {};
    dockingShip = createShipModule(loadout.ship ?? 'nova7');
    dockingShip.name = 'devastador-dock-ship-' + (loadout.ship ?? 'nova7');
    const selectedPaint = String(loadout.color ?? '');
    if (/^#[0-9a-f]{6}$/i.test(selectedPaint))
      dockingShip.traverse((part) => {
        if (part.isMesh && part.material?.userData?.paintModule) {
          part.material = part.material.clone();
          part.material.color.set(selectedPaint);
        }
      });
    dockingShip.scale.setScalar(1.05);
    dockingShip.position.set(0, 5, 18);
    dockingShip.userData.visualOnly = true;
    scene.add(dockingShip);
    for (const side of [-1, 1]) {
      const tunnelLight = new T.PointLight(side < 0 ? 0x5dd7ff : 0xff926a, 9, 56, 2);
      tunnelLight.position.set(side * 15, 16, -16);
      scene.add(tunnelLight);
    }
    beacons = CLUE_POSITIONS.map(([x, z], i) => {
      // The rendered activator and the real trigger must have EXACTLY the
      // same location, otherwise the world contradicts the mini-map.
      const ring = new T.Mesh(new T.TorusGeometry(2.3, 0.22, 8, 28), line);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.22, z);
      scene.add(ring);
      // Flat illuminated pad, not an opaque pedestal that the pilot clips.
      makeBox(3.2, 0.14, 3.2, line, x, 0.04, z);
      const column = new T.Mesh(
        new T.CylinderGeometry(0.44, 0.44, 12, 12, 1, true),
        new T.MeshBasicMaterial({
          color: '#41d9ff',
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      column.position.set(x, 6.1, z);
      scene.add(column);
      const core = new T.Mesh(new T.OctahedronGeometry(1.25, 1), mat('#55f2ff', '#106a9a'));
      core.position.set(x, 4.5, z);
      core.name = 'orbit9-clue-' + i;
      scene.add(core);
      // A numbered in-world label makes all three devices identifiable on
      // phone screens; canvas textures stay local and are disposed on exit.
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b2335';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#65e3ff';
      ctx.lineWidth = 7;
      ctx.strokeRect(4, 4, 504, 120);
      ctx.fillStyle = '#e2faff';
      ctx.font = 'bold 35px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1 + '/3  ' + DEVASTADOR_ACCESS_MODULES[i].name, 256, 79, 480);
      const label = new T.Sprite(
        new T.SpriteMaterial({
          map: new T.CanvasTexture(canvas),
          transparent: true,
          depthTest: false,
        }),
      );
      label.name = 'reactor-module-label-' + (i + 1);
      label.position.set(x, 13, z);
      label.scale.set(13, 3.25, 1);
      scene.add(label);
      return { core, ring, column, label };
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
    npc.visible = false; // No unrelated NPC/dialogue before the reactor.
    scene.add(npc);
    // Use the same approved feline 3D character the current hangar and
    // stage-one opening already share; never build an unrelated cube avatar.
    const selectedPilot = game.snapshot?.().loadout?.pilot ?? 'bia';
    pilot = createShowroomPilot(selectedPilot);
    pilot.name = 'orbit9-player-' + selectedPilot;
    pilot.scale.multiplyScalar(1.2);
    walkRig = createOrbit9WalkRig(pilot);
    facingYaw = Math.PI;
    pilot.rotation.y = facingYaw;
    scene.add(pilot);
    const initialCamera = orbit9CameraPose(playerX, playerZ, {
      ...cameraState,
      aspect: viewport.clientWidth / Math.max(1, viewport.clientHeight),
    });
    camera.position.set(initialCamera.eye.x, initialCamera.eye.y, initialCamera.eye.z);
    cameraAimSmooth.set(initialCamera.aim.x, initialCamera.aim.y, initialCamera.aim.z);
    camera.lookAt(cameraAimSmooth);
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
    // Mission instructions stay in the top rail; transient notifications
    // should not permanently cover the cat or the middle of the scene.
    if (statusUntil > 0 && elapsed >= statusUntil) {
      status.hidden = true;
      statusUntil = 0;
    }
    // Movement stays locked until the tunnel arrival camera rail finishes.
    // Early key or joystick input must never hard-cut the landing cinematic.
    const inputLocked = cinematicPhase !== 'none' || !dialoguePanel.hidden || !choicePanel.hidden;
    const keyX = Number(held.has('right')) - Number(held.has('left'));
    const keyZ = Number(held.has('down')) - Number(held.has('up'));
    const keyboardActive = keyX !== 0 || keyZ !== 0;
    const inputX = inputLocked ? 0 : keyboardActive ? keyX : stickInput.x;
    const inputZ = inputLocked ? 0 : keyboardActive ? keyZ : stickInput.z;
    // The thumbstick and keyboard follow the rendered camera orientation.
    // World-aligned input felt inverted after orbiting behind the cat.
    const { x: moveX, z: moveZ } = orbit9CameraRelativeAxes(inputX, inputZ, cameraYawVisual);
    const len = Math.max(1, Math.hypot(moveX, moveZ));
    const boosting = held.has('boost') || boostTouchHeld;
    const speed = WALK_SPEED * (boosting ? RUN_MULTIPLIER : 1);
    const previousX = playerX;
    const previousZ = playerZ;
    const direction = motion.update(moveX / len, moveZ / len, dt);
    const moved = orbit9Move(playerX, playerZ, direction.x * speed * dt, direction.z * speed * dt);
    playerX = moved.x;
    playerZ = moved.z;
    const actualX = playerX - previousX;
    const actualZ = playerZ - previousZ;
    motion.stopBlockedAxes(actualX, actualZ, dt);
    const distanceTravelled = Math.hypot(actualX, actualZ);
    pilot.position.set(playerX, 1.92, playerZ);
    walkRig?.update({ distanceTravelled, dt, boost: boosting });
    if (distanceTravelled > 0.0001) {
      // Showroom pilots face local +Z; yaw must follow actual walking direction,
      // not the opposite heading or an input blocked by a physical obstacle.
      const destinationYaw = Math.atan2(actualX, actualZ);
      const angle = Math.atan2(
        Math.sin(destinationYaw - facingYaw),
        Math.cos(destinationYaw - facingYaw),
      );
      facingYaw += angle * Math.min(1, dt * 13);
    }
    // Full 360 degree character turn is visual only. It does not displace
    // the collision capsule, trigger flight rolls or change progression.
    let spinAngle = 0;
    if (spinElapsed >= 0) {
      // dt is deliberately capped for collision safety. The 360-degree
      // action must use real time; otherwise low-FPS devices take several
      // seconds to complete an intended 720ms rotation.
      const t = Math.min(1, Math.max(0, (stamp - spinElapsed) / (SPIN_SECONDS * 1000)));
      spinAngle = Math.PI * 2 * (t * t * (3 - 2 * t));
      if (t >= 1) {
        spinElapsed = -1;
        spinAngle = 0;
        spinButton.classList.remove('pressed');
      }
    }
    pilot.rotation.y = facingYaw + spinAngle;
    const turn = Math.atan2(
      Math.sin(cameraState.yaw - cameraYawVisual),
      Math.cos(cameraState.yaw - cameraYawVisual),
    );
    cameraYawVisual += turn * Math.min(1, dt * 7);
    const pose = orbit9CameraPose(playerX, playerZ, {
      yaw: cameraYawVisual,
      mode: cameraState.mode,
      aspect: camera.aspect,
    });
    cameraGoal.set(pose.eye.x, pose.eye.y, pose.eye.z);
    camera.position.lerp(cameraGoal, Math.min(1, dt * 8));
    // Smoothed orbit transitions must not interpolate THROUGH opaque pillars.
    if (orbit9CameraIntersectsSolid(camera.position)) camera.position.copy(cameraGoal);
    cameraTarget.set(pose.aim.x, pose.aim.y, pose.aim.z);
    cameraAimSmooth.lerp(cameraTarget, Math.min(1, dt * 10));
    camera.lookAt(cameraAimSmooth);
    if (Math.abs(camera.fov - pose.fov) > 0.03) {
      camera.fov += (pose.fov - camera.fov) * Math.min(1, dt * 8);
      camera.updateProjectionMatrix();
    }
    for (const [i, beacon] of beacons.entries()) {
      beacon.core.rotation.y += dt * 0.8;
      beacon.core.position.y = 4.5 + Math.sin(elapsed * 2 + i * 2) * 0.45;
    }
    npc.children[0].scale.y = 1 + Math.sin(elapsed * 1.7) * 0.06;
    updateOrbit9StageArt(stageArt, elapsed, state.clues.length);
    if (cinematicPhase === 'arrival' || cinematicPhase === 'departure') {
      const seconds = Math.max(0, (stamp - cinematicStarted) / 1000);
      const cinematic = reactorCinematicPose(
        cinematicPhase === 'departure' ? 'departure' : 'arrival',
        seconds,
        departureCameraStart,
      );
      if (cinematic.complete) {
        if (cinematicPhase === 'departure') {
          close();
          return;
        }
        endArrival();
      } else {
        pilot.visible = false;
        dockingShip.visible = true;
        dockingShip.position.set(cinematic.ship.x, cinematic.ship.y, cinematic.ship.z);
        camera.position.set(cinematic.eye.x, cinematic.eye.y, cinematic.eye.z);
        cameraAimSmooth.set(cinematic.aim.x, cinematic.aim.y, cinematic.aim.z);
        camera.lookAt(cameraAimSmooth);
        camera.fov = cinematic.fov;
        camera.updateProjectionMatrix();
      }
    } else dockingShip.visible = true;
    renderer.render(scene, camera);
    updateUI();
    rafId = requestAnimationFrame(frame);
  }

  function open() {
    if (active || !integratedRequest) return false;
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
    motion.reset();
    cinematicPhase = 'arrival';
    departureCameraStart = null;
    cinematicStarted = performance.now();
    held.clear();
    resetStick();
    boostTouchHeld = false;
    boostButton.classList.remove('pressed');
    spinElapsed = -1;
    spinButton.classList.remove('pressed');
    dialogueIndex = -1;
    root.hidden = false;
    root.dataset.mode = 'reactor-access';
    root.dataset.reactorBeat = 'arrival';
    gateBeat.hidden = false;
    gateBeat.textContent = reactorGateStatus(0).text;
    $('explorationTitle').textContent = 'DEVASTADOR · ACESSO AO REATOR';
    $('explorationEyebrow').textContent = 'FASE 04 · DESEMBARQUE · REATOR';
    exitButton.textContent = 'PAUSAR / MENU';
    scanButton.textContent = 'ATIVAR';
    launchCombat.textContent = 'RETORNAR À NAVE · TÚNEL DO REATOR';
    talkButton.hidden = true;
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
      return false;
    }
    const pilotName = game.snapshot?.().loadout?.pilotName ?? 'FIVE CATS';
    notification(
      pilotName + ': O PORTÃO DO REATOR ESTÁ BLOQUEADO. Ative os três módulos para abrir.',
    );
    updateUI();
    rafId = requestAnimationFrame(frame);
    return true;
  }

  function close() {
    active = false;
    cancelAnimationFrame(rafId);
    held.clear();
    resetStick();
    boostTouchHeld = false;
    boostButton.classList.remove('pressed');
    spinElapsed = -1;
    spinButton.classList.remove('pressed');
    cameraPointer = null;
    cinematicPhase = 'none';
    departureCameraStart = null;
    motion.reset();
    gateBeat.hidden = true;
    root.dataset.reactorBeat = 'none';
    dialogueIndex = -1;
    dialoguePanel.hidden = true;
    choicePanel.hidden = true;
    root.hidden = true;
    for (const beacon of beacons) beacon.label.material.map?.dispose();
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
    walkRig = null;
    stageArt = null;
    dockingShip = null;
    rafId = 0;
    integratedRequest = null;
  }

  function launchMission() {
    if (!integratedRequest || !reactorModulesComplete(state.clues)) {
      notification('ACESSO BLOQUEADO · ATIVE OS TRÊS MÓDULOS');
      return;
    }
    if (Math.hypot(playerX - DOCK_RETURN.x, playerZ - DOCK_RETURN.z) > DOCK_RETURN.radius) {
      notification('VOLTE À NAVE NO HANGAR ANTES DE ENTRAR NO REATOR.');
      return;
    }
    // Continue the SAME Stage 04 flight: the original reactor boss spawns
    // after the normal encounter warning. Never start a second QA scenario.
    const resumed = integratedRequest.complete([...state.clues]);
    if (resumed) {
      // Keep the SAME actual enclosed 3D tunnel visible while the flight
      // renderer resumes behind this full-screen overlay. This removes
      // the momentary space skybox before the reactor boss becomes active.
      departureCameraStart = {
        eye: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        aim: { x: cameraAimSmooth.x, y: cameraAimSmooth.y, z: cameraAimSmooth.z },
        fov: camera.fov,
      };
      cinematicPhase = 'departure';
      cinematicStarted = performance.now();
      motion.reset();
      held.clear();
      boostTouchHeld = false;
      root.dataset.reactorBeat = 'departure';
      launchCombat.disabled = true;
      gateBeat.hidden = false;
      gateBeat.textContent = 'PORTÃO ABERTO · ENTRANDO PELO TÚNEL DO REATOR';
      updateUI();
    } else notification('NÃO FOI POSSÍVEL LIBERAR O NÚCLEO.');
  }

  function leaveToPause() {
    if (!integratedRequest) return;
    const abort = integratedRequest.abort;
    close();
    abort();
  }

  function openIntegrated(request) {
    if (
      !request ||
      request.sector !== 3 ||
      typeof request.complete !== 'function' ||
      typeof request.abort !== 'function'
    )
      return false;
    integratedRequest = request;
    return open();
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
      if (cinematicPhase === 'departure') return;
      endArrival();
      held.add(direction);
      e.preventDefault();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      endArrival();
      held.add('boost');
      e.preventDefault();
    } else if (e.code === 'KeyE' && !e.repeat) {
      scan();
      e.preventDefault();
    } else if (e.code === 'KeyQ' || e.code === 'KeyR') {
      cameraState = orbit9RotateCamera(cameraState, ((e.code === 'KeyQ' ? -1 : 1) * Math.PI) / 7);
      e.preventDefault();
    } else if (e.code === 'KeyC') {
      cameraState = orbit9ToggleCameraMode(cameraState);
      cameraZoom.setAttribute('aria-pressed', String(cameraState.mode === 'survey'));
      e.preventDefault();
    } else if (e.code === 'Escape') {
      leaveToPause();
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
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') held.delete('boost');
  }

  listen(exitButton, 'click', leaveToPause);
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
  listen(spinButton, 'click', () => {
    if (!active || spinElapsed >= 0 || !dialoguePanel.hidden || !choicePanel.hidden) return;
    spinElapsed = performance.now();
    spinButton.classList.add('pressed');
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
  listen(window, 'blur', () => {
    held.clear();
    resetStick();
    boostTouchHeld = false;
    boostButton.classList.remove('pressed');
  });
  function resetStick() {
    stickInput.x = 0;
    stickInput.z = 0;
    stickInput.pointerId = null;
    nub.style.transform = 'translate(-50%, -50%)';
    stick.classList.remove('pressed');
  }
  function moveStick(event) {
    const bounds = stick.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) * 0.32;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const axes = orbit9StickAxes(dx, dy, radius);
    stickInput.x = axes.x;
    stickInput.z = axes.z;
    const distance = Math.hypot(dx, dy);
    const scale = distance > radius ? radius / distance : 1;
    nub.style.transform =
      'translate(-50%, -50%) translate(' +
      Math.round(dx * scale) +
      'px, ' +
      Math.round(dy * scale) +
      'px)';
  }
  listen(stick, 'pointerdown', (event) => {
    if (!active || stickInput.pointerId !== null || cinematicPhase === 'departure') return;
    endArrival();
    event.preventDefault();
    stickInput.pointerId = event.pointerId;
    stick.setPointerCapture?.(event.pointerId);
    stick.classList.add('pressed');
    moveStick(event);
  });
  listen(stick, 'pointermove', (event) => {
    if (event.pointerId !== stickInput.pointerId) return;
    event.preventDefault();
    moveStick(event);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(stick, eventName, (event) => {
      if (event.pointerId === stickInput.pointerId) resetStick();
    });
  }
  listen(boostButton, 'pointerdown', (event) => {
    if (!active || cinematicPhase === 'departure') return;
    endArrival();
    event.preventDefault();
    boostTouchHeld = true;
    boostButton.classList.add('pressed');
    boostButton.setPointerCapture?.(event.pointerId);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(boostButton, eventName, () => {
      boostTouchHeld = false;
      boostButton.classList.remove('pressed');
    });
  }

  function startStageReactorQA() {
    if (!qaAllowed || active || game.snapshot?.().state !== 'menu') return false;
    return game.startDeveloperScenario(3, 'stage') && game.enterReactorAccessForQA();
  }
  if (qaAllowed && $('developerReactorQA')) {
    $('developerReactorQA').hidden = false;
    listen($('developerReactorQA'), 'click', startStageReactorQA);
  }

  // Developer-only teleport/inspection API supports deterministic browser QA.
  // It grants no rank, save, mission victory or privileged backend actions.
  if (qaAllowed)
    window.__novaExploreQA = Object.freeze({
      startStageReactorQA,
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
        endArrival(true);
        playerX = x;
        playerZ = z;
        motion.reset();
        // Developer/QA teleport is not player movement. Never interpolate the
        // camera across dozens of meters through the station's physical walls.
        // Snapping immediately also makes screenshots of each district reliable.
        // The viewport can change between screenshots without a delivered
        // window.resize event yet. Read its actual dimensions synchronously.
        resize();
        cameraYawVisual = cameraState.yaw;
        const pose = orbit9CameraPose(playerX, playerZ, {
          ...cameraState,
          aspect: camera?.aspect,
        });
        cameraGoal.set(pose.eye.x, pose.eye.y, pose.eye.z);
        cameraTarget.set(pose.aim.x, pose.aim.y, pose.aim.z);
        cameraAimSmooth.copy(cameraTarget);
        camera?.position.copy(cameraGoal);
        camera?.lookAt(cameraTarget);
        updateUI();
        return true;
      },
      snapshot() {
        return {
          active,
          game: {
            state: game.snapshot?.().state,
            sector: game.snapshot?.().sector,
            seconds: game.snapshot?.().seconds,
            arena: game.snapshot?.().boss === true,
            boss: game.snapshot?.().boss === true,
            reactorAccess: game.snapshot?.().reactorAccess,
          },
          player: { x: playerX, z: playerZ },
          pilotModel: pilot?.name ?? null,
          stageArt: stageArt
            ? {
                name: stageArt.name,
                referencesStage: stageArt.userData.referencesStage,
                districtLandmarks: stageArt.userData.landmarks.map((item) => item.id),
                instanceCounts: { ...stageArt.userData.instanceCounts },
              }
            : null,
          gait: walkRig?.snapshot() ?? null,
          moduleVisuals: beacons.map((beacon, i) => ({
            id: DEVASTADOR_ACCESS_MODULES[i].id,
            x: beacon.core.position.x,
            z: beacon.core.position.z,
            visible: beacon.label.visible,
          })),
          stick: { x: stickInput.x, z: stickInput.z },
          boosting: held.has('boost') || boostTouchHeld,
          spinning: spinElapsed >= 0,
          cameraVisualYaw: cameraYawVisual,
          cinematic: {
            phase: cinematicPhase,
            gate: reactorGateStatus(state.clues.length),
            gateProgress: stageArt?.userData?.reactorGate?.progress ?? 0,
            shipModel: dockingShip?.name ?? null,
          },
          motion: motion.snapshot(),
          district: orbit9District(playerX, playerZ).id,
          camera: { ...cameraState },
          cameraEye: camera
            ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
            : null,
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
    openIntegrated,
    destroy() {
      close();
      if (qaAllowed && window.__novaExploreQA) delete window.__novaExploreQA;
      for (const [el, name, handler, opts] of listeners)
        el.removeEventListener(name, handler, opts);
    },
  };
}
