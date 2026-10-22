import {
  ARSENAL,
  SPECIALS,
  xpForStage,
  specialtyRank,
  stageAt,
  readStrategy,
  weaknessAt,
  elementalDamage,
  weakPointOpen,
} from './strategy.js';
import {
  bossTacticsAt,
  inDanger,
  chargeTactics,
  impactPoint,
  radarGradient,
  wrapAngle,
} from './tactics.js';
import { createEvolution } from './evolution.js';
import { createCockpit } from './cockpit.js';
import { routeAt, createRouteRenderer } from './route.js';
import { SKINS, readCosmetics, skinPurchase } from './customization.js';
import {
  PILOT_PROFILES,
  SHIP_MODELS,
  SHIP_COLORS,
  readPilotLoadout,
  pilotAt,
  shipAt,
  shipColorAt,
} from './pilots.js';
import { createArcade, drawArcade } from './arcade.js';
import { isGameKey, protectFlightSurface } from './input.js';
import * as T from 'three';
import {
  SECTORS,
  PILOTS,
  WEAPONS,
  SHOT_COUNTS,
  WEAPON_COLORS,
  SHOP,
  shopPrice,
  readSave,
  writeSave,
} from './campaign.js';
import { createFlightCamera, crossesSolid } from './flight.js';
import {
  createGroundEnemy,
  animateGroundEnemy,
  createObstacle,
  isGroundSector,
} from './encounters.js';
import { createMusic } from './audio.js';
import { loadSettings, storeSettings, readSettings, uiText } from './ui-preferences.js';
import { createAudioCues } from './audio-cues.js';
import { PET_ITEMS, readPetCare, collectPetItem } from './pet-collectibles.js';
import { createPetPickup } from './pet-visuals.js';
import { pickupStep } from './pickup-assist.js';
import { createI18n } from './i18n.js';
import { CINEMATICS, cinematicBeat, cinematicDuration } from './cinematics.js';
import {
  createBossModel,
  createSubboss,
  disposeBoss,
  encounterPattern,
  SUBBOSS_NAMES,
} from './bosses.js';
import { createBossCombat } from './combat.js';
import { createPod, animatePod, createPickup } from './equipment.js';
import { createCollapse, updateCollapse, disposeCollapse, COLLAPSE_SECONDS } from './finale.js';
import {
  fighter,
  createShipModule,
  createWorld,
  postProcessor,
  halo,
  glowMaterial,
  metal,
  box,
} from './visuals.js';
/** Create one isolated game. Node tests inject the browser boundary, not source code. */
export function createGame({
  document = globalThis.document,
  window = globalThis.window,
  rendererFactory = (options) => new T.WebGLRenderer(options),
  requestFrame = globalThis.requestAnimationFrame,
  now = () => performance.now(),
  random = Math.random,
  autoLoop = true,
  spawnEncounters = true,
  nativeLifecycle = false,
} = {}) {
  const { innerWidth, innerHeight, devicePixelRatio = 1 } = window;
  const matchMedia = (q) => window.matchMedia(q);
  const cleanups = [];
  let running = true;
  const addEventListener = (type, fn) => {
    window.addEventListener(type, fn);
    cleanups.push(() => window.removeEventListener(type, fn));
  };
  const pixelLimit = matchMedia('(pointer:coarse)').matches ? 1.25 : 1.7;
  const $ = (id) => document.getElementById(id),
    clamp = T.MathUtils.clamp,
    rnd = (a, b) => a + random() * (b - a);
  document.body.classList.add('menu');
  let renderer;
  try {
    renderer = rendererFactory({
      canvas: $('game'),
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    $('brief').textContent =
      'Seu navegador não conseguiu iniciar o 3D. Ative a aceleração gráfica e recarregue.';
    $('start').disabled = true;
    throw e;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, pixelLimit));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2500);
  camera.position.set(0, 10, 32);
  camera.lookAt(0, 7, -50);
  const flightCamera = createFlightCamera(camera, !nativeLifecycle);
  const dynamicFlight = !nativeLifecycle;
  const routeRenderer = dynamicFlight ? createRouteRenderer(scene, camera) : null;
  scene.add(camera);
  const cockpit = dynamicFlight ? createCockpit(camera) : null;
  let cameraMode = 'chase';
  const cameraNames = { chase: 'PERSEGUIÇÃO', cockpit: 'COCKPIT', combat: 'COMBATE' };
  function cycleCamera() {
    if (!dynamicFlight || state !== 'playing') return;
    const modes = ['chase', 'cockpit', 'combat'];
    cameraMode = modes[(modes.indexOf(cameraMode) + 1) % modes.length];
    flightCamera.setMode(cameraMode);
    $('cameraView').textContent = 'C · ' + cameraNames[cameraMode];
  }
  $('cameraView').hidden = !dynamicFlight;
  $('cameraView').onclick = cycleCamera;
  let route = routeAt(0, 0, 65);
  let arcade = null,
    arcadeDone = false;
  const world = createWorld(scene, random, dynamicFlight),
    post = postProcessor(renderer, scene, camera);
  post.resize(innerWidth, innerHeight);
  const buildingMat = metal('#173344');
  const green = glowMaterial('#64ffe4', 4),
    enemyOrbMat = glowMaterial('#ff5065', 3);
  const reticle = new T.Group();
  const lineMat = new T.LineBasicMaterial({ color: 0x8affb5, transparent: true, opacity: 0.9 });
  for (let [x, y] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const geo = new T.BufferGeometry().setFromPoints([
      new T.Vector3(x * 2.2, y * 1.3, 0),
      new T.Vector3(x * 2.2, y * 2.2, 0),
      new T.Vector3(x * 1.3, y * 2.2, 0),
    ]);
    reticle.add(new T.Line(geo, lineMat));
  }
  scene.add(reticle);
  reticle.visible = false;
  const player = fighter();
  scene.add(player);
  player.position.set(0, 6, 9);
  let pilotLoadout = readPilotLoadout(null);
  let shipModule = dynamicFlight ? createShipModule(pilotLoadout.ship) : new T.Group();
  player.add(shipModule);
  const activePilot = () => pilotAt(pilotLoadout.pilot);
  const activeShip = () => shipAt(pilotLoadout.ship);
  const barrierVisual = new T.Mesh(
    new T.SphereGeometry(5.8, 16, 10),
    new T.MeshBasicMaterial({
      color: '#6eeaff',
      transparent: true,
      opacity: 0.2,
      wireframe: true,
      depthWrite: false,
    }),
  );
  barrierVisual.visible = false;
  player.add(barrierVisual);
  let enemies = [],
    shots = [],
    hostile = [],
    particles = [],
    rings = [],
    obstacles = [],
    boss = null;
  const laserGeo = new T.CylinderGeometry(0.1, 0.16, 3.8, 6),
    orbGeo = new T.SphereGeometry(0.35, 8, 6),
    particleGeo = new T.IcosahedronGeometry(0.3, 0);
  let state = 'menu',
    elapsed = 0,
    score = 0,
    hp = 100,
    bombs = 3,
    energy = 100,
    shotCd = 0,
    spawnCd = 0,
    ringCd = 0,
    petCd = 0,
    petWave = 0,
    obstacleCd = 0,
    invuln = 0,
    roll = 0,
    rollCd = 0,
    boosting = false,
    boostNeedsRelease = false,
    bossHp = 200,
    bossCd = 0,
    msgTime = 0,
    muted = false,
    visualTime = 0,
    shake = 0,
    lastStage = -1;
  let sectorIndex = 0,
    lives = 3,
    credits = 0,
    weapon = 0,
    armor = 0,
    podCount = 0,
    blueRings = 0,
    charge = 0,
    chargeLatch = false,
    podsDetached = false,
    podCd = 0,
    subDone = false,
    rivalDone = false,
    baseDone = false,
    groundCd = 5,
    groundWave = 0,
    tunnelDone = false,
    respawnTime = 0,
    totalTime = 0,
    music = null,
    audioCues = null,
    musicOn = true,
    menuThemePlaying = false,
    cinematic = null,
    bossVolley = 0,
    bossCombat = null,
    collapse = null,
    collapseTime = 0,
    collapseBurst = 0,
    collapseFinal = false,
    pausedFrom = 'playing',
    ringWave = 0,
    stageIntroTime = 0,
    sectorStart = null,
    confirmation = null,
    settingsOpen = false;
  let strategy = readStrategy(null),
    arcana = 100,
    specialCd = 0,
    barrier = 0,
    stasis = 0;
  let evolution = null,
    evolutionStage = -1,
    orbitAngle = 0,
    orbitTouch = 0;
  let tacticEnergy = 0,
    scanTime = 0,
    impactTime = 0,
    impactConfirmed = false,
    lastSpecialCycle = -1,
    pickupFeedbackTime = 0;
  const tactics = () => bossTacticsAt(sectorIndex, bossCombat?.age ?? 0, bossCombat?.phase ?? 1);
  const relativeOrbit = () => orbitAngle - (dynamicFlight && boss ? tactics().heading : 0);
  const stage = () => (dynamicFlight ? stageAt(strategy.xp) : 0);
  const rank = (branch) =>
    dynamicFlight ? specialtyRank(strategy.xp, strategy.specialty, branch) : 0;
  const weaponPower = () =>
    dynamicFlight
      ? selectedWeapon().damage *
        (1 + rank('attack') * 0.12) *
        (strategy.specialty === 'attack' ? 1.15 : 1) *
        activePilot().bonuses.damage *
        (podsDetached ? 1 : 1 + podCount * 0.3)
      : 1;
  const selectedWeapon = () => ARSENAL[dynamicFlight ? strategy.arsenal : 0];
  function evolve() {
    if (!dynamicFlight || evolutionStage === stage()) return;
    evolutionStage = stage();
    if (evolution) player.remove(evolution);
    evolution = createEvolution(evolutionStage);
    player.add(evolution);
    player.scale.setScalar(1 + Math.min(18, evolutionStage) * 0.025);
  }
  function gainXP(amount) {
    if (!dynamicFlight) return;
    const before = stage();
    strategy.xp = Math.min(Number.MAX_SAFE_INTEGER, strategy.xp + amount);
    weapon = Math.max(weapon, Math.min(5, Math.floor(stage() / 3)));
    evolve();
    if (stage() > before) message('EVOLUÇÃO ' + (stage() + 1) + ' · POTÊNCIA AUMENTADA');
  }
  function orbit(direction) {
    if (dynamicFlight && boss && state === 'playing') orbitTouch = clamp(direction, -1, 1);
  }
  function cycleArsenal() {
    if (!dynamicFlight || state !== 'playing') return;
    const available = ARSENAL.filter((w) => w.stage <= stage()).length;
    strategy.arsenal = (strategy.arsenal + 1) % available;
    message('ARMA · ' + selectedWeapon().name);
  }
  function cycleSpecial() {
    if (!dynamicFlight || state !== 'playing') return;
    strategy.special = (strategy.special + 1) % SPECIALS.filter((w) => w.stage <= stage()).length;
  }
  function castSpecial() {
    if (!dynamicFlight || state !== 'playing' || specialCd > 0) return false;
    const spell = SPECIALS[strategy.special];
    if (arcana < spell.cost) {
      message('ENERGIA ARCANA INSUFICIENTE');
      return false;
    }
    arcana -= spell.cost;
    specialCd = dynamicFlight ? Math.max(3, 8 / (1 + rank('spirit') * 0.025)) : 8;
    if (strategy.special === 0) barrier = 4 + rank('defense') * 0.08;
    if (strategy.special === 2) stasis = 5;
    if (strategy.special === 1) {
      for (let i = 0; i < 9; i++) {
        const angle = (i * Math.PI * 2) / 9;
        const direction = new T.Vector3(Math.sin(angle), 0, Math.cos(angle));
        launchShot(
          0,
          (18 + rank('spirit') * 3) * (strategy.specialty === 'spirit' ? 1.3 : 1),
          true,
        );
        const b = shots.at(-1);
        b.o.position.copy(player.position).addScaledVector(direction, 4);
        b.o.material = shotMaterials[3];
        b.v = direction.multiplyScalar(130);
        b.element = 'arcane';
      }
    }
    message('ESPECIAL · ' + spell.name);
    return true;
  }
  function scanBoss() {
    if (!dynamicFlight || state !== 'playing' || !boss || arcana < 10 || scanTime > 0) return false;
    arcana -= 10;
    scanTime = 8;
    return true;
  }
  function tacticalAction(kind) {
    if (!dynamicFlight || state !== 'playing') return false;
    const cost = { precision: 1, repair: 2, barrage: 3 }[kind];
    if (!cost || tacticEnergy + 1e-8 < cost || (kind === 'repair' && hp >= maxHp())) return false;
    tacticEnergy = Math.max(0, tacticEnergy - cost);
    if (kind === 'repair') hp = Math.min(maxHp(), hp + 25 + rank('defense') * 2);
    else {
      const count = kind === 'precision' ? 1 : 7;
      for (let i = 0; i < count; i++) {
        launchShot(
          (i - (count - 1) / 2) * 1.4,
          (kind === 'precision' ? 55 : 22) * weaponPower(),
          true,
        );
        const b = shots.at(-1);
        b.homing = true;
        b.element = kind === 'precision' ? selectedWeapon().element : 'arcane';
        b.o.scale.setScalar(kind === 'precision' ? 2.2 : 1.6);
      }
      cockpit?.fire();
    }
    return true;
  }
  const podMeshes = [];
  let podMode = 'docked';
  let podBlocks = 0;
  const podAnchor = new T.Vector3();
  function togglePods() {
    if (!podCount || state !== 'playing') return;
    podsDetached = !podsDetached;
    podMode = podsDetached ? 'launching' : 'returning';
    podAnchor.copy(player.position);
    podAnchor.z -= 42;
  }
  const flightLimit = () => (dynamicFlight ? 72 : Math.min(25, camera.aspect * 20));
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    /* Storage is optional. */
  }
  let cosmetics = readCosmetics(null);
  let petCare = readPetCare(null);
  let settings = loadSettings(storage);
  const localization = createI18n(document, window);
  const saved = readSave(storage);
  if (saved) {
    cosmetics = readCosmetics(saved.cosmetics);
    petCare = readPetCare(saved.petCare);
  }
  function applySkin() {
    const skin = SKINS.find((s) => s.id === (dynamicFlight ? cosmetics.skin : 'classic'));
    const starter = shipColorAt(pilotLoadout.color);
    const palette = dynamicFlight && cosmetics.skin === 'classic' ? starter : skin;
    player.userData.paint?.forEach((m) =>
      m.color.set(m.userData.paintAccent ? palette.accent : palette.color),
    );
    shipModule.traverse((o) => {
      if (o.material?.userData.paintModule) o.material.color.set(palette.color);
    });
  }
  function applyShipModel() {
    if (shipModule) {
      player.remove(shipModule);
      shipModule.traverse((o) => {
        o.geometry?.dispose();
        if (o.material?.userData.paintModule) o.material.dispose();
      });
    }
    shipModule = dynamicFlight ? createShipModule(pilotLoadout.ship) : new T.Group();
    player.add(shipModule);
    applySkin();
  }
  const statLabels = {
    attack: 'ATAQUE',
    defense: 'DEFESA',
    agility: 'AGILIDADE',
    force: 'FORÇA',
    vitality: 'VIDA',
    spirit: 'ESPÍRITO',
  };
  function renderPilotSelection() {
    const pilot = activePilot(),
      ship = activeShip();
    $('squadSelection').style.setProperty?.('--profile-color', pilot.color);
    $('squadSelection').setAttribute?.('data-pilot', pilot.id);
    $('squadSelection').setAttribute?.('data-ship', pilotLoadout.ship);
    $('squadSelection').setAttribute?.('data-ship-color', pilotLoadout.color);
    $('profileAvatar').style.setProperty?.('--pilot', pilot.color);
    $('profileAvatar').textContent = '';
    $('profileAvatar').setAttribute?.('data-pilot', pilot.id);
    $('profileName').textContent = pilot.name;
    $('profileRole').textContent = pilot.role;
    $('profileSkill').textContent = pilot.skill.toUpperCase();
    $('profileDescription').textContent = pilot.description;
    $('profileStats').innerHTML = Object.entries(pilot.stats)
      .map(
        ([key, value]) =>
          '<span class="stat-row"><b>' +
          statLabels[key] +
          '</b><i style="--stat:' +
          value +
          '"></i></span>',
      )
      .join('');
    $('selectedShipName').textContent = ship.name;
    $('selectedShipDescription').textContent = ship.role + ' · ' + ship.description;
    $('specialty').value = pilot.specialty;
    for (const entry of PILOT_PROFILES) {
      const button = $('pilot-' + entry.id),
        selected = entry.id === pilot.id;
      button.classList[selected ? 'add' : 'remove']('selected');
      button.setAttribute?.('aria-pressed', String(selected));
    }
    for (const entry of SHIP_MODELS) {
      const button = $('ship-' + entry.id),
        selected = entry.id === ship.id;
      button.classList[selected ? 'add' : 'remove']('selected');
      button.setAttribute?.('aria-pressed', String(selected));
    }
    for (const entry of SHIP_COLORS) {
      const button = $('ship-color-' + entry.id),
        selected = entry.id === pilotLoadout.color;
      button.classList[selected ? 'add' : 'remove']('selected');
      button.setAttribute?.('aria-pressed', String(selected));
    }
  }
  function selectPilot(id) {
    if (!dynamicFlight || state !== 'menu' || !PILOT_PROFILES.some((p) => p.id === id))
      return false;
    pilotLoadout.pilot = id;
    renderPilotSelection();
    return true;
  }
  function selectShip(id) {
    if (!dynamicFlight || state !== 'menu' || !SHIP_MODELS.some((p) => p.id === id)) return false;
    pilotLoadout.ship = id;
    applyShipModel();
    renderPilotSelection();
    return true;
  }
  function selectShipColor(id) {
    if (!dynamicFlight || state !== 'menu' || !SHIP_COLORS.some((entry) => entry.id === id))
      return false;
    pilotLoadout.color = id;
    applySkin();
    renderPilotSelection();
    return true;
  }
  for (const pilot of PILOT_PROFILES) $('pilot-' + pilot.id).onclick = () => selectPilot(pilot.id);
  for (const ship of SHIP_MODELS) $('ship-' + ship.id).onclick = () => selectShip(ship.id);
  for (const color of SHIP_COLORS)
    $('ship-color-' + color.id).onclick = () => selectShipColor(color.id);
  $('squadSelection').hidden = true;
  $('prepareSquad').hidden = !dynamicFlight;
  $('prepareSquad').onclick = () => {
    const open = $('squadSelection').hidden;
    $('squadSelection').hidden = !open;
    $('prepareSquad').setAttribute?.('aria-expanded', String(open));
    $('menu').classList[open ? 'add' : 'remove']('selecting');
    $('prepareSquad').textContent = open ? 'VOLTAR À CAPA −' : 'PILOTO E NAVE ＋';
  };
  renderPilotSelection();
  applySkin();
  $('customization').hidden = !dynamicFlight;
  function renderSkins() {
    for (const skin of SKINS) {
      const button = $('skin-' + skin.id);
      const owned = cosmetics.owned.includes(skin.id);
      button.textContent =
        skin.name +
        (cosmetics.skin === skin.id
          ? ' · EQUIPADA'
          : owned
            ? ' · EQUIPAR'
            : ' · ' + skin.price + ' CR' + (skin.hits ? ' / ' + skin.hits + ' ACERTOS' : ''));
      button.disabled =
        cosmetics.skin === skin.id || (!owned && (credits < skin.price || score < skin.hits));
    }
  }
  function buySkin(id) {
    if (!dynamicFlight || state !== 'shop') return false;
    const result = skinPurchase(cosmetics, id, credits, score);
    if (!result) return false;
    credits = result.credits;
    cosmetics = { owned: result.owned, skin: result.skin };
    applySkin();
    renderShop();
    saveCheckpoint(sectorIndex + 1);
    return true;
  }
  for (const skin of SKINS) $('skin-' + skin.id).onclick = () => buySkin(skin.id);
  $('continue').hidden = !saved;
  const maxHp = () =>
    Math.round(
      (100 +
        armor * 25 +
        (dynamicFlight ? rank('defense') * 3 + (strategy.specialty === 'defense' ? 25 : 0) : 0) +
        (dynamicFlight ? activeShip().stats.defense * 12 : 0)) *
        (dynamicFlight ? activePilot().bonuses.shield : 1),
    );
  const current = () => SECTORS[sectorIndex];
  function saveCheckpoint(next = sectorIndex) {
    writeSave(storage, {
      sector: next,
      credits,
      weapon,
      armor,
      pods: podCount,
      score,
      cosmetics,
      ...(dynamicFlight ? { petCare } : {}),
      ...(dynamicFlight ? { loadout: pilotLoadout } : {}),
      ...(dynamicFlight ? { strategy } : {}),
    });
  }
  function syncPods() {
    if (podMeshes.length === podCount && podMeshes.every((p) => p.userData.level === podCount))
      return;
    const positions = podMeshes.map((p) => p.position.clone());
    while (podMeshes.length) scene.remove(podMeshes.pop());
    for (let i = 0; i < podCount; i++) {
      const o = createPod(podCount);
      scene.add(o);
      o.position.copy(positions[i] ?? positions[0] ?? player.position);
      podMeshes.push(o);
    }
  }

  function collect(kind) {
    if (state !== 'playing') return;
    if (dynamicFlight && typeof kind === 'string' && kind.startsWith('pet:')) {
      const result = collectPetItem(petCare, kind.slice(4));
      if (!result) return;
      petCare = result.care;
      score += result.points;
      credits += Math.ceil(result.points / 2);
      message(result.message + ' RESGATADO · CUIDE DOS FIVE CATS');
      cue(result.audioCue);
      return;
    }
    if (kind === 'blue') {
      if (dynamicFlight) gainXP(4);
      else weapon = Math.min(5, weapon + 1);
      blueRings++;
      if (blueRings % (dynamicFlight ? 6 : 3) === 0) podCount = Math.min(3, podCount + 1);
      syncPods();
      message(
        dynamicFlight
          ? 'XP +4 · EVOLUÇÃO ' + (stage() + 1) + ' · PODS ' + podCount
          : 'ARMA ' + WEAPONS[weapon] + ' · PODS ' + podCount,
      );
    } else {
      hp = Math.min(maxHp(), hp + 25);
      message('ESCUDO +25');
    }
    credits += 15;
    if (!dynamicFlight) sound(1400, 0.25, 'sine');
  }
  function showShop() {
    state = 'shop';
    releaseControls();
    keys.clear();
    touchFire = touchBoost = false;
    charge = 0;
    music?.start(sectorIndex, 'victory');
    $('bossHUD').hidden = true;
    $('shop').hidden = false;
    $('shopTitle').textContent = 'SETOR ' + String(sectorIndex + 1).padStart(2, '0') + ' LIBERTADO';
    $('shopNext').textContent = 'PRÓXIMO: ' + SECTORS[sectorIndex + 1].name;
    renderShop();
    saveCheckpoint(sectorIndex + 1);
  }
  function renderShop() {
    $('shopCredits').textContent = credits + ' CR · ' + score + ' ACERTOS';
    renderSkins();
    for (const k of Object.keys(SHOP)) {
      const level = k === 'weapon' ? weapon : k === 'armor' ? armor : k === 'pods' ? podCount : 0;
      const full =
        k === 'repair' ? hp >= maxHp() : k === 'bomb' ? bombs >= 5 : level >= SHOP[k].max;
      const price = shopPrice(k, level);
      $('buy' + k).textContent = SHOP[k].label + ' · ' + (full ? 'MÁXIMO' : price + ' CR');
      $('buy' + k).disabled = full || credits < price;
    }
  }
  function buy(k) {
    if (state !== 'shop' || !SHOP[k]) return false;
    const n = k === 'weapon' ? weapon : k === 'armor' ? armor : k === 'pods' ? podCount : 0,
      price = shopPrice(k, n);
    if (
      credits < price ||
      (k === 'repair' ? hp >= maxHp() : k === 'bomb' ? bombs >= 5 : n >= SHOP[k].max)
    )
      return false;
    credits -= price;
    if (k === 'weapon') weapon++;
    if (k === 'armor') {
      armor++;
      hp = Math.min(maxHp(), hp + 25);
    }
    if (k === 'pods') {
      podCount++;
      syncPods();
    }
    if (k === 'repair') hp = maxHp();
    if (k === 'bomb') bombs++;
    renderShop();
    saveCheckpoint(sectorIndex + 1);
    return true;
  }
  function nextSector() {
    if (state !== 'shop' || !appActive) return;
    resumeAudio();
    sectorIndex++;
    enterSector();
    saveCheckpoint();
  }
  function enterSector() {
    arcade = null;
    arcadeDone = false;
    $('arcadePanel').hidden = true;
    route = routeAt(sectorIndex, 0, current().duration);
    routeRenderer?.update(route);
    clearWorld();
    world.reset();
    world.setSector(current());
    lastStage = -1;
    elapsed = 0;
    spawnCd = 2;
    ringCd = 4;
    ringWave = 0;
    bossCombat = null;
    orbitAngle = orbitTouch = 0;
    arcana = 100;
    tacticEnergy = scanTime = impactTime = 0;
    impactConfirmed = false;
    lastSpecialCycle = -1;
    specialCd = barrier = stasis = 0;
    podsDetached = false;
    podMode = 'docked';
    podBlocks = 0;
    podCd = 0;
    obstacleCd = 9;
    subDone = rivalDone = baseDone = false;
    groundCd = 5;
    groundWave = 0;
    tunnelDone = false;
    bossVolley = 0;
    collapseBurst = 0;
    pausedFrom = 'playing';
    bossCd = 2;
    bossHp = 1400 + sectorIndex * 170;
    shotCd = 0;
    charge = 0;
    chargeLatch = false;
    invuln = 3;
    energy = 100;
    hp = Math.min(maxHp(), hp + 30);
    bombs = Math.min(5, bombs + 1);
    releaseControls();
    touchFire = touchBoost = false;
    roll = 0;
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    flightCamera.setMode(cameraMode);
    flightCamera.reset(player.position);
    state = 'playing';
    $('shop').hidden = true;
    $('result').hidden = true;
    $('bossHUD').hidden = true;
    $('subHUD').hidden = true;
    $('attackWarning').textContent = '';
    $('menu').hidden = true;
    document.body.classList.remove('menu');
    $('pause').textContent = 'Ⅱ';
    $('pauseMenu').hidden = true;
    $('settingsMenu').hidden = true;
    settingsOpen = false;
    document.body.classList.add('in-mission', 'stage-intro');
    stageIntroTime = 3;
    pickupFeedbackTime = 0;
    $('pickupFlash').hidden = true;
    $('aimReticle').hidden = true;
    $('sectorLabel').textContent =
      (sectorIndex < 5 ? 'BLOCO I · ASCENSÃO' : 'BLOCO II · DEVASTADOR') +
      ' / ' +
      String(sectorIndex + 1).padStart(2, '0');
    $('chapter').textContent = String(sectorIndex + 1).padStart(2, '0');
    $('stage').textContent = current().name;
    $('weaponLabel').textContent = WEAPONS[weapon] + ' · ' + credits + ' CR · PODS ' + podCount;
    syncPods();
    sectorStart = {
      sector: sectorIndex,
      credits,
      weapon,
      armor,
      pods: podCount,
      score,
      cosmetics: { skin: cosmetics.skin, owned: [...cosmetics.owned] },
      loadout: { ...pilotLoadout },
      strategy: { ...strategy },
      petCare: { ...petCare },
    };
    music?.start(sectorIndex);
    message(PILOTS[3 - lives] + ' / ' + current().brief);
  }
  const keys = new Set(),
    stick = { x: 0, y: 0 };
  let touchFire = false,
    touchBoost = false,
    audioCtx,
    appActive = true;
  function unlockAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      void audioCtx.resume?.().catch?.(() => {});
      if (!music) music = createMusic(audioCtx);
      if (!audioCues) audioCues = createAudioCues(audioCtx);
      music.setEnabled(musicOn);
      music.setVolume(settings.master * settings.music);
      audioCues.setVolume(settings.master * settings.sfx);
      return true;
    } catch {
      return false;
    }
  }
  function cue(name) {
    audioCues?.play(name, { enabled: !muted, active: appActive });
  }
  function resumeAudio() {
    if (appActive) audioCtx?.resume().catch(() => {});
  }
  function sound(freq = 400, duration = 0.07, type = 'sawtooth', vol = 0.025) {
    if (muted || !audioCtx || !appActive || settings.master * settings.sfx <= 0) return;
    vol *= settings.master * settings.sfx;
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(30, freq * 0.35),
      audioCtx.currentTime + duration,
    );
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
    o.start();
    o.stop(audioCtx.currentTime + duration);
  }
  function updateAimReticle() {
    if (!dynamicFlight || !['playing', 'collapsing'].includes(state)) {
      $('aimReticle').hidden = true;
      return;
    }
    // Shots travel forward along the ship's own x/y axis, not screen center.
    camera.updateMatrixWorld();
    const target = new T.Vector3(player.position.x, player.position.y, -80).project(camera);
    const visible =
      Number.isFinite(target.x) &&
      Number.isFinite(target.y) &&
      target.z >= -1 &&
      target.z <= 1 &&
      Math.abs(target.x) <= 1 &&
      Math.abs(target.y) <= 1;
    $('aimReticle').hidden = !visible;
    if (visible) {
      $('aimReticle').style.left = (((target.x + 1) / 2) * window.innerWidth).toFixed(1) + 'px';
      $('aimReticle').style.top = (((1 - target.y) / 2) * window.innerHeight).toFixed(1) + 'px';
    }
  }
  function pickupFeedback(kind) {
    const element = $('pickupFlash');
    const pet = kind.startsWith('pet:');
    element.textContent = pet
      ? '✦ ' + (PET_ITEMS.find((item) => item.id === kind.slice(4))?.name ?? 'ITEM') + ' +1'
      : kind === 'blue'
        ? '✦ XP +4 · PODS'
        : '✦ ESCUDO +25';
    element.style.color = kind === 'blue' ? '#75c8ff' : kind === 'shield' ? '#92ff97' : '#ffd994';
    element.hidden = false;
    pickupFeedbackTime = 1;
    if (!pet) cue(kind === 'blue' ? 'ringBlue' : 'ringShield');
  }
  function message(t) {
    $('message').textContent = t;
    $('comms').classList.add('active');
    msgTime = 3;
  }
  function dispose(o) {
    scene.remove(o);
  }
  function explode(pos, n = 16, color = 0xffa04a) {
    if (n >= 12 && dynamicFlight) cue('explosion');
    else if (n > 3) sound(100, 0.2, 'sine', 0.025);
    for (let i = 0; i < n; i++) {
      const p = new T.Mesh(
        particleGeo,
        new T.MeshBasicMaterial({
          color: new T.Color(color).multiplyScalar(2.2),
          transparent: true,
          blending: T.AdditiveBlending,
          depthWrite: false,
        }),
      );
      p.position.copy(pos);
      scene.add(p);
      particles.push({
        o: p,
        v: new T.Vector3(rnd(-17, 17), rnd(-17, 17), rnd(-17, 17)),
        life: rnd(0.3, 0.85),
        kind: 'spark',
      });
    }
    if (n > 5) {
      const light = halo(color, 9, 0.85);
      light.material = light.material.clone();
      light.position.copy(pos);
      scene.add(light);
      particles.push({ o: light, v: new T.Vector3(), life: 0.45, kind: 'flash' });
      const wave = new T.Mesh(
        new T.RingGeometry(1, 1.2, 48),
        new T.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          blending: T.AdditiveBlending,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      wave.position.copy(pos);
      scene.add(wave);
      particles.push({ o: wave, v: new T.Vector3(), life: 0.6, kind: 'wave' });
    }
  }
  function hit(d) {
    if (dynamicFlight && barrier > 0) return;
    if (state !== 'playing' || !Number.isFinite(d) || d <= 0 || invuln > 0 || roll > 0) return;
    hp = Math.max(0, hp - d);
    if (settings.vibration) window.navigator?.vibrate?.(45);
    if (dynamicFlight && hp > 0 && hp / maxHp() <= 0.25) {
      $('criticalWarning').hidden = false;
      cue('critical');
    }
    shake = 0.35;
    invuln = 1.1;
    $('flash').style.opacity = '.3';
    setTimeout(() => ($('flash').style.opacity = '0'), 150);
    sound(60, 0.25);
    if (hp <= 0) {
      lives--;
      if (lives <= 0) finish(false);
      else {
        state = 'respawning';
        releaseControls();
        respawnTime = 1.5;
        explode(player.position, 40);
        player.visible = false;
        keys.clear();
        touchFire = touchBoost = false;
        charge = 0;
        music?.pause();
        message('NAVE PERDIDA · ' + PILOTS[3 - lives] + ' ASSUMINDO O COMANDO');
      }
    }
  }
  function kill(e) {
    if (e.dead) return;
    explode(e.o.position, e.kind === 'subboss' ? 48 : 16);
    if (e.kind === 'subboss') {
      $('subHUD').hidden = true;
      music?.start(sectorIndex);
      message('CRUZADOR DESTRUÍDO / ROTA LIBERADA');
    }
    score += e.elite ? 15 : 1;
    gainXP(e.elite ? 8 : 1);
    credits += e.elite ? 90 : 12;
    if (e.kind === 'base') {
      collect('blue');
      hp = Math.min(maxHp(), hp + 25);
      message('BASE DESTRUÍDA · ARMA E ESCUDO RECUPERADOS');
    }
    dispose(e.o);
    e.dead = true;
  }
  function doRoll() {
    if (state !== 'playing' || rollCd > 0) return;
    roll = 0.65;
    rollCd = 1.6;
    sound(230, 0.25, 'sine');
  }
  function bomb() {
    if (state !== 'playing' || bombs <= 0) return;
    bombs--;
    const bombPower = dynamicFlight ? activePilot().bonuses.bomb : 1;
    for (let e of enemies)
      if (!e.dead) {
        if (e.kind === 'subboss') {
          damageEnemy(e, 90 * bombPower, 'kinetic');
          explode(e.o.position, 20);
          if (e.life <= 0) kill(e);
        } else kill(e);
      }
    for (let b of hostile) dispose(b.o);
    hostile = [];
    if (boss) {
      explode(boss.position, 40);
      damageBoss(35 * bombPower);
    }
    $('flash').style.background = '#baffff';
    $('flash').style.opacity = '.35';
    shake = 0.5;
    explode(player.position.clone().add(new T.Vector3(0, 0, -30)), 50, 0x59ffc8);
    setTimeout(() => {
      $('flash').style.opacity = '0';
      $('flash').style.background = '#f43f43';
    }, 180);
    if (dynamicFlight) cue('explosion');
    else sound(45, 0.8, 'sawtooth', 0.08);
  }
  const chargeGlow = dynamicFlight ? halo('#8effed', 1, 0.65) : null;
  if (chargeGlow) {
    chargeGlow.position.set(0, 0, -3);
    player.add(chargeGlow);
    chargeGlow.visible = false;
  }
  const shotMaterials = ARSENAL.map((w) => glowMaterial(w.color, 3));
  function impact(position, dealt = 1) {
    if (!dynamicFlight) return;
    const color = dealt > 0 ? '#eaffff' : '#ffad55';
    explode(position, 3, dealt > 0 ? 0xbaffee : 0xffad55);
    const flash = halo(color, dealt > 0 ? 8 : 5, 0.95);
    flash.material = flash.material.clone();
    flash.material.depthTest = false;
    flash.material.depthWrite = false;
    flash.renderOrder = 100;
    if (dealt > 0 || impactTime <= 0 || !impactConfirmed) {
      impactTime = 0.25;
      impactConfirmed = dealt > 0;
      $('hitFeedback').textContent = dealt > 0 ? '✦ ' + Math.max(1, Math.round(dealt)) : '◇';
      $('hitFeedback').style.color = color;
    }
    flash.position.copy(position);
    scene.add(flash);
    particles.push({ o: flash, v: new T.Vector3(), life: 0.22, kind: 'flash' });
  }
  function damageEnemy(e, amount, element = 'kinetic') {
    if (dynamicFlight) {
      if (e.kind === 'subboss') {
        if (e.age < 3) return 0;
        amount *= e.age % 6 < 1.5 ? 0.25 : 1;
      }
      amount = elementalDamage(amount, element, weaknessAt(e.variant, e.combatPhase));
      if (element === 'ice') e.chilled = 2;
      if (element === 'fire') e.burning = 2;
    }
    e.life -= amount;
    if (e.life <= 0) kill(e);
    return amount;
  }
  function launchShot(x, damage = 2, charged = false) {
    const o = new T.Mesh(
      charged ? orbGeo : laserGeo,
      dynamicFlight ? shotMaterials[strategy.arsenal] : green,
    );
    o.add(
      halo(dynamicFlight ? selectedWeapon().color : WEAPON_COLORS[weapon], charged ? 6 : 1.8, 0.5),
    );
    o.rotation.x = Math.PI / 2;
    o.position.copy(player.position);
    o.position.x += x;
    o.position.z -= 3;
    if (charged) o.scale.setScalar(5);
    scene.add(o);
    shots.push({
      o,
      life: 2,
      damage,
      charged,
      element: dynamicFlight ? selectedWeapon().element : 'kinetic',
      pierced: new Set(),
    });
  }
  function fire() {
    if ((state !== 'playing' && !(dynamicFlight && state === 'collapsing')) || shotCd > 0) return;
    green.color.set(WEAPON_COLORS[weapon]).multiplyScalar(3);
    cockpit?.fire();
    const count = SHOT_COUNTS[weapon];
    for (let i = 0; i < count; i++) {
      const power = weaponPower();
      launchShot((i - (count - 1) / 2) * 0.9, (2 + weapon) * power);
      const b = shots.at(-1);
      if (dynamicFlight) {
        b.homing = strategy.arsenal === 3;
        b.spread = strategy.arsenal === 2 ? (i - (count - 1) / 2) * 7 : 0;
        b.o.scale.setScalar(podsDetached ? 1 : 1 + podCount * 0.22);
      }
    }
    if (dynamicFlight) cue('shot');
    else sound(900 + weapon * 110);
    shotCd = dynamicFlight ? selectedWeapon().cadence / (1 + Math.min(30, stage()) * 0.035) : 0.135;
  }
  function enemy(kind = 'fighter') {
    const ground = kind === 'tank' || kind === 'walker';
    let o = ground
      ? createGroundEnemy(kind, dynamicFlight ? (groundWave + sectorIndex) % 3 : -1)
      : kind === 'subboss'
        ? createSubboss(sectorIndex)
        : fighter(true, dynamicFlight ? (Math.floor(elapsed / 3) + sectorIndex) % 3 : -1);
    if (kind === 'base') {
      o = new T.Group();
      o.add(box(8, 12, 9, buildingMat, 0, -4, 0));
      o.add(box(10, 3, 10, metal('#483346'), 0, 3, 0));
      o.add(new T.Mesh(new T.SphereGeometry(1.8, 12, 8), enemyOrbMat));
      o.userData.owned = true;
    }
    const elite = !ground && kind !== 'fighter';
    o.scale.setScalar(ground || kind === 'subboss' ? 1 : elite ? 1.6 : 0.65);
    o.rotation.y = ground || kind === 'subboss' ? 0 : Math.PI;
    const x = ground ? (groundWave % 2 ? -17 : 17) : kind === 'subboss' ? 0 : rnd(-24, 24),
      y = ground ? -7 : kind === 'subboss' ? 10 : rnd(1, 19);
    o.position.set(x, y, -200);
    scene.add(o);
    enemies.push({
      o,
      x,
      y,
      phase: rnd(0, 6),
      cd: rnd(1, 3),
      life:
        kind === 'subboss'
          ? dynamicFlight
            ? 360 + sectorIndex * 90
            : 180 + sectorIndex * 40
          : ground
            ? (kind === 'walker' ? 28 : 14) + sectorIndex * 3
            : elite
              ? 35 + sectorIndex * 8
              : 2 + Math.floor(sectorIndex / 3),
      variant: (groundWave + sectorIndex) % 5,
      age: 0,
      combatPhase: 1,
      chilled: 0,
      burning: 0,
      maxLife:
        kind === 'subboss' ? (dynamicFlight ? 360 + sectorIndex * 90 : 180 + sectorIndex * 40) : 1,
      ground,
      hitY: kind === 'walker' ? 18 : kind === 'tank' ? 5 : 0,
      half: new T.Vector3(
        ground ? (kind === 'walker' ? 10 : 6) : kind === 'subboss' ? 16 : 3.4,
        ground ? (kind === 'walker' ? 10 : 3) : kind === 'subboss' ? 5 : 2,
        ground ? 8 : 3,
      ),
      dead: false,
      elite,
      kind,
    });
  }
  function bullet(pos, target, spell = '') {
    if (hostile.length >= 180) return;
    let o = new T.Mesh(
      orbGeo,
      spell === 'arcane' ? shotMaterials[3] : spell === 'fire' ? shotMaterials[2] : enemyOrbMat,
    );
    if (spell) o.scale.setScalar(1.8);
    o.add(halo(0xff4265, 2.6, 0.8));
    o.position.copy(pos);
    scene.add(o);
    hostile.push({
      o,
      v: target
        .clone()
        .sub(pos)
        .normalize()
        .multiplyScalar(spell === 'arcane' ? 38 : 58),
      life: 6,
      spell,
      age: 0,
    });
  }
  function makeBoss() {
    bossCombat = createBossCombat(sectorIndex, dynamicFlight ? 1 : 0.3);
    orbitAngle = 0;
    scanTime = 0;
    lastSpecialCycle = -1;
    bossHp = bossCombat.max;
    boss = createBossModel(current(), sectorIndex, dynamicFlight);
    for (const e of enemies) dispose(e.o);
    enemies = [];
    for (const e of hostile) dispose(e.o);
    hostile = [];
    boss.position.set(0, 10, -230);
    if (dynamicFlight) {
      for (const o of obstacles) dispose(o.o);
      obstacles = [];
      message('ARENA · J/L OU ↶/↷ PARA ORBITAR · GERADORES NOS FLANCOS');
    }
    music?.start(sectorIndex, true);
    $('bossName').textContent = current().boss;
    scene.add(boss);
    $('bossHUD').hidden = false;
    message(
      dynamicFlight
        ? 'ARENA · J/L OU ↶/↷ PARA ORBITAR · GERADORES ±60° / NÚCLEO 0°'
        : 'ALERTA COLOSSAL / ' + current().boss + ' · DESTRUA OS GERADORES VERMELHOS',
    );
  }
  function damageBoss(amount, target = null, element = 'kinetic', charged = false) {
    if (state !== 'playing' || !boss || !Number.isFinite(amount) || amount <= 0) return 0;
    boss.updateMatrixWorld(true);
    const parts = boss.userData.parts.filter((p) => p.hp > 0);
    const openPart = (p) =>
      !dynamicFlight || weakPointOpen(relativeOrbit(), boss.userData.parts.indexOf(p));
    if (dynamicFlight)
      amount =
        elementalDamage(amount, element, weaknessAt(sectorIndex, bossCombat.phase)) *
        (tactics().vulnerable ? 1.5 : 1);
    let part = target
      ? parts.find((p) =>
          dynamicFlight
            ? target.distanceTo(p.mesh.getWorldPosition(new T.Vector3())) < 6
            : Math.hypot(
                target.x - boss.position.x - p.mesh.position.x,
                target.y - boss.position.y - p.mesh.position.y,
              ) < 6,
        )
      : parts.find(openPart);
    if (parts.length) {
      if (!part || !openPart(part)) return 0;
      const dealt = bossCombat.spend(amount, dynamicFlight && charged);
      part.hp = Math.max(0, part.hp - dealt);

      if (part.hp === 0) {
        part.mesh.visible = false;
        explode(part.mesh.getWorldPosition(new T.Vector3()), 24);
        credits += 35;
        message(
          'GERADOR DESTRUÍDO · ' +
            (parts.length === 1 ? 'NÚCLEO EXPOSTO' : 'MIRE NO OUTRO GERADOR'),
        );
      }
      return dealt;
    }
    if (
      target &&
      (dynamicFlight
        ? target.distanceTo(boss.userData.core.getWorldPosition(new T.Vector3())) > 8
        : Math.hypot(target.x - boss.position.x, target.y - boss.position.y) > 7)
    )
      return 0;
    if (!bossCombat.coreOpen || (dynamicFlight && !weakPointOpen(relativeOrbit()))) return 0;
    const dealt = bossCombat.spend(amount, dynamicFlight && charged);
    bossCombat.damage(dealt);

    bossHp = bossCombat.hp;
    if (bossHp === 0) {
      gainXP(30);
      state = 'collapsing';
      if (!dynamicFlight) releaseControls();
      for (const arr of [shots, hostile]) {
        for (const e of arr) dispose(e.o);
        arr.length = 0;
      }
      collapseTime = collapseBurst = 0;
      collapseFinal = false;
      collapse = createCollapse(boss.position);
      scene.add(collapse);
      music?.start(sectorIndex, 'collapse');
      $('bossState').textContent = 'COLAPSO DO REATOR';
      $('attackWarning').textContent = 'REATOR INSTÁVEL / AFASTE-SE';
      reticle.visible = false;
      player.visible = true;
    }
    return dealt;
  }
  function updateFinale(dt) {
    if (dynamicFlight) {
      shotCd -= dt;
      updatePiloting(dt);
      for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];
        shot.o.position.z -= 190 * dt;
        shot.life -= dt;
        if (shot.life <= 0) {
          dispose(shot.o);
          shots.splice(i, 1);
        }
      }
    }
    collapseTime += dt;
    collapseBurst -= dt;
    updateCollapse(collapse, collapseTime);
    boss.rotation.z = Math.sin(collapseTime * 9) * 0.015 + collapseTime * 0.014;
    boss.position.y -= dt * 0.55;
    if (collapseTime < 4.7 && collapseBurst <= 0) {
      collapseBurst = Math.max(0.12, 0.5 - collapseTime * 0.07);
      explode(boss.position.clone().add(new T.Vector3(rnd(-36, 36), rnd(-12, 20), 23)), 18);
    }
    if (collapseTime >= 4.7 && !collapseFinal) {
      collapseFinal = true;
      boss.visible = false;
      explode(boss.position.clone().add(new T.Vector3(0, 0, 24)), 100, 0xffd27c);
      if (dynamicFlight) cue('explosion');
      else sound(38, 1.8, 'sawtooth', 0.12);
      music?.start(sectorIndex, 'victory');
      $('attackWarning').textContent = 'ALVO DESTRUÍDO';
    }
    if (dynamicFlight) flightCamera.setMode('combat');
    flightCamera.update(dt, player.position, 0, false);
    const vibration = collapseFinal ? Math.max(0, 1 - (collapseTime - 4.7) / 2) : 0.15;
    camera.position.x += Math.sin(collapseTime * 35) * vibration * 0.8;
    camera.position.y += Math.cos(collapseTime * 27) * vibration * 0.4;
    if (collapseTime >= COLLAPSE_SECONDS) {
      dispose(boss);
      disposeBoss(boss);
      boss = null;
      dispose(collapse);
      disposeCollapse(collapse);
      collapse = null;
      score += 50;
      credits += 250 + sectorIndex * 40;
      $('attackWarning').textContent = '';
      if (sectorIndex === SECTORS.length - 1) finish(true);
      else showShop();
    }
  }

  function finish(win) {
    releaseControls();
    if (win) music?.start(sectorIndex, 'victory');
    else music?.pause();
    state = win ? 'won' : 'lost';
    $('result').hidden = false;
    $('resultTitle').textContent = win ? 'A TERRA ESTÁ LIVRE' : 'NAVE ABATIDA';
    $('resultText').textContent =
      `${score} acertos · ${Math.floor(totalTime / 60)}m ${String(Math.floor(totalTime % 60)).padStart(2, '0')}s de voo. ${win ? 'Marvin derrotado. Os suprimentos estão de volta. Five Cats, missão cumprida.' : 'Use o giro para bloquear disparos e os anéis para recuperar escudo.'}`;
    $('resultLabel').textContent = win ? 'MISSÃO CUMPRIDA' : 'TENTE NOVAMENTE';
  }
  function clearWorld() {
    if (collapse) {
      dispose(collapse);
      disposeCollapse(collapse);
      collapse = null;
    }
    collapseTime = 0;
    collapseFinal = false;
    for (let arr of [enemies, shots, hostile, particles, rings, obstacles])
      for (let e of arr) {
        dispose(e.o);
        if (arr === particles) e.o.material.dispose();
      }
    enemies = [];
    shots = [];
    hostile = [];
    particles = [];
    rings = [];
    obstacles = [];
    if (boss) {
      dispose(boss);
      disposeBoss(boss);
    }
    boss = null;
  }
  function start(resume = false, restart = null) {
    if (!appActive) return;
    $('pauseConfirmPanel').hidden = true;
    confirmation = null;
    cameraMode = 'chase';
    flightCamera.setMode(cameraMode);
    $('cameraView').textContent = 'C · PERSEGUIÇÃO';
    const checkpoint = restart ?? (resume === true ? readSave(storage) : null);
    sectorIndex = checkpoint?.sector ?? 0;
    credits = checkpoint?.credits ?? 0;
    weapon = checkpoint?.weapon ?? 0;
    pilotLoadout = dynamicFlight
      ? readPilotLoadout(checkpoint ? checkpoint.loadout : pilotLoadout)
      : readPilotLoadout(null);
    applyShipModel();
    strategy = dynamicFlight
      ? readStrategy(checkpoint ? checkpoint.strategy : { specialty: activePilot().specialty })
      : readStrategy(null);
    $('strategyDrawer').open = false;
    evolve();
    armor = checkpoint?.armor ?? 0;
    podCount = checkpoint?.pods ?? 0;
    lives = 3;
    blueRings = 0;
    totalTime = 0;
    clearWorld();
    reticle.visible = false;
    $('comms').classList.remove('active');
    world.reset();
    lastStage = -1;
    shake = 0;
    boosting = false;
    touchFire = touchBoost = false;
    elapsed = 0;
    score = checkpoint?.score ?? 0;
    cosmetics = readCosmetics(checkpoint?.cosmetics);
    applySkin();
    hp = maxHp();
    bombs = 3;
    energy = 100;
    shotCd = 0;
    spawnCd = 2;
    ringCd = 8;
    petCd = 11;
    petWave = 0;
    petCare = readPetCare(checkpoint?.petCare);
    $('criticalWarning').hidden = true;
    obstacleCd = 12;
    invuln = 2;
    roll = 0;
    rollCd = 0;
    bossHp = 200;
    bossCd = 2;
    releaseControls();
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    flightCamera.setMode(cameraMode);
    flightCamera.reset(player.position);
    state = 'playing';
    document.getSelection?.()?.removeAllRanges();
    $('game').focus?.({ preventScroll: true });
    $('menu').hidden = true;
    $('result').hidden = true;
    $('bossHUD').hidden = true;
    document.body.classList.remove('menu');
    $('pause').textContent = 'Ⅱ';
    $('pauseMenu').hidden = true;
    $('settingsMenu').hidden = true;
    settingsOpen = false;
    unlockAudio();
    menuThemePlaying = false;
    enterSector();
    bombs = 3;
  }
  function pause() {
    if (!appActive) return;
    if (['playing', 'collapsing', 'respawning', 'arcade'].includes(state)) {
      pausedFrom = state;
      releaseControls();
      state = 'paused';
      music?.pause();
      audioCtx?.suspend?.().catch(() => {});
      $('pauseMenu').hidden = false;
      $('pauseConfirmPanel').hidden = true;
      $('pauseActions').hidden = false;
      confirmation = null;
      $('pause').textContent = '▶';
      $('pauseCare').textContent = PET_ITEMS.map(({ id, name }) => name + ' ' + petCare[id]).join(
        ' · ',
      );
      $('pauseResume').focus?.({ preventScroll: true });
    } else if (state === 'paused' && !settingsOpen && !confirmation) {
      resumeAudio();
      state = pausedFrom;
      $('pauseMenu').hidden = true;
      $('pause').textContent = 'Ⅱ';
      message('Missão retomada.');
      music?.resume();
      $('game').focus?.({ preventScroll: true });
    }
  }
  function requestPauseAction(kind) {
    if (state !== 'paused' || !['restart', 'exit'].includes(kind)) return;
    confirmation = kind;
    $('pauseActions').hidden = true;
    $('pauseConfirmPanel').hidden = false;
    $('pauseConfirmText').textContent = uiText(
      settings.language,
      kind === 'restart' ? 'confirmRestart' : 'confirmExit',
    );
  }
  function exitToMenu() {
    if (state !== 'paused') return;
    releaseControls();
    music?.pause();
    clearWorld();
    state = 'menu';
    menuThemePlaying = false;
    confirmation = null;
    settingsOpen = false;
    stageIntroTime = 0;
    document.body.classList.remove('in-mission', 'stage-intro');
    document.body.classList.add('menu');
    for (const id of [
      'pauseMenu',
      'pauseConfirmPanel',
      'settingsMenu',
      'cinematic',
      'arcadePanel',
      'shop',
      'result',
      'bossHUD',
      'subHUD',
    ])
      $(id).hidden = true;
    $('menu').hidden = false;
    $('continue').hidden = !readSave(storage);
    $('pause').textContent = 'Ⅱ';
    $('start').focus?.({ preventScroll: true });
  }
  function confirmPauseAction() {
    if (!confirmation || state !== 'paused') return;
    const action = confirmation;
    confirmation = null;
    $('pauseConfirmPanel').hidden = true;
    if (action === 'exit') exitToMenu();
    else
      start(
        false,
        sectorStart
          ? {
              ...sectorStart,
              cosmetics: { ...sectorStart.cosmetics, owned: [...sectorStart.cosmetics.owned] },
              loadout: { ...sectorStart.loadout },
              strategy: { ...sectorStart.strategy },
              petCare: { ...sectorStart.petCare },
            }
          : null,
      );
  }
  function applySettings() {
    const label = (id, key) => {
      $(id).textContent = uiText(settings.language, key);
    };
    for (const [id, key] of [
      ['settingsTitle', 'options'],
      ['labelLanguage', 'language'],
      ['labelMaster', 'master'],
      ['labelMusic', 'music'],
      ['labelSfx', 'effects'],
      ['labelSensitivity', 'sensitivity'],
      ['labelOpacity', 'opacity'],
      ['labelSubtitles', 'subtitles'],
      ['labelIntro', 'intro'],
      ['labelVibration', 'vibration'],
      ['labelLeftHanded', 'leftHanded'],
      ['pauseTitle', 'pause'],
      ['pauseResume', 'resume'],
      ['pauseRestart', 'restart'],
      ['pauseExit', 'exit'],
      ['pauseOptions', 'options'],
      ['pauseConfirmCancel', 'cancel'],
      ['pauseConfirmOk', 'confirm'],
      ['settingsClose', 'close'],
      ['optionsFromMenu', 'options'],
    ])
      label(id, key);
    $('continue').textContent = uiText(settings.language, 'continue') + ' ↗';
    $('watchIntro').textContent = '▶ ' + uiText(settings.language, 'watch');
    $('criticalWarning').textContent = uiText(settings.language, 'critical');
    for (const [key, id] of [
      ['language', 'settingLanguage'],
      ['master', 'settingMaster'],
      ['music', 'settingMusic'],
      ['sfx', 'settingSfx'],
      ['sensitivity', 'settingSensitivity'],
      ['opacity', 'settingOpacity'],
      ['subtitles', 'settingSubtitles'],
      ['intro', 'settingIntro'],
      ['vibration', 'settingVibration'],
      ['leftHanded', 'settingLeftHanded'],
    ]) {
      if (typeof settings[key] === 'boolean') $(id).checked = settings[key];
      else $(id).value = String(settings[key]);
    }
    $('touch').style.opacity = String(settings.opacity);
    document.body.classList[settings.leftHanded ? 'add' : 'remove']('left-handed');
    $('cinematic').classList[settings.subtitles ? 'remove' : 'add']('hide-subtitles');
    music?.setVolume(settings.master * settings.music);
    audioCues?.setVolume(settings.master * settings.sfx);
    localization.setLanguage(settings.language);
  }
  function openSettings() {
    if (state !== 'menu' && state !== 'paused') return;
    settingsOpen = true;
    $('settingsMenu').hidden = false;
    applySettings();
    $('settingLanguage').focus?.({ preventScroll: true });
  }
  function closeSettings() {
    settingsOpen = false;
    $('settingsMenu').hidden = true;
    (state === 'paused' ? $('pauseResume') : $('optionsFromMenu')).focus?.({ preventScroll: true });
  }
  function setActive(active) {
    if (appActive === active) return;
    if (!active) {
      if (['playing', 'collapsing', 'respawning', 'arcade'].includes(state)) pause();
      else {
        releaseControls();
        music?.pause();
        audioCtx?.suspend?.().catch(() => {});
      }
    }
    appActive = active;
    // Returning to the Activity never resumes combat or audio without player input.
    last = now();
  }
  function updateCinematic() {
    if (!cinematic) return;
    const beat = cinematicBeat(cinematic.scenes, cinematic.elapsed);
    $('cinematicSpeaker').textContent = beat.speaker;
    $('cinematicCaption').textContent = beat.text;
    $('cinematicProgress').style.width =
      (Math.min(1, cinematic.elapsed / cinematic.duration) * 100).toFixed(1) + '%';
  }
  function finishCinematic() {
    if (!cinematic) return;
    const playMission = cinematic.playMission;
    cinematic = null;
    $('cinematic').hidden = true;
    if (playMission) start();
    else $('menu').hidden = false;
  }
  function advanceCinematic(dt) {
    if (!cinematic) return;
    cinematic.elapsed += dt;
    if (cinematic.elapsed >= cinematic.duration) finishCinematic();
    else updateCinematic();
  }
  function beginCinematic(playMission = true) {
    if (!dynamicFlight || !appActive) {
      if (playMission) start();
      return;
    }
    const introDuration = cinematicDuration(CINEMATICS.intro);
    const scenes = [
      ...CINEMATICS.intro,
      ...CINEMATICS.campaign.map((scene) => ({
        ...scene,
        time: scene.time + introDuration,
      })),
    ];
    cinematic = {
      elapsed: 0,
      scenes,
      duration: introDuration + cinematicDuration(CINEMATICS.campaign),
      playMission,
    };
    // Hide the underlying hangar while the modal is active. Native safe-area
    // stacking contexts otherwise intercept taps meant for the skip action.
    $('menu').hidden = true;
    $('cinematic').hidden = false;
    $('cinematic').classList[settings.subtitles ? 'remove' : 'add']('hide-subtitles');
    $('cinematicSkip').focus?.({ preventScroll: true });
    updateCinematic();
  }
  function beginMenuTheme() {
    if (state !== 'menu' || !appActive) return;
    if (menuThemePlaying) {
      music?.pause();
      menuThemePlaying = false;
    } else if (unlockAudio()) {
      musicOn = true;
      music.setEnabled(true);
      music.start(0, 'menu');
      menuThemePlaying = true;
    }
    $('menuMusic').textContent = menuThemePlaying ? '♪ PAUSAR TEMA' : '♪ OUVIR TEMA';
  }
  $('start').onclick = () => (settings.intro ? beginCinematic() : start());
  $('continue').onclick = () => start(true);
  $('menuMusic').onclick = beginMenuTheme;
  $('watchIntro').onclick = () => beginCinematic(false);
  $('cinematicSkip').onclick = finishCinematic;
  $('optionsFromMenu').onclick = openSettings;
  $('pauseOptions').onclick = openSettings;
  $('settingsClose').onclick = closeSettings;
  $('pauseResume').onclick = pause;
  $('pauseRestart').onclick = () => requestPauseAction('restart');
  $('pauseExit').onclick = () => requestPauseAction('exit');
  $('pauseConfirmCancel').onclick = () => {
    confirmation = null;
    $('pauseConfirmPanel').hidden = true;
    $('pauseActions').hidden = false;
  };
  $('pauseConfirmOk').onclick = confirmPauseAction;
  for (const [key, id] of [
    ['language', 'settingLanguage'],
    ['master', 'settingMaster'],
    ['music', 'settingMusic'],
    ['sfx', 'settingSfx'],
    ['sensitivity', 'settingSensitivity'],
    ['opacity', 'settingOpacity'],
    ['subtitles', 'settingSubtitles'],
    ['intro', 'settingIntro'],
    ['vibration', 'settingVibration'],
    ['leftHanded', 'settingLeftHanded'],
  ]) {
    $(id).oninput = () => {
      const el = $(id);
      settings = readSettings({
        ...settings,
        [key]:
          typeof settings[key] === 'boolean'
            ? !!el.checked
            : key === 'language'
              ? el.value
              : Number(el.value),
      });
      storeSettings(storage, settings);
      applySettings();
    };
  }
  applySettings();
  $('nextSector').onclick = nextSector;
  for (const k of Object.keys(SHOP)) $('buy' + k).onclick = () => buy(k);
  $('music').onclick = () => {
    musicOn = !musicOn;
    music?.setEnabled(musicOn);
    $('music').textContent = musicOn ? '♪ ON' : '♪ OFF';
  };
  $('arsenalSwitch').onclick = cycleArsenal;
  $('specialSwitch').onclick = cycleSpecial;
  $('specialCast').onclick = castSpecial;
  $('scanBoss').onclick = scanBoss;
  $('precisionShot').onclick = () => tacticalAction('precision');
  $('repairPulse').onclick = () => tacticalAction('repair');
  $('homingBarrage').onclick = () => tacticalAction('barrage');
  for (const [id, direction] of [
    ['orbitLeft', -1],
    ['orbitRight', 1],
  ]) {
    $(id).onpointerdown = (e) => {
      e.preventDefault?.();
      if (state !== 'playing' || !boss) return;
      $(id).setPointerCapture(e.pointerId);
      orbitTouch = direction;
    };
    $(id).onpointerup =
      $(id).onpointercancel =
      $(id).onlostpointercapture =
        () => {
          orbitTouch = 0;
        };
  }
  $('strategyControls').hidden = !dynamicFlight;
  $('specialtyChoice').hidden = true;
  $('podsTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    if (state === 'playing') togglePods();
  };
  $('restart').onclick = start;
  $('pause').onclick = pause;
  $('sound').onclick = () => {
    muted = !muted;
    $('sound').textContent = muted ? 'SOM OFF' : 'SOM ON';
  };
  const visibilityHandler = () => {
    if (document.hidden && state === 'menu') {
      music?.pause();
      menuThemePlaying = false;
      $('menuMusic').textContent = '♪ OUVIR TEMA';
    }
  };
  document.addEventListener?.('visibilitychange', visibilityHandler);
  cleanups.push(() => document.removeEventListener?.('visibilitychange', visibilityHandler));
  const inFlight = () =>
    ['playing', 'paused', 'respawning', 'collapsing', 'arcade'].includes(state);
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (cinematic) {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault?.();
        finishCinematic();
      }
      return;
    }
    if (settingsOpen) {
      if (e.code === 'Escape') {
        e.preventDefault?.();
        closeSettings();
      }
      return;
    }
    if (confirmation) {
      if (e.code === 'Escape') {
        e.preventDefault?.();
        $('pauseConfirmCancel').onclick();
      }
      if (e.code === 'Enter') {
        e.preventDefault?.();
        confirmPauseAction();
      }
      return;
    }
    if (inFlight() && isGameKey(e)) e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyF') cycleArsenal();
    if (e.code === 'KeyH') cycleSpecial();
    if (e.code === 'KeyG') castSpecial();
    if (e.code === 'KeyI') scanBoss();
    if (e.code === 'KeyK') tacticalAction('precision');
    if (e.code === 'KeyR') tacticalAction('repair');
    if (e.code === 'KeyU') tacticalAction('barrage');
    if (e.code === 'KeyC') cycleCamera();
    if (e.code === 'KeyV') togglePods();
    if (e.code === 'KeyB' || e.code === 'KeyX') bomb();
    if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'KeyZ') doRoll();
    if (e.code === 'KeyP' || e.code === 'Escape') pause();
    if (e.code === 'Enter' && state === 'menu') settings.intro ? beginCinematic() : start();
  });
  addEventListener('keyup', (e) => {
    if (inFlight() && isGameKey(e) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault?.();
    keys.delete(e.code);
    if (!boostRequested()) boostNeedsRelease = false;
  });
  cleanups.push(protectFlightSurface(document, $('game'), $('touch'), inFlight));
  let stickId = null;
  const heldPointers = new Map();
  function boostRequested() {
    return keys.has('ShiftLeft') || keys.has('ShiftRight') || touchBoost;
  }
  function releaseControls() {
    orbitTouch = 0;
    boosting = false;
    boostNeedsRelease = false;
    document.body.classList.remove('boosting');
    for (const f of player.userData.flames) {
      f.material.color.set('#78eaff');
      f.scale.set(1, 1, 1);
      f.position.z = 4;
    }
    keys.clear();
    touchFire = touchBoost = false;
    charge = 0;
    chargeLatch = false;
    stick.x = stick.y = 0;
    stickId = null;
    heldPointers.clear();
    $('nub').style.transform = '';
    for (const id of ['fireTouch', 'boostTouch']) $(id).classList.remove('pressed');
  }
  addEventListener('blur', () => {
    releaseControls();
    if (['playing', 'collapsing', 'respawning', 'arcade'].includes(state)) pause();
  });
  addEventListener('focus', () => {
    if (!nativeLifecycle) setActive(true);
  });
  const visibility = () => {
    if (!nativeLifecycle) setActive(!document.hidden);
  };
  document.addEventListener('visibilitychange', visibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', visibility));
  function stickMove(e) {
    e.preventDefault?.();
    const r = $('stick').getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dy = e.clientY - r.top - r.height / 2,
      len = Math.max(r.width * 0.35, Math.hypot(dx, dy));
    stick.x = clamp((dx / len) * settings.sensitivity, -1, 1);
    stick.y = clamp((-dy / len) * settings.sensitivity, -1, 1);
    $('nub').style.transform = `translate(${stick.x * 35}px,${-stick.y * 35}px)`;
  }
  $('stick').onpointerdown = (e) => {
    e.preventDefault?.();
    if (!['playing', 'arcade', 'collapsing'].includes(state) || stickId !== null) return;
    stickId = e.pointerId;
    $('stick').setPointerCapture(e.pointerId);
    stickMove(e);
  };
  $('stick').onpointermove = (e) => {
    if (e.pointerId === stickId) stickMove(e);
  };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
    $('stick').addEventListener(ev, (e) => {
      if (e.pointerId !== undefined && e.pointerId !== stickId) return;
      stickId = null;
      stick.x = stick.y = 0;
      $('nub').style.transform = '';
    });
  for (const [id, set] of [
    ['fireTouch', (v) => (touchFire = v)],
    ['boostTouch', (v) => (touchBoost = v)],
  ]) {
    const b = $(id);
    b.onpointerdown = (e) => {
      e.preventDefault?.();
      if (!['playing', 'arcade', 'collapsing'].includes(state) || heldPointers.has(id)) return;
      heldPointers.set(id, e.pointerId);
      b.setPointerCapture(e.pointerId);
      set(true);
      b.classList.add('pressed');
    };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(ev, (e) => {
        if (e.pointerId !== undefined && heldPointers.get(id) !== e.pointerId) return;
        heldPointers.delete(id);
        set(false);
        if (!boostRequested()) boostNeedsRelease = false;
        b.classList.remove('pressed');
      });
  }
  $('rollTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    doRoll();
  };
  $('bombTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    bomb();
  };
  function updatePiloting(dt) {
    let dx =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        stick.x,
      dy =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
        stick.y;
    const boostHeld = boostRequested();
    if (!boostHeld) boostNeedsRelease = false;
    if (boostHeld && energy <= 5 && !boostNeedsRelease) {
      boostNeedsRelease = true;
      message('IMPULSO ESGOTADO / SOLTE SHIFT OU BOOST PARA REARMAR');
    }
    boosting = boostHeld && !boostNeedsRelease && energy > 5;
    energy = clamp(energy + dt * (boosting ? -28 : 15), 0, 100);
    const profileSpeed = dynamicFlight
      ? activePilot().bonuses.speed * (1 + activeShip().stats.agility * 0.08)
      : 1;
    const speed = (boosting ? 90 : 48) * (1 + Math.min(30, stage()) * 0.02) * profileSpeed;
    const holding = keys.has('Space') || touchFire;
    if (holding) {
      charge = Math.min(1.5, charge + dt);
      if (dynamicFlight && charge > 0.15 && charge - dt <= 0.15) cue('plasmaCharge');
      chargeLatch = true;
    } else if (chargeLatch) {
      if (charge >= 0.8) {
        launchShot(
          0,
          (20 + weapon * 12) * weaponPower() * (dynamicFlight ? 1 + charge / 1.5 : 1),
          true,
        );
        cockpit?.fire();
        if (dynamicFlight) cue('plasmaRelease');
        else sound(160, 0.4, 'sawtooth', 0.06);
      }
      charge = 0;
      chargeLatch = false;
    }
    $('chargeBar').style.width = (charge / 1.5) * 100 + '%';
    if (chargeGlow) {
      chargeGlow.visible = charge > 0.15;
      chargeGlow.scale.setScalar(2 + charge * (5 + Math.sin(elapsed * 30) * 0.5));
      chargeGlow.material.color.set(charge >= 0.8 ? '#eaffff' : selectedWeapon().color);
    }
    reticle.visible = true;
    const previousPlayer = player.position.clone();
    player.position.x = clamp(
      player.position.x + dx * dt * 24 * (1 + Math.min(30, stage()) * 0.03) * profileSpeed,
      -flightLimit(),
      flightLimit(),
    );
    player.position.y = clamp(
      player.position.y + dy * dt * 20 * (1 + Math.min(30, stage()) * 0.03) * profileSpeed,
      -1,
      dynamicFlight ? 46 : 23,
    );
    player.rotation.z = T.MathUtils.lerp(player.rotation.z, -dx * 0.48, dt * 8);
    player.rotation.x = T.MathUtils.lerp(player.rotation.x, dy * 0.14, dt * 8);
    player.rotation.y = T.MathUtils.lerp(player.rotation.y, -dx * 0.12, dt * 8);
    if (roll > 0) {
      roll -= dt;
      player.rotation.z = Math.PI * 2 * (1 - roll / 0.65);
    }
    player.visible =
      cameraMode !== 'cockpit' && (boosting || invuln <= 0 || Math.floor(invuln * 12) % 2 === 0);
    flightCamera.update(
      dt,
      player.position,
      clamp(dx, -1, 1),
      boosting,
      dynamicFlight ? route : undefined,
    );
    reticle.position.set(player.position.x, player.position.y, -60);
    // Keep legacy/native 3D sight; use clearer projected HUD for the web.
    reticle.visible = !dynamicFlight;
    updateAimReticle();
    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      camera.position.x += Math.sin(visualTime * 70) * shake * 0.3;
      camera.position.y += Math.cos(visualTime * 65) * shake * 0.2;
    }
    if ((keys.has('Space') || touchFire) && shotCd <= 0) fire();
    return { speed, previousPlayer, holding };
  }
  function update(dt) {
    if (state !== 'playing') return;
    elapsed += dt;
    totalTime += dt;
    if (
      dynamicFlight &&
      spawnEncounters &&
      !arcadeDone &&
      [2, 6].includes(sectorIndex) &&
      elapsed >= 8
    ) {
      arcadeDone = true;
      arcade = createArcade(sectorIndex + 1);
      state = 'arcade';
      releaseControls();
      $('arcadePanel').hidden = false;
      message('FENDA ESPACIAL / VISÃO LATERAL · MOVA, ATIRE E RECOLHA CRÉDITOS');
      return;
    }
    if (dynamicFlight) {
      route = routeAt(sectorIndex, elapsed, current().duration, !!boss);
      routeRenderer.update(route);
      world.setAscent(Math.min(1, elapsed / current().duration), sectorIndex === 2);
      $('routeLabel').textContent = route.label;
    }
    shotCd -= dt;
    if (dynamicFlight) {
      tacticEnergy = chargeTactics(
        tacticEnergy,
        dt,
        !!(orbitTouch || keys.has('KeyJ') || keys.has('KeyL')),
        rank('spirit'),
      );
      scanTime = Math.max(0, scanTime - dt);
      impactTime = Math.max(0, impactTime - dt);
      $('tacticCharge').textContent = Array.from({ length: 3 }, (_, i) =>
        tacticEnergy >= i + 1 ? '◆' : '◇',
      ).join(' ');
      $('battleCharge').textContent = $('tacticCharge').textContent;
      $('precisionShot').disabled = tacticEnergy < 1;
      $('repairPulse').disabled = tacticEnergy < 2 || hp >= maxHp();
      $('homingBarrage').disabled = tacticEnergy < 3;
      $('scanBoss').disabled = !boss || arcana < 10 || scanTime > 0;
      arcana = Math.min(
        100,
        arcana +
          dt *
            (4 + rank('spirit') * 0.1) *
            (strategy.specialty === 'spirit' ? 1.3 : 1) *
            activePilot().bonuses.arcana,
      );
      specialCd = specialCd - dt < 1e-6 ? 0 : specialCd - dt;
      barrier = Math.max(0, barrier - dt);
      stasis = Math.max(0, stasis - dt);
      $('arsenalSwitch').textContent = 'F · ' + selectedWeapon().name;
      $('specialSwitch').textContent = 'H · ' + SPECIALS[strategy.special].name;
      $('specialCast').textContent =
        'G · ' +
        (specialCd > 0 ? Math.ceil(specialCd) + 's' : 'ATIVAR') +
        ' · ' +
        Math.floor(arcana);
      $('specialCast').disabled = specialCd > 0 || arcana < SPECIALS[strategy.special].cost;
      $('orbitControls').hidden = !boss;
      $('strategyStatus').textContent =
        'EV ' +
        (stage() + 1) +
        ' · XP ' +
        strategy.xp +
        '/' +
        xpForStage(stage() + 1) +
        ' · VEL ' +
        (boosting ? '890' : '480') +
        (barrier > 0 ? ' · BARREIRA' : stasis > 0 ? ' · ESTASE' : '');
    }
    invuln -= dt;
    rollCd -= dt;
    msgTime -= dt;
    if (msgTime <= 0) $('comms').classList.remove('active');
    const { speed, previousPlayer, holding } = updatePiloting(dt);
    spawnCd -= dt;
    if (spawnEncounters && elapsed < current().duration && spawnCd <= 0) {
      for (let i = 0; i < 2 + Math.floor(sectorIndex / 4); i++) enemy();
      spawnCd = 3.4 - sectorIndex * 0.12;
    }
    if (spawnEncounters && !subDone && elapsed > current().duration * 0.22) {
      subDone = true;
      enemy('subboss');
      $('subHUD').hidden = false;
      music?.start(sectorIndex, 'subboss');
      message('SUBCHEFE / ' + SUBBOSS_NAMES[sectorIndex]);
    }
    if (spawnEncounters && !rivalDone && elapsed > current().duration * 0.7) {
      rivalDone = true;
      enemy('rival');
      message('CAÇA RIVAL / NÃO DEIXE QUE ELE ENCERRE A MISSÃO');
    }
    if (spawnEncounters && !baseDone && sectorIndex < 2 && elapsed > 18) {
      baseDone = true;
      enemy('base');
      message('BASE-SERVIDOR / ELIMINE A TORRE PARA RECEBER SUPRIMENTOS');
    }
    groundCd -= dt;
    if (
      spawnEncounters &&
      isGroundSector(current()) &&
      elapsed < current().duration &&
      groundCd <= 0
    ) {
      groundWave++;
      enemy(groundWave % 2 ? 'tank' : 'walker');
      groundCd = 6;
    }
    if (
      spawnEncounters &&
      isGroundSector(current()) &&
      !tunnelDone &&
      elapsed >= 24 &&
      !enemies.some((e) => !e.dead && e.kind === 'subboss')
    ) {
      tunnelDone = true;
      const o = createObstacle('tunnel');
      o.position.z = -230;
      scene.add(o);
      obstacles.push({ o, life: 1 });
      message('TÚNEL INDUSTRIAL / SIGA AS SETAS E ELIMINE A DEFESA TERRESTRE');
    }
    if (
      elapsed >= current().duration &&
      !boss &&
      !enemies.some((e) => !e.dead && e.kind === 'subboss') &&
      !obstacles.some((o) => o.o.userData.kind === 'tunnel')
    )
      makeBoss();
    const phase = boss
      ? 3
      : elapsed < current().duration * 0.32
        ? 0
        : elapsed < current().duration * 0.7
          ? 1
          : 2;
    $('stage').textContent = boss ? current().boss : current().name;
    if (phase !== lastStage) {
      lastStage = phase;
    }
    $('pilotName').textContent =
      (dynamicFlight ? activePilot().name : PILOTS[3 - lives]) + ' / ' + lives + ' VIDAS';
    $('weaponLabel').textContent = WEAPONS[weapon] + ' · ' + credits + ' CR · PODS ' + podCount;
    podCd -= dt;
    if (dynamicFlight && podsDetached) {
      const prey = enemies
        .filter((e) => !e.dead && e.o.position.z < player.position.z)
        .sort(
          (a, b) =>
            a.o.position.distanceToSquared(player.position) -
            b.o.position.distanceToSquared(player.position),
        )[0];
      const destination = boss
        ? boss.position.clone().add(new T.Vector3(0, 0, 40))
        : prey?.o.position.clone().add(new T.Vector3(0, prey.hitY, 20));
      if (destination) podAnchor.lerp(destination, 1 - Math.exp(-3 * dt));
    }
    let podsArrived = true;
    podMeshes.forEach((p, i) => {
      const offset = new T.Vector3(i === 0 ? 0 : i === 1 ? -5 : 5, i === 0 ? 0 : 2, -6);
      const target = (podsDetached ? podAnchor : player.position).clone().add(offset);
      const delta = target.sub(p.position);
      const distance = delta.length();
      p.position.addScaledVector(
        delta.normalize(),
        Math.min(distance, dt * (podsDetached ? 65 : 85)),
      );
      if (distance > 0.6) podsArrived = false;
      animatePod(p, visualTime + i);
    });
    if (podsArrived) podMode = podsDetached ? 'deployed' : 'docked';
    $('podsTouch').textContent = podsDetached ? 'VOLTAR' : 'LANÇAR';
    if (podCount > 0 && podCd <= 0 && (podsDetached || holding)) {
      podCd = 0.72 - podCount * 0.1;
      for (const p of podMeshes) {
        for (const spread of podsDetached ? [-1, 0, 1] : [0]) {
          launchShot(0, 3 + weapon);
          const shot = shots[shots.length - 1];
          shot.o.position.copy(p.position);
          shot.spread = spread * (8 + podCount * 2);
          if (podCount === 3 || (dynamicFlight && podsDetached)) shot.homing = true;
        }
      }
    }

    for (let e of enemies) {
      if (e.dead) continue;
      e.age += dt;
      if (dynamicFlight) {
        e.chilled = Math.max(0, e.chilled - dt);
        e.burning = Math.max(0, e.burning - dt);
        e.hitCooldown = Math.max(0, (e.hitCooldown ?? 0) - dt);
        if (e.burning > 0) {
          e.life -= dt * (3 + stage());
          if (e.life <= 0) {
            kill(e);
            continue;
          }
        }
        if (e.kind === 'subboss')
          e.combatPhase = e.life > e.maxLife * 0.65 ? 1 : e.life > e.maxLife * 0.3 ? 2 : 3;
      }
      e.o.position.z +=
        dt *
        (e.kind === 'subboss'
          ? Math.max(0, (-85 - e.o.position.z) * 1.4)
          : e.ground
            ? speed
            : e.elite
              ? e.o.position.z < -55
                ? speed
                : 6
              : speed + 12);
      e.o.position.x = e.ground
        ? e.x
        : e.kind === 'base'
          ? e.x * 0.7
          : e.x +
            Math.sin(elapsed * (e.kind === 'rival' ? 2 : 1.1) + e.phase) *
              (dynamicFlight && e.kind === 'subboss' ? 18 : 5);
      e.o.position.y = e.ground
        ? -7
        : e.kind === 'base'
          ? -1
          : e.y + Math.sin(elapsed + e.phase) * 2;
      if (e.kind === 'subboss') {
        $('subHealth').style.width = Math.max(0, (e.life / e.maxLife) * 100) + '%';
        if (e.cd < 0.6) $('subState').textContent = '⚠ CANHÕES CARREGANDO';
        else
          $('subState').textContent = dynamicFlight
            ? 'FASE ' +
              e.combatPhase +
              ' · FRACO: ' +
              ARSENAL.find((w) => w.element === weaknessAt(e.variant, e.combatPhase)).name +
              (e.age % 6 < 1.5 ? ' · ESCUDO' : '')
            : SUBBOSS_NAMES[sectorIndex];
      }
      if (e.ground) animateGroundEnemy(e.o, elapsed, player.position);
      e.cd -= dt * (e.chilled > 0 ? 0.5 : 1);
      if (e.cd <= 0 && e.o.position.z < -15) {
        bullet(
          e.o.position.clone().add(new T.Vector3(0, e.hitY, e.ground ? 8 : 0)),
          player.position,
        );
        if (e.kind === 'subboss')
          for (const target of encounterPattern(
            sectorIndex,
            elapsed,
            player.position,
            e.combatPhase,
          ))
            bullet(e.o.position.clone().add(new T.Vector3(0, 0, 10)), target);
        e.cd =
          e.kind === 'subboss' ? (dynamicFlight ? [1.8, 1.35, 1][e.combatPhase - 1] : 1.5) : 2.3;
      }
      if (
        crossesSolid(
          previousPlayer,
          player.position,
          e.o.position.clone().add(new T.Vector3(0, e.hitY, 0)),
          e.half,
        )
      ) {
        hit(22);
        kill(e);
      }
      if (e.o.position.z > 40) {
        dispose(e.o);
        e.dead = true;
      }
    }
    if (boss) {
      if (dynamicFlight) {
        const turn =
          ((keys.has('KeyL') ? 1 : 0) - (keys.has('KeyJ') ? 1 : 0) + orbitTouch) * dt * 0.8;
        orbitAngle = Math.atan2(Math.sin(orbitAngle + turn), Math.cos(orbitAngle + turn));
        boss.rotation.y = tactics().heading - orbitAngle;
        world.setOrbit(-orbitAngle, boss.position);
        // Re-express existing projectiles in the rotating arena frame. New shots retain their aim.
        if (turn)
          for (const b of [...shots, ...hostile]) {
            b.o.position
              .sub(boss.position)
              .applyAxisAngle(new T.Vector3(0, 1, 0), -turn)
              .add(boss.position);
            if (!b.v) b.v = new T.Vector3(0, 0, -190);
            b.v.applyAxisAngle(new T.Vector3(0, 1, 0), -turn);
          }
        boss.userData.parts.forEach((p, i) => {
          p.mesh.scale.setScalar(weakPointOpen(relativeOrbit(), i) ? 1.15 : 0.75);
        });
      }
      bossCombat.update(dt);
      const combatPhase = bossCombat.phase;
      if (music?.snapshot().mode !== (combatPhase === 3 ? 'enraged' : 'boss'))
        music?.start(sectorIndex, combatPhase === 3 ? 'enraged' : 'boss');
      if (dynamicFlight) {
        const t = tactics();
        const approach = 1 - Math.pow(1 - Math.min(1, bossCombat.age / 3), 3);
        boss.position.set(
          t.x * approach,
          10 + (t.y - 10) * approach,
          -230 + (t.z + 230) * approach,
        );
        boss.rotation.z = t.bank;
        $('battleRadar').style.background = radarGradient(t);
        $('radarPlayer').style.transform = 'rotate(' + orbitAngle + 'rad)';
        $('tacticState').textContent =
          t.state === 'windup'
            ? '⚠ ' + t.name
            : t.vulnerable
              ? 'CONTRA-ATAQUE'
              : inDanger(orbitAngle, t)
                ? 'RISCO'
                : 'COBERTURA';
        const point = boss.userData.parts.findIndex((p) => p.hp > 0);
        const targetAngle = (point < 0 ? 0 : point === 0 ? -Math.PI / 3 : Math.PI / 3) + t.heading;
        $('radarWeak').hidden = scanTime <= 0;
        $('radarWeak').style.transform = 'rotate(' + targetAngle + 'rad)';
        if (t.state === 'attack' && t.cycle !== lastSpecialCycle) {
          lastSpecialCycle = t.cycle;
          const dangerous = inDanger(orbitAngle, t);
          for (let n = 0; n < (dangerous ? 3 : 1); n++) {
            const origin = boss.position.clone().add(new T.Vector3((n - 1) * 16, 0, 18));
            for (const target of encounterPattern(
              sectorIndex,
              t.cycle + n,
              player.position,
              dangerous ? 3 : 1,
            ))
              bullet(origin, target, sectorIndex % 2 ? 'arcane' : 'fire');
          }
        }
      } else {
        boss.position.z = T.MathUtils.lerp(boss.position.z, -88, dt * 0.7);
        boss.position.x = Math.sin(elapsed * 0.3) * 7;
        boss.position.y = 10 + Math.sin(elapsed * 0.4) * 3;
      }
      boss.userData.rotors.forEach((o, i) => (o.rotation.z += dt * (i % 2 ? -0.14 : 0.2)));
      boss.userData.organic?.forEach((o, i) => {
        o.rotation.z = Math.sin(elapsed * 1.8 + i) * 0.1;
      });
      boss.userData.jaw.rotation.x = Math.sin(elapsed * 2) * 0.12;
      boss.userData.core.scale.setScalar(1 + Math.sin(visualTime * 5) * 0.07);
      const remaining = boss.userData.parts.filter((p) => p.hp > 0).length;
      boss.userData.vents.forEach((v, i) => {
        v.visible = bossHp / bossCombat.max > 0.65 || i % 3 !== 0;
      });
      boss.userData.core.scale.setScalar(bossCombat.coreOpen ? 1.1 : 0.7);
      $('bossState').textContent =
        bossCombat.age < 3
          ? 'APROXIMAÇÃO'
          : remaining
            ? 'GERADORES ' + remaining + '/2'
            : 'FASE ' +
              combatPhase +
              ' · ' +
              (bossCombat.coreOpen ? 'NÚCLEO EXPOSTO' : 'BLINDAGEM ATIVA');
      if (dynamicFlight && scanTime > 0)
        $('bossState').textContent +=
          ' · FRACO: ' +
          ARSENAL.find((w) => w.element === weaknessAt(sectorIndex, combatPhase)).name;
      bossCd -= dt;
      $('attackWarning').textContent =
        bossCd < 0.65
          ? '⚠ ' +
            [
              'LEQUE DUPLO',
              'PINÇAS',
              'HÉLICE',
              'CRUZ ORBITAL',
              'ASAS DE FOGO',
              'MARTELO',
              'CABEÇAS DA HIDRA',
              'BATERIAS',
              'ANEL DO VAZIO',
              'COROA IMPERIAL',
            ][sectorIndex]
          : '';
      if (dynamicFlight && bossCd < 0.65)
        $('attackWarning').textContent +=
          (bossVolley + 1) % 3 === 0 ? ' · ORBES ARCANOS' : ' · PLASMA';
      if (bossCd <= 0 && bossCombat.age >= 3) {
        bossVolley++;
        const origin = boss.position.clone().add(new T.Vector3(0, 0, 22));
        for (const target of encounterPattern(
          sectorIndex,
          bossVolley,
          player.position,
          combatPhase,
        ))
          bullet(origin, target, dynamicFlight ? (bossVolley % 3 === 0 ? 'arcane' : 'fire') : '');
        bossCd = [2.3, 1.8, 1.25][combatPhase - 1];
      }
    } else $('attackWarning').textContent = '';
    for (let b of shots) {
      const previousShot = b.o.position.clone();
      const prev = b.o.position.z;
      if (b.homing) {
        const enemy = boss ? null : enemies.find((e) => !e.dead);
        const weakPart = boss?.userData.parts.find(
          (p, i) => p.hp > 0 && (!dynamicFlight || weakPointOpen(relativeOrbit(), i)),
        );
        const target = boss
          ? (weakPart?.mesh ?? boss.userData.core).getWorldPosition(new T.Vector3())
          : enemy?.o.position.clone().add(new T.Vector3(0, enemy.hitY, 0));
        if (target) {
          b.o.position.x = T.MathUtils.lerp(b.o.position.x, target.x, dt * 3);
          b.o.position.y = T.MathUtils.lerp(b.o.position.y, target.y, dt * 3);
        }
      }
      b.o.position.x += (b.spread ?? 0) * dt;
      if (b.v) b.o.position.addScaledVector(b.v, dt);
      else b.o.position.z -= dt * 190;
      b.life -= dt;
      for (let e of enemies) {
        if (
          !e.dead &&
          !b.pierced.has(e) &&
          (dynamicFlight
            ? crossesSolid(
                previousShot,
                b.o.position,
                e.o.position.clone().add(new T.Vector3(0, e.hitY, 0)),
                e.half,
                0.2,
              )
            : e.o.position.z <= prev + 3 &&
              e.o.position.z >= b.o.position.z - 3 &&
              Math.abs(e.o.position.x - b.o.position.x) < e.half.x &&
              Math.abs(e.o.position.y + e.hitY - b.o.position.y) < e.half.y)
        ) {
          const weak = Math.abs(e.o.position.x - b.o.position.x) < 1.2;
          const dealt = damageEnemy(e, (b.damage ?? 2) * (weak ? 2 : 1), b.element);
          impact(
            impactPoint(
              previousShot,
              b.o.position,
              e.o.position.clone().add(new T.Vector3(0, e.hitY, 0)),
              e.half,
            ),
            dealt,
          );
          b.pierced.add(e);
          if (b.element !== 'void') b.life = 0;
          if (e.life <= 0) kill(e);
          break;
        }
      }
      if (
        !dynamicFlight &&
        b.life > 0 &&
        boss &&
        boss.position.z + 18 <= prev + 3 &&
        boss.position.z + 18 >= b.o.position.z - 4 &&
        Math.abs(b.o.position.x - boss.position.x) < 24 &&
        Math.abs(b.o.position.y - boss.position.y) < 12
      ) {
        damageBoss(b.damage ?? 2, b.o.position);
        b.life = 0;
        explode(b.o.position, 2, 0x88ffee);
      }
      if (b.life > 0 && boss && dynamicFlight) {
        boss.updateMatrixWorld(true);
        const targets = boss.userData.parts.some((p) => p.hp > 0)
          ? boss.userData.parts.filter((p) => p.hp > 0).map((p) => p.mesh)
          : [boss.userData.core];
        for (const mesh of targets) {
          const center = mesh.getWorldPosition(new T.Vector3());
          if (crossesSolid(previousShot, b.o.position, center, new T.Vector3(5, 5, 5), 0.5)) {
            const dealt = damageBoss(b.damage ?? 2, center, b.element, b.charged);
            impact(impactPoint(previousShot, b.o.position, center, new T.Vector3(5, 5, 5)), dealt);
            b.life = 0;

            break;
          }
        }
        // Hull catches missed/armored shots behind the forward weak-point volumes.
        const hull = new T.Vector3(45, 20, 4);
        if (b.life > 0 && crossesSolid(previousShot, b.o.position, boss.position, hull, 0.2)) {
          impact(impactPoint(previousShot, b.o.position, boss.position, hull), 0);
          b.life = 0;
        }
      }
    }
    for (let b of hostile) {
      const from = b.o.position.clone();
      b.age += dt;
      if (b.spell === 'arcane' && b.age < 0.8)
        b.v.lerp(
          player.position.clone().sub(b.o.position).normalize().multiplyScalar(38),
          1 - Math.exp(-2 * dt),
        );
      b.o.position.addScaledVector(b.v, dt * (stasis > 0 ? 0.3 : 1));
      b.life -= dt;
      if (
        podMeshes.some((p) =>
          crossesSolid(from, b.o.position, p.position, new T.Vector3(1.6, 1.6, 1.6), 0.5),
        )
      ) {
        b.life = 0;
        podBlocks++;
        explode(b.o.position, 3, 0x70cfff);
        continue;
      }
      if (b.o.position.distanceTo(player.position) < 2.1) {
        hit(b.spell === 'fire' ? 14 : 10);
        b.life = 0;
        if (roll > 0) explode(b.o.position, 5, 0x77ffff);
      }
    }
    ringCd -= dt;
    if (spawnEncounters && ringCd < 0 && elapsed < current().duration) {
      const kind = ringWave++ % 2 === 0 ? 'blue' : 'shield';
      const o = createPickup(kind);
      const extent = Math.max(0, flightLimit() - 2);
      const spread = Math.min(23, camera.aspect * 20 - 2);
      o.position.set(
        dynamicFlight
          ? clamp(player.position.x + rnd(-spread, spread), -extent, extent)
          : rnd(-extent, extent),
        dynamicFlight ? clamp(player.position.y + rnd(-8, 8), 2, 42) : rnd(2, 18),
        -170,
      );
      scene.add(o);
      rings.push({ o, life: 10, kind });
      ringCd = 6;
    }
    if (dynamicFlight && spawnEncounters && elapsed < current().duration) {
      petCd -= dt;
      if (petCd <= 0) {
        const id = PET_ITEMS[petWave++ % PET_ITEMS.length].id;
        const o = createPetPickup(id);
        const extent = Math.max(0, flightLimit() - 2);
        const spread = Math.min(16, camera.aspect * 17 - 2);
        o.position.set(
          clamp(player.position.x + rnd(-spread, spread), -extent, extent),
          clamp(player.position.y + rnd(-7, 7), 2, 42),
          -160,
        );
        scene.add(o);
        rings.push({ o, life: 12, kind: 'pet:' + id });
        petCd = 9;
      }
    }
    for (let r of rings) {
      const extent = Math.max(0, flightLimit() - 2);
      r.o.position.x = clamp(r.o.position.x, -extent, extent);
      const result = pickupStep({
        position: r.o.position,
        player: player.position,
        speed,
        dt,
        kind: r.kind,
      });
      r.o.position.set(result.x, result.y, result.z);
      r.o.rotation.z += dt;
      if (result.collected) {
        score += 3;
        r.life = 0;
        explode(r.o.position, 3, r.kind === 'blue' ? 0x61b9ff : 0x9affb5);
        collect(r.kind);
        pickupFeedback(r.kind);
      }
      if (r.o.position.z > 40) r.life = 0;
    }
    obstacleCd -= dt;
    if (
      spawnEncounters &&
      obstacleCd <= 0 &&
      elapsed < current().duration &&
      !obstacles.some((o) => o.o.userData.kind === 'tunnel')
    ) {
      const o = createObstacle(Math.floor(elapsed / 8) % 2 ? 'gantry' : 'reactor');
      o.position.set(o.userData.kind === 'gantry' ? 0 : rnd(-20, 20), 0, -230);
      scene.add(o);
      obstacles.push({ o, life: 1 });
      obstacleCd = 8;
    }
    for (const obstacle of obstacles) {
      const travel = speed * dt;
      obstacle.o.position.z += travel;
      const from = previousPlayer
        .clone()
        .sub(obstacle.o.position)
        .add(new T.Vector3(0, 0, travel));
      const to = player.position.clone().sub(obstacle.o.position);
      if (
        obstacle.o.userData.solids.some((solid) =>
          crossesSolid(from, to, solid.center, solid.half, 1.3),
        )
      )
        hit(30);
      if (obstacle.o.position.z - obstacle.o.userData.length > 50) obstacle.life = 0;
    }
    for (let arr of [shots, hostile, rings, obstacles])
      for (let i = arr.length - 1; i >= 0; i--)
        if (arr[i].life <= 0) {
          dispose(arr[i].o);
          arr.splice(i, 1);
        }
    enemies = enemies.filter((e) => !e.dead);
    $('shieldValue').textContent = Math.ceil(hp) + ' / ' + maxHp();
    $('speedValue').textContent = boosting ? '890' : '480';
    $('shield').style.width = (hp / maxHp()) * 100 + '%';
    $('criticalWarning').hidden = !dynamicFlight || hp <= 0 || hp > maxHp() * 0.25;
    $('petCareHud').hidden = !dynamicFlight;
    $('petCareHud').textContent =
      'CUIDADOS · ' + PET_ITEMS.map(({ id, name }) => name + ' ' + petCare[id]).join(' / ');
    $('score').textContent = String(score).padStart(3, '0');
    $('bombs').textContent = '◆ '.repeat(bombs) || '—';
    $('energy').style.width = energy + '%';
    $('progress').style.width = Math.min(100, (elapsed / current().duration) * 100) + '%';
    $('bossHealth').style.width = Math.max(0, (bossHp / (bossCombat?.max ?? 1400)) * 100) + '%';
  }
  let last = now();
  function tick(dt, nowMs) {
    if (!appActive) return;
    const now = nowMs;
    if (cinematic && state === 'menu') advanceCinematic(dt);
    if (state === 'playing' && stageIntroTime > 0) {
      stageIntroTime = Math.max(0, stageIntroTime - dt);
      if (stageIntroTime === 0) document.body.classList.remove('stage-intro');
    }
    if (state === 'playing' && pickupFeedbackTime > 0) {
      pickupFeedbackTime = Math.max(0, pickupFeedbackTime - dt);
      if (pickupFeedbackTime === 0) $('pickupFlash').hidden = true;
    }
    if (!['playing', 'collapsing'].includes(state)) $('aimReticle').hidden = true;
    if (['menu', 'playing', 'collapsing', 'shop', 'won', 'arcade'].includes(state)) {
      if (state !== 'menu' || menuThemePlaying) music?.update(dt);
    }
    if (state === 'collapsing') updateFinale(dt);
    if (state === 'respawning') {
      respawnTime -= dt;
      player.rotation.z += dt * 7;
      if (respawnTime <= 0) {
        hp = maxHp();
        invuln = 3;
        state = 'playing';
        player.visible = true;
        music?.resume();
        message(PILOTS[3 - lives] + ' / ASSUMINDO A NOVA-7. VAMOS CONTINUAR.');
      }
    }
    if (state !== 'paused' && state !== 'arcade') {
      visualTime += dt;
      world.update(
        dt,
        visualTime,
        (boosting ? 90 : 48) *
          (1 + Math.min(30, stage()) * 0.02) *
          (dynamicFlight
            ? activePilot().bonuses.speed * (1 + activeShip().stats.agility * 0.08)
            : 1),
        (state === 'playing' && !(dynamicFlight && boss)) ||
          (dynamicFlight && state === 'collapsing'),
      );
      const boostVisible = boosting && ['playing', 'collapsing'].includes(state);
      if (boostVisible) document.body.classList.add('boosting');
      else document.body.classList.remove('boosting');
      for (let f of player.userData.flames) {
        f.material.color.set(boostVisible ? '#ff9a35' : '#78eaff');
        f.scale.set(
          boostVisible ? 1.7 : 1,
          (boostVisible ? 3 : 1) + Math.sin(visualTime * 30) * 0.12,
          boostVisible ? 1.7 : 1,
        );
        f.position.z = 2.3 + 1.7 * f.scale.y;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.life -= dt;
        p.o.position.addScaledVector(p.v, dt);
        p.o.material.opacity = Math.max(0, p.life);
        if (p.kind === 'wave') p.o.scale.addScalar(dt * 30);
        else p.o.scale.multiplyScalar(1 + dt * (p.kind === 'flash' ? 4 : 1.4));
        if (p.life <= 0) {
          dispose(p.o);
          p.o.material.dispose();
          if (p.kind === 'wave') p.o.geometry.dispose();
          particles.splice(i, 1);
        }
      }
    }
    if (state === 'arcade') {
      arcade.update(dt, {
        x:
          (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
          (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
          stick.x,
        y:
          (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
          (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
          stick.y,
        fire: keys.has('Space') || touchFire,
      });
      const data = arcade.snapshot();
      $('arcadeStatus').textContent =
        'FENDA 2D · ' +
        Math.ceil(18 - data.time) +
        's · +' +
        data.credits +
        ' CR · ' +
        data.hits +
        ' ACERTOS';
      drawArcade($('arcadeCanvas'), data, SKINS.find((s) => s.id === cosmetics.skin).color);
      if (data.done) {
        credits += data.credits;
        score += data.hits;
        arcade = null;
        state = 'playing';
        invuln = Math.max(invuln, 3);
        releaseControls();
        $('arcadePanel').hidden = true;
        message('SAÍDA DA FENDA / +' + data.credits + ' CR · ROTA 3D RETOMADA');
      }
    } else if (state === 'playing') update(dt);
    else if (state === 'menu') {
      player.visible = true;
      const small = camera.aspect < 1;
      player.position.set(small ? 0 : 9, small ? 12 : 7, small ? -3 : 5);
      player.rotation.set(0.12, -0.45 + Math.sin(now * 0.0003) * 0.08, -0.12);
      camera.position.set(0, 11, 32);
      camera.lookAt(0, 5, -60);
    }
    const inside =
      cameraMode === 'cockpit' &&
      (state === 'playing' || (state === 'paused' && pausedFrom === 'playing'));
    barrierVisual.visible =
      dynamicFlight && barrier > 0 && !inside && ['playing', 'paused'].includes(state);
    cockpit?.update(state === 'paused' ? 0 : dt, inside, charge);
    $('cockpitPanel').hidden = !inside;
    $('tacticalPanel').hidden = !dynamicFlight || !boss || !['playing', 'paused'].includes(state);
    $('hitFeedback').hidden =
      !dynamicFlight || impactTime <= 0 || !['playing', 'paused'].includes(state);
    $('cameraView').disabled = state !== 'playing';
    $('strategyControls').hidden =
      !dynamicFlight ||
      !['playing', 'paused'].includes(state) ||
      (state === 'paused' && pausedFrom !== 'playing');
    $('cockpitReadout').textContent =
      Math.ceil(hp) +
      '% ESCUDO · ' +
      Math.ceil(energy) +
      '% ENERGIA · ' +
      (boosting ? '890' : '480');
    // The opaque web cover/hangar owns the menu frame; keep the live GPU idle.
    if (!(dynamicFlight && state === 'menu' && document.body.classList.contains('showroom-web'))) {
      routeRenderer?.prepare();
      post.render();
    }
  }
  function step(dt) {
    if (!Number.isFinite(dt) || dt < 0 || dt > 1)
      throw new RangeError('dt must be between 0 and 1 second');
    tick(dt, now());
  }
  function loop(time) {
    if (!running) return;
    const dt = Math.min((time - last) / 1000, 0.035);
    last = time;
    tick(dt, time);
    requestFrame(loop);
  }
  if (autoLoop) requestFrame(loop);
  addEventListener('resize', () => {
    const { innerWidth: w, innerHeight: h, devicePixelRatio: p = 1 } = window;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(p, pixelLimit));
    post.resize(w, h);
  });
  if (document.modelContext?.registerTool) {
    try {
      Promise.resolve(
        document.modelContext.registerTool({
          name: 'get_flight_status',
          description: 'Read the current mission status, shield, hits and bombs.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: () => ({ state, shield: hp, hits: score, bombs, seconds: Math.floor(elapsed) }),
        }),
      ).catch(() => {});
    } catch {
      /* Optional browser capability; gameplay remains available. */
    }
  }

  return {
    start,
    cycleCamera,
    orbit,
    cycleArsenal,
    cycleSpecial,
    castSpecial,
    scanBoss,
    tacticalAction,
    pause,
    setActive,
    fire,
    bomb,
    roll: doRoll,
    step,
    // These are internal domain events, never installed on window or WebMCP.
    damage: hit,
    damageBoss,
    collect,
    buy,
    buySkin,
    selectPilot,
    selectShip,
    selectShipColor,
    nextSector,
    snapshot: () => ({
      state,
      settings: { ...settings },
      pauseDialog: !$('pauseMenu').hidden,
      confirmation,
      stageTitleVisible: stageIntroTime > 0,
      strategy: { ...strategy, stage: stage(), arcana, specialCd, barrier, stasis, orbitAngle },
      tactics: { energy: tacticEnergy, scanTime, impactTime, ...(boss ? tactics() : {}) },
      coreAngle: dynamicFlight && boss ? tactics().heading : 0,
      shotPower: shots[0]?.damage ?? 0,
      chargedPower: shots.find((s) => s.charged)?.damage ?? 0,
      shotDirections: shots.filter((b) => b.v).map((b) => b.v.toArray()),
      hostilePositions: hostile.slice(0, 5).map((b) => b.o.position.toArray()),
      cameraMode,
      playerVisible: player.visible,
      route: { ...route },
      arcade: arcade?.snapshot() ?? null,
      cosmetics: { skin: cosmetics.skin, owned: [...cosmetics.owned] },
      petCare: { ...petCare },
      cinematic: cinematic ? { elapsed: cinematic.elapsed, duration: cinematic.duration } : null,
      loadout: { ...pilotLoadout, pilotName: activePilot().name, shipName: activeShip().name },
      sector: sectorIndex + 1,
      lives,
      credits,
      weapon: weapon + 1,
      pods: podCount,
      armor,
      charge,
      music: music?.snapshot() ?? null,
      arena: dynamicFlight && !!boss,
      bossTargets:
        boss?.userData.parts.map((p, i) => ({
          hp: p.hp,
          open: !dynamicFlight || weakPointOpen(relativeOrbit(), i),
          angle: wrapAngle(
            (i === 0 ? -Math.PI / 3 : Math.PI / 3) + (dynamicFlight ? tactics().heading : 0),
          ),
          position: p.mesh.getWorldPosition(new T.Vector3()).toArray(),
        })) ?? [],
      bossParts: boss?.userData.parts.filter((p) => p.hp > 0).length ?? 0,
      seconds: elapsed,
      shield: hp,
      hits: score,
      bombs,
      energy,
      boss: !!boss,
      bossHp,
      bossPhase: bossCombat?.phase ?? 0,
      bossAge: bossCombat?.age ?? 0,
      bossZ: boss?.position.z ?? null,
      coreOpen: bossCombat?.coreOpen ?? false,
      collapseTime,
      podsDetached,
      podMode,
      podBlocks,
      podPositions: podMeshes.map((p) => ({ x: p.position.x, y: p.position.y, z: p.position.z })),
      boostVisual: {
        color: player.userData.flames[0].material.color.getHex(),
        length: player.userData.flames[0].scale.y,
      },
      podLevels: podMeshes.map((p) => p.userData.level),
      pickups: rings.map((r) => ({
        kind: r.kind,
        color: r.o.userData.color,
        x: r.o.position.x,
        y: r.o.position.y,
        z: r.o.position.z,
      })),
      rolling: roll > 0,
      player: { x: player.position.x, y: player.position.y },
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        fov: camera.fov,
        bank: camera.rotation.z,
      },
      encounterKinds: enemies.filter((e) => !e.dead).map((e) => e.kind),
      targets: enemies
        .filter((e) => !e.dead)
        .map((e) => ({
          kind: e.kind,
          x: e.o.position.x,
          y: e.o.position.y + e.hitY,
          z: e.o.position.z,
          life: e.life,
          chilled: e.chilled,
          burning: e.burning,
          phase: e.combatPhase,
        })),
      tunnel: obstacles.some((o) => o.o.userData.kind === 'tunnel'),
      controls: { fire: touchFire, boost: touchBoost, stickX: stick.x, stickY: stick.y },
      entities: {
        enemies: enemies.length,
        shots: shots.length,
        hostile: hostile.length,
        particles: particles.length,
        rings: rings.length,
        obstacles: obstacles.length,
      },
    }),
    destroy() {
      running = false;
      document.body.classList.remove('in-mission', 'stage-intro', 'left-handed');
      $('pauseMenu').hidden = true;
      $('settingsMenu').hidden = true;
      music?.destroy();
      audioCues?.destroy();
      localization.destroy();
      cleanups.forEach((fn) => fn());
      clearWorld();
      player.userData.flames.forEach((f) => f.material.dispose());
      cockpit?.destroy();
      shotMaterials.forEach((m) => m.dispose());
      barrierVisual.geometry.dispose();
      barrierVisual.material.dispose();
      routeRenderer?.destroy();
      player.userData.paint?.forEach((m) => m.dispose());
      shipModule.traverse((o) => {
        o.geometry?.dispose();
        if (o.material?.userData.paintModule) o.material.dispose();
      });
      renderer.dispose?.();
    },
  };
}
