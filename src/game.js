import {
  ARSENAL,
  SPECIALS,
  progressionBenefits,
  nextRpgUnlock,
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
import { createPilotRelay } from './pilot-relay.js';
import { routeAt, createRouteRenderer } from './route.js';
import { stagePerspectiveAt } from './stage-variety.js';
import { chooseBossIntent, bossMeleeHit, bossMeleePose } from './boss-combat-ai.js';
import { bossRadarPlan, renderBossRadar } from './boss-radar.js';
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
  projectileCount,
  firingCooldown,
  WEAPON_COLORS,
  SHOP,
  shopPrice,
  readSave,
  writeSave,
} from './campaign.js';
import {
  createFlightCamera,
  crossesSolid,
  launchOrbitReady,
  projectileHitsObstacle,
  projectileHitsApproachingObstacle,
} from './flight.js';
import { resolveCitySolidContact } from './city-collision.js';
import { createOrbitalLaunch } from './orbital-launch.js';
import { initialJourney, advanceJourney, journeyPhaseAt } from './stage-journey.js';
import { saturnObstacleKindAt } from './saturn-ring-passage.js';
import { advanceOmegaRearResponse, chaseOmegaOffset } from './omega-hunt.js';
import { ARRIVAL_SECONDS } from './destination-arrival.js';
import { MARS_TOUCHDOWN_SECONDS } from './mars-descent.js';
import { marsSandstormAt, createMarsDustCoating, setMarsDustCoating } from './mars-sandstorm.js';
import { marsBossAltitudeConstraint } from './mars-boss-ground.js';
import { warpExitAt, createWarpStreaks, updateWarpStreaks } from './warp-departure.js';
import { createAsteroidInterior } from './asteroid-interior.js';
import { measurePilotHull, projectPilotHull } from './asteroid-course.js';
import { createMarvinRival } from './marvin-rival.js';
import { bossDepartureAt } from './boss-departure.js';
import {
  europaBossMinimumCenterHeight,
  europaBossArenaHeight,
  europaBossFloorY,
  europaBossArenaDepth,
  europaBossPortraitFov,
} from './europa-boss-arena.js';
import { drawCampaignMap } from './campaign-map.js';
import {
  SCATTER_CADENCE_FACTOR,
  SCATTER_LIFETIME,
  readScatterLoadout,
  scatterDamageFactor,
  scatterPellets,
} from './scatter-cannon.js';
import {
  createGroundEnemy,
  animateGroundEnemy,
  fireGroundRobotEyes,
  robotEyeMuzzles,
  createObstacle,
  primeEuropaTunnelBreach,
  openEuropaTunnelBreach,
  updateEuropaTunnelBreach,
  isGroundSector,
} from './encounters.js';
import { createMusic } from './audio.js';
import { stageOneEncounterWindows, stageOneCombatDensity } from './stage-one-pacing.js';
import { configurePlaybackAudioSession } from './audio-session.js';
import { loadSettings, storeSettings, readSettings, uiText } from './ui-preferences.js';
import { createAdaptiveGraphics, graphicsPixelRatioLimit } from './graphics-quality.js';
import { createFrameAudit, formatFrameAudit } from './frame-audit.js';
import { createHostileProjectilePool } from './hostile-projectile-pool.js';
import { createParticlePool } from './particle-pool.js';
import { createHudWriteGuard } from './hud-write-guard.js';
import { createRenderCostAudit } from './render-cost-audit.js';
import { createReflexBoost, nearbyHostileThreats } from './reflex-boost.js';
import { robotAttackPose, robotEyeBurstReady, ROBOT_EYE_WARNING_SECONDS } from './robot-assault.js';
import { bossBatteryPlan, batteryForSignature, sourceHardpointName } from './boss-hardpoints.js';
import { animateBossWeaponVfx, flashBossWeapon, BOSS_WEAPON_COLORS } from './boss-weapon-vfx.js';
import { createHeroWeaponEffects } from './hero-weapon-vfx.js';
import {
  difficultyProfile,
  fighterInterval,
  obstacleInterval,
  firstSubbossQuiet,
  firstSubbossObstacleQuiet,
  firstSubbossWarmup,
} from './difficulty.js';
import { createAudioCues } from './audio-cues.js';
import { createMechaThrusterAudio } from './mecha-thruster-audio.js';
import { updateMechaPose, resetMechaPose, selectMechaTarget } from './mecha-motion.js';
import { prewarmSceneShaders } from './scene-prewarm.js';
import { scheduleIdlePrewarm } from './obstacle-idle-prewarm.js';
import {
  mechaMultiLockCapacity,
  availableMechaTargets,
  collectMultiLocks,
  multiLockCost,
} from './mecha-multi-lock.js';
import { mechaShotDamage, mechaShotCooldown, mechaShotScale } from './mecha-heavy-fire.js';
import { bossWeakPointOpen, bossWeakPointAngle, bossRadarTarget } from './boss-weakpoint-layout.js';
import {
  newWeakpointEvidence,
  recordWeakpointContact,
  bossIntegrityRatio,
  weakpointReadout,
} from './boss-weakpoint-feedback.js';
import {
  createDevastadorSabotageCore,
  updateDevastadorSabotageCore,
  sabotagedSystem,
  sabotageTargetOpen,
  sabotageRadarTarget,
} from './devastador-sabotage.js';
import { animatePremiumMecha } from './mecha-premium.js';
import { createMechaDashTrail } from './mecha-dash-trail.js';
import {
  MECHA_DASH,
  heldBankAngle,
  dashDirection,
  dashFrame,
  heroVisualScale,
  shipCollisionMargin,
} from './hero-dodge-controls.js';
import { breakableHullHealth, damageBreakableHull } from './breakable-encounters.js';
import {
  CITY_DESTRUCTION_BEATS,
  CITY_STAGE_AUDIO,
  CITY_STREET_TOP_Y,
  cityWarningText,
  cityDestructionAt,
  createCityHangingTrainObstacle,
  animateCityHangingTrainObstacle,
} from './city-destruction.js';
import {
  evolvedShotColor,
  dockedPodPower,
  podLaserMultiplier,
  lockLaserCount,
  progressionSpeed,
  boostTrailLength,
} from './combat-progression.js';
import { createFiveCatsSquad } from './five-cats-runtime.js';
import { renderRadioSpeaker, renderCinematicPortrait } from './radio-portraits.js';
import { SQUAD_SPECIALS } from './five-cats-squad.js';
import { combatFeedback } from './combat-feedback.js';
import { shouldWarnBoss } from './boss-telegraph.js';
import { bossEncounterGate } from './encounter-separation.js';
import { FIGHTER_ROLES, fighterMotion, fighterAdvance, fighterAimOffsets } from './enemy-roles.js';
import { fighterWaveAt } from './sector-waves.js';
import {
  fighterAllowedDuringArrival,
  arrivalFighterDepth,
  fighterArrivalAge,
  fighterMayFireAtDepth,
  shouldKeepArrivalCooldown,
} from './encounter-arrival-flow.js';
import {
  subbossProfile,
  subbossMotion,
  subbossCooldown,
  subbossWindup,
  firstSubbossDeparture,
} from './subboss-tactics.js';
import { PET_ITEMS, readPetCare, collectPetItem } from './pet-collectibles.js';
import { createPetPickup } from './pet-visuals.js';
import { pickupStep } from './pickup-assist.js';
import { createI18n } from './i18n.js';
import { developerToolsAllowed, parseDeveloperScenario } from './developer-mode.js';
import { developerLabLoadout } from './developer-lab.js';
import { CINEMATICS, cinematicBeat, cinematicDuration } from './cinematics.js';
import { createCinematicStage } from './cinematic-stage.js';
import {
  createBossModel,
  createSubboss,
  disposeBoss,
  encounterPattern,
  SUBBOSS_NAMES,
  animateBossSignature,
} from './bosses.js';
import { bossSignatureVolley } from './boss-signature.js';
import { createBossCombat } from './combat.js';
import { bossAttackProgram, bossDamageMultipliers } from './boss-director.js';
import { createPod, animatePod, createPickup } from './equipment.js';
import { createCollapse, updateCollapse, disposeCollapse, COLLAPSE_SECONDS } from './finale.js';
import { devastadorEscapeAt, DEVASTADOR_ESCAPE_BOOST_START } from './devastador-escape.js';
import {
  reactorOrbitalPosition,
  withReactorOrbitPresentation,
} from './reactor-orbit-presentation.js';
import {
  fighter,
  createFlyingRobot,
  scaleFighterVisual,
  animateMechPower,
  resetMechPower,
  setFighterEvolution,
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
  // QA fixtures may inspect destruction without spawning hostile formations;
  // ordinary gameplay inherits the normal encounter toggle.
  enableCitySetpieces = spawnEncounters,
  enableAsteroidCourse = spawnEncounters,
  enableSquadIntro = true,
  nativeLifecycle = false,
  onStageStarted = () => {},
  onStageFinished = () => {},
} = {}) {
  const { innerWidth, innerHeight, devicePixelRatio = 1 } = window;
  const frameAudit = createFrameAudit();
  const renderCostAudit = createRenderCostAudit();
  let frameAuditContext = null;
  let pausePanel = 'controls';
  const matchMedia = (q) => window.matchMedia(q);
  const coarsePointer = matchMedia('(pointer:coarse)');
  const cleanups = [];
  let running = true;
  const addEventListener = (type, fn) => {
    window.addEventListener(type, fn);
    cleanups.push(() => window.removeEventListener(type, fn));
  };
  let pixelLimit = coarsePointer.matches ? 1.25 : 1.7;
  const $ = (id) => document.getElementById(id),
    clamp = T.MathUtils.clamp,
    rnd = (a, b) => a + random() * (b - a);
  const hud = createHudWriteGuard($);
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
  const developerAvailable = developerToolsAllowed(window.location?.hostname, nativeLifecycle);
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
  const orbitalLaunchSequence = createOrbitalLaunch();
  let route = routeAt(0, 0, SECTORS[0].duration);
  let arcade = null,
    arcadeDone = false;
  const world = createWorld(scene, random, dynamicFlight),
    post = postProcessor(renderer, scene, camera, { coarsePointer: coarsePointer.matches });
  let lastFrameCost = { drawCalls: null, triangles: null, postPasses: 0 };
  post.resize(innerWidth, innerHeight);
  const dashTrail = createMechaDashTrail(scene);
  const asteroidInterior = dynamicFlight
    ? createAsteroidInterior(scene, { obstacles: enableAsteroidCourse })
    : null;
  const marvinRival = dynamicFlight ? createMarvinRival(scene) : null;
  let journey = initialJourney(0);
  let asteroidWallCooldown = 0;
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
  const cityPlayerBefore = new T.Vector3();
  const citySolidFrom = new T.Vector3();
  const citySolidTo = new T.Vector3();
  const citySolidOrigin = new T.Vector3();
  let cityImpactCount = 0;
  scene.add(player);
  player.position.set(0, 6, 9);
  let pilotLoadout = readPilotLoadout(null);
  let selectedMissionLoadout = { ...pilotLoadout };
  const pilotRelay = createPilotRelay(pilotLoadout);
  let pendingPilotRelay = null;
  let lastFlightSpeed = 48;
  let shipModule = dynamicFlight ? createShipModule(pilotLoadout.ship) : new T.Group();
  player.add(shipModule);
  // Grow visible NOVA-7 by 11% (a ~6% gain vs Graphics 3.6), preserving root/hitbox.
  scaleFighterVisual(player, 1.02);
  // Only these meshes represent the ship; keep effects independent of form changes.
  const shipParts = [...player.children];
  const robot = createFlyingRobot();
  robot.visible = false;
  player.add(robot);
  let asteroidShipHull = measurePilotHull(player, robot);
  const asteroidRobotHull = measurePilotHull(robot);
  const asteroidPriorRotation = new T.Euler();
  let pendingAsteroidTransform = null;
  function asteroidPilotHalf(mode = robotMode) {
    return projectPilotHull(
      mode ? asteroidRobotHull : asteroidShipHull,
      player.rotation,
      player.scale.x,
    );
  }
  function asteroidImpact() {
    if (asteroidWallCooldown > 0) return;
    asteroidWallCooldown = 1.25;
    hit(12);
    cue('armorHit');
    shake = Math.max(shake, 0.25);
  }
  // A damaged ship retreats instead of depicting a dead cat.
  const damagedCraft = dynamicFlight ? fighter() : null;
  if (damagedCraft) {
    damagedCraft.name = 'five-cats-damaged-craft-retreat';
    damagedCraft.visible = false;
    damagedCraft.scale.setScalar(0.85);
    scene.add(damagedCraft);
  }
  const heroEffects = createHeroWeaponEffects(player, robot);
  const reflexBoost = createReflexBoost();
  const squad = dynamicFlight
    ? createFiveCatsSquad({
        scene,
        player,
        createWing(pilot) {
          const wing = fighter();
          wing.name = 'five-cats-wingman-' + pilot.id;
          wing.userData.paint?.forEach((material) => material.color.set(pilot.color));
          wing.scale.setScalar(1.1);
          return wing;
        },
        fireFrom(origin, target, damage, element, charged, source = 'squad-support') {
          launchShot(0, damage, charged, origin);
          const shot = shots.at(-1);
          shot.v = target
            .clone()
            .sub(origin)
            .normalize()
            .multiplyScalar(charged ? 250 : 195);
          shot.element = element;
          shot.homing = false;
          shot.source = source;
          shot.life = 2.2;
          if (charged) shot.o.scale.setScalar(5);
        },
        opponent() {
          if (boss) {
            boss.updateMatrixWorld(true);
            const weak = boss.userData.parts.find((p, i) => p.hp > 0 && bossTargetOpen(i));
            if (weak) return weak.mesh.getWorldPosition(new T.Vector3());
            if (bossCoreOpen() && boss.userData.parts.every((p) => p.hp <= 0))
              return boss.userData.core.getWorldPosition(new T.Vector3());
            // The full Five Cats formation must never stop firing just because
            // the flank generators are armored. Aim at the visible hull; its
            // damage is low until the pilot exposes a generator.
            return boss.position.clone().add(new T.Vector3(0, 0, 4));
          }
          const target = enemies.find((e) => !e.dead);
          return target ? target.o.position.clone().add(new T.Vector3(0, target.hitY, 0)) : null;
        },
        obstacleRange() {
          const nearest = obstacles
            .filter(
              ({ o }) =>
                o.position.z < player.position.z &&
                Math.abs(o.position.x - player.position.x) < 6 &&
                Math.abs(o.position.y - player.position.y) < 6,
            )
            .reduce(
              (distance, { o }) => Math.min(distance, player.position.z - o.position.z - 6),
              150,
            );
          return Math.max(5, nearest);
        },
        notify: (text) => message(text),
        cue: (sound) => cue(sound),
        status: $('squadSuperStatus'),
        formationStatus: $('squadFormationStatus'),
        getLanguage: () => settings?.language ?? 'pt',
      })
    : null;
  let skipSquadIntro = false;
  let cityDestructionTriggered = new Set();
  let cityOrbitReadyAt = null;
  let developerSession = false;
  let developerScenario = null;
  let robotMode = false;
  let robotFireKick = 0;
  let robotPrecisionKick = 0;
  let robotCooldown = 0;
  let robotTransition = 0;
  const transformDuration = 1.25;
  let mechaEngine = null;
  let lockEnabled = false;
  let lockedId = null;
  let lockProgress = 0;
  let precisionCd = 0;
  let lockHeld = false;
  let lockWasEnabled = false;
  let lockHoldSeconds = 0;
  let lockQueue = [];
  const clearMultiLockMarkers = () => {
    for (let i = 0; i < 12; i++) $('mechaMultiTarget' + i).hidden = true;
  };
  function resetMechaLock() {
    lockEnabled = false;
    lockedId = null;
    lockProgress = 0;
    lockHeld = false;
    lockHoldSeconds = 0;
    lockQueue = [];
    clearMultiLockMarkers();
    $('lockTouch').ariaPressed = 'false';
    $('mechaLockStatus').hidden = true;
    $('mechaLockReticle').hidden = true;
  }
  function toggleMechaLock() {
    if (!robotMode || state !== 'playing') return;
    lockEnabled = !lockEnabled;
    if (!lockEnabled) resetMechaLock();
    else $('lockTouch').ariaPressed = 'true';
  }
  function startMechaMultiLock() {
    if (!robotMode || state !== 'playing') return;
    lockWasEnabled = lockEnabled;
    lockHeld = true;
    lockHoldSeconds = 0;
    lockQueue = [];
    lockEnabled = true;
    lockedId = null;
    lockProgress = 0;
    $('lockTouch').ariaPressed = 'true';
  }
  function finishMechaMultiLock(cancel = false) {
    if (!lockHeld) return;
    const sustained = lockHoldSeconds >= 0.23;
    const targets = [...lockQueue];
    const wasEnabled = lockWasEnabled;
    lockHeld = false;
    if (cancel || state !== 'playing' || !robotMode) {
      resetMechaLock();
      return;
    }
    if (!sustained) {
      // A quick tap retains the old toggle-to-auto-aim behavior.
      lockEnabled = wasEnabled;
      toggleMechaLock();
      return;
    }
    const cost = multiLockCost(targets.length);
    if (targets.length && energy >= cost && precisionCd <= 0) {
      robot.updateMatrixWorld(true);
      const origin = robot.userData.mecha.arms.left.muzzle.getWorldPosition(new T.Vector3());
      for (const target of targets) {
        const aim = target.position.clone().sub(origin);
        if (aim.lengthSq() < 1) continue;
        launchShot(
          0,
          mechaShotDamage(weaponPower(), { robot: true, kind: 'precision' }) * 0.8,
          false,
          origin,
        );
        const shot = shots.at(-1);
        shot.v = aim.normalize().multiplyScalar(215 + stage() * 3);
        shot.source = 'mecha-multi-lock';
        shot.homing = false;
        shot.o.scale.setScalar(1.8 + stage() * 0.05);
      }
      energy -= cost;
      precisionCd = Math.max(1.15, 1.8 - stage() * 0.03);
      heroEffects.pulse({ robot: true, precisionShot: true, color: shotColor() });
      cue('mechaPrecision');
      message('MULTI-LOCK · ' + targets.length + ' ALVOS · RAJADA LIBERADA');
    } else if (targets.length) {
      message('MULTI-LOCK · RECARGA OU ENERGIA INSUFICIENTE');
    }
    resetMechaLock();
  }
  function syncDodgeControl() {
    const rollButton = $('rollTouch');
    const key = robotMode ? 'mechaDashButton' : 'rollButton';
    rollButton.textContent = uiText(settings.language, key);
    rollButton.setAttribute?.(
      'aria-label',
      uiText(settings.language, robotMode ? 'mechaDashAria' : 'rollAria'),
    );
    const hint = document.getElementById('rollHint');
    if (hint)
      hint.textContent = uiText(settings.language, robotMode ? 'mechaDashHint' : 'rollHint');
    for (const node of document.querySelectorAll?.(
      '[data-help-key="helpRoll"], [data-help-key="helpMechaDash"]',
    ) ?? []) {
      node.dataset.helpKey = robotMode ? 'helpMechaDash' : 'helpRoll';
      node.textContent = uiText(settings.language, node.dataset.helpKey);
    }
  }
  function toggleRobot() {
    if (
      !dynamicFlight ||
      state !== 'playing' ||
      robotCooldown > 0 ||
      energy < 15 ||
      dashRemaining > 0
    )
      return;
    if (
      sectorIndex === 2 &&
      asteroidInterior.course.overlaps(player.position, asteroidPilotHalf(!robotMode))
    ) {
      pendingAsteroidTransform = !robotMode;
      return;
    }
    pendingAsteroidTransform = null;
    energy -= 15;
    robotCooldown = 2.5;
    robotTransition = transformDuration;
    robotMode = !robotMode;
    // Ship barrel roll and robot lateral dash are mutually exclusive moves.
    roll = rollAngle = 0;
    marsPendingRoll = false;
    rollHeld = false;
    dashRemaining = dashCooldown = 0;
    syncDodgeControl();
    if (marsCleanse > 0) {
      $('attackWarning').textContent = robotMode
        ? 'AREIA NOS CANHÕES · VOLTE À NAVE PARA 3 GIROS'
        : 'AREIA NOS CANHÕES · GIROS: ' + marsCleanse;
    }
    if (!robotMode) resetMechaLock();
    robot.visible = robotMode;
    $('lockTouch').hidden = !robotMode;
    unlockAudio();
    if (!mechaEngine && audioCtx && robotMode) mechaEngine = createMechaThrusterAudio(audioCtx);
    cue('mechaTransform');
    for (const part of shipParts) part.visible = !robotMode;
    // shipParts captured the original module; every replacement must also follow the transformation.
    shipModule.visible = !robotMode;
    $('robotTouch').ariaPressed = String(robotMode);
    $('robotTouch').textContent = robotMode ? 'NAVE' : 'ROBÔ';
    syncDodgeControl();
    dashRemaining = 0;
    rollHeld = false;
    cue(robotMode ? 'transformRobot' : 'transformShip');
    message(
      robotMode ? 'MODO ROBÔ / CANHÕES PESADOS ATIVOS' : 'MODO NAVE / AGILIDADE RESTAURADA',
      'christopher',
    );
  }
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
  const marsDust = dynamicFlight ? createMarsDustCoating() : null;
  if (marsDust) player.add(marsDust);
  const warpStreaks = dynamicFlight ? createWarpStreaks() : null;
  if (warpStreaks) scene.add(warpStreaks);
  let marsBossAltitude = null;
  // CPU geometry generation and shader compilation belong to stage loading,
  // never to the critical frame where the boss appears.
  let preparedBoss = null;
  let prepareGeneration = 0;
  let bossShadersWarm = false;
  let mechaWarmupScheduled = false;
  let fighterSerial = 0;
  let enemies = [],
    shots = [],
    hostile = [],
    particles = [],
    rings = [],
    obstacles = [],
    boss = null;
  // Shared muzzle meshes avoid per-spawn GPU resource leaks across long missions.
  const muzzleGeometry = new T.SphereGeometry(0.8, 8, 6);
  const muzzleMaterial = new T.MeshBasicMaterial({ color: '#ff695c', toneMapped: false });
  const laserGeo = new T.CylinderGeometry(0.1, 0.16, 3.8, 6),
    orbGeo = new T.SphereGeometry(0.35, 8, 6),
    particleGeo = new T.IcosahedronGeometry(0.3, 0);
  const particlePool = createParticlePool({ scene, sparkGeometry: particleGeo, createHalo: halo });
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
    rollHeld = false,
    rollAngle = 0,
    dashRemaining = 0,
    dashCooldown = 0,
    dashSide = 1,
    boosting = false,
    boostNeedsRelease = false,
    orbitalAlertElapsed = 0,
    bossHp = 200,
    bossCd = 0,
    msgTime = 0,
    muted = false,
    visualTime = 0,
    shake = 0,
    lastStage = -1;
  let scatterOwned = false;
  let fireMode = 'pulse';
  let sectorIndex = 0,
    lives = 3,
    credits = 0,
    weapon = 0,
    volley = 0,
    rapid = 0,
    armor = 0,
    podCount = 0,
    blueRings = 0,
    charge = 0,
    chargeLatch = false,
    podsDetached = false,
    podCd = 0,
    subDone = false,
    subbossClearedAt = null,
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
    cinematicStage = null,
    bossVolley = 0,
    bossCombat = null,
    collapse = null,
    collapseTime = 0,
    collapseBurst = 0,
    collapseFinal = false,
    devastadorEscapeBoostSeconds = 0,
    devastadorEscapeBeat = -1,
    devastadorEscapeAssisted = false,
    devastadorEscapeWarp = false,
    pausedFrom = 'playing',
    ringWave = 0,
    stageIntroTime = 0,
    marsArrivalPhase = 'space',
    marsStormPhase = 'clear',
    marsCleanse = 0,
    marsPendingRoll = false,
    marsStormDamageCooldown = 0,
    warpDeparture = false,
    sectorStart = null,
    confirmation = null,
    settingsOpen = false,
    bossWarned = false,
    bossWarningTime = 0;
  let stageScoreStart = 0,
    stageResultSent = false,
    stagePerformance = null;
  let strategy = readStrategy(null),
    arcana = 100,
    specialCd = 0,
    barrier = 0,
    stasis = 0,
    berserk = 0,
    bossHitPulse = 0;
  let weakpointEvidence = [];
  let evolution = null,
    evolutionStage = -1,
    orbitAngle = 0,
    orbitTouch = 0;
  let tacticEnergy = 0,
    scanTime = 0,
    impactTime = 0,
    impactConfirmed = false,
    lastSpecialCycle = -1,
    lastRangedCycle = -1,
    bossIntentCycle = -1,
    fighterWaveSerial = 0,
    lastFighterWave = null,
    bossMeleeResolved = false,
    bossIntent = null,
    reactorGridSeconds = 0,
    reactorGridCompleted = false,
    reactorGridWave = 0,
    pickupFeedbackTime = 0;
  const tactics = () => bossTacticsAt(sectorIndex, bossCombat?.age ?? 0, bossCombat?.phase ?? 1);
  const relativeOrbit = () =>
    boss?.userData.sabotage
      ? orbitAngle
      : sectorIndex === 7 && dynamicFlight && boss
        ? -boss.rotation.y
        : orbitAngle - (dynamicFlight && boss ? tactics().heading : 0);
  const bossTargetOpen = (index) =>
    boss?.userData.sabotage
      ? sabotageTargetOpen(boss.userData.parts, index, relativeOrbit())
      : bossWeakPointOpen(sectorIndex, relativeOrbit(), index);
  const bossCoreOpen = () =>
    boss?.userData.sabotage
      ? sabotagedSystem(boss.userData.parts).system === 'core'
      : (bossCombat?.coreOpen ?? false);
  const stage = () => (dynamicFlight ? stageAt(strategy.xp) : 0);
  const rank = (branch) =>
    dynamicFlight ? specialtyRank(strategy.xp, strategy.specialty, branch) : 0;
  const weaponPower = () =>
    dynamicFlight
      ? selectedWeapon().damage *
        (1 + rank('attack') * 0.12) *
        (strategy.specialty === 'attack' ? 1.15 : 1) *
        activePilot().bonuses.damage *
        dockedPodPower(podCount, stage(), podsDetached) *
        (1 + activeShip().stats.attack * 0.06) *
        (berserk > 0 ? 1.6 : 1)
      : 1;
  const selectedWeapon = () => ARSENAL[dynamicFlight ? strategy.arsenal : 0];
  function evolve() {
    if (!dynamicFlight || evolutionStage === stage()) return;
    evolutionStage = stage();
    if (evolution) player.remove(evolution);
    evolution = createEvolution(evolutionStage);
    player.add(evolution);
    evolution.visible = !robotMode;
    setFighterEvolution(shipModule, evolutionStage);
    player.scale.setScalar(heroVisualScale(evolutionStage));
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
  function castSquadSpecial(kind) {
    if (!dynamicFlight || state !== 'playing' || !squad) return false;
    const spent = squad.activate(kind, arcana);
    if (!spent) return false;
    if (stagePerformance) {
      stagePerformance.squadSpecialUsed = true;
      if (boss) stagePerformance.primaryOnly = false;
    }
    arcana -= spent;
    return true;
  }
  function castSpecial() {
    if (!dynamicFlight || state !== 'playing' || specialCd > 0) return false;
    const spell = SPECIALS[strategy.special];
    if (arcana < spell.cost) {
      message('ENERGIA ARCANA INSUFICIENTE');
      return false;
    }
    arcana -= spell.cost;
    if (boss && stagePerformance) stagePerformance.primaryOnly = false;
    specialCd = dynamicFlight ? Math.max(9, spell.cooldown / (1 + rank('spirit') * 0.025)) : 8;
    if (strategy.special === 0) barrier = spell.duration + rank('defense') * 0.1;
    if (strategy.special === 2) stasis = spell.duration;
    if (strategy.special === 3) {
      berserk = spell.duration;
      message('BERSERK ATIVO · POTÊNCIA +60% · CADÊNCIA +25%');
    }
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
  function activateQaBerserk() {
    // Repeatable QA action: genuine Berserk spell, isolated from campaign saves,
    // with a longer inspection window and no twenty-six-second cooldown.
    if (!developerAvailable || !developerSession || state !== 'playing' || !dynamicFlight)
      return false;
    const before = stage();
    strategy.xp = Math.max(strategy.xp, xpForStage(12));
    strategy.special = 3;
    if (stage() !== before) evolve();
    arcana = 100;
    specialCd = 0;
    if (!castSpecial()) return false;
    berserk = 20;
    $('qaBerserkAction').textContent = 'REPETIR BERSERK';
    $('qaBerserkStatus').textContent = 'ATIVO · 20s · POTÊNCIA +60%';
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
    if (boss && stagePerformance) stagePerformance.primaryOnly = false;
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
  // The previous y=46 ceiling sat BELOW visible viaducts. The camera follows
  // all altitudes, and only actual geometry should block the pilot's climb.
  const verticalFlightLimit = () => (dynamicFlight ? (sectorIndex === 0 ? 184 : 96) : 23);
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    /* Storage is optional. */
  }
  let cosmetics = readCosmetics(null);
  let petCare = readPetCare(null);
  let settings = loadSettings(storage);
  const adaptiveGraphics = createAdaptiveGraphics({
    mode: settings.graphics,
    coarsePointer: coarsePointer.matches,
    deviceMemory: window.navigator?.deviceMemory ?? null,
    hardwareConcurrency: window.navigator?.hardwareConcurrency ?? null,
  });
  let activeGraphicsSetting = settings.graphics;
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
    robot.userData.mechPaint.primary.color.set(palette.color);
    robot.userData.mechPaint.accent.color.set(palette.accent);
    $('robotTouch').style.setProperty?.('--mech-accent', palette.accent);
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
    shipModule.scale.setScalar(1.02);
    shipModule.visible = !robotMode;
    asteroidShipHull = measurePilotHull(player, robot);
    setFighterEvolution(shipModule, Math.max(0, evolutionStage));
    robot.userData.mecha.baseScale =
      pilotLoadout.ship === 'aegis' ? 0.94 : pilotLoadout.ship === 'specter' ? 0.85 : 0.91;
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
    $('pilotHudAvatar').style.setProperty?.('--pilot', pilot.color);
    $('pilotHudAvatar').setAttribute?.('data-pilot', pilot.id);
    $('pilotHudAvatar').setAttribute?.('aria-label', pilot.name + ', piloto em missão');
    $('pilotHudName').textContent = pilot.name;
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
    $('shipStats').textContent =
      'ATAQUE ' +
      (ship.stats.attack > 0 ? '+' : '') +
      ship.stats.attack +
      ' · DEFESA ' +
      (ship.stats.defense > 0 ? '+' : '') +
      ship.stats.defense +
      ' · AGILIDADE ' +
      (ship.stats.agility > 0 ? '+' : '') +
      ship.stats.agility;
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
    selectedMissionLoadout = { ...pilotLoadout };
    renderPilotSelection();
    return true;
  }
  function selectShip(id) {
    if (!dynamicFlight || state !== 'menu' || !SHIP_MODELS.some((p) => p.id === id)) return false;
    pilotLoadout.ship = id;
    selectedMissionLoadout = { ...pilotLoadout };
    applyShipModel();
    renderPilotSelection();
    return true;
  }
  function selectShipColor(id) {
    if (!dynamicFlight || state !== 'menu' || !SHIP_COLORS.some((entry) => entry.id === id))
      return false;
    pilotLoadout.color = id;
    selectedMissionLoadout = { ...pilotLoadout };
    applySkin();
    renderPilotSelection();
    return true;
  }
  function adoptRelayPilot(nextLoadout, restoreHull = false) {
    const ratio = maxHp() > 0 ? hp / maxHp() : 1;
    pilotLoadout = { ...nextLoadout };
    robotMode = false;
    robotTransition = 0;
    robotCooldown = 0;
    resetMechaLock();
    dashRemaining = dashCooldown = 0;
    roll = rollAngle = 0;
    rollHeld = false;
    robot.visible = false;
    for (const part of shipParts) part.visible = true;
    $('robotTouch').ariaPressed = 'false';
    $('robotTouch').textContent = 'ROBÔ';
    $('lockTouch').hidden = true;
    syncDodgeControl();
    applyShipModel();
    renderPilotSelection();
    cockpit?.setPilot(activePilot().id);
    hp = restoreHull ? maxHp() : Math.max(1, Math.min(maxHp(), Math.round(ratio * maxHp())));
    $('criticalWarning').hidden = hp > maxHp() * 0.25;
    $('pilotName').textContent = activePilot().name + ' / ' + lives + ' NAVES';
  }
  function switchPilot() {
    if (!dynamicFlight || state !== 'playing' || hp <= 0 || squad?.snapshot().intro > 0)
      return false;
    const handoff = pilotRelay.switchPilot();
    if (!handoff) return false;
    adoptRelayPilot(handoff.next);
    invuln = Math.max(invuln, 0.8);
    cue('boostIgnition');
    message(
      'TROCA DE COMANDO · ' + activePilot().name + ' / ' + activeShip().name,
      activePilot().id,
    );
    return true;
  }
  $('pilotSwitch').onclick = () => switchPilot();
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
  // The extended BOOST-gated launch is a web P0; keep the existing native campaign pacing.
  const nativeLaunchSector = { ...SECTORS[0], duration: 65 };
  const current = () =>
    nativeLifecycle && sectorIndex === 0 ? nativeLaunchSector : SECTORS[sectorIndex];
  function saveCheckpoint(next = sectorIndex) {
    if (developerSession) return; // QA flights never overwrite campaign checkpoints.
    writeSave(storage, {
      sector: next,
      credits,
      weapon,
      volley,
      rapid,
      ...(dynamicFlight ? { scatterOwned, fireMode } : {}),
      bombs: next > sectorIndex ? Math.min(dynamicFlight ? 8 : 5, bombs + 1) : bombs,
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
      message('ESCUDO +25', 'bob');
    }
    credits += 15;
    if (!dynamicFlight) sound(1400, 0.25, 'sine');
  }
  function recordStageResult(outcome = 'cleared') {
    if (!dynamicFlight || developerSession || stageResultSent) return;
    stageResultSent = true;
    try {
      Promise.resolve(
        onStageFinished({
          sector: sectorIndex + 1,
          points: Math.max(0, score - stageScoreStart),
          durationMs: Math.max(0, Math.round(elapsed * 1000)),
          totalPoints: score,
          outcome,
          difficulty: settings.difficulty,
          pilot: activePilot().id,
          bossDefeated: stagePerformance?.bossDefeated === true,
          primaryOnly: stagePerformance?.primaryOnly === true,
          mechaFinisher: stagePerformance?.mechaFinisher === true,
          damageTaken: stagePerformance?.damageTaken !== false,
          bombsUsed: stagePerformance?.bombsUsed !== false,
          kills: stagePerformance?.kills ?? 0,
          rings: stagePerformance?.rings ?? 0,
          squadSpecialUsed: stagePerformance?.squadSpecialUsed === true,
        }),
      ).catch(() => {});
    } catch {
      // Optional ranking must never interrupt a finished mission.
    }
  }
  // A completed mission is a distinct UI state. Inert blocks stray touch and
  // keyboard focus in browsers that retain controls underneath the shop panel.
  // CSS provides the visual fallback and always keeps the hangar in front.
  function setIntermissionUI(active) {
    document.body.classList[active ? 'add' : 'remove']('intermission-active');
    for (const id of [
      'hud',
      'hudNotices',
      'touch',
      'bottom',
      'loadout',
      'sectorTag',
      'bossHUD',
      'subHUD',
      'petCareHud',
      'orbitControls',
      'strategyControls',
      'cameraView',
      'aimReticle',
      'mechaLockReticle',
    ]) {
      const node = document.getElementById(id);
      if (node) node.inert = active;
    }
    if (active)
      document.body.classList.remove('in-mission', 'stage-intro', 'boosting', 'reflex-boost');
  }
  function showShop() {
    recordStageResult('cleared');
    setIntermissionUI(true);
    document.body.classList.add('ranking-intermission');
    state = 'shop';
    releaseControls();
    mechaEngine?.silence();
    resetMechaLock();
    keys.clear();
    touchFire = touchBoost = false;
    charge = 0;
    music?.start(sectorIndex, 'victory');
    $('bossHUD').hidden = true;
    $('shop').hidden = false;
    $('shopTitle').textContent = 'SETOR ' + String(sectorIndex + 1).padStart(2, '0') + ' LIBERTADO';
    $('shopNext').textContent = 'PRÓXIMO: ' + SECTORS[sectorIndex + 1].name;
    $('campaignMap').hidden = true;
    renderShop();
    saveCheckpoint(sectorIndex + 1);
  }
  function shopLevel(k) {
    return { weapon, volley, rapid, scatter: Number(scatterOwned), armor, pods: podCount }[k] ?? 0;
  }
  function shopFull(k) {
    if (k === 'repair') return hp >= maxHp();
    if (k === 'bomb') return bombs >= (dynamicFlight ? 8 : 5);
    if (k === 'bombPack') return bombs > 5;
    return shopLevel(k) >= SHOP[k].max;
  }
  function renderShop() {
    $('shopCredits').textContent = credits + ' CR · ' + score + ' ACERTOS · ' + bombs + ' BOMBAS';
    renderSkins();
    for (const k of Object.keys(SHOP)) {
      const level = shopLevel(k);
      const full = shopFull(k);
      $('buy' + k).hidden =
        !dynamicFlight && ['volley', 'rapid', 'bombPack', 'scatter'].includes(k);
      const price = shopPrice(k, level);
      const status = full ? (k === 'bombPack' ? 'PRECISA DE 3 VAGAS' : 'MÁXIMO') : price + ' CR';
      $('buy' + k).textContent = SHOP[k].label + ' · ' + status;
      $('buy' + k).disabled = full || credits < price;
    }
    $('scatterLoadout').hidden = !dynamicFlight;
    $('equipScatter').hidden = !dynamicFlight;
    $('equipScatter').disabled = !scatterOwned || !dynamicFlight;
    $('equipScatter').textContent = fireMode === 'scatter' ? 'EQUIPAR PULSO' : 'EQUIPAR DISPERSÃO';
    $('scatterInfo').textContent =
      fireMode === 'scatter'
        ? 'DISPARO EQUIPADO: DISPERSÃO · CURTO ALCANCE'
        : 'DISPARO EQUIPADO: PULSO · ALCANCE LONGO';
    $('scatterInfo').hidden = !dynamicFlight;
  }
  function equipScatter() {
    if (state !== 'shop' || !dynamicFlight || !scatterOwned) return false;
    fireMode = fireMode === 'scatter' ? 'pulse' : 'scatter';
    renderShop();
    saveCheckpoint(sectorIndex + 1);
    return true;
  }
  function buy(k) {
    if (state !== 'shop' || !SHOP[k]) return false;
    if (!dynamicFlight && ['volley', 'rapid', 'bombPack', 'scatter'].includes(k)) return false;
    const price = shopPrice(k, shopLevel(k));
    if (credits < price || shopFull(k)) return false;
    credits -= price;
    if (k === 'weapon') weapon++;
    if (k === 'volley') volley++;
    if (k === 'rapid') rapid++;
    if (k === 'scatter') scatterOwned = true;
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
    if (k === 'bombPack') bombs = Math.min(8, bombs + 3);
    renderShop();
    saveCheckpoint(sectorIndex + 1);
    return true;
  }
  function showCampaignMap() {
    if (state !== 'shop' || !appActive) return;
    state = 'map';
    $('shop').hidden = true;
    drawCampaignMap(document, SECTORS, sectorIndex + 1);
    $('campaignMap').hidden = false;
  }
  function backToShop() {
    if (state !== 'map') return;
    state = 'shop';
    $('campaignMap').hidden = true;
    $('shop').hidden = false;
    renderShop();
  }
  function nextSector() {
    if (!['shop', 'map'].includes(state) || !appActive) return;
    $('campaignMap').hidden = true;
    resumeAudio();
    sectorIndex++;
    enterSector();
    saveCheckpoint();
  }
  function enterSector(resupply = true) {
    // Repair previously disabled crafts between stages without replenishing lives.
    if (dynamicFlight) pilotRelay.reset(pilotLoadout);
    pendingPilotRelay = null;
    if (damagedCraft) damagedCraft.visible = false;
    setIntermissionUI(false);
    document.body.classList.remove('ranking-intermission');
    orbitalLaunchSequence.reset();
    orbitalAlertElapsed = 0;
    reflexBoost.reset();
    heroEffects.reset();
    $('launchBoostNotice').hidden = true;
    document.body.classList.remove('orbital-super-boost');
    document.body.classList.remove('devastador-escape');
    document.body.classList.remove('devastador-warp');
    devastadorEscapeBoostSeconds = 0;
    devastadorEscapeBeat = -1;
    devastadorEscapeAssisted = false;
    devastadorEscapeWarp = false;
    $('boostTouch').classList.remove('launch-required');
    $('boostTouch').textContent = 'BOOST';
    $('boostTouch').setAttribute('aria-label', 'Ativar boost da nave');
    arcade = null;
    arcadeDone = false;
    $('arcadePanel').hidden = true;
    route = routeAt(sectorIndex, 0, current().duration);
    resetMechPower(robot);
    resetMechaPose(robot);
    dashRemaining = dashCooldown = 0;
    robotFireKick = 0;
    robotPrecisionKick = 0;
    robotMode = false;
    shipModule.visible = true;
    if (evolution) evolution.visible = true;
    robotCooldown = 0;
    robotTransition = 0;
    precisionCd = 0;
    mechaEngine?.silence();
    resetMechaLock();
    $('lockTouch').hidden = true;
    $('robotTouch').ariaPressed = 'false';
    $('robotTouch').textContent = 'ROBÔ';
    $('rollTouch').textContent = 'GIRO';
    dashCooldown = dashRemaining = 0;
    dashTrail.reset();
    robot.visible = false;
    for (const part of shipParts) part.visible = true;
    routeRenderer?.update(route);
    clearWorld();
    world.reset();
    world.setSector(current(), sectorIndex);
    journey = initialJourney(sectorIndex);
    marsArrivalPhase = 'space';
    marsStormPhase = 'clear';
    marsCleanse = 0;
    marsPendingRoll = false;
    setMarsDustCoating(marsDust);
    updateWarpStreaks(warpStreaks, false, 0, player.position);
    marsBossAltitude = null;
    marsStormDamageCooldown = 0;
    warpDeparture = false;
    asteroidInterior?.reset(sectorIndex === 2);
    marvinRival?.reset();
    asteroidWallCooldown = 0;
    squad?.begin(sectorIndex === 0 && enableSquadIntro && !skipSquadIntro);
    skipSquadIntro = false;
    lastStage = -1;
    elapsed = 0;
    cityDestructionTriggered = new Set();
    cityOrbitReadyAt = null;
    world.setCityDestruction?.(0);
    spawnCd = 2;
    fighterSerial = 0;
    fighterWaveSerial = 0;
    lastFighterWave = null;
    ringCd = 4;
    ringWave = 0;
    bossCombat = null;
    bossWarned = false;
    bossWarningTime = 0;
    $('bossIncoming').hidden = true;
    orbitAngle = orbitTouch = 0;
    arcana = 100;
    tacticEnergy = scanTime = impactTime = 0;
    impactConfirmed = false;
    lastSpecialCycle = -1;
    lastRangedCycle = bossIntentCycle = -1;
    bossMeleeResolved = false;
    bossIntent = null;
    renderBossRadar(document, null);
    reactorGridSeconds = 0;
    reactorGridCompleted = false;
    reactorGridWave = 0;
    specialCd = barrier = stasis = berserk = bossHitPulse = 0;
    weakpointEvidence = [];
    podsDetached = false;
    podMode = 'docked';
    podBlocks = 0;
    podCd = 0;
    obstacleCd = 9;
    subDone = rivalDone = false;
    subbossClearedAt = null;
    baseDone = sectorIndex === 1;
    // The first ground patrol enters before the suspended-train warning.
    groundCd = dynamicFlight && sectorIndex === 0 ? 3.6 : 5;
    groundWave = 0;
    tunnelDone = sectorIndex === 1;
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
    if (resupply) bombs = Math.min(dynamicFlight ? 8 : 5, bombs + 1);
    releaseControls();
    touchFire = touchBoost = false;
    roll = 0;
    rollHeld = false;
    dashRemaining = dashCooldown = 0;
    rollAngle = 0;
    dashRemaining = dashCooldown = 0;
    cityImpactCount = 0;
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    flightCamera.setMode(cameraMode);
    flightCamera.reset(player.position);
    prepareUpcomingBoss();
    state = 'playing';
    $('shop').hidden = true;
    $('campaignMap').hidden = true;
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
    document.body.classList[current().theme === 'city' ? 'add' : 'remove']('city-bright');
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
    // Show the correct destination even in the very first rendered frame;
    // never briefly flash an unrelated route label in QA screenshots.
    if (dynamicFlight && sectorIndex >= 3) {
      const firstArrival = world.setDestinationArrival(0);
      if (firstArrival) route.label = firstArrival.label;
    }
    $('routeLabel').textContent = route.label;
    $('weaponLabel').textContent = WEAPONS[weapon] + ' · ' + credits + ' CR · PODS ' + podCount;
    syncPods();
    sectorStart = {
      sector: sectorIndex,
      credits,
      weapon,
      volley,
      rapid,
      ...(dynamicFlight ? { scatterOwned, fireMode } : {}),
      bombs,
      armor,
      pods: podCount,
      score,
      cosmetics: { skin: cosmetics.skin, owned: [...cosmetics.owned] },
      loadout: { ...pilotLoadout },
      strategy: { ...strategy },
      petCare: { ...petCare },
    };
    stageScoreStart = score;
    stageResultSent = false;
    stagePerformance = {
      damageTaken: false,
      bombsUsed: false,
      kills: 0,
      rings: 0,
      bossDefeated: false,
      primaryOnly: true,
      mechaFinisher: false,
      squadSpecialUsed: false,
    };
    if (dynamicFlight && !developerSession) {
      try {
        Promise.resolve(onStageStarted({ sector: sectorIndex + 1 })).catch(() => {});
      } catch {
        // Offline progression always continues if the ranking API is unavailable.
      }
    }
    music?.start(sectorIndex);
    message((dynamicFlight ? activePilot().name : PILOTS[3 - lives]) + ' / ' + current().brief);
  }
  const keys = new Set(),
    stick = { x: 0, y: 0 };
  let touchFire = false,
    touchBoost = false,
    audioCtx,
    appActive = true;
  function unlockAudio() {
    try {
      // On iOS WebKit, media playback must use the playback session so that
      // explicit game audio is audible through the built-in speaker in Silent mode.
      configurePlaybackAudioSession(window.navigator);
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      void audioCtx.resume?.().catch?.(() => {});
      if (!music) music = createMusic(audioCtx);
      if (!audioCues) audioCues = createAudioCues(audioCtx);
      music.setEnabled(musicOn);
      music.setVolume(settings.master * settings.music);
      audioCues.setVolume(settings.master * settings.sfx);
      audioCues.setEnabled(!muted);
      return true;
    } catch {
      return false;
    }
  }
  function cue(name) {
    audioCues?.play(name, { enabled: !muted, active: appActive });
  }
  function resumeAudio() {
    if (appActive) {
      // WebKit can reset its audio route after an app or tab interruption.
      configurePlaybackAudioSession(window.navigator);
      audioCtx?.resume().catch(() => {});
    }
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
  function message(t, speakerId = 'bia') {
    renderRadioSpeaker(document, speakerId);
    $('message').textContent = t;
    $('comms').classList.add('active');
    msgTime = 3;
  }
  function dispose(o) {
    scene.remove(o);
  }
  function explode(pos, n = 16, color = 0xffa04a, playGenericSound = true) {
    if (playGenericSound && n >= 12 && dynamicFlight) cue('explosion');
    else if (playGenericSound && n > 3) sound(100, 0.2, 'sine', 0.025);
    for (let i = 0; i < n; i++)
      particles.push(
        particlePool.spark(pos, color, rnd(-17, 17), rnd(-17, 17), rnd(-17, 17), rnd(0.3, 0.85)),
      );
    if (n > 5) {
      particles.push(particlePool.flash(pos, color, 9, 0.85, 0.45));
      particles.push(particlePool.wave(pos, color, 0.6));
    }
  }
  function hit(d) {
    if (dynamicFlight && barrier > 0) return;
    if (
      state !== 'playing' ||
      !Number.isFinite(d) ||
      d <= 0 ||
      invuln > 0 ||
      roll > 0 ||
      (robotMode && dashRemaining > MECHA_DASH.duration - MECHA_DASH.protection)
    )
      return;
    const receivedDamage = d * (dynamicFlight ? difficultyProfile(settings.difficulty).damage : 1);
    hp = Math.max(0, hp - receivedDamage);
    if (stagePerformance && receivedDamage > 0) stagePerformance.damageTaken = true;
    if (settings.vibration) window.navigator?.vibrate?.(45);
    if (dynamicFlight && hp > 0 && hp / maxHp() <= 0.25) {
      $('criticalWarning').hidden = false;
      cue('critical');
    }
    shake = 0.35;
    invuln = 1.1;
    $('flash').style.opacity = '.3';
    setTimeout(() => ($('flash').style.opacity = '0'), 150);
    if (dynamicFlight) cue('shipImpact');
    else sound(60, 0.25);
    if (hp <= 0) {
      lives--;
      pendingPilotRelay = dynamicFlight && lives > 0 ? pilotRelay.retire() : null;
      if (lives <= 0 || (dynamicFlight && !pendingPilotRelay)) {
        message('NAVE AVARIADA · SEM RESERVAS DISPONÍVEIS');
        finish(false);
      } else {
        state = 'respawning';
        releaseControls();
        respawnTime = 1.5;
        if (damagedCraft) {
          damagedCraft.position.copy(player.position);
          damagedCraft.rotation.copy(player.rotation);
          // A broken craft retains the actual pilot's selected livery.
          const livePaint = player.userData.paint ?? [];
          damagedCraft.userData.paint?.forEach((material, i) => {
            if (livePaint[i]) material.color.copy(livePaint[i].color);
          });
          damagedCraft.visible = true;
        }
        explode(player.position, 12, 0xffb16d, false);
        player.visible = false;
        keys.clear();
        touchFire = touchBoost = false;
        charge = 0;
        music?.pause();
        message(
          'NAVE AVARIADA · ' +
            (pendingPilotRelay ? pilotAt(pendingPilotRelay.next.pilot).name : PILOTS[3 - lives]) +
            ' VAI ASSUMIR',
        );
      }
    }
  }
  function kill(e) {
    if (e.dead) return;
    explode(e.o.position, e.kind === 'subboss' ? 48 : 16);
    if (e.kind === 'subboss') {
      subbossClearedAt = elapsed;
      $('subHUD').hidden = true;
      music?.start(sectorIndex);
      message('CRUZADOR DESTRUÍDO / ROTA LIBERADA');
    }
    score += e.elite ? 15 : 1;
    if (stagePerformance) stagePerformance.kills++;
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
  function doRoll(key = '') {
    if (state !== 'playing') return;
    if (robotMode) {
      if (dashCooldown > 0) return;
      const steer =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        stick.x;
      // Q/E select explicit sides when steering is neutral; touch/Z repeat
      // the previously chosen side. Live stick or held movement always wins.
      const direction =
        dashDirection(steer) || (key === 'KeyQ' ? -1 : key === 'KeyE' ? 1 : dashSide);
      if (Math.abs(player.position.x - direction * flightLimit()) < 0.1) return;
      if (energy < MECHA_DASH.energyCost) {
        message('DASH INDISPONÍVEL · ENERGIA INSUFICIENTE');
        return;
      }
      dashSide = direction;
      dashRemaining = MECHA_DASH.duration;
      dashCooldown = MECHA_DASH.cooldown;
      energy = Math.max(0, energy - MECHA_DASH.energyCost);
      cue('boostIgnition');
      return;
    }
    if (rollCd > 0) return;
    roll = 0.65;
    rollAngle = 0;
    rollCd = marsCleanse > 0 ? 0.72 : 1.6;
    // Only a completed ship barrel roll removes Mars dust; a robot dash does not.
    marsPendingRoll = marsCleanse > 0;
    sound(230, 0.25, 'sine');
    return true;
  }
  function bomb() {
    if (state !== 'playing' || bombs <= 0) return;
    bombs--;
    // HUD acknowledgement must not wait for the next expensive WebGL frame.
    // Under mobile GPU pressure, gameplay input may be received seconds before
    // the render loop next paints, so reflect the actual consumable immediately.
    $('bombs').textContent = '◆ '.repeat(bombs) || '—';
    $('bombTouch').setAttribute?.('data-count', bombs);
    if (stagePerformance) {
      stagePerformance.bombsUsed = true;
      if (boss) stagePerformance.primaryOnly = false;
    }
    const bombPower = dynamicFlight ? activePilot().bonuses.bomb : 1;
    for (let e of enemies)
      if (!e.dead) {
        if (e.kind === 'subboss') {
          damageEnemy(e, 90 * bombPower, 'kinetic');
          explode(e.o.position, 20);
          if (e.life <= 0) kill(e);
        } else kill(e);
      }
    for (let b of hostile) hostileShotPool.release(b);
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
  const bossShotMaterials = BOSS_WEAPON_COLORS.map((color) => glowMaterial(color, 3.8));
  const hostileShotPool = createHostileProjectilePool({
    scene,
    geometry: orbGeo,
    materials: { normal: enemyOrbMat, fire: shotMaterials[2], arcane: shotMaterials[3] },
    bossMaterials: bossShotMaterials,
    createHalo: () => halo(0xff4265, 2.6, 0.8),
    maxRetained: 96,
  });
  const upgradedShotMaterials = ['#52ecff', '#ffd15e', '#df85ff', '#f8ffff'].map((c) =>
    glowMaterial(c, 3.4),
  );
  const shotColor = () =>
    dynamicFlight ? evolvedShotColor(stage(), selectedWeapon().color) : WEAPON_COLORS[weapon];
  const shotMaterial = () =>
    stage() >= 16
      ? upgradedShotMaterials[3]
      : stage() >= 12
        ? upgradedShotMaterials[2]
        : stage() >= 8
          ? upgradedShotMaterials[1]
          : stage() >= 4
            ? upgradedShotMaterials[0]
            : shotMaterials[strategy.arsenal];
  const scatterShotMaterial = glowMaterial('#ffba70', 3);
  function impact(position, dealt = 1, { bossHit = false, weak = false, heavy = false } = {}) {
    if (!dynamicFlight) return;
    const feedback = combatFeedback(dealt, { boss: bossHit, weak });
    const confirmed = feedback.type !== 'blocked';
    const color = feedback.color;
    explode(position, heavy ? 7 : 3, confirmed ? (weak ? 0xffeb8a : 0xbaffee) : 0xffad55);
    if (heavy && confirmed) cue('mechaImpact');
    const flashSize = confirmed ? (weak ? 11 : 8) * (heavy ? 1.5 : 1) : 5;
    if (confirmed || impactTime <= 0 || !impactConfirmed) {
      impactTime = feedback.duration;
      impactConfirmed = confirmed;
      const element = $('hitFeedback');
      element.textContent = feedback.label;
      element.style.color = color;
      element.setAttribute?.('data-impact', feedback.type);
      // Keep impact labels outside the aiming corridor; the world-space spark marks the hit.
      element.style.left = '';
      element.style.top = '';
      if (weak) cue('weakPoint');
      else if (bossHit && !confirmed) cue('armorHit');
    }
    particles.push(particlePool.flash(position, color, flashSize, 0.95, 0.22, false));
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
  function launchShot(x, damage = 2, charged = false, origin = null, scatter = false) {
    const o = new T.Mesh(
      charged ? orbGeo : laserGeo,
      scatter ? scatterShotMaterial : dynamicFlight ? shotMaterial() : green,
    );
    o.add(
      halo(berserk > 0 ? '#ff913e' : scatter ? '#ffba70' : shotColor(), charged ? 6 : 1.8, 0.5),
    );
    o.rotation.x = Math.PI / 2;
    o.position.copy(origin ?? player.position);
    o.position.x += x;
    if (!origin) o.position.z -= 3;
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
    if (
      (state !== 'playing' && !(dynamicFlight && state === 'collapsing')) ||
      shotCd > 0 ||
      (state === 'playing' && marsCleanse > 0)
    )
      return;
    green.color.set(WEAPON_COLORS[weapon]).multiplyScalar(3);
    cockpit?.fire();
    heroEffects.pulse({ robot: robotMode, color: berserk > 0 ? '#ff913e' : shotColor() });
    if (robotMode) robotFireKick = 0.29;
    const scatter = dynamicFlight && scatterOwned && fireMode === 'scatter';
    const pellets = scatter ? scatterPellets() : null;
    const count = scatter ? pellets.length : projectileCount(weapon, volley, dynamicFlight);
    for (let i = 0; i < count; i++) {
      const power = mechaShotDamage(weaponPower(), { robot: robotMode });
      const rightHand = robotMode
        ? robot.userData.mecha.arms.right.muzzle.getWorldPosition(new T.Vector3())
        : null;
      launchShot((i - (count - 1) / 2) * 0.9, (2 + weapon) * power, false, rightHand, scatter);
      const b = shots.at(-1);
      if (dynamicFlight) {
        b.homing = !scatter && strategy.arsenal === 3;
        b.spread = scatter
          ? pellets[i].drift
          : strategy.arsenal === 2
            ? (i - (count - 1) / 2) * 7
            : 0;
        if (scatter) {
          b.scatter = true;
          b.travelled = 0;
          b.life = SCATTER_LIFETIME;
        }
        b.o.scale.setScalar(mechaShotScale(podsDetached ? 1 : 1 + podCount * 0.22, robotMode));
        if (robotMode) b.source = 'mecha-heavy';
      }
    }
    if (robotMode && dynamicFlight) {
      particles.push(
        particlePool.flash(
          robot.userData.mecha.arms.right.muzzle.getWorldPosition(new T.Vector3()),
          '#a8faff',
          3.8,
          0.7,
          0.14,
        ),
      );
    }
    if (dynamicFlight) cue(robotMode ? 'mechaShot' : 'shot');
    else sound(900 + weapon * 110);
    shotCd = dynamicFlight
      ? mechaShotCooldown(
          firingCooldown(selectedWeapon().cadence / (1 + Math.min(30, stage()) * 0.035), rapid) *
            (scatter ? SCATTER_CADENCE_FACTOR : 1),
          robotMode,
        ) * (berserk > 0 ? 0.8 : 1)
      : 0.135;
  }

  /** Right wrist maintains frontal pressure. Left wrist requires LOS lock for precision. */
  function updateMechaLock(dt, dx, dy) {
    let selected = null;
    if (lockEnabled) {
      if (boss) boss.updateMatrixWorld(true);
      const candidates = boss
        ? [
            ...boss.userData.parts.flatMap((part, i) =>
              part.hp > 0 && bossTargetOpen(i)
                ? [{ id: part, position: part.mesh.getWorldPosition(new T.Vector3()), weak: true }]
                : [],
            ),
            ...(bossCoreOpen() &&
            boss.userData.parts.every((part) => part.hp <= 0) &&
            weakPointOpen(relativeOrbit())
              ? [
                  {
                    id: boss.userData.core,
                    position: boss.userData.core.getWorldPosition(new T.Vector3()),
                    weak: true,
                  },
                ]
              : []),
          ]
        : enemies
            .filter((enemy) => !enemy.dead)
            .map((enemy) => ({
              id: enemy,
              position: enemy.o.position.clone().add(new T.Vector3(0, enemy.hitY, 0)),
              weak: enemy.kind === 'subboss',
            }));
      const visible = (from, to) =>
        !obstacles.some(({ o }) => projectileHitsApproachingObstacle(from, to, o, 0));
      selected = selectMechaTarget(player.position, candidates, { visible });
      if (lockHeld) {
        lockHoldSeconds += dt;
        const available = availableMechaTargets(player.position, candidates, { visible });
        lockQueue = collectMultiLocks(
          lockQueue,
          available,
          mechaMultiLockCapacity(stage()),
          1 + Math.floor(lockHoldSeconds / 0.16),
        );
        selected = lockQueue[0] ?? selected;
      }
    }
    if (selected?.id !== lockedId) {
      lockedId = selected?.id ?? null;
      lockProgress = 0;
    } else if (selected) lockProgress = Math.min(0.8, lockProgress + dt);
    const position = selected?.position ?? null;
    for (let i = 0; i < 12; i++) {
      const marker = $('mechaMultiTarget' + i);
      marker.hidden = true;
      if (!lockHeld || !lockQueue[i]) continue;
      const projected = lockQueue[i].position.clone().project(camera);
      if (
        projected.z < -1 ||
        projected.z > 1 ||
        Math.abs(projected.x) > 1 ||
        Math.abs(projected.y) > 1
      )
        continue;
      marker.hidden = false;
      marker.style.left = ((projected.x + 1) * window.innerWidth) / 2 + 'px';
      marker.style.top = ((1 - projected.y) * window.innerHeight) / 2 + 'px';
    }
    updateMechaPose(robot, {
      dt,
      time: visualTime,
      boosting,
      strafe: dx,
      vertical: dy,
      firing: touchFire || keys.has('Space'),
      targetWorld: position,
      transforming: robotTransition,
      recoil: robotFireKick,
      precisionRecoil: robotPrecisionKick,
      dashing: dashRemaining > 0,
      dashDirection: dashSide,
    });
    robotFireKick = Math.max(0, robotFireKick - dt * 2.8);
    robotPrecisionKick = Math.max(0, robotPrecisionKick - dt * 3.5);
    const status = $('mechaLockStatus');
    status.hidden = !lockEnabled;
    if (lockEnabled)
      status.textContent = lockHeld
        ? 'MULTI-LOCK · ' +
          lockQueue.length +
          '/' +
          mechaMultiLockCapacity(stage()) +
          ' · SOLTE PARA ATIRAR'
        : !selected
          ? 'MIRA · SEM ALVO'
          : lockProgress < 0.8
            ? 'MIRA · ' + Math.round((lockProgress / 0.8) * 100) + '%'
            : precisionCd > 0
              ? 'MIRA · RECARGA'
              : 'MIRA · FIXADA';
    const marker = $('mechaLockReticle');
    marker.hidden = true;
    if (position) {
      const projected = position.clone().project(camera);
      if (
        projected.z > -1 &&
        projected.z < 1 &&
        Math.abs(projected.x) <= 1 &&
        Math.abs(projected.y) <= 1
      ) {
        marker.hidden = false;
        marker.style.left = ((projected.x + 1) * window.innerWidth) / 2 + 'px';
        marker.style.top = ((1 - projected.y) * window.innerHeight) / 2 + 'px';
      }
    }
    const lasers = lockLaserCount(stage());
    const laserEnergy = 10 + (lasers - 1) * 2;
    if (!lockHeld && selected && lockProgress >= 0.8 && precisionCd <= 0 && energy >= laserEnergy) {
      robot.updateMatrixWorld(true);
      const muzzle = robot.userData.mecha.arms.left.muzzle.getWorldPosition(new T.Vector3());
      const totalDamage =
        mechaShotDamage(weaponPower(), { robot: true, kind: 'precision' }) *
        (1 + (lasers - 1) * 0.22);
      for (let i = 0; i < lasers; i++) {
        const origin = muzzle.clone().add(new T.Vector3((i - (lasers - 1) / 2) * 0.62, 0, 0));
        launchShot(0, totalDamage / lasers, false, origin);
        const shot = shots.at(-1);
        shot.source = 'mecha-precision';
        shot.o.scale.setScalar(2.1 + stage() * 0.045);
        shot.v = position
          .clone()
          .sub(origin)
          .normalize()
          .multiplyScalar(205 + stage() * 2);
        shot.homing = false; // Already physically aimed at the locked target.
      }
      energy -= laserEnergy;
      precisionCd = Math.max(1.25, 2 - stage() * 0.025);
      lockProgress = 0;
      heroEffects.pulse({ robot: true, precisionShot: true, color: shotColor() });
      cue('mechaPrecision');
    }
  }
  function enemy(kind = 'fighter', assignedSlot = null) {
    const airborneRobot = kind === 'hover-walker';
    const ground = kind === 'tank' || kind === 'walker' || airborneRobot;
    const roleIndex = assignedSlot?.role
      ? FIGHTER_ROLES.indexOf(assignedSlot.role)
      : (fighterSerial + sectorIndex) % 3;
    const tacticalFighter = dynamicFlight && kind === 'fighter';
    const subbossTactic = dynamicFlight && kind === 'subboss' ? subbossProfile(sectorIndex) : null;
    if (tacticalFighter) fighterSerial++;
    let o = ground
      ? createGroundEnemy(
          airborneRobot ? 'walker' : kind,
          dynamicFlight ? (groundWave + sectorIndex) % 3 : -1,
        )
      : kind === 'subboss'
        ? createSubboss(sectorIndex)
        : fighter(
            true,
            dynamicFlight
              ? tacticalFighter
                ? roleIndex
                : (Math.floor(elapsed / 3) + sectorIndex) % 3
              : -1,
          );
    if (kind === 'base') {
      o = new T.Group();
      o.add(box(8, 12, 9, buildingMat, 0, -4, 0));
      o.add(box(10, 3, 10, metal('#483346'), 0, 3, 0));
      o.add(new T.Mesh(new T.SphereGeometry(1.8, 12, 8), enemyOrbMat));
      o.userData.owned = true;
    }
    const elite = !ground && kind !== 'fighter';
    o.scale.setScalar(
      ground || kind === 'subboss' ? 1 : elite ? 1.6 : tacticalFighter ? 1.3 : 0.65,
    );
    o.rotation.y = ground || kind === 'subboss' ? 0 : Math.PI;
    const x =
        assignedSlot?.x ??
        (ground ? (groundWave % 2 ? -17 : 17) : kind === 'subboss' ? 0 : rnd(-24, 24)),
      y =
        assignedSlot?.y ??
        (airborneRobot
          ? rnd(9, 23)
          : ground
            ? -7
            : kind === 'subboss'
              ? 10
              : dynamicFlight && sectorIndex === 0
                ? rnd(12, 24)
                : rnd(1, 19));
    o.position.set(
      x,
      y,
      tacticalFighter ? arrivalFighterDepth(sectorIndex, assignedSlot?.arrivalIndex) : -200,
    );
    if (assignedSlot?.europaBreach)
      o.position.set(52, 20, assignedSlot.europaBreach.position.z - 220);
    // All enemy projectiles originate at visible physical sockets.
    // Walker and hover walker reuse their two articulated eye emitters.
    if (kind !== 'walker' && !airborneRobot) {
      const mount = ground ? (o.getObjectByName('turret') ?? o) : o;
      for (const side of [-1, 1]) {
        const muzzle = new T.Mesh(muzzleGeometry, muzzleMaterial);
        muzzle.name = side < 0 ? 'enemy-muzzle-left' : 'enemy-muzzle-right';
        muzzle.position.set(
          side * (ground ? 1.8 : 2.7),
          ground ? 0.2 : 0,
          ground ? 11.8 : kind === 'subboss' ? 13 : kind === 'base' ? 6 : -3.7,
        );
        mount.add(muzzle);
      }
    }
    if (kind === 'walker' || airborneRobot) o.userData.combatState = 'deploying';
    if (airborneRobot) {
      const thrusterMat = new T.MeshBasicMaterial({ color: '#64dfff' });
      for (const side of [-1, 1]) {
        const thruster = new T.Mesh(new T.ConeGeometry(0.85, 3.8, 10), thrusterMat);
        thruster.name = 'enemy-hover-thruster';
        thruster.rotation.x = Math.PI;
        thruster.position.set(side * 3.2, -6, 0.5);
        o.add(thruster);
      }
      o.userData.airborneRobot = true;
    }
    scene.add(o);
    const attackGlow = tacticalFighter
      ? halo(['#ff7c69', '#65e6ff', '#ffc45e'][roleIndex], 8, 0.85)
      : subbossTactic
        ? halo(subbossTactic.color, 12, 0.9)
        : null;
    if (attackGlow) {
      attackGlow.position.set(0, tacticalFighter ? 1 : 2, tacticalFighter ? -5 : 16);
      attackGlow.visible = false;
      o.add(attackGlow);
    }
    if (subbossTactic) {
      $('subHUD').style.color = subbossTactic.color;
      $('subHealth').style.background =
        'linear-gradient(90deg, ' + subbossTactic.color + ', #fff3c4)';
    }
    const phase = assignedSlot?.phase ?? rnd(0, 6);
    const initialCooldown = rnd(1, 3);
    enemies.push({
      o,
      role: tacticalFighter ? FIGHTER_ROLES[roleIndex] : null,
      arrivalIndex: assignedSlot?.arrivalIndex ?? 0,
      europaBreach: assignedSlot?.europaBreach ?? null,
      subbossTactic,
      attackGlow,
      x,
      y,
      phase,
      cd: tacticalFighter ? 1.2 : subbossTactic ? 1.6 : initialCooldown,
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
      airborneRobot,
      hitY: airborneRobot ? 0 : kind === 'walker' ? 18 : kind === 'tank' ? 5 : 0,
      half: new T.Vector3(
        ground
          ? kind === 'walker'
            ? 10
            : 6
          : kind === 'subboss'
            ? 16
            : tacticalFighter
              ? 5.5
              : 3.4,
        ground ? (kind === 'walker' ? 10 : 3) : kind === 'subboss' ? 5 : tacticalFighter ? 2.6 : 2,
        ground ? 8 : tacticalFighter ? 4.5 : 3,
      ),
      dead: false,
      elite,
      kind,
    });
  }
  function bossMuzzle(side = 0) {
    if (!boss) return null;
    boss.updateMatrixWorld(true);
    const muzzle = boss.getObjectByName(sourceHardpointName(side));
    if (!muzzle) return null;
    flashBossWeapon(boss, side);
    return muzzle.getWorldPosition(new T.Vector3());
  }
  function hostileMuzzles(e) {
    e.o.updateMatrixWorld(true);
    if (e.kind === 'walker' || e.airborneRobot) return robotEyeMuzzles(e.o);
    return ['enemy-muzzle-left', 'enemy-muzzle-right']
      .map((name) => e.o.getObjectByName(name)?.getWorldPosition(new T.Vector3()))
      .filter(Boolean);
  }
  function bullet(pos, target, spell = '', bossIndex = -1) {
    if (hostile.length >= 180 || !pos) return;
    hostile.push(hostileShotPool.acquire(pos, target, spell, bossIndex));
  }
  function prepareUpcomingBoss() {
    if (!dynamicFlight) return;
    if (!mechaWarmupScheduled) {
      mechaWarmupScheduled = true;
      // The entire articulated robot starts hidden; precompile its future
      // plasma/glow/armor materials before the first transformation.
      void prewarmSceneShaders(renderer, robot, camera, scene);
    }
    // The stage/briefing is still loading. Never build a multi-hundred-mesh
    // procedural model on the frame that starts the boss encounter.
    const generation = ++prepareGeneration;
    preparedBoss = createBossModel(current(), sectorIndex, true);
    if (sectorIndex === 1) marsBossAltitude = marsBossAltitudeConstraint(preparedBoss);
    bossShadersWarm = false;
    // Precompile future-visible terrain, orbital sky, core and both markers
    // while they are offscreen. Shader warmup is asynchronous when supported;
    // there is deliberately no blocking synchronous compile fallback.
    void prewarmSceneShaders(renderer, world.transitionShaderRoot?.(), camera, scene).then(() => {
      if (!running || generation !== prepareGeneration || !preparedBoss) return;
      const model = preparedBoss;
      return prewarmSceneShaders(renderer, model, camera, scene).then((ready) => {
        if (running && generation === prepareGeneration) bossShadersWarm = ready;
      });
    });
  }
  function makeBoss() {
    if (dynamicFlight && sectorIndex === 2) {
      journey = advanceJourney(journey, 'arenaReached');
      asteroidInterior.setPhase(journey.phase);
    }
    bossWarningTime = 0;
    $('bossIncoming').hidden = true;
    bossCombat = createBossCombat(sectorIndex, dynamicFlight ? 1 : 0.3);
    orbitAngle = 0;
    $('strategyDrawer').open = false;
    scanTime = 0;
    lastSpecialCycle = -1;
    lastRangedCycle = bossIntentCycle = -1;
    bossMeleeResolved = false;
    bossIntent = null;
    reactorGridSeconds = 0;
    bossHp = bossCombat.max;
    // Preserve the already warmed GPU model; rebuilding on boss arrival
    // causes stutter and defeats the stage-loading shader prewarm.
    const bossUsesSabotageCore = dynamicFlight && sectorIndex === 3;
    if (bossUsesSabotageCore && preparedBoss) disposeBoss(preparedBoss);
    boss = bossUsesSabotageCore
      ? createDevastadorSabotageCore()
      : (preparedBoss ?? createBossModel(current(), sectorIndex, dynamicFlight));
    preparedBoss = null;
    weakpointEvidence = newWeakpointEvidence(boss.userData.parts);
    bossHitPulse = 0;
    for (const e of enemies) dispose(e.o);
    enemies = [];
    for (const e of hostile) hostileShotPool.release(e);
    hostile = [];
    // Enter through the illuminated hangar of the mother ship in the distance.
    // No instant pop-in to the combat position.
    boss.position.set(0, dynamicFlight ? 57 : 10, dynamicFlight ? -680 : -230);
    if (dynamicFlight && sectorIndex === 5) {
      // Lower the *arena floor* into a glacial basin rather than moving the
      // enormous Colossus above the camera/reticle. Keep the 18-unit buffer
      // under its full 3D silhouette during bank and attack animations.
      boss.userData.europaArenaFloorY = europaBossFloorY(boss);
      boss.userData.europaMinimumCenterY = europaBossMinimumCenterHeight(
        boss,
        boss.userData.europaArenaFloorY,
      );
      boss.position.y = europaBossArenaHeight(boss.position.y, boss.userData.europaMinimumCenterY);
    }
    if (dynamicFlight) {
      world.showCarrierForBoss?.();
      // Only Europa opens a ground-based grand arena. Its forward crystals
      // and generic carrier must leave the boss firing/camera corridor.
      world.setEuropaBossArena?.(sectorIndex === 5, boss.userData.europaArenaFloorY);
      // The narrow corridor section ends at the monumental reactor hall:
      // keeping both active would put walls through the 360-degree orbit.
      world.setReactorGrandHall?.(boss.userData.sabotage === true);
      for (const o of obstacles) dispose(o.o);
      obstacles = [];
      message(
        sectorIndex === 3
          ? 'DEVASTADOR · SABOTAGEM · DESTRUA CIRCUITOS, REFRIGERAÇÃO E MOTORES'
          : 'ARENA · J/L OU ↶/↷ PARA ORBITAR · GERADORES NOS FLANCOS',
      );
    }
    music?.start(sectorIndex, true);
    $('bossName').textContent = boss.userData.sabotage
      ? 'DEVASTADOR · NÚCLEO DE PROPULSÃO'
      : current().boss;
    scene.add(boss);
    $('bossHUD').hidden = false;
    message(
      dynamicFlight && boss.userData.sabotage
        ? 'SABOTAGEM · J/L PARA ORBITAR 360° · TRAVE OS SISTEMAS COM O ROBÔ'
        : dynamicFlight
          ? 'ARENA · ORBITE 360° · GERADORES NOS FLANCOS E TRASEIRA'
          : 'ALERTA COLOSSAL / ' + current().boss + ' · DESTRUA OS GERADORES VERMELHOS',
    );
  }
  function damageBoss(
    amount,
    target = null,
    element = 'kinetic',
    charged = false,
    hitZone = 'weak',
    source = 'weapon',
  ) {
    if (
      state !== 'playing' ||
      !boss ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (dynamicFlight && bossCombat?.age < 3)
    )
      return 0;
    if (stagePerformance && source !== 'weapon') stagePerformance.primaryOnly = false;
    boss.updateMatrixWorld(true);
    const parts = boss.userData.parts.filter((p) => p.hp > 0);
    const spendDamage = (value, chargedShot) =>
      source === 'squad-plasma' || source === 'squad-overdrive'
        ? bossCombat.spendSquadSpecial(value)
        : bossCombat.spend(value, chargedShot);
    if (hitZone === 'hull' && boss.userData.sabotage) return 0;
    if (hitZone === 'hull' && dynamicFlight) {
      // Hull plating absorbs most damage but does not make ordinary hits meaningless.
      // Generators must still be destroyed and the exposed core gets the final blow.
      const chip =
        spendDamage(amount * 0.75, charged) * bossDamageMultipliers('hull', parts.length);
      const floor = bossCombat.max * (parts.length > 0 ? 0.72 : 0.12);
      const dealt = Math.min(chip, Math.max(0, bossCombat.hp - floor));
      bossCombat.damage(dealt);
      bossHp = bossCombat.hp;
      if (dealt > 0) bossHitPulse = 0.5;
      return dealt;
    }
    const openPart = (p) => !dynamicFlight || bossTargetOpen(boss.userData.parts.indexOf(p));
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
      if (!part) return 0;
      const evidenceIndex = boss.userData.parts.indexOf(part);
      if (!openPart(part)) {
        recordWeakpointContact(weakpointEvidence, evidenceIndex, 0);
        return 0;
      }
      const dealt = spendDamage(amount, dynamicFlight && charged);
      recordWeakpointContact(weakpointEvidence, evidenceIndex, dealt);
      if (dealt > 0) bossHitPulse = 0.5;
      part.hp = Math.max(
        0,
        part.hp - dealt * (dynamicFlight ? bossDamageMultipliers('generator') : 1),
      );

      if (part.hp === 0) {
        part.mesh.visible = false;
        if (boss.userData.sabotage) {
          part.marker.visible = false;
          const phase = sabotagedSystem(boss.userData.parts);
          explode(part.mesh.getWorldPosition(new T.Vector3()), 35, 0xffa65a);
          credits += 45;
          message(
            'SISTEMA DESTRUÍDO · ' +
              (phase.system === 'core'
                ? 'BLINDAGEM ABERTA · DESTRUA O NÚCLEO CENTRAL'
                : phase.label + ' · ' + phase.remaining + ' RESTANTES'),
          );
          return dealt;
        }
        // Destroyed generators power a specific turret. The barrel physically
        // disappears and attack planner drops that battery's shots.
        if (part.battery) part.battery.visible = false;
        explode(part.mesh.getWorldPosition(new T.Vector3()), 24);
        credits += 35;
        message(
          'BATERIA DESTRUÍDA · ' +
            (parts.length === 1 ? 'NÚCLEO EXPOSTO · FOGO REDUZIDO' : 'MENOS TIROS · MIRE NA OUTRA'),
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
    if (
      !bossCoreOpen() ||
      (dynamicFlight && !boss?.userData.sabotage && !weakPointOpen(relativeOrbit()))
    )
      return 0;
    const spent = spendDamage(amount, dynamicFlight && charged);
    const dealt = spent * (dynamicFlight ? bossDamageMultipliers('core') : 1);
    bossCombat.damage(dealt);
    if (dealt > 0) bossHitPulse = 0.5;

    bossHp = bossCombat.hp;
    if (bossHp === 0) {
      if (stagePerformance) {
        stagePerformance.bossDefeated = true;
        stagePerformance.mechaFinisher = robotMode;
      }
      if (boss.userData.sabotage) {
        message(devastadorEscapeAt(0).radio, 'bia');
        devastadorEscapeBoostSeconds = 0;
        devastadorEscapeBeat = 0;
        devastadorEscapeAssisted = false;
        devastadorEscapeWarp = false;
        // The last phase is a cinematic emergency thrust, not a resource
        // softlock. Real player BOOST works; assisted thrust guarantees exit.
        energy = Math.max(energy, 50);
        document.body.classList.add('devastador-escape');
      }
      if (dynamicFlight && sectorIndex === 2) {
        journey = advanceJourney(journey, 'bossDefeated');
        asteroidInterior.setPhase(journey.phase);
        message('NÚCLEO DESTRUÍDO · FUJA DO ASTEROIDE!');
      }
      gainXP(30);
      state = 'collapsing';
      if (!dynamicFlight) releaseControls();
      for (const arr of [shots, hostile]) {
        for (const e of arr)
          if (arr === hostile) hostileShotPool.release(e);
          else dispose(e.o);
        arr.length = 0;
      }
      collapseTime = collapseBurst = 0;
      collapseFinal = false;
      warpDeparture = false;
      collapse = createCollapse(boss.position, { final: sectorIndex === SECTORS.length - 1 });
      scene.add(collapse);
      music?.start(sectorIndex, 'collapse');
      $('bossState').textContent = 'COLAPSO DO REATOR';
      $('attackWarning').setAttribute?.('data-severity', 'danger');
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
    if (dynamicFlight) {
      const jump = warpExitAt(collapseTime, boostRequested());
      if (jump.active && !warpDeparture) {
        warpDeparture = true;
        cue('boostIgnition');
        $('attackWarning').setAttribute?.('data-severity', 'info');
        $('attackWarning').textContent = 'SALTO DE LUZ · SAINDO DO SETOR';
      }
      if (jump.active) {
        boosting = true;
        player.position.z -= dt * jump.speed;
        player.position.y += dt * 7;
      }
      updateWarpStreaks(warpStreaks, jump.active, collapseTime, player.position);
    }
    if (dynamicFlight) {
      const exit = world.setDestinationExit(collapseTime);
      if (exit?.active) $('routeLabel').textContent = exit.label;
    }
    if (boss?.userData.sabotage) {
      if (collapseTime >= DEVASTADOR_ESCAPE_BOOST_START && boosting)
        devastadorEscapeBoostSeconds += dt;
      const escape = devastadorEscapeAt(collapseTime, {
        boostedSeconds: devastadorEscapeBoostSeconds,
      });
      $('routeLabel').textContent = escape.label;
      if (escape.beat !== devastadorEscapeBeat) {
        devastadorEscapeBeat = escape.beat;
        message(escape.radio, escape.speaker);
        if (escape.phase === 'boost') cue('boostIgnition');
      }
      if (escape.boostWindow && !escape.warp && !escape.boostActivated) {
        $('boostTouch').classList.add('launch-required');
        $('boostTouch').textContent = 'BOOST FUGA';
        $('boostTouch').setAttribute('aria-label', 'Segure BOOST para sair da Devastador');
        $('attackWarning').textContent = 'FUGA · ACIONE BOOST AGORA';
      } else {
        $('boostTouch').classList.remove('launch-required');
        if (!escape.warp) $('attackWarning').textContent = 'DEVASTADOR · FALHA EM CASCATA';
      }
      if (escape.warp && !devastadorEscapeWarp) {
        devastadorEscapeWarp = true;
        devastadorEscapeAssisted = escape.assistedBoost;
        document.body.classList.add('devastador-warp');
        heroEffects.pulse({ robot: robotMode, charged: true, color: '#c9faff' });
        cue('boostIgnition');
        if (escape.assistedBoost)
          message('FIVE CATS · PROPULSÃO DE EMERGÊNCIA ATIVADA! SAÍDA EM HIPERIMPULSO!', 'bob');
      }
      if (escape.warp) {
        // The visual emergency exhaust is independent of control input and
        // never modifies the player’s shield, flight trajectory or checkpoint.
        boosting = true;
        for (const flame of player.userData.flames) {
          flame.scale.y = Math.max(flame.scale.y, escape.flameScale * 2.5);
          flame.material.color.set('#daffff');
        }
        $('attackWarning').textContent = 'HIPERIMPULSO · DEVASTADOR EM COLAPSO';
      }
      // Earlier reactor systems spark in sequence. Existing collapse debris
      // remains bounded and retains the generic eight-second finale contract.
      if (!escape.warp && collapseTime > 1.3 && collapseBurst <= 0)
        $('attackWarning').setAttribute?.('data-severity', 'danger');
    }
    collapseBurst -= dt;
    updateCollapse(collapse, collapseTime);
    boss.rotation.z = Math.sin(collapseTime * 9) * 0.015 + collapseTime * 0.014;
    boss.position.y = marsBossAltitude
      ? marsBossAltitude(boss.position.y - dt * 0.55, boss.rotation.z)
      : boss.position.y - dt * 0.55;
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
      $('attackWarning').setAttribute?.('data-severity', 'info');
      $('attackWarning').textContent =
        sectorIndex === SECTORS.length - 1
          ? 'MARVIN DERROTADO · SUPRIMENTOS RECUPERADOS'
          : 'ALVO DESTRUÍDO';
    }
    if (dynamicFlight) flightCamera.setMode('combat');
    flightCamera.update(dt, player.position, 0, false);
    const vibration = collapseFinal ? Math.max(0, 1 - (collapseTime - 4.7) / 2) : 0.15;
    camera.position.x += Math.sin(collapseTime * 35) * vibration * 0.8;
    camera.position.y += Math.cos(collapseTime * 27) * vibration * 0.4;
    if (collapseTime >= COLLAPSE_SECONDS) {
      if (boss.userData.sabotage) {
        document.body.classList.remove('devastador-escape');
        document.body.classList.remove('devastador-warp');
        $('boostTouch').classList.remove('launch-required');
        $('boostTouch').textContent = 'BOOST';
        $('boostTouch').setAttribute('aria-label', 'Ativar boost da nave');
        boosting = false;
        message('BIA · DEVASTADOR DESTRUÍDA. FIVE CATS, PREPARAR PRÓXIMA MISSÃO!', 'bia');
      }
      dispose(boss);
      disposeBoss(boss);
      boss = null;
      dispose(collapse);
      disposeCollapse(collapse);
      collapse = null;
      score += 50;
      credits += 250 + sectorIndex * 40;
      if (dynamicFlight && sectorIndex === 2) {
        journey = advanceJourney(journey, 'exitReached');
        asteroidInterior.setPhase(journey.phase);
        world.setAsteroidInterior(false);
      }
      $('attackWarning').textContent = '';
      if (sectorIndex === SECTORS.length - 1) finish(true);
      else showShop();
    }
  }

  function finish(win) {
    recordStageResult(win ? 'cleared' : 'defeated');
    document.body.classList.add('ranking-intermission');
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
    prepareGeneration++;
    bossShadersWarm = false;
    if (preparedBoss) {
      disposeBoss(preparedBoss);
      preparedBoss = null;
    }
    if (collapse) {
      dispose(collapse);
      disposeCollapse(collapse);
      collapse = null;
    }
    collapseTime = 0;
    collapseFinal = false;
    for (let arr of [enemies, shots, hostile, particles, rings, obstacles])
      for (let e of arr) {
        if (arr === hostile) hostileShotPool.release(e);
        else if (arr === particles) particlePool.release(e);
        else dispose(e.o);
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
  function start(resume = false, restart = null, skipSquad = false, developerRun = false) {
    skipSquadIntro = skipSquad;
    if (!appActive) return;
    developerSession = developerAvailable && developerRun;
    if (!developerSession) developerScenario = null;
    $('developerSessionTag').hidden = !developerSession;
    $('developerFlightLab').hidden = !developerSession;
    document.body.classList[developerSession ? 'add' : 'remove']('developer-session');
    $('pauseConfirmPanel').hidden = true;
    confirmation = null;
    cameraMode = 'chase';
    flightCamera.setMode(cameraMode);
    $('cameraView').textContent = 'C · PERSEGUIÇÃO';
    const checkpoint = restart ?? (resume === true ? readSave(storage) : null);
    sectorIndex = checkpoint?.sector ?? 0;
    credits = checkpoint?.credits ?? 0;
    weapon = checkpoint?.weapon ?? 0;
    volley = checkpoint?.volley ?? 0;
    rapid = checkpoint?.rapid ?? 0;
    const scatterLoadout = readScatterLoadout(checkpoint);
    scatterOwned = dynamicFlight && scatterLoadout.owned;
    fireMode = dynamicFlight ? scatterLoadout.mode : 'pulse';
    pilotLoadout = dynamicFlight
      ? readPilotLoadout(checkpoint ? checkpoint.loadout : selectedMissionLoadout)
      : readPilotLoadout(null);
    pilotRelay.reset(pilotLoadout);
    pendingPilotRelay = null;
    if (damagedCraft) damagedCraft.visible = false;
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
    reflexBoost.reset();
    heroEffects.reset();
    touchFire = touchBoost = false;
    elapsed = 0;
    score = checkpoint?.score ?? 0;
    cosmetics = readCosmetics(checkpoint?.cosmetics);
    applySkin();
    hp = maxHp();
    bombs = dynamicFlight ? (checkpoint?.bombs ?? 3) : 3;
    energy = 100;
    shotCd = 0;
    spawnCd = 2;
    ringCd = 8;
    petCd = 11;
    petWave = 0;
    petCare = readPetCare(checkpoint?.petCare);
    $('criticalWarning').hidden = true;
    $('shieldWarning').hidden = true;
    obstacleCd = 12;
    invuln = 2;
    roll = 0;
    rollCd = 0;
    rollHeld = false;
    rollAngle = 0;
    bossHp = 200;
    bossCd = 2;
    releaseControls();
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    flightCamera.setMode(cameraMode);
    flightCamera.reset(player.position);
    frameAudit.clear();
    renderCostAudit.clear();
    frameAuditContext = null;
    pausePanel = 'controls';
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
    enterSector(false);
    // The selected Five Cats pilot is already the active player on frame zero.
    // Do not leave the previous/default pilot on the HUD until the first tick.
    $('pilotName').textContent =
      (dynamicFlight ? activePilot().name : PILOTS[3 - lives]) +
      ' / ' +
      lives +
      (dynamicFlight ? ' NAVES' : ' VIDAS');
    renderPilotSelection();
  }
  function startDeveloperScenario(sector, encounter, fromRestart = false) {
    if (!developerAvailable || (!fromRestart && state !== 'menu')) return false;
    const scenario = parseDeveloperScenario(sector, encounter, SECTORS.length);
    if (!scenario) return false;
    const lab = developerLabLoadout(
      $('developerTier').value,
      $('developerShip').value,
      $('developerArsenal').value,
      $('developerSpecial').value,
    );
    if (!lab) return false;
    developerScenario = scenario;
    // This is an isolated, disposable QA run. The user's real save is never loaded or updated.
    start(
      false,
      {
        sector: scenario.sector,
        loadout: { ...pilotLoadout, ship: lab.ship },
        strategy: {
          specialty: activePilot().specialty,
          xp: lab.xp,
          arsenal: lab.arsenal,
          special: lab.special,
        },
        weapon: lab.weaponLevel,
        volley: lab.volley,
        rapid: lab.rapid,
        scatterOwned: lab.scatterOwned,
        fireMode: 'pulse',
        armor: lab.armor,
        pods: lab.pods,
        bombs: lab.bombs,
        credits: 0,
        score: 0,
        cosmetics: { ...cosmetics, owned: [...cosmetics.owned] },
        petCare: { ...petCare },
      },
      true,
      true,
    );
    if (!developerSession) return false;
    for (const [id, value] of [
      ['qaLabLevel', $('developerTier').value],
      ['qaLabShip', lab.ship],
      ['qaLabArsenal', String(lab.arsenal)],
      ['qaLabSpecial', String(lab.special)],
      ['qaLabForm', 'ship'],
      ['qaLabPods', 'docked'],
    ])
      $(id).value = value;
    if (scenario.encounter !== 'stage') {
      if (scenario.sector === 0) {
        // Advance the genuine orbital state machine, never bypass the main campaign gate.
        orbitalLaunchSequence.advance({
          seconds: 23,
          dt: 2,
          boosting: true,
          chargeBefore: 100,
          chargeAfter: 40,
        });
        orbitalLaunchSequence.advance({
          seconds: 25,
          dt: 2,
          boosting: true,
          chargeBefore: 40,
          chargeAfter: 0,
        });
        orbitalLaunchSequence.advance({
          seconds: 26,
          dt: 40,
          boosting: false,
          chargeBefore: 0,
          chargeAfter: 0,
        });
      }
      // Keep the test focused on its selected encounter, not ambient enemies/pickups.
      subDone = rivalDone = baseDone = tunnelDone = arcadeDone = true;
      subbossClearedAt = elapsed;
      spawnCd = groundCd = obstacleCd = ringCd = petCd = Infinity;
      if (scenario.encounter === 'subboss') {
        elapsed = current().duration * 0.25;
        enemy('subboss');
        $('subHUD').hidden = false;
        music?.start(sectorIndex, 'subboss');
      } else if (scenario.encounter === 'tunnel') {
        // Real stage-6 tunnel/ice-breach logic, reached directly for visual
        // validation. The same obstacle, swept collision, debris animation
        // and spawn rules run during the normal campaign. No mock scene.
        elapsed = Math.min(current().duration - 16, ARRIVAL_SECONDS + 10);
        const crossing = createObstacle('tunnel', 'europa');
        crossing.position.z = -230;
        scene.add(crossing);
        obstacles.push({
          o: crossing,
          life: 1,
          hp: breakableHullHealth(crossing.userData.kind),
        });
        world.setDestinationArrival?.(elapsed);
        world.setEuropaTunnel?.(true);
      } else {
        elapsed = current().duration + 0.1;
        if (sectorIndex === 2) {
          // The asteroid boss lives inside the cavern; prepare the actual journey phases.
          journey = advanceJourney(journey, 'destinationReached');
          journey = advanceJourney(journey, 'entryCompleted');
        }
        makeBoss();
      }
    }
    $('developerSessionTag').textContent =
      'QA · SETOR ' +
      String(scenario.sector + 1).padStart(2, '0') +
      ' · ' +
      { stage: 'FASE', subboss: 'SUBCHEFE', boss: 'CHEFE', tunnel: 'TÚNEL / GELO' }[
        scenario.encounter
      ] +
      ' · SEM RANK';
    return true;
  }
  function pause() {
    if (!appActive) return;
    if (['playing', 'collapsing', 'respawning', 'arcade'].includes(state)) {
      pausedFrom = state;
      releaseControls();
      state = 'paused';
      $('bossIncoming').hidden = true;
      music?.pause();
      mechaEngine?.silence();
      audioCtx?.suspend?.().catch(() => {});
      $('pauseMenu').hidden = false;
      $('pauseConfirmPanel').hidden = true;
      $('pauseActions').hidden = false;
      confirmation = null;
      showPausePanel(pausePanel);
      $('pause').textContent = '▶';
      $('pauseCare').textContent = PET_ITEMS.map(({ id, name }) => name + ' ' + petCare[id]).join(
        ' · ',
      );
      renderFrameAudit();
      $('pauseResume').focus?.({ preventScroll: true });
    } else if (state === 'paused' && !settingsOpen && !confirmation) {
      resumeAudio();
      state = pausedFrom;
      $('bossIncoming').hidden = state !== 'playing' || bossWarningTime <= 0;
      $('pauseMenu').hidden = true;
      $('pause').textContent = 'Ⅱ';
      if (!(dynamicFlight && coarsePointer.matches && stageIntroTime > 0 && msgTime > 0))
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
    developerSession = false;
    developerScenario = null;
    $('developerSessionTag').hidden = true;
    $('developerFlightLab').hidden = true;
    document.body.classList.remove('developer-session');
    menuThemePlaying = false;
    confirmation = null;
    settingsOpen = false;
    stageIntroTime = 0;
    setIntermissionUI(false);
    document.body.classList.remove('in-mission', 'stage-intro', 'city-bright');
    document.body.classList.add('menu');
    for (const id of [
      'pauseMenu',
      'pauseConfirmPanel',
      'settingsMenu',
      'cinematic',
      'arcadePanel',
      'shop',
      'campaignMap',
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
    else if (developerSession && developerScenario)
      startDeveloperScenario(developerScenario.sector, developerScenario.encounter, true);
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
  function showPausePanel(which) {
    pausePanel = which === 'fps' ? 'fps' : 'controls';
    const fps = pausePanel === 'fps';
    $('pauseControlGuide').hidden = fps;
    $('pauseFrameAudit').hidden = !fps;
    $('pauseTabControls').setAttribute?.('aria-pressed', String(!fps));
    $('pauseTabFps').setAttribute?.('aria-pressed', String(fps));
    if (fps) {
      $('pauseFrameAudit').open = true;
      renderFrameAudit();
    }
  }
  function renderFrameAudit() {
    const result = frameAudit.report();
    const renderCost = renderCostAudit.report();
    const budget = adaptiveGraphics.current();
    const detail =
      settings.language === 'en'
        ? 'Render: '
        : settings.language === 'es'
          ? 'Renderizado: '
          : 'Renderização: ';
    $('auditReadout').textContent =
      formatFrameAudit(result, {
        language: settings.language,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio ?? 1,
        ...frameAuditContext,
      }) +
      '\n' +
      detail +
      budget.quality.toUpperCase() +
      ' · ' +
      Math.round(budget.resolutionScale * 100) +
      '% ' +
      (budget.adaptive ? '(adaptativo)' : '') +
      (renderCost.samples > 0
        ? '\n' +
          (settings.language === 'en'
            ? 'Scene cost samples'
            : settings.language === 'es'
              ? 'Muestras de coste 3D'
              : 'Amostras de custo 3D') +
          ': ' +
          renderCost.samples +
          '\n' +
          (settings.language === 'en'
            ? 'Draw calls p95 / peak'
            : settings.language === 'es'
              ? 'Llamadas p95 / pico'
              : 'Chamadas p95 / pico') +
          ': ' +
          renderCost.p95DrawCalls +
          ' / ' +
          renderCost.maxDrawCalls +
          '\n' +
          (settings.language === 'en'
            ? 'Triangles p95 / peak'
            : settings.language === 'es'
              ? 'Triángulos p95 / pico'
              : 'Triângulos p95 / pico') +
          ': ' +
          renderCost.p95Triangles +
          ' / ' +
          renderCost.maxTriangles +
          '\n' +
          (settings.language === 'en'
            ? 'Post-process passes (peak)'
            : settings.language === 'es'
              ? 'Pasadas posproceso (pico)'
              : 'Passes pós-processamento (pico)') +
          ': ' +
          renderCost.maxPostPasses
        : '');
    $('auditStart').disabled = result.active;
    $('auditStop').disabled = !result.active;
    $('auditCopy').disabled = result.frames === 0;
  }
  function applyRenderBudget(budget) {
    heroEffects.setQuality(budget.quality, coarsePointer.matches);
    pixelLimit =
      graphicsPixelRatioLimit(budget.quality, {
        coarsePointer: coarsePointer.matches,
      }) * budget.resolutionScale;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, pixelLimit));
    world.setGraphicsQuality(budget.quality);
    post.setGraphicsQuality(budget.quality);
    post.resize(window.innerWidth, window.innerHeight);
    if (document.body.dataset) {
      document.body.dataset.graphicsQuality = budget.quality;
      document.body.dataset.graphicsAdaptive = String(budget.adaptive);
    }
  }
  function applySettings() {
    if (settings.graphics !== activeGraphicsSetting) {
      // A single FPS report must never combine two manually selected
      // render presets. Invalidate both samplers before changing quality.
      frameAudit.clear();
      renderCostAudit.clear();
      frameAuditContext = null;
      activeGraphicsSetting = settings.graphics;
      adaptiveGraphics.reset(settings.graphics);
    }
    applyRenderBudget(adaptiveGraphics.current());
    const label = (id, key) => {
      $(id).textContent = uiText(settings.language, key);
    };
    for (const [id, key] of [
      ['settingsTitle', 'options'],
      ['labelLanguage', 'language'],
      ['labelDifficulty', 'difficulty'],
      ['labelGraphics', 'graphics'],
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
    $('shieldWarning').textContent = uiText(settings.language, 'shieldLow');
    for (const node of document.querySelectorAll?.('[data-help-key]') ?? [])
      node.textContent = uiText(settings.language, node.dataset.helpKey);
    for (const mode of ['easy', 'normal', 'hard']) {
      const option = Array.from($('settingDifficulty').options ?? []).find(
        (item) => item.value === mode,
      );
      if (option) option.textContent = uiText(settings.language, mode);
    }
    for (const [mode, key] of [
      ['auto', 'graphicsAuto'],
      ['medium', 'graphicsMedium'],
      ['high', 'graphicsHigh'],
    ]) {
      const option = Array.from($('settingGraphics').options ?? []).find(
        (item) => item.value === mode,
      );
      if (option) option.textContent = uiText(settings.language, key);
    }
    for (const [key, id] of [
      ['language', 'settingLanguage'],
      ['difficulty', 'settingDifficulty'],
      ['graphics', 'settingGraphics'],
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
    // Options controls actual button translucency, not just its parent wrapper.
    $('touch').style.setProperty?.('--nw-touch-preference', String(settings.opacity));
    document.body.classList[settings.leftHanded ? 'add' : 'remove']('left-handed');
    $('cinematic').classList[settings.subtitles ? 'remove' : 'add']('hide-subtitles');
    music?.setVolume(settings.master * settings.music);
    audioCues?.setVolume(settings.master * settings.sfx);
    localization.setLanguage(settings.language);
    syncDodgeControl();
    renderFrameAudit();
  }
  function openSettings() {
    if (state !== 'menu' && state !== 'paused') return;
    settingsOpen = true;
    $('settingsMenu').hidden = false;
    applySettings();
    // Keep the language selector visible but never auto-open a native mobile popup.
    $('settingsTitle').setAttribute?.('tabindex', '-1');
    $('settingsTitle').focus?.({ preventScroll: true });
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
    renderCinematicPortrait(document, beat.speaker);
    $('cinematicCaption').textContent = beat.text;
    cinematicStage?.update(cinematic.elapsed, window.innerWidth, window.innerHeight);
    $('cinematicProgress').style.width =
      (Math.min(1, cinematic.elapsed / cinematic.duration) * 100).toFixed(1) + '%';
  }
  function finishCinematic(skipSquad = false) {
    if (!cinematic) return;
    const playMission = cinematic.playMission;
    cinematic = null;
    cinematicStage?.destroy();
    cinematicStage = null;
    $('cinematic').hidden = true;
    if (playMission) start(false, null, skipSquad);
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
    if (!cinematicStage) cinematicStage = createCinematicStage($('cinematicCanvas'));
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
  $('developerPanel').hidden = !developerAvailable;
  $('menuQA').hidden = !developerAvailable;
  $('developerSessionTag').hidden = true;
  if (developerAvailable) {
    // Test harnesses and first-load mobile browsers share safe defaults.
    for (const [id, value] of [
      ['developerTier', '9'],
      ['developerShip', 'nova7'],
      ['developerArsenal', '0'],
      ['developerSpecial', '0'],
    ])
      if (!$(id).value) $(id).value = value;
    for (const [index, sector] of SECTORS.entries()) {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = String(index + 1).padStart(2, '0') + ' · ' + sector.name;
      $('developerSector').append(option);
    }
    const tunnelQaOption = document.createElement('option');
    tunnelQaOption.value = 'tunnel';
    tunnelQaOption.textContent = 'TÚNEL DE GELO / RUPTURA DA PAREDE';
    $('developerEncounter').append(tunnelQaOption);
    const syncTunnelQaOption = () => {
      const europa = Number($('developerSector').value) === 5;
      tunnelQaOption.hidden = !europa;
      tunnelQaOption.disabled = !europa;
      if (!europa && $('developerEncounter').value === 'tunnel')
        $('developerEncounter').value = 'stage';
    };
    $('developerSector').onchange = syncTunnelQaOption;
    syncTunnelQaOption();
    $('developerLaunch').onclick = () =>
      startDeveloperScenario($('developerSector').value, $('developerEncounter').value);
    $('developerBerserkLaunch').onclick = () => {
      // One-tap QA access. Real power-up and disposable progression.
      $('developerTier').value = '12';
      $('developerSpecial').value = '3';
      if (startDeveloperScenario($('developerSector').value, $('developerEncounter').value)) {
        message('QA · BERSERK PRONTO · TOQUE ATIVAR BERSERK NO HUD');
      }
    };
    $('qaBerserkAction').onclick = activateQaBerserk;
    $('qaLabApply').onclick = () => {
      if (!developerAvailable || !developerSession || state !== 'paused' || confirmation) return;
      const lab = developerLabLoadout(
        $('qaLabLevel').value,
        $('qaLabShip').value,
        $('qaLabArsenal').value,
        $('qaLabSpecial').value,
      );
      if (!lab) return;
      const form = $('qaLabForm').value;
      const pods = $('qaLabPods').value;
      const testBerserk = $('qaLabBerserk').checked;
      // Apply real visuals/progression without issuing a gameplay stat write
      // to any saved checkpoint, server ranking or production environment.
      strategy.xp = lab.xp;
      strategy.arsenal = lab.arsenal;
      strategy.special = testBerserk ? 3 : lab.special;
      if (testBerserk) strategy.xp = Math.max(strategy.xp, xpForStage(12));
      weapon = lab.weaponLevel;
      volley = lab.volley;
      rapid = lab.rapid;
      scatterOwned = lab.scatterOwned;
      armor = lab.armor;
      podCount = lab.pods;
      bombs = 8;
      arcana = 100;
      tacticEnergy = 3;
      energy = 100;
      specialCd = 0;
      berserk = 0;
      robotCooldown = 0;
      hp = maxHp();
      if (pilotLoadout.ship !== lab.ship) {
        pilotLoadout = { ...pilotLoadout, ship: lab.ship };
        applyShipModel();
      }
      evolve();
      syncPods();
      pause(); // Resume first; transforms must run the real gameplay action.
      if (testBerserk) castSpecial();
      if (form === 'robot' && !robotMode) toggleRobot();
      else if (form === 'ship' && robotMode) toggleRobot();
      if ((pods === 'deployed') !== podsDetached) togglePods();
      message(
        'QA · EVOLUÇÃO ' +
          (stage() + 1) +
          ' / ARMA ' +
          selectedWeapon().name +
          ' / RPG ' +
          SPECIALS[strategy.special].name,
      );
    };
  }
  $('start').onclick = () => (settings.intro ? beginCinematic() : start());
  $('continue').onclick = () => start(true);
  $('menuMusic').onclick = beginMenuTheme;
  $('watchIntro').onclick = () => beginCinematic(false);
  $('cinematicSkip').onclick = () => finishCinematic(true);
  $('optionsFromMenu').onclick = openSettings;
  $('pauseOptions').onclick = openSettings;
  $('pauseTabControls').onclick = () => showPausePanel('controls');
  $('pauseTabFps').onclick = () => showPausePanel('fps');
  $('auditStart').onclick = () => {
    if (state !== 'paused') return;
    frameAuditContext = {
      sector: sectorIndex + 1,
      graphics: settings.graphics,
      version: $('gameVersion').textContent.trim(),
    };
    frameAudit.start();
    renderCostAudit.start();
    renderFrameAudit();
  };
  $('auditStop').onclick = () => {
    if (state !== 'paused') return;
    frameAudit.stop();
    renderCostAudit.stop();
    renderFrameAudit();
  };
  $('auditCopy').onclick = () => {
    if (state !== 'paused' || frameAudit.report().frames === 0) return;
    const text = $('auditReadout').textContent;
    const clipboard = window.navigator?.clipboard;
    if (!clipboard?.writeText) {
      $('auditReadout').textContent = uiText(settings.language, 'auditCopyFail') + '\n' + text;
      return;
    }
    Promise.resolve(clipboard.writeText(text))
      .then(() => {
        $('auditReadout').textContent = uiText(settings.language, 'auditCopied') + '\n' + text;
      })
      .catch(() => {
        $('auditReadout').textContent = uiText(settings.language, 'auditCopyFail') + '\n' + text;
      });
  };
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
    ['difficulty', 'settingDifficulty'],
    ['graphics', 'settingGraphics'],
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
            : key === 'language' || key === 'difficulty' || key === 'graphics'
              ? el.value
              : Number(el.value),
      });
      storeSettings(storage, settings);
      applySettings();
    };
  }
  applySettings();
  $('nextSector').onclick = dynamicFlight ? showCampaignMap : nextSector;
  if (!dynamicFlight) $('nextSector').textContent = 'SALTAR PARA O PRÓXIMO SETOR ↗';
  $('mapBack').onclick = backToShop;
  $('mapLaunch').onclick = nextSector;
  for (const k of Object.keys(SHOP)) $('buy' + k).onclick = () => buy(k);
  $('equipScatter').onclick = equipScatter;
  $('music').onclick = () => {
    musicOn = !musicOn;
    music?.setEnabled(musicOn);
    $('music').textContent = musicOn ? '♪ ON' : '♪ OFF';
  };
  $('arsenalSwitch').onclick = cycleArsenal;
  $('specialSwitch').onclick = cycleSpecial;
  $('specialCast').onclick = castSpecial;
  $('plasmaTitan').onclick = () => castSquadSpecial('plasma');
  $('fiveCatsOverdrive').onclick = () => castSquadSpecial('overdrive');
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
      $('strategyDrawer').open = false;
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
    audioCues?.setEnabled(!muted);
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
  // Q/E/Z mirror touch behavior: a brief tap spins 360°, a hold banks 90°.
  // Robot mode continues to use the same keys for a single lateral dash.
  const rollKeys = new Set(['KeyQ', 'KeyE', 'KeyZ']);
  const rollKeyDownAt = new Map();
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (cinematic) {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault?.();
        finishCinematic(true);
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
    if (e.code === 'KeyM') switchPilot();
    if (e.code === 'KeyT') toggleRobot();
    if (e.code === 'KeyN') startMechaMultiLock();
    if (e.code === 'KeyY') castSquadSpecial('plasma');
    if (e.code === 'KeyO') castSquadSpecial('overdrive');
    if (e.code === 'KeyV') togglePods();
    if (e.code === 'KeyB' || e.code === 'KeyX') bomb();
    if (rollKeys.has(e.code) && state === 'playing') {
      rollKeyDownAt.set(e.code, now());
      if (robotMode) doRoll(e.code);
    }
    if (e.code === 'KeyP' || e.code === 'Escape') pause();
    if (e.code === 'Enter' && state === 'menu') settings.intro ? beginCinematic() : start();
  });
  addEventListener('keyup', (e) => {
    if (inFlight() && isGameKey(e) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault?.();
    const rollStarted = rollKeyDownAt.get(e.code);
    rollKeyDownAt.delete(e.code);
    keys.delete(e.code);
    if (e.code === 'KeyN') finishMechaMultiLock();
    if (
      rollStarted !== undefined &&
      !robotMode &&
      state === 'playing' &&
      now() - rollStarted < 240 &&
      ![...rollKeys].some((code) => keys.has(code)) &&
      rollPointerId === null
    )
      doRoll();
    if (!boostRequested()) boostNeedsRelease = false;
  });
  cleanups.push(protectFlightSurface(document, $('game'), $('touch'), inFlight));
  let stickId = null;
  const heldPointers = new Map();
  function boostRequested() {
    return keys.has('ShiftLeft') || keys.has('ShiftRight') || touchBoost;
  }
  function releaseControls() {
    // Blur/pause can swallow keyup: never retain a held multi-lock or fire on release.
    if (lockHeld) finishMechaMultiLock(true);
    pendingAsteroidTransform = null;
    audioCues?.silence();
    orbitTouch = 0;
    boosting = false;
    reflexBoost.reset();
    heroEffects.reset();
    document.body.classList.remove('reflex-boost');
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
    rollKeyDownAt.clear();
    rollPointerId = null;
    rollHeld = false;
    dashRemaining = 0;
    dashTrail.reset();
    $('nub').style.transform = '';
    for (const id of ['fireTouch', 'boostTouch']) $(id).classList.remove('pressed');
    mechaEngine?.silence();
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
  const rollButton = $('rollTouch');
  let rollPointerId = null;
  let rollPressStarted = 0;
  let rollPressStartedAsRobot = false;
  rollButton.onpointerdown = (e) => {
    e.preventDefault?.();
    if (state !== 'playing' || rollPointerId !== null) return;
    rollPointerId = e.pointerId;
    rollPressStarted = performance.now();
    rollPressStartedAsRobot = robotMode;
    rollHeld = !robotMode;
    if (robotMode) doRoll();
    rollButton.setPointerCapture?.(e.pointerId);
  };
  const finishRollPress = (e) => {
    if (rollPointerId !== e.pointerId) return;
    const tap = e.type === 'pointerup' && performance.now() - rollPressStarted < 240;
    rollPointerId = null;
    rollHeld = false;
    if (tap && !rollPressStartedAsRobot && !robotMode) doRoll();
  };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    rollButton.addEventListener(event, finishRollPress);
  $('robotTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    toggleRobot();
  };
  $('lockTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    $('lockTouch').setPointerCapture?.(e.pointerId);
    startMechaMultiLock();
  };
  $('lockTouch').addEventListener('pointerup', () => finishMechaMultiLock());
  for (const event of ['pointercancel', 'lostpointercapture'])
    $('lockTouch').addEventListener(event, () => finishMechaMultiLock(true));
  $('bombTouch').onpointerdown = (e) => {
    e.preventDefault?.();
    bomb();
  };
  function updatePiloting(dt) {
    robotCooldown = Math.max(0, robotCooldown - dt);
    robotTransition = Math.max(0, robotTransition - dt);
    if (robot.visible) robot.rotation.y = Math.sin(robotTransition * 18) * robotTransition * 1.8;
    precisionCd = Math.max(0, precisionCd - dt);
    let dx =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        stick.x,
      dy =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
        stick.y;
    rollHeld =
      !robotMode && (rollPointerId !== null || [...rollKeys].some((code) => keys.has(code)));
    const boostHeld = boostRequested();
    if (!boostHeld) boostNeedsRelease = false;
    if (boostHeld && energy <= 5 && !boostNeedsRelease) {
      boostNeedsRelease = true;
      if (sectorIndex !== 0 || orbitalLaunchSequence.snapshot().phase !== 'atmosphere')
        message('IMPULSO ESGOTADO / SOLTE SHIFT OU BOOST PARA REARMAR');
    }
    const wasBoosting = boosting;
    boosting = boostHeld && !boostNeedsRelease && energy > 5;
    if (dynamicFlight && boosting && !wasBoosting) cue('boostIgnition');
    if (robotMode) animateMechPower(robot, elapsed, boosting, stage(), { x: dx, y: dy }, dt);
    const unfoldProgress = robotTransition / transformDuration;
    animatePremiumMecha(robot, {
      progress: robotMode ? 1 - unfoldProgress : 0,
      level: stage(),
      time: elapsed,
      boosting,
      dash: {
        active: robotMode && dashRemaining > 0,
        direction: dashSide,
        progress: 1 - dashRemaining / MECHA_DASH.duration,
      },
    });
    if (robot.visible) {
      // The independently aimed wrists and dual dorsal gimbals belong to
      // updateMechaPose(). Do not overwrite their animation with a legacy rig.
      robot.rotation.y =
        Math.sin(elapsed * 1.7) * 0.035 +
        Math.sin(unfoldProgress * Math.PI * 5) * unfoldProgress * 0.32;
    } else if (robotTransition > 0) {
      shipModule.rotation.z = Math.sin(unfoldProgress * Math.PI * 2) * unfoldProgress * 0.22;
    } else {
      shipModule.rotation.z = 0;
    }
    const energyBeforeBoost = energy;
    energy = clamp(energy + dt * (boosting ? -28 : robotMode ? 7 : 15), 0, 100);
    if (dynamicFlight && sectorIndex === 0) {
      const beforeLaunch = orbitalLaunchSequence.snapshot().phase;
      const launchState = orbitalLaunchSequence.advance({
        seconds: elapsed,
        dt,
        boosting,
        chargeBefore: energyBeforeBoost,
        chargeAfter: energy,
      });
      const boostGuide = $('launchBoostNotice');
      const needsBoost = launchState.phase === 'boost' && state === 'playing';
      if (launchState.phase !== beforeLaunch && needsBoost) orbitalAlertElapsed = 0;
      if (needsBoost) orbitalAlertElapsed += dt;
      // The mandatory BOOST stays on the button; the huge stage notice is
      // merely a short heads-up, never a persistent gameplay obstruction.
      boostGuide.hidden = !needsBoost || orbitalAlertElapsed > 2.6;
      const boostButton = $('boostTouch');
      if (needsBoost) boostButton.classList.add('launch-required');
      else boostButton.classList.remove('launch-required');
      const nextLabel = needsBoost ? 'SUPER BOOST' : 'BOOST';
      if (boostButton.textContent !== nextLabel) boostButton.textContent = nextLabel;
      boostButton.setAttribute(
        'aria-label',
        needsBoost ? 'Super Boost obrigatório para romper a atmosfera' : 'Ativar boost da nave',
      );
      if (needsBoost && boosting) document.body.classList.add('orbital-super-boost');
      else document.body.classList.remove('orbital-super-boost');
      if (launchState.phase !== beforeLaunch) {
        if (launchState.phase === 'orbit') cityOrbitReadyAt = elapsed;
        if (launchState.phase === 'boost')
          message('FUGA ORBITAL · SEGURE SUPER BOOST ATÉ ESGOTAR A ENERGIA', 'jenifer');
        else if (launchState.phase === 'atmosphere')
          message('IMPULSO ESGOTADO · ATRAVESSANDO A ATMOSFERA', 'jenifer');
        else if (launchState.phase === 'orbit') message('ÓRBITA ALCANÇADA · TERRA À VISTA', 'bob');
      }
    }
    const profileSpeed = dynamicFlight
      ? activePilot().bonuses.speed *
        (1 + activeShip().stats.agility * 0.08) *
        (robotMode ? 0.65 : 1)
      : 1;
    const superBoost =
      dynamicFlight &&
      sectorIndex === 0 &&
      orbitalLaunchSequence.snapshot().phase === 'boost' &&
      boosting;
    const speed =
      (superBoost ? 114 : boosting ? 90 : 48) *
      (1 + Math.min(30, stage()) * 0.02) *
      profileSpeed *
      progressionSpeed(stage());
    lastFlightSpeed = speed;
    const holding = keys.has('Space') || touchFire;
    if (holding && marsCleanse === 0) {
      charge = Math.min(1.5, charge + dt);
      if (dynamicFlight && charge > 0.15 && charge - dt <= 0.15) cue('plasmaCharge');
      chargeLatch = true;
    } else if (chargeLatch) {
      if (charge >= 0.8 && marsCleanse === 0) {
        // The charged cannon must originate at the same articulated right wrist
        // as the mecha's primary fire, never from the hidden ship's center.
        if (robotMode) robot.updateMatrixWorld(true);
        const chargedMuzzle = robotMode
          ? robot.userData.mecha.arms.right.muzzle.getWorldPosition(new T.Vector3())
          : null;
        launchShot(
          0,
          mechaShotDamage((20 + weapon * 12) * weaponPower(), {
            robot: robotMode,
            kind: 'charged',
          }) * (dynamicFlight ? 1 + charge / 1.5 : 1),
          true,
          chargedMuzzle,
        );
        if (robotMode) {
          shots.at(-1).source = 'mecha-charged';
          shots.at(-1).o.scale.multiplyScalar(1.3);
          robotFireKick = 0.4;
        }
        cockpit?.fire();
        heroEffects.pulse({ robot: robotMode, charged: true, color: selectedWeapon().color });
        if (dynamicFlight) cue(robotMode ? 'mechaChargeRelease' : 'plasmaRelease');
        else sound(160, 0.4, 'sawtooth', 0.06);
      }
      charge = 0;
      chargeLatch = false;
    }
    const chargePercent = (charge / 1.5) * 100;
    $('chargeBar').style.width = chargePercent + '%';
    $('fireTouch').style.setProperty?.('--meter', chargePercent + '%');
    if (chargeGlow) {
      chargeGlow.visible = charge > 0.15;
      chargeGlow.scale.setScalar(2 + charge * (5 + Math.sin(elapsed * 30) * 0.5));
      chargeGlow.material.color.set(charge >= 0.8 ? '#eaffff' : selectedWeapon().color);
    }
    reticle.visible = true;
    const previousPlayer = player.position.clone();
    asteroidPriorRotation.copy(player.rotation);
    const dodgeMultiplier = reflexBoost.snapshot().dodgeMultiplier;
    const storm = dynamicFlight && sectorIndex === 1 ? marsSandstormAt(elapsed) : null;
    const gustX = storm?.windX ?? 0;
    marsStormDamageCooldown = Math.max(0, marsStormDamageCooldown - dt);
    if (storm?.hazard && marsStormDamageCooldown <= 0 && Math.sign(dx) !== -Math.sign(gustX)) {
      marsStormDamageCooldown = 3.2;
      hit(6);
      shake = Math.max(shake, 0.28);
      if (settings.vibration) window.navigator?.vibrate?.(70);
    }
    player.position.x = clamp(
      player.position.x +
        (dx * 24 * dodgeMultiplier * (1 + Math.min(30, stage()) * 0.03) * profileSpeed + gustX) *
          dt,
      -flightLimit(),
      flightLimit(),
    );
    // Preserve the swept collision segment: the dash moves within the normal
    // piloting step, before walls and moving enemy projectiles are resolved.
    const overheadControls = dynamicFlight && flightCamera.getShot() === 'overhead';
    if (overheadControls) {
      // UP/DOWN become depth movement for a real, playable tactical corridor.
      player.position.z = clamp(
        player.position.z - dy * dt * 34 * dodgeMultiplier * profileSpeed,
        -44,
        29,
      );
      player.position.y = T.MathUtils.damp(player.position.y, 10, 4, dt);
    } else {
      player.position.z = T.MathUtils.damp(player.position.z, 9, 4, dt);
      player.position.y = clamp(
        player.position.y +
          dy * dt * 20 * dodgeMultiplier * (1 + Math.min(30, stage()) * 0.03) * profileSpeed,
        -1,
        verticalFlightLimit(),
      );
    }
    dashCooldown = Math.max(0, dashCooldown - dt);
    dashTrail.update(dt);
    const dashStart = robotMode && dashRemaining > 0 ? player.position.clone() : null;
    if (dashStart) {
      const dash = dashFrame(dashRemaining, dt, dashSide);
      dashRemaining = dash.remaining;
      player.position.x = clamp(
        player.position.x + dash.displacement,
        -flightLimit(),
        flightLimit(),
      );
    }
    // Resolve cavern walls after BOTH stick movement and the mecha dash.
    // Otherwise the dash could put the player outside the rock collision hull
    // until the following frame, causing visible clipping at tight corners.
    asteroidWallCooldown = Math.max(0, asteroidWallCooldown - dt);
    if (dynamicFlight && sectorIndex === 2) {
      const wall = asteroidInterior.constrain(player.position);
      if (wall.collided) {
        player.position.x = wall.x;
        player.position.y = wall.y;
        asteroidImpact();
      }
    }
    if (dashStart) dashTrail.emit(dashStart, player.position);
    player.rotation.z = T.MathUtils.lerp(
      player.rotation.z,
      heldBankAngle({ robot: robotMode, held: rollHeld, steer: dx }),
      dt * 8,
    );
    player.rotation.x = T.MathUtils.lerp(player.rotation.x, dy * 0.14, dt * 8);
    player.rotation.y = T.MathUtils.lerp(player.rotation.y, -dx * 0.12, dt * 8);
    if (roll > 0) {
      roll = Math.max(0, roll - dt);
      rollAngle = Math.PI * 2 * (1 - roll / 0.65);
      player.rotation.z = rollAngle;
      if (roll === 0 && marsPendingRoll) {
        marsPendingRoll = false;
        marsCleanse = Math.max(0, marsCleanse - 1);
        setMarsDustCoating(marsDust, 0, marsCleanse);
        explode(player.position, 7, 0xc58b5d);
        if (marsCleanse > 0) {
          $('attackWarning').textContent = 'AREIA NAS ARMAS · GIROS: ' + marsCleanse;
        } else {
          $('attackWarning').textContent = '';
          message('ARMAS LIMPAS · CANHÕES OPERACIONAIS', 'christopher');
        }
      }
    } else {
      // A held button banks smoothly; a quick tap triggers a full 360-degree roll.
      // Keep the bank continuous and return to neutral smoothly after release.
      const bankTarget = heldBankAngle({ robot: robotMode, held: rollHeld, steer: dx });
      const currentBank = rollAngle > 0 ? 0 : player.rotation.z;
      player.rotation.z = T.MathUtils.lerp(currentBank, bankTarget, Math.min(1, dt * 12));
      rollAngle = 0;
      // Actual crosswind banks the spacecraft; manual directional inputs
      // remain fully responsive and can counter-steer against the gust.
      if (storm?.active && !rollHeld)
        player.rotation.z = clamp(player.rotation.z + storm.roll, -0.75, 0.75);
    }
    if (dynamicFlight && sectorIndex === 2 && enableAsteroidCourse) {
      let half = asteroidPilotHalf();
      // A hull cannot unfold inside solid rock. Controls remain released;
      // the bank can return to neutral as soon as the opening is cleared.
      if (asteroidInterior.course.overlaps(previousPlayer, half)) {
        player.rotation.copy(asteroidPriorRotation);
        half = asteroidPilotHalf();
      }
      const contact = asteroidInterior.course.constrain(previousPlayer, player.position, half);
      player.position.set(contact.x, contact.y, contact.z);
      if (contact.collided) asteroidImpact();
    }
    // Keep transformation and flight-mech readable even during the initial
    // invulnerability flicker. Damage protection is unchanged; ordinary ship
    // mode retains the original blink feedback when invulnerable.
    player.visible =
      cameraMode !== 'cockpit' &&
      (robotMode ||
        robotTransition > 0 ||
        boosting ||
        invuln <= 0 ||
        Math.floor(invuln * 12) % 2 === 0);
    flightCamera.update(
      dt,
      player.position,
      clamp(dx, -1, 1),
      boosting,
      dynamicFlight ? route : undefined,
      dynamicFlight && sectorIndex === 5 && boss ? europaBossPortraitFov(camera.aspect) : null,
    );
    // Keep a true solid in the game world but render the nearby underside
    // translucent when it would eclipse the pilot and the gameplay corridor.
    if (dynamicFlight) world.updateCityCameraOcclusion(camera.position, player.position, dt);
    if (robotMode) updateMechaLock(dt, dx, dy);
    mechaEngine?.update({
      dt,
      active: robotMode && state === 'playing' && !muted && appActive,
      boosting,
      accelerating: Math.max(Math.abs(dx), Math.abs(dy)),
      volume: settings.master * settings.sfx,
    });
    reticle.position.set(player.position.x, player.position.y, -60);
    // Keep legacy/native 3D sight; use clearer projected HUD for the web.
    reticle.visible = !dynamicFlight;
    updateAimReticle();
    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      camera.position.x += Math.sin(visualTime * 70) * shake * 0.3;
      camera.position.y += Math.cos(visualTime * 65) * shake * 0.2;
    }
    if ((keys.has('Space') || touchFire) && shotCd <= 0 && marsCleanse === 0) fire();
    return { speed, previousPlayer, holding };
  }
  function cityGroundImpactAt(objectName) {
    const object = scene.getObjectByName(objectName);
    if (!object) return null;
    // The cue belongs to the piece at its CURRENT animated world position.
    // Never explode where the object was spawned several seconds earlier.
    const impact = object.getWorldPosition(new T.Vector3());
    impact.y = CITY_STREET_TOP_Y + 1.1;
    return impact;
  }
  function updateCityStageSetpieces() {
    if (!dynamicFlight || sectorIndex !== 0 || !enableCitySetpieces) return;
    const state = world.setCityDestruction?.(elapsed);
    if (!state || elapsed >= 23) return;
    for (const beat of CITY_DESTRUCTION_BEATS) {
      if (elapsed < beat.at || cityDestructionTriggered.has(beat.id)) continue;
      cityDestructionTriggered.add(beat.id);
      if (beat.id === 'trainSpawn') {
        const obstacle = createCityHangingTrainObstacle();
        obstacle.position.z = -210;
        scene.add(obstacle);
        obstacles.push({ o: obstacle, life: 1, hp: null });
      }
      if (beat.id === 'billboardImpact') {
        const impact = cityGroundImpactAt('city-sign-structure');
        if (impact) explode(impact, 9, 0x7ee9ff, false);
      }
      if (beat.id === 'vehicleImpact') {
        const impact = cityGroundImpactAt('city-falling-hovercar');
        if (impact) explode(impact, 13, 0xffaa65, false);
      }
      if (beat.id === 'facadeImpact') {
        const flash = scene.getObjectByName('city-tower-impact-flash');
        if (flash) explode(flash.getWorldPosition(new T.Vector3()), 15, 0xffaa6a, false);
      }
      if (beat.id === 'facadeDebrisImpact') {
        const impact = cityGroundImpactAt('city-tower-damaged-crown');
        if (impact) explode(impact, 11, 0xc6e4eb, false);
      }
      if (beat.id === 'trainImpact') {
        const wreck = obstacles.find(({ o }) => o.userData.kind === 'city-hanging-train');
        if (wreck) explode(new T.Vector3(-25, 13, wreck.o.position.z + 15), 22, 0xffad64, false);
      }
      // Sound and radio are authored per beat: no repeated generic explosion
      // layered with the specific physical impact, and no chatty HUD over the
      // falling scenery. The train's one actionable warning is localized.
      if (CITY_STAGE_AUDIO[beat.id]) cue(CITY_STAGE_AUDIO[beat.id]);
      if (beat.id === 'trainWarning') message(cityWarningText(settings.language));
    }
  }
  function update(dt) {
    if (state !== 'playing') return;
    if (squad?.snapshot().intro > 0) {
      squad.update(dt, {
        sector: sectorIndex,
        elapsed,
        pilot: pilotLoadout.pilot,
        aspect: camera.aspect,
      });
      return;
    }
    elapsed += dt;
    totalTime += dt;
    updateCityStageSetpieces();
    const marsArrival = dynamicFlight && sectorIndex === 1 ? world.setMarsDescent(elapsed) : null;
    const marsTransit = !!marsArrival && !marsArrival.combatReady;
    const destinationArrival =
      dynamicFlight && sectorIndex >= 3 ? world.setDestinationArrival(elapsed) : null;
    // Europa's real tunnel deck is the only visible floor during traversal.
    // The global ice terrain is coplanar with its top face (-7): rendering
    // both caused z-fighting and severe ground flicker on mobile.
    const europaTunnelCrossing =
      dynamicFlight &&
      sectorIndex === 5 &&
      obstacles.some(({ o, life }) => life > 0 && o.userData.kind === 'tunnel');
    if (dynamicFlight && sectorIndex === 5) world.setEuropaTunnel?.(europaTunnelCrossing);
    const arrivalTransit = marsTransit || (!!destinationArrival && !destinationArrival.combatReady);
    const sandstorm = marsArrival?.storm;
    if (sandstorm && sandstorm.phase !== marsStormPhase) {
      const previousStorm = marsStormPhase;
      marsStormPhase = sandstorm.phase;
      if (sandstorm.phase === 'warning')
        message('ALERTA MARTE · TEMPESTADE DE AREIA À FRENTE', 'bob');
      else if (sandstorm.phase === 'active')
        message('TURBULÊNCIA · VENTO LATERAL · COMPENSE COM O DIRECIONAL', 'christopher');
      else if (previousStorm === 'active') {
        marsCleanse = 3;
        marsPendingRoll = false;
        charge = 0;
        chargeLatch = false;
        $('attackWarning').setAttribute?.('data-severity', 'warning');
        $('attackWarning').textContent = robotMode
          ? 'AREIA NOS CANHÕES · VOLTE À NAVE PARA 3 GIROS'
          : 'AREIA NOS CANHÕES · 3 GIROS PARA LIMPAR';
        message(
          robotMode
            ? 'AREIA NAS ARMAS · VOLTE À NAVE E EXECUTE 3 GIROS'
            : 'AREIA NAS ARMAS · EXECUTE 3 GIROS RÁPIDOS (Q)',
          'christopher',
        );
      }
    }
    if (sectorIndex === 1) {
      setMarsDustCoating(marsDust, sandstorm?.intensity ?? 0, marsCleanse);
    }
    if (sandstorm?.active && marsCleanse === 0 && !boss) {
      $('attackWarning').setAttribute?.('data-severity', sandstorm.hazard ? 'danger' : 'warning');
      $('attackWarning').textContent = sandstorm.hazard
        ? 'TURBULÊNCIA · COMPENSE O VENTO!'
        : 'TEMPESTADE DE AREIA · VENTO LATERAL';
    } else if (sectorIndex === 1 && marsCleanse === 0 && !boss && !sandstorm?.active) {
      $('attackWarning').textContent = '';
    }
    if (marsArrival && marsArrival.phase !== marsArrivalPhase) {
      marsArrivalPhase = marsArrival.phase;
      const announcements = {
        orbit: ['ÓRBITA DE MARTE · PREPARAR DESCIDA', 'bob'],
        entry: ['REENTRADA EM MARTE · PROTEÇÃO TÉRMICA ATIVA', 'christopher'],
        descent: ['DESCIDA CONTROLADA · DESERTO À FRENTE', 'bia'],
        surface: ['POUSO CONCLUÍDO · COMBATE NO DESERTO', 'bob'],
      };
      const next = announcements[marsArrival.phase];
      if (next) message(next[0], next[1]);
      if (marsArrival.phase === 'surface') invuln = Math.max(invuln, 2.5);
    }
    if (dynamicFlight && sectorIndex === 2) {
      const planned = journeyPhaseAt(elapsed, current().duration);
      if (journey.phase === 'approach' && planned !== 'approach') {
        journey = advanceJourney(journey, 'destinationReached');
        asteroidInterior.setPhase(journey.phase);
        message('MEGA-ASTEROIDE À FRENTE · ENCONTRE A ABERTURA');
      }
      if (journey.phase === 'transition' && ['interior', 'boss'].includes(planned)) {
        journey = advanceJourney(journey, 'entryCompleted');
        asteroidInterior.setPhase(journey.phase);
        message('DENTRO DO ASTEROIDE · EVITE AS PAREDES');
      }
    }
    squad?.update(dt, {
      sector: sectorIndex,
      elapsed,
      pilot: pilotLoadout.pilot,
      power: weaponPower(),
    });
    // The first boss cannot begin while the pilot remains in the city or
    // inside the long post-boost climb. Keep the flight playable meanwhile.
    if (dynamicFlight && sectorIndex === 0 && !orbitalLaunchSequence.snapshot().complete)
      elapsed = Math.min(elapsed, current().duration - 7);
    if (
      dynamicFlight &&
      spawnEncounters &&
      !arcadeDone &&
      [6].includes(sectorIndex) &&
      elapsed >= ARRIVAL_SECONDS + 4
    ) {
      arcadeDone = true;
      arcade = createArcade(sectorIndex + 1);
      state = 'arcade';
      releaseControls();
      $('arcadePanel').hidden = false;
      message('FENDA ESPACIAL / VISÃO LATERAL · MOVA, ATIRE E RECOLHA CRÉDITOS', 'calvin');
      return;
    }
    if (dynamicFlight) {
      const launchState = orbitalLaunchSequence.snapshot();
      route = routeAt(
        sectorIndex,
        elapsed,
        current().duration,
        !!boss,
        sectorIndex === 0 ? launchState.amount : 0,
      );
      if (destinationArrival && !boss) {
        route.label = destinationArrival.label;
        if (destinationArrival.phase === 'entry') route.ascent -= 0.16 * destinationArrival.haze;
      }
      if (marsArrival && !boss) {
        route.label = marsArrival.label;
        // Camera tilts toward the surface continuously during re-entry.
        route.ascent = marsArrival.cameraAscent;
        if (sandstorm?.label) route.label = sandstorm.label;
        // Camera reacts to the same physical gust as the player; there are
        // no random cuts or unplayable top-down control changes.
        route.bank = (route.bank ?? 0) + (sandstorm?.roll ?? 0) * 0.24;
      }
      if (sectorIndex === 0 && !boss) {
        route.label =
          launchState.phase === 'boost'
            ? 'SUPER BOOST · ROMPA A ATMOSFERA'
            : launchState.phase === 'atmosphere'
              ? 'ATRAVESSANDO A ATMOSFERA'
              : launchState.phase === 'orbit'
                ? 'ÓRBITA TERRESTRE'
                : 'ROTA DE APROXIMAÇÃO';
      }
      // Authored short perspectives, while pilot cockpit/combat selection retains priority.
      // The camera changes only for an authored reactor-grid mission beat,
      // with a matching playable depth-control mode. Never for elapsed time
      // alone or while fighting a boss.
      if (
        sectorIndex === 3 &&
        !boss &&
        !reactorGridCompleted &&
        elapsed >= current().duration * 0.35
      ) {
        reactorGridCompleted = true;
        reactorGridSeconds = 17;
        message('DEVASTADOR · REATOR · DESVIE DAS DEFESAS E ELIMINE OS INIMIGOS', 'calvin');
      }
      if (reactorGridSeconds > 0)
        reactorGridSeconds = boss ? 0 : Math.max(0, reactorGridSeconds - dt);
      const directedShot = stagePerspectiveAt(sectorIndex, elapsed, current().duration, !!boss, {
        mission: reactorGridSeconds > 0 ? 'reactor-grid' : '',
      });
      flightCamera.setShot(directedShot);
      // Sector 4 never overrides forward flight with a top-down camera.
      routeRenderer.update(route);
      world.setAscent(Math.min(1, elapsed / current().duration), sectorIndex === 2);
      world.setLaunchAscent(launchState.amount, sectorIndex === 0);
      if (sectorIndex === 2) {
        world.setAsteroidInterior(journey.phase !== 'approach' && journey.phase !== 'complete');
        route.label =
          {
            approach: 'APROXIMAÇÃO · MEGA-ASTEROIDE',
            transition: 'ENTRADA · CAVERNA',
            interior: 'COMBATE · INTERIOR DO ASTEROIDE',
            boss: 'NÚCLEO · PERFURADOR',
            escape: 'FUGA · COLAPSO DO ASTEROIDE',
          }[journey.phase] ?? route.label;
      }
      $('routeLabel').textContent = route.label;
    }
    // Marvin's recurring rivalry is scoped to sector 5 onwards. The actor
    // uses the same mission clock as movement/attacks, and never swaps the
    // camera or overwrites player controls during the brief encounters.
    if (dynamicFlight && sectorIndex >= 4) {
      marvinRival.update({
        sector: sectorIndex,
        elapsed,
        duration: current().duration,
        bossActive: !!boss,
        player: player.position,
        fire: spawnEncounters ? (origin, target, element) => bullet(origin, target, element) : null,
        notify: (line, speaker) => message(line, speaker),
      });
    }
    const orbitalLaunch =
      dynamicFlight &&
      sectorIndex === 0 &&
      launchOrbitReady(orbitalLaunchSequence.snapshot().amount);
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
      berserk = Math.max(0, berserk - dt);
      bossHitPulse = Math.max(0, bossHitPulse - dt);
      if (berserk > 0) document.body.classList.add('berserk-active');
      else document.body.classList.remove('berserk-active');
      const team = squad?.snapshot();
      $('plasmaTitan').disabled =
        !!team && (team.plasmaCooldown > 0 || arcana < SQUAD_SPECIALS.plasma.cost);
      $('fiveCatsOverdrive').disabled =
        !!team && (team.overdriveCooldown > 0 || arcana < SQUAD_SPECIALS.overdrive.cost);
      $('plasmaTitan').textContent =
        team?.plasmaCooldown > 0
          ? 'Y · PLASMA ' + Math.ceil(team.plasmaCooldown) + 's'
          : 'Y · PLASMA';
      $('fiveCatsOverdrive').textContent =
        team?.overdriveCooldown > 0
          ? 'O · FIVE CATS ' + Math.ceil(team.overdriveCooldown) + 's'
          : 'O · FIVE CATS';
      barrier = Math.max(0, barrier - dt);
      stasis = Math.max(0, stasis - dt);
      const compactRpg = coarsePointer.matches && window.innerWidth <= 900;
      $('arsenalSwitch').textContent = compactRpg
        ? 'ARMA ' + selectedWeapon().name
        : 'F · ' + selectedWeapon().name;
      $('specialSwitch').textContent = compactRpg
        ? 'RPG ' + SPECIALS[strategy.special].name
        : 'H · ' + SPECIALS[strategy.special].name;
      $('specialCast').textContent = compactRpg
        ? berserk > 0
          ? 'BERSERK ' + Math.ceil(berserk) + 's'
          : specialCd > 0
            ? 'RECARGA ' + Math.ceil(specialCd) + 's'
            : 'USAR ' + Math.floor(arcana)
        : 'G · ' +
          (berserk > 0
            ? 'BERSERK ' + Math.ceil(berserk) + 's'
            : specialCd > 0
              ? Math.ceil(specialCd) + 's'
              : 'ATIVAR') +
          ' · ' +
          Math.floor(arcana);
      $('specialCast').disabled = specialCd > 0 || arcana < SPECIALS[strategy.special].cost;
      $('quickRpg').setAttribute('data-selected', SPECIALS[strategy.special].name);
      $('specialCast').setAttribute(
        'aria-label',
        'Ativar ' + SPECIALS[strategy.special].name + ', energia ' + Math.floor(arcana),
      );
      $('arsenalSwitch').disabled = ARSENAL.filter((item) => item.stage <= stage()).length < 2;
      $('specialSwitch').disabled = SPECIALS.filter((item) => item.stage <= stage()).length < 2;
      $('orbitControls').hidden = !boss;
      const level = stage();
      const nextXp = xpForStage(level + 1);
      const previousXp = xpForStage(level);
      const progress = Math.min(1, (strategy.xp - previousXp) / Math.max(1, nextXp - previousXp));
      const benefits = progressionBenefits(strategy.xp, strategy.specialty);
      const unlock = nextRpgUnlock(level);
      $('rpgLevel').textContent = 'EV ' + (level + 1);
      $('rpgProgressBar').style.width = progress * 100 + '%';
      $('rpgNext').textContent = unlock
        ? 'PRÓXIMO · ' + unlock.type + ' ' + unlock.name + ' · EV ' + (unlock.stage + 1)
        : 'ARSENAL COMPLETO';
      $('strategyStatus').textContent =
        'XP ' +
        strategy.xp +
        '/' +
        nextXp +
        ' · ATAQUE +' +
        benefits.attack +
        '% · ESCUDO +' +
        benefits.shield +
        ' · AGILIDADE +' +
        benefits.agility +
        '% · ARCANA +' +
        benefits.arcana +
        '%' +
        (barrier > 0
          ? ' · BARREIRA ' + Math.ceil(barrier) + 's'
          : stasis > 0
            ? ' · ESTASE ' + Math.ceil(stasis) + 's'
            : '');
    }
    invuln -= dt;
    rollCd -= dt;
    // Dash timer is advanced inside piloting, never by a separate wall clock.
    // Touch briefing owns the radio lane; retain the pending real message until
    // it can be shown. Desktop and native keep their existing timer contract.
    if (!(dynamicFlight && coarsePointer.matches && stageIntroTime > 0)) msgTime -= dt;
    if (msgTime <= 0) $('comms').classList.remove('active');
    const { speed, previousPlayer, holding } = updatePiloting(dt);
    const reflex = reflexBoost.update(dt, {
      boosting: dynamicFlight && boosting,
      energy,
      threats: nearbyHostileThreats(hostile, player.position),
      enabled:
        dynamicFlight &&
        state === 'playing' &&
        (sectorIndex !== 0 || orbitalLaunchSequence.snapshot().complete),
    });
    if (reflex.activated) {
      energy = Math.max(0, energy - reflex.energyCost);
      message('REFLEX BOOST · CÂMERA LENTA / DESVIE DOS PROJÉTEIS');
    }
    if (reflex.active) document.body.classList.add('reflex-boost');
    else document.body.classList.remove('reflex-boost');
    const hostileDt = dt * reflex.hostileTimeScale;
    spawnCd -= dt;
    // Never accumulate a huge overdue spawn while the spacecraft boards a
    // world. The first formation approaches from deep offscreen, not as a
    // synchronized pop immediately after an arrival gate becomes false.
    if (shouldKeepArrivalCooldown(sectorIndex, elapsed, arrivalTransit))
      spawnCd = Math.max(spawnCd, 1.35);
    // Keep the authored train and Super Boost readable; allow a short recovery
    // after reaching real orbit, then stage combat in separate beats.
    const cityPacing = stageOneEncounterWindows(
      elapsed,
      sectorIndex === 0 ? orbitalLaunchSequence.snapshot().phase : 'city',
      cityOrbitReadyAt,
      dynamicFlight && sectorIndex === 0 && enableCitySetpieces,
      sectorIndex === 0 ? orbitalLaunchSequence.snapshot().atmosphereSeconds : 0,
    );
    const quietFirstSubboss =
      (!cityPacing.ascentCombat &&
        dynamicFlight &&
        firstSubbossQuiet(sectorIndex, elapsed, current().duration)) ||
      cityPacing.subbossIntroQuiet;
    const quietCityWreck = cityPacing.exclusiveTransit;
    if (quietFirstSubboss) spawnCd = Math.max(2.4, spawnCd);
    if (
      spawnEncounters &&
      fighterAllowedDuringArrival(sectorIndex, elapsed, arrivalTransit) &&
      !europaTunnelCrossing &&
      elapsed < current().duration &&
      spawnCd <= 0 &&
      !quietFirstSubboss &&
      (!quietCityWreck || cityPacing.ascentCombat)
    ) {
      const cityDensity =
        dynamicFlight && sectorIndex === 0
          ? stageOneCombatDensity(
              settings.difficulty,
              cityPacing.orbitAge !== null,
              enemies.filter((target) => !target.dead && target.kind === 'fighter').length,
              cityPacing.ascentCombat,
            )
          : null;
      const count = cityDensity?.count ?? 2 + Math.floor(sectorIndex / 4);
      // When the GPU-safe active cap is reached, retry later instead of
      // allocating another overlapping formation or skipping a wave cycle.
      if (count > 0) {
        if (dynamicFlight) {
          const wave = fighterWaveAt(sectorIndex, fighterWaveSerial++, count);
          lastFighterWave = { name: wave.name, rhythm: wave.rhythm, cycle: wave.cycle };
          wave.slots.forEach((slot, arrivalIndex) => enemy('fighter', { ...slot, arrivalIndex }));
          if (wave.cycle === 0 && sectorIndex > 0) message('FORMAÇÃO INIMIGA · ' + wave.name);
        } else {
          for (let i = 0; i < count; i++) enemy();
        }
      }
      spawnCd =
        count === 0
          ? 1.25
          : (cityDensity?.interval ??
            (dynamicFlight
              ? fighterInterval(sectorIndex, settings.difficulty)
              : 3.4 - sectorIndex * 0.12));
    }
    if (
      spawnEncounters &&
      !arrivalTransit &&
      !europaTunnelCrossing &&
      !quietCityWreck &&
      cityPacing.canSpawnSubboss &&
      // In the asteroid sector, the subboss must follow the completed
      // obstacle course, never appear inside its narrow passages.
      (sectorIndex !== 2 || !dynamicFlight || asteroidInterior.course.snapshot().complete) &&
      !subDone &&
      elapsed >
        (sectorIndex === 1 && dynamicFlight
          ? MARS_TOUCHDOWN_SECONDS + (current().duration - MARS_TOUCHDOWN_SECONDS) * 0.22
          : current().duration * 0.22)
    ) {
      subDone = true;
      enemy('subboss');
      $('subHUD').hidden = false;
      music?.start(sectorIndex, 'subboss');
      message('SUBCHEFE / ' + SUBBOSS_NAMES[sectorIndex]);
    }
    if (
      spawnEncounters &&
      !arrivalTransit &&
      !europaTunnelCrossing &&
      cityPacing.canSpawnSubboss &&
      !rivalDone &&
      elapsed >
        (sectorIndex === 1 && dynamicFlight
          ? MARS_TOUCHDOWN_SECONDS + (current().duration - MARS_TOUCHDOWN_SECONDS) * 0.7
          : current().duration * 0.7)
    ) {
      rivalDone = true;
      enemy('rival');
      message('CAÇA RIVAL / NÃO DEIXE QUE ELE ENCERRE A MISSÃO');
    }
    if (
      spawnEncounters &&
      !baseDone &&
      !quietCityWreck &&
      cityPacing.canSpawnBase &&
      // Post-orbit base encounter must not overlap the first subboss.
      (!(dynamicFlight && sectorIndex === 0 && enableCitySetpieces) ||
        (subDone && !enemies.some((enemy) => !enemy.dead && enemy.kind === 'subboss'))) &&
      sectorIndex < 2 &&
      elapsed > 18 &&
      !(dynamicFlight && firstSubbossObstacleQuiet(sectorIndex, elapsed, current().duration))
    ) {
      baseDone = true;
      enemy('base');
      message('BASE-SERVIDOR / ELIMINE A TORRE PARA RECEBER SUPRIMENTOS');
    }
    groundCd -= dt;
    // One airborne mech patrol at a time intercepts the climb from deep space.
    // Actual city tanks remain on streets; never move heavy ground units into orbit.
    if (
      dynamicFlight &&
      spawnEncounters &&
      sectorIndex === 0 &&
      cityPacing.ascentCombat &&
      !quietFirstSubboss &&
      groundCd <= 0
    ) {
      const activeMechs = enemies.filter((target) => !target.dead && target.airborneRobot).length;
      if (activeMechs === 0) {
        groundWave++;
        enemy('hover-walker', {
          x: groundWave % 2 ? -23 : 23,
          y: Math.max(12, Math.min(verticalFlightLimit() - 6, player.position.y + 5)),
        });
      }
      groundCd = 11.5;
    }
    if (
      dynamicFlight &&
      spawnEncounters &&
      sectorIndex === 0 &&
      orbitalLaunch &&
      !quietCityWreck &&
      !quietFirstSubboss &&
      elapsed < current().duration * 0.97 &&
      groundCd <= 0
    ) {
      // Orbital patrols share the same GPU-safe active-fighter budget as the
      // authored formations, so neither spawn path can bypass the cap.
      const activeFighters = enemies.filter(
        (target) => !target.dead && target.kind === 'fighter',
      ).length;
      if (stageOneCombatDensity(settings.difficulty, true, activeFighters).count > 0) {
        groundWave++;
        enemy('fighter');
        groundCd = 7.5;
      } else {
        groundCd = 1.25;
      }
    }
    if (
      spawnEncounters &&
      isGroundSector(current()) &&
      elapsed < current().duration &&
      !arrivalTransit &&
      !europaTunnelCrossing &&
      cityPacing.canSpawnGround &&
      groundCd <= 0 &&
      !quietFirstSubboss &&
      !quietCityWreck &&
      (!dynamicFlight || sectorIndex !== 0 || elapsed < current().duration * 0.56)
    ) {
      groundWave++;
      enemy(
        dynamicFlight && sectorIndex === 0
          ? ['tank', 'walker', 'hover-walker'][(groundWave - 1) % 3]
          : groundWave % 2
            ? 'tank'
            : 'walker',
      );
      groundCd =
        dynamicFlight && sectorIndex === 0
          ? stageOneCombatDensity(settings.difficulty).groundInterval
          : 6;
    }
    if (
      spawnEncounters &&
      isGroundSector(current()) &&
      !tunnelDone &&
      sectorIndex !== 1 &&
      subDone &&
      (!dynamicFlight || sectorIndex !== 0) &&
      elapsed >= 24 &&
      !enemies.some((e) => !e.dead && e.kind === 'subboss')
    ) {
      tunnelDone = true;
      const o = createObstacle(
        'tunnel',
        dynamicFlight && sectorIndex === 5 ? 'europa' : 'standard',
      );
      o.position.z = -230;
      scene.add(o);
      obstacles.push({ o, life: 1, hp: breakableHullHealth(o.userData.kind) });
      if (dynamicFlight && sectorIndex === 5) {
        // No fighter is allowed to phase through a solid frozen wall. Clear
        // only this staged transit and stop spawning until the tunnel passes.
        // A future breach encounter must physically remove its wall collision
        // and play falling debris BEFORE allowing an enemy inside.
        for (const e of enemies) dispose(e.o);
        enemies = [];
        for (const shot of hostile) hostileShotPool.release(shot);
        hostile = [];
        world.setEuropaTunnel?.(true);
        message('FENDA GLACIAL · TÚNEL PROTEGIDO · SIGA A ABERTURA');
      } else message('TÚNEL INDUSTRIAL / SIGA AS SETAS E ELIMINE A DEFESA TERRESTRE');
    }
    const activeSubboss = enemies.some((e) => !e.dead && e.kind === 'subboss');
    const bossBlocked =
      activeSubboss ||
      obstacles.some((o) => o.o.userData.kind === 'tunnel') ||
      (dynamicFlight &&
        sectorIndex === 2 &&
        (!asteroidInterior.course.snapshot().complete || (spawnEncounters && !subDone)));
    const bossSeparated =
      !spawnEncounters ||
      bossEncounterGate({
        elapsed,
        subbossStarted: subDone,
        subbossClearedAt,
        activeSubboss,
        blocked: bossBlocked,
      });
    if (
      bossSeparated &&
      (sectorIndex !== 0 || !dynamicFlight || orbitalLaunchSequence.snapshot().complete) &&
      (shouldWarnBoss({
        elapsed,
        duration: current().duration,
        warned: bossWarned,
        boss: !!boss,
        blocked: bossBlocked,
      }) ||
        (elapsed >= current().duration && !bossWarned && !boss))
    ) {
      bossWarned = true;
      bossWarningTime = 3.5;
      world.showCarrierForBoss?.();
      $('bossIncoming').textContent = '⚠ CHEFE SE APROXIMANDO · SAINDO DA NAVE-MÃE';
      $('bossIncoming').hidden = false;
      cue('critical');
    }
    if (bossWarningTime > 0) {
      bossWarningTime = Math.max(0, bossWarningTime - dt);
      if (bossWarningTime === 0) $('bossIncoming').hidden = true;
    }
    if (
      elapsed >= current().duration &&
      !boss &&
      bossSeparated &&
      bossWarned &&
      bossWarningTime === 0
    )
      makeBoss();
    const phase = boss
      ? 3
      : elapsed < current().duration * 0.32
        ? 0
        : elapsed < current().duration * 0.7
          ? 1
          : 2;
    $('stage').textContent = boss?.userData.sabotage
      ? 'DEVASTADOR · SABOTAGEM'
      : boss
        ? current().boss
        : current().name;
    if (phase !== lastStage) {
      lastStage = phase;
    }
    $('pilotName').textContent =
      (dynamicFlight ? activePilot().name : PILOTS[3 - lives]) +
      ' / ' +
      lives +
      (dynamicFlight ? ' NAVES' : ' VIDAS');
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
    $('podsTouch').textContent = podsDetached ? 'VOLTAR' : 'PODS';
    if (podCount > 0 && podCd <= 0 && (podsDetached || holding) && marsCleanse === 0) {
      podCd = 0.72 - podCount * 0.1;
      for (const p of podMeshes) {
        for (const spread of podsDetached ? [-1, 0, 1] : [0]) {
          launchShot(0, 3 + weapon);
          const shot = shots[shots.length - 1];
          shot.o.position.copy(p.position);
          shot.source = 'pod';
          shot.damage *= podLaserMultiplier(podCount, stage());
          shot.o.scale.setScalar(1 + Math.min(18, stage()) * 0.07);
          shot.spread = spread * (8 + podCount * 2);
          if (podCount === 3 || (dynamicFlight && podsDetached)) shot.homing = true;
        }
      }
    }

    for (let e of enemies) {
      if (e.dead) continue;
      e.age += hostileDt;
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
      if (e.role) {
        const approachAge = fighterArrivalAge(sectorIndex, e.age, e.arrivalIndex);
        const flightStep = approachAge > 0 ? hostileDt : 0;
        e.o.position.z = fighterAdvance(e.o.position.z, approachAge, flightStep, speed);
      } else if (e.subbossTactic) {
        const motion = subbossMotion(sectorIndex, e.age, e.combatPhase, e.x, e.y);
        e.o.position.set(motion.x, motion.y, motion.z);
        e.o.rotation.z = motion.bank;
      } else
        e.o.position.z +=
          hostileDt *
          (e.kind === 'subboss'
            ? Math.max(0, (-85 - e.o.position.z) * 1.4)
            : e.ground
              ? speed
              : e.elite
                ? e.o.position.z < -55
                  ? speed
                  : 6
                : speed + 12);
      if (!e.subbossTactic) {
        e.o.position.x = e.ground
          ? e.x + (e.airborneRobot ? Math.sin(e.age * 0.85 + e.phase) * 4 : 0)
          : e.kind === 'base'
            ? e.x * 0.7
            : e.x + Math.sin(elapsed * (e.kind === 'rival' ? 2 : 1.1) + e.phase) * 5;
        e.o.position.y = e.airborneRobot
          ? e.y + Math.sin(e.age * 2.1 + e.phase) * 2.8
          : e.ground
            ? -7
            : e.kind === 'base'
              ? -1
              : e.y + Math.sin(elapsed + e.phase) * 2;
      }
      if (e.airborneRobot) {
        if (sectorIndex === 0 && cityPacing.ascentCombat)
          e.y = T.MathUtils.damp(
            e.y,
            Math.max(12, Math.min(verticalFlightLimit() - 6, player.position.y + 5)),
            1.4,
            hostileDt,
          );
        e.o.rotation.z = Math.sin(e.age * 0.85 + e.phase) * 0.12;
        e.o.traverse((part) => {
          if (part.name === 'enemy-hover-thruster')
            part.scale.y = 0.72 + Math.sin(e.age * 16 + e.phase) * 0.25;
        });
      }
      if (e.role) {
        const motion = fighterMotion(
          e.role,
          e.age,
          e.x,
          e.y,
          player.position.x,
          e.phase,
          player.position.y,
        );
        e.o.position.x = motion.x;
        e.o.position.y = motion.y;
        e.o.rotation.z = motion.bank;
        e.attackGlow.visible = e.cd <= 0.55 && e.cd > 0 && e.o.position.z < -15;
        e.attackGlow.scale.setScalar(6 + Math.sin(e.age * 20) * 2);
      }
      if (e.europaBreach) {
        // The enemy enters from OUTSIDE through the now-open right-hand
        // aperture, traveling with the moving tunnel so it never phases
        // through an intact wall or pops into the corridor mid-flight.
        const breach = Math.min(1, e.age / 1.45);
        const eased = breach * breach * (3 - 2 * breach);
        e.o.position.set(
          52 - eased * 36,
          20 + Math.sin(e.age * 1.6) * 1.1,
          e.europaBreach.position.z - 220,
        );
        e.o.rotation.z = -0.2 * (1 - eased);
      }
      // First-sector subbosses retreat after a real combat window if not defeated.
      // They do not award kills/XP and must not block the orbital boss indefinitely.
      const departure =
        dynamicFlight && sectorIndex === 0 && e.kind === 'subboss'
          ? firstSubbossDeparture(sectorIndex, e.age)
          : null;
      if (departure?.complete) {
        subbossClearedAt = elapsed;
        dispose(e.o);
        e.dead = true;
        $('subHUD').hidden = true;
        music?.start(sectorIndex);
        message('SUBCHEFE RECUOU / PERSEGUIÇÃO ORBITAL LIBERADA', 'christopher');
        continue;
      }
      if (departure?.retreating) {
        if (e.attackGlow) e.attackGlow.visible = false;
        $('subState').textContent = 'SUBCHEFE EM RETIRADA';
        continue;
      }
      if (e.kind === 'subboss') {
        $('subHealth').style.width = Math.max(0, (e.life / e.maxLife) * 100) + '%';
        const windup = e.subbossTactic ? subbossWindup(sectorIndex, e.combatPhase) : 0.6;
        if (e.attackGlow) {
          e.attackGlow.visible = e.cd <= windup && e.cd > 0 && e.o.position.z < -15;
          e.attackGlow.scale.setScalar(10 + Math.sin(e.age * 22) * 3);
        }
        if (e.cd < windup)
          $('subState').textContent = e.subbossTactic
            ? '⚠ ' + e.subbossTactic.attack
            : '⚠ CANHÕES CARREGANDO';
        else
          $('subState').textContent = dynamicFlight
            ? SUBBOSS_NAMES[sectorIndex] +
              ' · FASE ' +
              e.combatPhase +
              ' · FRACO: ' +
              ARSENAL.find((w) => w.element === weaknessAt(e.variant, e.combatPhase)).name +
              (e.age % 6 < 1.5 ? ' · ESCUDO' : '')
            : SUBBOSS_NAMES[sectorIndex];
      }
      if (e.kind === 'walker' || e.airborneRobot) {
        const pose = robotAttackPose(
          e.age,
          e.x,
          e.y,
          e.variant,
          player.position.x,
          e.airborneRobot,
        );
        e.o.position.x = pose.x;
        e.o.position.y = pose.y;
        e.o.rotation.z = pose.bank;
        e.o.userData.combatState = pose.deployed ? 'attacking' : 'deploying';
      }
      if (e.ground)
        animateGroundEnemy(
          e.o,
          elapsed,
          player.position,
          e.age,
          (e.kind === 'walker' || e.airborneRobot) &&
            e.age >= 1.9 &&
            e.cd <= ROBOT_EYE_WARNING_SECONDS &&
            e.cd > 0,
        );
      e.cd -= hostileDt * (e.chilled > 0 ? 0.5 : 1);
      if (
        e.cd <= 0 &&
        e.o.position.z < -15 &&
        (!e.role || fighterMayFireAtDepth(sectorIndex, e.o.position.z)) &&
        (!(e.kind === 'walker' || e.airborneRobot) ||
          robotEyeBurstReady(e.age, e.o.position.z, e.cd))
      ) {
        const introductorySubboss =
          dynamicFlight && e.kind === 'subboss' && firstSubbossWarmup(sectorIndex, e.age);
        if (e.kind === 'walker' || e.airborneRobot) {
          const eyes = hostileMuzzles(e);
          // Every hostile projectile comes from a visible red eye, not an
          // arbitrary offset under the body. Genuine collision is unchanged.
          for (const eye of eyes) bullet(eye, player.position.clone(), 'eye-ray');
          fireGroundRobotEyes(e.o, e.age);
        } else
          for (const offset of introductorySubboss
            ? [0]
            : e.role
              ? fighterAimOffsets(e.role)
              : e.subbossTactic
                ? e.subbossTactic.aim
                : [0])
            bullet(
              hostileMuzzles(e)[Math.abs(Math.round(offset)) % 2] ??
                hostileMuzzles(e)[0] ??
                e.o.position.clone(),
              player.position.clone().add(new T.Vector3(offset, 0, 0)),
              e.subbossTactic?.spell ?? '',
            );
        if (e.attackGlow) e.attackGlow.visible = false;
        if (e.kind === 'subboss' && !introductorySubboss)
          for (const target of encounterPattern(
            sectorIndex,
            elapsed,
            player.position,
            e.combatPhase,
          ))
            bullet(
              hostileMuzzles(e)[0] ?? e.o.position.clone(),
              target,
              e.subbossTactic?.spell ?? '',
            );
        e.cd =
          (e.kind === 'subboss'
            ? dynamicFlight
              ? subbossCooldown(sectorIndex, e.combatPhase) * (introductorySubboss ? 1.5 : 1)
              : 1.5
            : e.role
              ? 1.8
              : e.kind === 'walker' || e.airborneRobot
                ? 2.9 - (e.variant % 3) * 0.18
                : 2.3) * (dynamicFlight ? difficultyProfile(settings.difficulty).shotDelay : 1);
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
        if (e.kind === 'subboss') {
          // A subboss leaving past the player's camera also resolves the encounter.
          // Without this timestamp, the final encounter could stay blocked forever.
          subbossClearedAt = elapsed;
          $('subHUD').hidden = true;
          music?.start(sectorIndex);
        }
        dispose(e.o);
        e.dead = true;
      }
    }
    if (boss) {
      if (dynamicFlight && boss.userData.sabotage) {
        // System-level 360° sabotage; do not run the generic boss AI.
        const turn =
          ((keys.has('KeyL') ? 1 : 0) - (keys.has('KeyJ') ? 1 : 0) + orbitTouch) * dt * 0.8;
        orbitAngle = Math.atan2(Math.sin(orbitAngle + turn), Math.cos(orbitAngle + turn));
        boss.rotation.y = -orbitAngle;
        world.setOrbit(-orbitAngle, boss.position);
        boss.position.z = T.MathUtils.lerp(boss.position.z, -164, Math.min(1, dt * 0.7));
        boss.position.y = T.MathUtils.lerp(boss.position.y, 17, Math.min(1, dt * 0.7));
        if (turn)
          for (const shot of [...shots, ...hostile]) {
            shot.o.position
              .sub(boss.position)
              .applyAxisAngle(new T.Vector3(0, 1, 0), -turn)
              .add(boss.position);
            if (shot.v) shot.v.applyAxisAngle(new T.Vector3(0, 1, 0), -turn);
          }
        renderBossRadar(document, null);
        $('battleRadar').style.background = 'conic-gradient(#3fc6df, #fda664, #304d63, #3fc6df)';
        $('radarPlayer').style.transform = 'rotate(' + orbitAngle + 'rad)';
        const objective = sabotageRadarTarget(boss.userData.parts, relativeOrbit());
        $('radarWeak').hidden = !objective;
        if (objective) $('radarWeak').style.transform = 'rotate(' + objective.angle + 'rad)';
        $('tacticState').textContent = 'SABOTAGEM · ORBITE 360°';
      } else if (dynamicFlight) {
        const turn =
          ((keys.has('KeyL') ? 1 : 0) - (keys.has('KeyJ') ? 1 : 0) + orbitTouch) * dt * 0.8;
        orbitAngle = Math.atan2(Math.sin(orbitAngle + turn), Math.cos(orbitAngle + turn));
        if (sectorIndex === 7) {
          // The pilot orbits a stationary Saturn arena. Omega holds its heading
          // until the pilot spends 1.8 s on either flank or behind it; only then
          // does its hull counterturn smoothly. Saturn and rings stay still.
          boss.userData.omegaRearResponse = advanceOmegaRearResponse(
            boss.userData.omegaRearResponse,
            orbitAngle,
            dt,
            bossCombat.phase,
            tactics().state,
          );
          boss.rotation.y = boss.userData.omegaRearResponse.heading - orbitAngle;
        } else boss.rotation.y = tactics().heading - orbitAngle;
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
          const open = bossTargetOpen(i) && p.hp > 0;
          p.mesh.scale.setScalar(open ? 1.18 : 0.75);
          const discovered = weakpointEvidence[i]?.revealed;
          // Omega always marks its two destructible armored modules; cool
          // markers mean shielded, amber means discovered, yellow means
          // physically vulnerable from the current orbital approach.
          p.marker.visible = (sectorIndex === 7 && p.hp > 0) || open || (discovered && p.hp > 0);
          if (p.marker.userData.signalMaterial)
            p.marker.userData.signalMaterial.color.set(
              open ? '#fff27a' : discovered ? '#ff925b' : '#6db8d2',
            );
          p.marker.rotation.z += dt * (i ? -1.5 : 1.5);
          p.marker.scale.setScalar(1 + Math.sin(visualTime * 7 + i) * 0.1);
        });
      }
      bossCombat.update(hostileDt);
      const combatPhase = bossCombat.phase;
      if (music?.snapshot().mode !== (combatPhase === 3 ? 'enraged' : 'boss'))
        music?.start(sectorIndex, combatPhase === 3 ? 'enraged' : 'boss');
      let radarPlan = null;
      if (dynamicFlight && !boss.userData.sabotage) {
        const t = tactics();
        if (t.state === 'windup' && bossIntentCycle !== t.cycle) {
          bossIntent = chooseBossIntent({
            sector: sectorIndex,
            cycle: t.cycle,
            phase: combatPhase,
            playerX: player.position.x,
            playerY: player.position.y,
            orbit: relativeOrbit(),
            boosting,
            robot: robotMode,
            generators: boss.userData.parts.map((part) => part.hp > 0),
          });
          bossIntentCycle = t.cycle;
          bossMeleeResolved = false;
        }
        const attackAge = Math.max(0, bossCombat.age - 8) % t.period;
        const meleePose = bossMeleePose(
          bossIntent,
          t.state,
          t.state === 'attack' ? attackAge - 2.2 : attackAge,
        );
        const approach = 1 - Math.pow(1 - Math.min(1, bossCombat.age / 3), 3);
        // Cinematic 3 s launch: boss exits the ship's central bay in the
        // background before following its existing tactic trajectory.
        const launchPose = bossDepartureAt(bossCombat.age, t, approach);
        if (sectorIndex === 7) {
          boss.userData.omegaPursuit = chaseOmegaOffset(
            boss.userData.omegaPursuit ?? { x: 0, y: 0 },
            player.position,
            dt,
            t.state,
          );
        }
        boss.position.set(
          launchPose.x + (sectorIndex === 7 ? boss.userData.omegaPursuit.x : 0),
          sectorIndex === 5
            ? europaBossArenaHeight(launchPose.y, boss.userData.europaMinimumCenterY)
            : launchPose.y + (sectorIndex === 7 ? boss.userData.omegaPursuit.y : 0),
          sectorIndex === 5 ? europaBossArenaDepth(launchPose.z) : launchPose.z + meleePose.lunge,
        );
        // Use the same center for both inverse world frame and final camera
        // presentation, even while Omega moves: Saturn/rings stay stationary.
        if (sectorIndex === 7) world.setOrbit(-orbitAngle, boss.position);
        boss.rotation.z = t.bank;
        // Each real drive valve powers its own reactor-exhaust shock. Breaking
        // that valve removes the plume and its physical attack on that flank.
        for (const [sideIndex, plume] of (boss.userData.driveShockPlumes ?? []).entries()) {
          const side = sideIndex ? 1 : -1;
          const active =
            bossIntent?.kind === 'reactor-vent' &&
            bossIntent.ventSide === side &&
            boss.userData.parts[sideIndex]?.hp > 0 &&
            (t.state === 'windup' || t.state === 'attack');
          plume.visible = !!active;
          if (active) {
            const intensity = Math.max(0.06, meleePose.exhaust);
            plume.scale.set(0.6 + intensity * 1.4, 0.5 + intensity * 1.7, 0.6 + intensity * 1.4);
            plume.position.z = boss.userData.parts[sideIndex].mesh.position.z + 16 * plume.scale.y;
            plume.material.opacity = Math.min(0.95, 0.36 + intensity * 0.46);
          }
        }
        if (
          t.state === 'attack' &&
          bossIntent &&
          bossIntent.kind !== 'barrage' &&
          !bossMeleeResolved &&
          attackAge >= 2.72
        ) {
          bossMeleeResolved = true;
          if (
            !bossBatteryPlan(boss.userData.parts.map((p) => p.hp > 0)).suppressMelee &&
            (bossIntent.kind !== 'reactor-vent' ||
              boss.userData.parts[bossIntent.ventSide < 0 ? 0 : 1]?.hp > 0) &&
            // A destroyed Hydra head immediately cancels its paired beam,
            // never landing invisible damage from an already broken gun.
            (bossIntent.kind !== 'hydra-two-head-crossfire' ||
              boss.userData.parts.every((part) => part.hp > 0)) &&
            bossMeleeHit(bossIntent, {
              x: player.position.x,
              y: player.position.y,
              orbit: relativeOrbit(),
            })
          ) {
            hit(bossIntent.damage);
            explode(player.position.clone(), 8, 0xff8060);
            cue('armorHit');
          } else {
            message(
              boss.userData.parts.every((part) => part.hp === 0)
                ? 'ARMAS DESTRUÍDAS · ATAQUE CANCELADO'
                : 'ESQUIVA TÁTICA · ATAQUE DO CHEFE EVITADO',
            );
          }
        }
        // The tactical arrow points to the actual animated signature weapon
        // when it exists, instead of always pretending the attack comes from
        // the center of the boss. This does not change collision or targeting.
        const signatureSource = bossIntent?.originMesh ?? bossIntent?.origin;
        const signatureOrigin = signatureSource
          ? boss.getObjectByName(signatureSource)?.getWorldPosition(new T.Vector3())
          : null;
        radarPlan =
          ['windup', 'attack'].includes(t.state) && bossIntent
            ? bossRadarPlan(bossIntent, {
                x: player.position.x,
                y: player.position.y,
                orbit: relativeOrbit(),
                originX:
                  signatureOrigin?.x ??
                  boss.position.x +
                    (bossIntent.kind === 'reactor-vent' ? bossIntent.ventSide * 38 : 0),
                originY: signatureOrigin?.y ?? boss.position.y,
              })
            : null;
        renderBossRadar(document, radarPlan);
        $('battleRadar').style.background = radarPlan ? '#071b20' : radarGradient(t);
        $('radarPlayer').style.transform = 'rotate(' + orbitAngle + 'rad)';
        $('tacticState').textContent =
          t.state === 'windup'
            ? '⚠ ' + t.name
            : t.vulnerable
              ? 'CONTRA-ATAQUE'
              : inDanger(orbitAngle, t)
                ? 'RISCO'
                : 'COBERTURA';
        const objective = bossRadarTarget(
          sectorIndex,
          boss.userData.parts,
          weakpointEvidence,
          relativeOrbit(),
          scanTime > 0,
        );
        $('radarWeak').hidden = !objective;
        if (objective)
          $('radarWeak').style.transform =
            'rotate(' +
            (objective.angle + (sectorIndex === 7 ? orbitAngle + boss.rotation.y : t.heading)) +
            'rad)';
        if (
          bossCombat.age >= 3 &&
          t.state === 'attack' &&
          t.cycle !== lastSpecialCycle &&
          (bossIntent?.kind === 'barrage' || !bossIntent)
        ) {
          lastSpecialCycle = t.cycle;
          const dangerous = inDanger(orbitAngle, t);
          const signature = bossSignatureVolley(
            sectorIndex,
            t.cycle,
            combatPhase,
            boss.userData.parts.map((part) => part.hp > 0),
          );
          if (signature) {
            // Projectiles originate from actual robot arms, drill ring, hydra
            // heads or Marvin's crown. Broken generators disable side batteries.
            boss.updateMatrixWorld(true);
            const generators = boss.userData.parts.map((part) => part.hp > 0);
            const budget = bossBatteryPlan(generators, signature.shots.length);
            let fired = 0;
            for (const emission of signature.shots) {
              if (fired >= budget.sides.length) break;
              const side = batteryForSignature(emission.origin, generators);
              if (side === null || (side === 0 && fired > 0)) continue;
              const origin = bossMuzzle(side);
              if (!origin) continue;
              const spread = dangerous ? 0.72 : 1.15;
              const destination = player.position
                .clone()
                .add(new T.Vector3(emission.target[0] * spread, emission.target[1] * spread, 0));
              bullet(origin, destination, emission.element, sectorIndex);
              fired++;
            }
            // Keep one readable fallback shot from the only live weapon.
            // After both side modules are destroyed the emergency core is
            // the ONLY valid origin; no invisible fire from destroyed guns.
            if (!fired) {
              const survivingSide = generators.some(Boolean) ? budget.sides[0] : 0;
              bullet(bossMuzzle(survivingSide), player.position.clone(), 'fire', sectorIndex);
            }
          } else {
            for (let n = 0; n < (dangerous ? 3 : 1); n++) {
              const side =
                bossBatteryPlan(
                  boss.userData.parts.map((p) => p.hp > 0),
                  3,
                ).sides[n] ?? 0;
              const origin = bossMuzzle(side);
              for (const target of encounterPattern(
                sectorIndex,
                t.cycle + n,
                player.position,
                dangerous ? 3 : 1,
              ))
                bullet(origin, target, sectorIndex % 2 ? 'arcane' : 'fire', sectorIndex);
            }
          }
        }
      } else if (!dynamicFlight) {
        boss.position.z = T.MathUtils.lerp(boss.position.z, -88, dt * 0.7);
        boss.position.x = Math.sin(elapsed * 0.3) * 7;
        boss.position.y = 10 + Math.sin(elapsed * 0.4) * 3;
      }
      if (!boss.userData.sabotage)
        boss.userData.rotors.forEach((o, i) => (o.rotation.z += dt * (i % 2 ? -0.14 : 0.2)));
      const t = dynamicFlight && !boss.userData.sabotage ? tactics() : null;
      const poseAge = t ? Math.max(0, bossCombat.age - 8) % t.period : 0;
      const melee = bossMeleePose(
        bossIntent,
        t?.state,
        t?.state === 'attack' ? poseAge - 2.2 : poseAge,
      );
      boss.userData.organic?.forEach((o, i) => {
        o.rotation.z = Math.sin(elapsed * 1.8 + i) * 0.1 + melee.tentacle * (i % 2 ? -1 : 1);
        o.rotation.x = melee.tentacle * 0.32;
      });
      boss.userData.jaw.rotation.x = Math.sin(elapsed * 2) * 0.12 + melee.jaw;
      const biteJaw = boss.getObjectByName('marvin-bite-jaw');
      if (biteJaw) biteJaw.rotation.x = melee.jaw;
      for (const [name, side] of [
        ['marvin-left-claw', -1],
        ['marvin-right-claw', 1],
      ]) {
        const claw = boss.getObjectByName(name);
        if (claw) {
          claw.rotation.z = side * melee.claw;
          claw.rotation.x = melee.claw * 0.4;
        }
      }
      if (dynamicFlight && !boss.userData.sabotage) {
        // Lock the physical claw to the attack's real telegraphed world-space
        // target. Dodging changes the player's position, NOT the latched aim.
        // Transforming the point to boss-local space also preserves orbit.
        const europaTarget =
          sectorIndex === 5 && bossIntent && ['windup', 'attack'].includes(tactics().state)
            ? boss.worldToLocal(
                new T.Vector3(bossIntent.targetX, bossIntent.targetY, player.position.z - 7),
              )
            : null;
        animateBossSignature(
          boss,
          sectorIndex,
          bossCombat.age,
          combatPhase,
          tactics().state,
          bossIntent?.kind,
          melee,
          sectorIndex === 5 ? bossIntent : null,
          europaTarget,
        );
      }
      boss.userData.core.scale.setScalar(1 + Math.sin(visualTime * 5) * 0.07);
      const remaining = boss.userData.parts.filter((p) => p.hp > 0).length;
      const sabotagePhase = boss.userData.sabotage
        ? updateDevastadorSabotageCore(boss, { orbit: orbitAngle, time: bossCombat.age })
        : null;
      const openGenerator = boss.userData.parts.findIndex(
        (p, i) => p.hp > 0 && (!dynamicFlight || bossTargetOpen(i)),
      );
      const coreVulnerable =
        remaining === 0 &&
        bossCoreOpen() &&
        (!dynamicFlight || boss.userData.sabotage || weakPointOpen(relativeOrbit()));
      boss.userData.coreMarker.visible = coreVulnerable;
      boss.userData.coreMarker.rotation.z -= dt * 1.8;
      boss.userData.coreMarker.scale.setScalar(1 + Math.sin(visualTime * 8) * 0.12);
      boss.userData.vents.forEach((v, i) => {
        v.visible = bossHp / bossCombat.max > 0.65 || i % 3 !== 0;
      });
      boss.userData.core.scale.setScalar(bossCoreOpen() ? 1.1 : 0.7);
      $('bossHUD').setAttribute?.('data-vulnerable', String(openGenerator >= 0 || coreVulnerable));
      $('bossState').textContent =
        bossCombat.age < 3
          ? 'APROXIMAÇÃO'
          : remaining
            ? openGenerator >= 0
              ? (sectorIndex === 7 ? 'ÔMEGA · PEÇA DESTRUTÍVEL FRACA · ' : 'ARMA VULNERÁVEL · ') +
                (openGenerator === 0 ? 'BATERIA ESQ.' : 'BATERIA DIR.')
              : sectorIndex === 7
                ? 'ÔMEGA · PEÇAS AZUIS BLINDADAS · ORBITE FLANCO OU COSTAS'
                : 'BLINDAGEM · CORPO RECEBE DANO REDUZIDO · ORBITE PARA O FLANCO'
            : 'FASE ' +
              combatPhase +
              ' · ' +
              (coreVulnerable
                ? 'ALVO VULNERÁVEL · NÚCLEO'
                : bossCombat.coreOpen
                  ? 'ORBITE PARA A FRENTE'
                  : 'BLINDAGEM · DANO REDUZIDO');
      if (sabotagePhase) {
        $('bossState').textContent =
          'DESATIVE ' +
          sabotagePhase.label +
          (sabotagePhase.remaining
            ? ' · ' + sabotagePhase.remaining + ' ALVOS'
            : ' · FOGO NO REATOR');
      }
      if (sectorIndex === SECTORS.length - 1 && combatPhase === 3 && remaining === 0)
        $('bossState').textContent =
          'ÚLTIMA RESISTÊNCIA DE MARVIN · ' +
          (bossCoreOpen() ? 'NÚCLEO EXPOSTO' : 'BLINDAGEM ATIVA');
      if (dynamicFlight && scanTime > 0)
        $('bossState').textContent +=
          ' · FRACO: ' +
          ARSENAL.find((w) => w.element === weaknessAt(sectorIndex, combatPhase)).name;
      bossCd -= hostileDt;
      if (!boss.userData.sabotage) {
        const charging =
          dynamicFlight && tactics().state === 'windup' && bossIntent?.kind === 'barrage'
            ? 1
            : !dynamicFlight || (dynamicFlight && tactics().state === 'maneuver')
              ? 1 - Math.max(0, Math.min(1, bossCd / 0.9))
              : 0;
        animateBossWeaponVfx(boss, bossCombat.age, charging, hostileDt);
      }
      $('attackWarning').setAttribute?.(
        'data-severity',
        radarPlan?.threatened === false ? 'info' : 'danger',
      );
      const physicalWarning =
        dynamicFlight &&
        bossIntent &&
        ['windup', 'attack'].includes(tactics().state) &&
        bossIntent.kind !== 'barrage'
          ? bossIntent.label
          : null;
      const signatureWarning =
        dynamicFlight && tactics().state === 'windup' && bossIntent?.kind === 'barrage'
          ? bossSignatureVolley(
              sectorIndex,
              tactics().cycle,
              combatPhase,
              boss.userData.parts.map((part) => part.hp > 0),
            )?.name
          : null;
      $('attackWarning').textContent = physicalWarning
        ? '⚠ ' +
          physicalWarning +
          (radarPlan?.threatened ? ' · SIGA A ZONA VERDE DO RADAR' : ' · POSIÇÃO SEGURA')
        : signatureWarning
          ? '⚠ ' + signatureWarning + ' · MUDE DE POSIÇÃO'
          : bossCd < 0.65
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
      if (boss.userData.sabotage)
        $('attackWarning').textContent = 'SABOTAGEM · ' + sabotagePhase.label;
      if (dynamicFlight && !boss.userData.sabotage && !physicalWarning && bossCd < 0.65)
        $('attackWarning').textContent +=
          (bossVolley + 1) % 3 === 0 ? ' · ORBES ARCANOS' : ' · PLASMA';
      // Only one targeted volley per maneuver; never spray generic bullets
      // over the physical strike window.
      const allowRanged =
        !boss.userData.sabotage &&
        (!dynamicFlight || (tactics().state === 'maneuver' && lastRangedCycle !== tactics().cycle));
      if (bossCd <= 0 && bossCombat.age >= 3 && allowRanged) {
        lastRangedCycle = tactics().cycle;
        bossVolley++;
        const program = bossAttackProgram(sectorIndex, combatPhase, bossVolley);
        if (dynamicFlight) {
          // Bosses fire from their own batteries/heads, not the same central barrel.
          const batteryPlan = bossBatteryPlan(
            boss.userData.parts.map((part) => part.hp > 0),
            program.sources.length,
          );
          for (const [sourceIndex, side] of batteryPlan.sides.entries()) {
            const source = program.sources[sourceIndex % program.sources.length];
            const origin = bossMuzzle(side);
            const targets = encounterPattern(
              sectorIndex,
              source.volley,
              player.position,
              combatPhase,
            );
            for (const [targetIndex, target] of targets.entries()) {
              // Keep a disciplined mobile projectile budget despite multi-origin volleys.
              if (
                program.sources.length > 1 &&
                targetIndex % program.sources.length !== sourceIndex
              )
                continue;
              bullet(origin, target, program.type, sectorIndex);
            }
          }
          bossCd = program.cadence * batteryPlan.cadenceMultiplier;
        } else {
          const origin = bossMuzzle(0);
          for (const target of encounterPattern(
            sectorIndex,
            bossVolley,
            player.position,
            combatPhase,
          ))
            bullet(origin, target, '', sectorIndex);
          bossCd = [2.3, 1.8, 1.25][combatPhase - 1];
        }
      }
    } else $('attackWarning').textContent = '';
    // Resolve walls before damage. At this point obstacles are still at their
    // previous-frame positions; both projectile and obstacle are swept together.
    const projectileOccluded = (from, to) =>
      obstacles.some(
        ({ o, life }) => life > 0 && projectileHitsApproachingObstacle(from, to, o, speed * dt),
      ) ||
      (sectorIndex === 2 && dynamicFlight && asteroidInterior.projectileBlocked(from, to));
    for (let b of shots) {
      const previousShot = b.o.position.clone();
      b.previousPosition = previousShot;
      const prev = b.o.position.z;
      if (b.homing) {
        const enemy = boss ? null : enemies.find((e) => !e.dead);
        const weakPart = boss?.userData.parts.find(
          (p, i) => p.hp > 0 && (!dynamicFlight || bossTargetOpen(i)),
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
      if (b.scatter) b.travelled += dt * 190;
      if (b.v) b.o.position.addScaledVector(b.v, dt);
      else b.o.position.z -= dt * 190;
      b.life -= dt;
      // Destructible carriers and hostile satellites are resolved BEFORE the
      // solid occlusion gate; no phantom collision survives their destruction.
      const struckObstacle =
        b.life > 0
          ? obstacles.find(
              ({ o, life }) =>
                life > 0 &&
                projectileHitsApproachingObstacle(previousShot, b.o.position, o, speed * dt),
            )
          : null;
      if (struckObstacle) {
        if (struckObstacle.hp !== null) {
          const hitHull = damageBreakableHull(struckObstacle.hp, b.damage ?? 2);
          struckObstacle.hp = hitHull.health;
          if (hitHull.destroyed) {
            struckObstacle.life = 0;
            score += struckObstacle.o.userData.kind === 'carrier' ? 140 : 70;
            explode(struckObstacle.o.position.clone(), 11, 0xffa85f);
            message(
              struckObstacle.o.userData.kind === 'carrier'
                ? 'NAVE HOSTIL DESTRUÍDA'
                : 'SATÉLITE HOSTIL DESTRUÍDO',
            );
          } else impact(b.o.position, hitHull.dealt, { heavy: b.source?.startsWith('mecha-') });
        }
        b.life = 0;
        if (dynamicFlight) cue('armorHit');
        continue;
      }
      if (
        b.life > 0 &&
        sectorIndex === 2 &&
        dynamicFlight &&
        asteroidInterior.projectileBlocked(previousShot, b.o.position)
      ) {
        b.life = 0;
        explode(b.o.position, 3, 0xffbf75);
        continue;
      }
      if (b.life > 0 && dynamicFlight && !boss) {
        const rival = marvinRival?.target();
        if (
          rival &&
          crossesSolid(previousShot, b.o.position, rival, new T.Vector3(13, 10, 16), 0.5)
        ) {
          const dealt = marvinRival.hit(b.damage ?? 2);
          impact(impactPoint(previousShot, b.o.position, rival, new T.Vector3(13, 10, 16)), dealt, {
            bossHit: true,
            weak: false,
            heavy: b.source?.startsWith('mecha-'),
          });
          b.life = 0;
        }
      }
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
          const effective =
            (b.damage ?? 2) * (b.scatter ? scatterDamageFactor(b.travelled ?? 0) : 1);
          const dealt = damageEnemy(e, effective * (weak ? 2 : 1), b.element);
          impact(
            impactPoint(
              previousShot,
              b.o.position,
              e.o.position.clone().add(new T.Vector3(0, e.hitY, 0)),
              e.half,
            ),
            dealt,
            { weak: weak && dealt > 0, heavy: b.source?.startsWith('mecha-') },
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
            const dealt = damageBoss(
              (b.damage ?? 2) * (b.scatter ? scatterDamageFactor(b.travelled ?? 0) : 1),
              center,
              b.element,
              b.charged,
              'weak',
              b.source,
            );
            impact(impactPoint(previousShot, b.o.position, center, new T.Vector3(5, 5, 5)), dealt, {
              bossHit: true,
              weak: dealt > 0,
              heavy: b.source?.startsWith('mecha-'),
            });
            b.life = 0;

            break;
          }
        }
        // Hull catches missed/armored shots behind the forward weak-point volumes.
        const hull = new T.Vector3(45, 20, 4);
        if (b.life > 0 && crossesSolid(previousShot, b.o.position, boss.position, hull, 0.2)) {
          const dealt = damageBoss(
            (b.damage ?? 2) * (b.scatter ? scatterDamageFactor(b.travelled ?? 0) : 1),
            boss.position,
            b.element,
            b.charged,
            'hull',
            b.source,
          );
          impact(impactPoint(previousShot, b.o.position, boss.position, hull), dealt, {
            bossHit: true,
            weak: false,
            heavy: b.source?.startsWith('mecha-'),
          });
          b.life = 0;
        }
      }
    }
    for (let b of hostile) {
      const from = b.previousPosition.copy(b.o.position);
      b.age += hostileDt;
      if (b.spell === 'arcane' && b.age < 0.8)
        b.v.lerp(
          player.position.clone().sub(b.o.position).normalize().multiplyScalar(38),
          1 - Math.exp(-2 * hostileDt),
        );
      b.o.position.addScaledVector(b.v, hostileDt * (stasis > 0 ? 0.3 : 1));
      // Real muzzle-to-shot ribbon lasts only through the first combat beats.
      // This is presentation-only; swept collision still uses the same positions.
      hostileShotPool.advanceVisual(b);
      b.life -= hostileDt;
      if (b.life > 0 && projectileOccluded(from, b.o.position)) {
        b.life = 0;
        explode(b.o.position, 3, 0xffbf75);
        continue;
      }
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
    if (spawnEncounters && !arrivalTransit && ringCd < 0 && elapsed < current().duration) {
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
    if (dynamicFlight && spawnEncounters && !arrivalTransit && elapsed < current().duration) {
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
        if (stagePerformance && !r.kind.startsWith('pet:')) stagePerformance.rings++;
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
      dynamicFlight &&
      sectorIndex === 3 &&
      reactorGridSeconds > 0 &&
      spawnEncounters &&
      reactorGridWave < 4 &&
      reactorGridSeconds < 15.8 - reactorGridWave * 3.5
    ) {
      // Reactor hazards remain in front of the chasing fighter; no sudden
      // overhead camera/control mapping or arbitrary X/Z navigation mode.
      const gate = createObstacle('reactor');
      gate.position.set([-17, 18, -12, 13][reactorGridWave], 8, player.position.z - 82);
      scene.add(gate);
      obstacles.push({ o: gate, life: 1 });
      reactorGridWave++;
    }
    // Preserve a clear view during BOOST ascent and the atmospheric crossing.
    // Orbital debris/carriers enter only once the player has reached real orbit.
    const launchTransit =
      dynamicFlight &&
      sectorIndex === 0 &&
      ['boost', 'atmosphere'].includes(orbitalLaunchSequence.snapshot().phase);
    const saturnHazard =
      sectorIndex === 7 ? saturnObstacleKindAt(elapsed, current().duration) : null;
    if (
      spawnEncounters &&
      !launchTransit &&
      !quietCityWreck &&
      !arrivalTransit &&
      (sectorIndex !== 7 || saturnHazard !== null) &&
      !(dynamicFlight && sectorIndex === 1) &&
      reactorGridSeconds <= 0 &&
      obstacleCd <= 0 &&
      elapsed < current().duration &&
      !obstacles.some((o) => o.o.userData.kind === 'tunnel') &&
      !quietFirstSubboss &&
      !(dynamicFlight && sectorIndex === 2 && journey.phase !== 'approach') &&
      !(dynamicFlight && firstSubbossObstacleQuiet(sectorIndex, elapsed, current().duration)) &&
      (sectorIndex !== 0 || !dynamicFlight || orbitalLaunch || elapsed < current().duration * 0.56)
    ) {
      const space = dynamicFlight && (orbitalLaunch || !isGroundSector(current()));
      // No stray carrier colliders in the quiet Saturn approach/arena.
      const kinds = ['satellite', 'carrier', 'debris'];
      const kind =
        sectorIndex === 7
          ? saturnHazard
          : space
            ? kinds[Math.floor(elapsed / 8) % kinds.length]
            : Math.floor(elapsed / 8) % 2
              ? 'gantry'
              : 'reactor';
      const o = createObstacle(kind);
      o.position.set(
        kind === 'gantry' ? 0 : kind === 'reactor' ? rnd(-20, 20) : rnd(-10, 10),
        kind === 'satellite' || kind === 'debris' ? rnd(-3, 3) : 0,
        -230,
      );
      scene.add(o);
      obstacles.push({ o, life: 1, hp: breakableHullHealth(o.userData.kind) });
      obstacleCd = dynamicFlight ? obstacleInterval(sectorIndex, settings.difficulty) : 8;
    }
    for (const obstacle of obstacles) {
      if (obstacle.life <= 0) continue;
      const travel = speed * dt;
      obstacle.o.position.z += travel;
      if (dynamicFlight && sectorIndex === 0 && obstacle.o.userData.kind === 'city-hanging-train')
        animateCityHangingTrainObstacle(obstacle.o, elapsed);
      if (sectorIndex === 5 && dynamicFlight && obstacle.o.userData.europaBreach) {
        const breachDepth = obstacle.o.position.z - 220;
        if (!obstacle.o.userData.breached) {
          // Start the fracture ~0.65 seconds before the enemy's opening.
          // Physical wall and its collision stay intact until impact.
          const warningLead = Math.max(12, speed * 0.65);
          const progress = Math.max(
            0,
            Math.min(1, (breachDepth + 115 + warningLead) / warningLead),
          );
          primeEuropaTunnelBreach(obstacle.o, progress);
        }
        if (!obstacle.o.userData.breached && breachDepth >= -115) {
          if (openEuropaTunnelBreach(obstacle.o)) {
            explode(new T.Vector3(34, 15, breachDepth), 13, 0xb9f3ff);
            enemy('fighter', {
              x: 52,
              y: 20,
              role: FIGHTER_ROLES[0],
              arrivalIndex: 0,
              europaBreach: obstacle.o,
            });
          }
        }
        updateEuropaTunnelBreach(obstacle.o, dt);
      }
      const from = previousPlayer
        .clone()
        .sub(obstacle.o.position)
        .add(new T.Vector3(0, 0, travel));
      const to = player.position.clone().sub(obstacle.o.position);
      if (
        obstacle.o.userData.solids.some((solid) =>
          crossesSolid(
            from,
            to,
            solid.center,
            solid.half,
            shipCollisionMargin(robotMode, rollHeld),
          ),
        )
      )
        hit(30);
      // Stop allied and hostile rounds at actual solid geometry, not after it.
      for (const b of [...shots, ...hostile]) {
        if (b.life <= 0 || !b.previousPosition) continue;
        if (projectileHitsObstacle(b.previousPosition, b.o.position, obstacle.o, travel)) {
          b.life = 0;
          explode(b.o.position, 3, 0xffbf75);
          if (dynamicFlight) cue('armorHit');
        }
      }
      if (obstacle.o.position.z - obstacle.o.userData.length > 50) obstacle.life = 0;
    }
    for (let arr of [shots, hostile, rings, obstacles])
      for (let i = arr.length - 1; i >= 0; i--)
        if (arr[i].life <= 0) {
          if (arr === hostile) hostileShotPool.release(arr[i]);
          else {
            if (arr === obstacles && arr[i].o.userData.europaBreach)
              for (const e of enemies)
                if (e.europaBreach === arr[i].o && !e.dead) {
                  dispose(e.o);
                  e.dead = true;
                }
            dispose(arr[i].o);
          }
          arr.splice(i, 1);
        }
    enemies = enemies.filter((e) => !e.dead);
    if (dynamicFlight && sectorIndex === 5)
      world.setEuropaTunnel?.(
        obstacles.some(({ o, life }) => life > 0 && o.userData.kind === 'tunnel'),
      );
    hud.text('shieldValue', Math.ceil(hp) + ' / ' + maxHp());
    hud.text('speedValue', String(Math.round(lastFlightSpeed * 10)));
    hud.style('shield', 'width', (hp / maxHp()) * 100 + '%');
    hud.hidden('criticalWarning', !dynamicFlight || hp <= 0 || hp > maxHp() * 0.25);
    hud.hidden('shieldWarning', !dynamicFlight || hp <= maxHp() * 0.25 || hp > maxHp() * 0.45);
    hud.hidden('petCareHud', !dynamicFlight);
    hud.text(
      'petCareHud',
      'CUIDADOS · ' + PET_ITEMS.map(({ id, name }) => name + ' ' + petCare[id]).join(' / '),
    );
    hud.text('score', String(score).padStart(3, '0'));
    hud.text('bombs', '◆ '.repeat(bombs) || '—');
    hud.style('energy', 'width', energy + '%');
    hud.cssVar('boostTouch', '--meter', energy + '%');
    hud.attribute('bombTouch', 'data-count', bombs);
    hud.style('progress', 'width', Math.min(100, (elapsed / current().duration) * 100) + '%');
    const integrity = boss
      ? bossIntegrityRatio(boss.userData.parts, bossHp, bossCombat?.max ?? 1400)
      : 0;
    hud.style('bossHealth', 'width', Math.round(integrity * 100) + '%');
    hud.text('bossHealthReadout', Math.round(integrity * 100) + '% INTEGRIDADE');
    hud.attribute('bossHUD', 'data-hit', String(bossHitPulse > 0));
  }
  let last = now();
  function tick(dt, nowMs) {
    if (!appActive) return;
    heroEffects.tick(dt, state === 'playing' || state === 'collapsing');
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
    if (['menu', 'playing', 'collapsing', 'shop', 'map', 'won', 'arcade'].includes(state)) {
      if (state !== 'menu' || menuThemePlaying) music?.update(dt);
    }
    if (state === 'collapsing') updateFinale(dt);
    if (state === 'respawning') {
      respawnTime -= dt;
      player.rotation.z += dt * 7;
      if (damagedCraft?.visible) {
        damagedCraft.position.x += dt * 15;
        damagedCraft.position.y += dt * 8;
        damagedCraft.position.z += dt * 12;
        damagedCraft.rotation.z += dt * 0.55;
      }
      if (respawnTime <= 0) {
        if (pendingPilotRelay) adoptRelayPilot(pendingPilotRelay.next, true);
        pendingPilotRelay = null;
        if (damagedCraft) damagedCraft.visible = false;
        player.rotation.set(0, 0, 0);
        hp = maxHp();
        invuln = 3;
        state = 'playing';
        player.visible = true;
        music?.resume();
        message(
          activePilot().name + ' / ' + activeShip().name + ' ASSUMIU O COMANDO',
          activePilot().id,
        );
      }
    }
    if (state !== 'paused' && state !== 'arcade') {
      visualTime += dt;
      const scenerySpeed =
        (boosting ? 90 : 48) *
        (1 + Math.min(30, stage()) * 0.02) *
        (dynamicFlight ? activePilot().bonuses.speed * (1 + activeShip().stats.agility * 0.08) : 1);
      const sceneryMoving =
        (state === 'playing' && !(dynamicFlight && boss)) ||
        (dynamicFlight && state === 'collapsing');
      world.update(dt, visualTime, scenerySpeed, sceneryMoving, elapsed);
      if (sectorIndex === 2 && dynamicFlight && sceneryMoving) {
        const contact = asteroidInterior.update(dt, scenerySpeed, {
          position: player.position,
          half: asteroidPilotHalf(),
          clearanceHalf:
            pendingAsteroidTransform === null
              ? undefined
              : asteroidPilotHalf(pendingAsteroidTransform),
        });
        if (contact?.collided) asteroidImpact();
        if (
          pendingAsteroidTransform !== null &&
          !asteroidInterior.course.overlaps(
            player.position,
            asteroidPilotHalf(pendingAsteroidTransform),
          )
        ) {
          pendingAsteroidTransform = null;
          toggleRobot();
        }
      }
      const boostVisible = boosting && ['playing', 'collapsing'].includes(state);
      if (boostVisible) document.body.classList.add('boosting');
      else document.body.classList.remove('boosting');
      for (let f of player.userData.flames) {
        f.material.color.set(
          boostVisible
            ? stage() >= 16
              ? '#f8ffff'
              : stage() >= 12
                ? '#d995ff'
                : stage() >= 8
                  ? '#ffd15e'
                  : '#ff9a35'
            : '#78eaff',
        );
        f.scale.set(
          boostVisible ? 1.7 : 1,
          boostTrailLength(stage(), boostVisible) * (boostVisible ? 1.65 : 1) +
            Math.sin(visualTime * 30) * 0.12,
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
          particlePool.release(p);
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
    } else if (state === 'playing') {
      pilotRelay.advance(dt);
      cityPlayerBefore.copy(player.position);
      update(dt);
      if (dynamicFlight && sectorIndex === 0 && state === 'playing') {
        // No global roadway wall: the ship may fly around and beyond the
        // roadside structures throughout the original stage flight arena.
        // Scripted urban rubble shares its visible collision geometry. Resolve
        // swept motion against the same city travel as the scene, not a
        // teleporting obstacle or an invisible trigger plane.
        for (const hazard of world.cityRoadActive() ? world.cityHazards() : []) {
          if (!hazard.active || !hazard.solid) continue;
          citySolidFrom.copy(cityPlayerBefore).sub(hazard.center);
          citySolidFrom.z += hazard.center.z - hazard.previousZ;
          citySolidTo.copy(player.position).sub(hazard.center);
          if (
            resolveCitySolidContact(cityPlayerBefore, player.position, hazard, {
              laneLimit: flightLimit(),
              maxY: verticalFlightLimit(),
            })
          ) {
            cityImpactCount++;
            hit(26);
            shake = Math.max(shake, 0.28);
          }
          for (const shot of [...shots, ...hostile]) {
            if (shot.life <= 0 || !shot.previousPosition) continue;
            citySolidFrom.set(
              shot.previousPosition.x - (hazard.previousX ?? hazard.center.x),
              shot.previousPosition.y - (hazard.previousY ?? hazard.center.y),
              shot.previousPosition.z - (hazard.previousZ ?? hazard.center.z),
            );
            citySolidTo.copy(shot.o.position).sub(hazard.center);
            if (crossesSolid(citySolidFrom, citySolidTo, citySolidOrigin, hazard.half, 0.3)) {
              shot.life = 0;
            }
          }
        }
      }
    } else if (state === 'menu') {
      player.visible = true;
      const small = camera.aspect < 1;
      player.position.set(small ? 0 : 9, small ? 12 : 7, small ? -3 : 5);
      player.rotation.set(0.12, -0.45 + Math.sin(now * 0.0003) * 0.08, -0.12);
      camera.position.set(0, 11, 32);
      camera.lookAt(0, 5, -60);
    }
    audioCues?.setFlight({
      active: dynamicFlight && !muted && ['playing', 'collapsing'].includes(state),
      boosting,
      robot: robotMode,
    });
    // Match the continuous charging sound to the real on-screen plasma meter.
    // Release, pause, blur, mute or a blocked cannon ends the rise immediately.
    audioCues?.setCharge({
      active:
        dynamicFlight &&
        appActive &&
        !muted &&
        state === 'playing' &&
        marsCleanse === 0 &&
        charge > 0.15 &&
        (keys.has('Space') || touchFire),
      progress: charge / 1.5,
    });
    const inside =
      cameraMode === 'cockpit' &&
      (state === 'playing' || (state === 'paused' && pausedFrom === 'playing'));
    barrierVisual.visible =
      dynamicFlight && barrier > 0 && !inside && ['playing', 'paused'].includes(state);
    cockpit?.update(state === 'paused' ? 0 : dt, inside, charge, {
      pilot: activePilot().id,
      steer:
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        stick.x,
      boosting,
    });
    hud.hidden('cockpitPanel', !inside);
    hud.hidden('pilotSwitch', !dynamicFlight || state !== 'playing');
    const relayStatus = pilotRelay.snapshot();
    hud.disabled('pilotSwitch', state !== 'playing' || !relayStatus.canSwitch);
    if (state === 'playing')
      hud.text(
        'pilotSwitch',
        relayStatus.cooldown > 0
          ? 'TROCA · ' + Math.ceil(relayStatus.cooldown) + 's'
          : 'M · TROCAR',
      );
    hud.hidden('tacticalPanel', !dynamicFlight || !boss || !['playing', 'paused'].includes(state));
    hud.hidden(
      'hitFeedback',
      !dynamicFlight || impactTime <= 0 || !['playing', 'paused'].includes(state),
    );
    // For the eight physical Devastador valves, reuse the two lightweight
    // labels for whichever currently vulnerable parts face the pilot.
    const cueTargets = boss?.userData.sabotage
      ? boss.userData.parts
          .map((part, index) => ({ part, index, open: bossTargetOpen(index) }))
          .filter(({ part, open }) => part.hp > 0 && open)
          .slice(0, 2)
      : [0, 1].map((index) => ({
          part: boss?.userData.parts[index],
          index,
          open: Boolean(boss && bossTargetOpen(index)),
        }));
    for (let i = 0; i < 2; i++) {
      const node = $('weakCue' + i);
      const target = cueTargets[i];
      const part = target?.part;
      const cue =
        dynamicFlight && boss
          ? weakpointReadout(part, weakpointEvidence[target?.index], target?.open)
          : null;
      hud.hidden('weakCue' + i, !cue || !['playing', 'paused'].includes(state));
      if (node.hidden) continue;
      boss.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const marker = part.marker.getWorldPosition(new T.Vector3()).project(camera);
      if (
        marker.z <= -1 ||
        marker.z >= 1 ||
        Math.abs(marker.x) > 0.94 ||
        Math.abs(marker.y) > 0.85
      ) {
        hud.hidden('weakCue' + i, true);
        continue;
      }
      hud.text('weakCue' + i, cue.label);
      hud.attribute('weakCue' + i, 'data-state', cue.state);
      hud.style('weakCue' + i, 'left', ((marker.x + 1) * window.innerWidth) / 2 + 'px');
      hud.style('weakCue' + i, 'top', ((1 - marker.y) * window.innerHeight) / 2 + 'px');
    }
    hud.disabled('cameraView', state !== 'playing');
    hud.hidden(
      'strategyControls',
      !dynamicFlight ||
        !['playing', 'paused'].includes(state) ||
        (state === 'paused' && pausedFrom !== 'playing'),
    );
    const qaBerserkVisible = developerAvailable && developerSession && state === 'playing';
    hud.hidden('qaBerserkDock', !qaBerserkVisible);
    if (qaBerserkVisible) {
      hud.text('qaBerserkAction', berserk > 0 ? 'REPETIR BERSERK' : 'ATIVAR BERSERK');
      hud.text(
        'qaBerserkStatus',
        berserk > 0
          ? 'ATIVO · ' + Math.ceil(berserk) + 's · ATAQUE +60%'
          : 'PRONTO · TOQUE PARA ATIVAR',
      );
      hud.attribute('qaBerserkDock', 'data-active', String(berserk > 0));
    }
    // Keep shield telemetry synchronized even while the cockpit is hidden:
    // switching camera must never show stale integrity from a previous frame.
    hud.text(
      'cockpitReadout',
      'ESCUDO ' + Math.ceil((hp / maxHp()) * 100) + '% · ENERGIA ' + Math.ceil(energy) + '%',
    );
    if (inside) {
      hud.text('cockpitPilot', activePilot().name);
      hud.text('cockpitShip', activeShip().name);
      hud.text(
        'cockpitWeapon',
        selectedWeapon().name + (fireMode === 'scatter' ? ' / SCATTER' : ''),
      );
      hud.text('cockpitSpeedValue', String(Math.round(lastFlightSpeed * 10)));
      hud.text(
        'cockpitNav',
        'SETOR ' +
          String(sectorIndex + 1).padStart(2, '0') +
          ' · ' +
          Math.round((elapsed / current().duration) * 100) +
          '%',
      );
      hud.text(
        'cockpitSwapStatus',
        relayStatus.cooldown > 0
          ? 'PRÓXIMA TROCA ' + Math.ceil(relayStatus.cooldown) + 's'
          : 'M · TROCAR PILOTO',
      );
      // Four reusable DOM pips, grounded in actual enemy/boss coordinates.
      let count = 0;
      const threats = boss ? [{ o: boss }] : enemies.filter((enemy) => !enemy.dead);
      for (const threat of threats) {
        if (count >= 4) break;
        const dx = threat.o.position.x - player.position.x;
        const dz = player.position.z - threat.o.position.z;
        if (Math.abs(dx) > 80 || dz < -6 || dz > 200) continue;
        const blip = $('cockpitBlip' + count++);
        blip.hidden = false;
        blip.style.left = 50 + (dx / 160) * 100 + '%';
        blip.style.top = 90 - (Math.max(0, dz) / 200) * 82 + '%';
      }
      for (; count < 4; count++) $('cockpitBlip' + count).hidden = true;
    }
    // The opaque web cover/hangar owns the menu frame; keep the live GPU idle.
    if (!(dynamicFlight && state === 'menu' && document.body.classList.contains('showroom-web'))) {
      routeRenderer?.prepare();
      const drawFrame = () => post.render();
      lastFrameCost =
        (dynamicFlight && boss && (boss.userData.sabotage || sectorIndex === 7)
          ? withReactorOrbitPresentation(scene, boss.position, orbitAngle, drawFrame)
          : drawFrame()) ?? lastFrameCost;
    }
  }
  function step(dt) {
    if (!Number.isFinite(dt) || dt < 0 || dt > 1)
      throw new RangeError('dt must be between 0 and 1 second');
    tick(dt, now());
  }
  function loop(time) {
    if (!running) return;
    const renderingFlight = appActive && !document.hidden && state === 'playing';
    frameAudit.sample(time, renderingFlight);
    const nextBudget = adaptiveGraphics.sample(time, renderingFlight);
    if (nextBudget) applyRenderBudget(nextBudget);
    const dt = Math.min((time - last) / 1000, cinematic ? 1 : 0.035);
    last = time;
    tick(dt, time);
    // Read renderer counters only after this frame rendered. No extra WebGL calls.
    renderCostAudit.sample(lastFrameCost, renderingFlight && state === 'playing');
    requestFrame(loop);
  }
  if (autoLoop) requestFrame(loop);
  // The first space obstacle previously built its procedural geometry on the
  // same frame as its arrival. Prime one type per idle slot during early flight,
  // while the three.js renderer can precompile its materials asynchronously.
  // QA harnesses (autoLoop=false) remain deterministic and unscheduled.
  const cancelObstacleWarmup =
    dynamicFlight && autoLoop
      ? scheduleIdlePrewarm({
          kinds: ['satellite', 'carrier', 'debris'],
          prime: (kind) => prewarmSceneShaders(renderer, createObstacle(kind), camera, scene),
          schedule: (callback) =>
            typeof window.requestIdleCallback === 'function'
              ? { mode: 'idle', id: window.requestIdleCallback(callback, { timeout: 2500 }) }
              : { mode: 'timer', id: setTimeout(callback, 700) },
          cancel: (pending) => {
            if (pending.mode === 'idle') window.cancelIdleCallback?.(pending.id);
            else clearTimeout(pending.id);
          },
        })
      : () => {};
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
    switchPilot,
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
    equipScatter,
    buySkin,
    selectPilot,
    selectShip,
    selectShipColor,
    nextSector,
    startDeveloperScenario,
    snapshot: () => ({
      state,
      developerAvailable,
      developerSession,
      developerScenario: developerSession ? { ...developerScenario } : null,
      settings: { ...settings },
      pauseDialog: !$('pauseMenu').hidden,
      confirmation,
      stageTitleVisible: stageIntroTime > 0,
      strategy: {
        ...strategy,
        stage: stage(),
        arcana,
        specialCd,
        barrier,
        stasis,
        berserk,
        orbitAngle,
      },
      missionCameraSeconds: reactorGridSeconds,
      missionHazardWave: reactorGridWave,
      bossIntent: bossIntent ? { ...bossIntent } : null,
      tactics: { energy: tacticEnergy, scanTime, impactTime, ...(boss ? tactics() : {}) },
      coreAngle: dynamicFlight && boss ? tactics().heading : 0,
      shotPower: shots[0]?.damage ?? 0,
      chargedPower: shots.find((s) => s.charged)?.damage ?? 0,
      shotDirections: shots.filter((b) => b.v).map((b) => b.v.toArray()),
      hostilePositions: hostile.slice(0, 5).map((b) => b.o.position.toArray()),
      // Snapshot-only evidence lets browser QA verify a visible effect without
      // changing the real projectile's collision, timing or position.
      bossShotLinks: hostile
        .filter((b) => b.tether?.visible)
        .slice(0, 8)
        .map((b) => ({
          bossIndex: b.bossIndex,
          origin: b.launchOrigin.toArray(),
          projectile: b.o.position.toArray(),
          length: b.tether.scale.y,
        })),
      hostileProjectilePool: hostileShotPool.stats(),
      particlePool: particlePool.stats(),
      cameraMode,
      directedShot: flightCamera.getShot(),
      playerVisible: player.visible,
      route: { ...route },
      orbitalLaunch: orbitalLaunchSequence.snapshot(),
      journey: { ...journey },
      asteroidInterior: asteroidInterior?.snapshot() ?? null,
      marvinRival: marvinRival?.snapshot() ?? null,
      arcade: arcade?.snapshot() ?? null,
      cosmetics: { skin: cosmetics.skin, owned: [...cosmetics.owned] },
      petCare: { ...petCare },
      cinematic: cinematic ? { elapsed: cinematic.elapsed, duration: cinematic.duration } : null,
      loadout: { ...pilotLoadout, pilotName: activePilot().name, shipName: activeShip().name },
      pilotRelay: pilotRelay.snapshot(),
      cockpit: cockpit?.snapshot() ?? null,
      flightSpeed: Math.round(lastFlightSpeed * 10),
      maxShield: maxHp(),
      combatMultipliers: {
        speed: activePilot().bonuses.speed * (1 + activeShip().stats.agility * 0.08),
        damage: activePilot().bonuses.damage * (1 + activeShip().stats.attack * 0.06),
        shield: activePilot().bonuses.shield,
        arcana: activePilot().bonuses.arcana,
        bomb: activePilot().bonuses.bomb,
      },
      sector: sectorIndex + 1,
      lives,
      credits,
      weapon: weapon + 1,
      volley,
      rapid,
      scatterOwned,
      fireMode,
      mecha: {
        active: robotMode,
        dash: {
          active: dashRemaining > 0,
          remaining: dashRemaining,
          cooldown: dashCooldown,
          direction: dashSide,
          progress: 1 - dashRemaining / MECHA_DASH.duration,
        },
        lockEnabled,
        lockProgress,
        multiLockHeld: lockHeld,
        multiLockTargets: lockQueue.length,
        multiLockCapacity: mechaMultiLockCapacity(stage()),
        thrustLength: robot.userData.mecha?.thrusters[0]?.plume.scale.y ?? 0,
        dashJetSide:
          robot.userData.premiumMecha?.dashJets?.find(({ jet }) => jet.visible)?.side ?? null,
        boostCoreCount:
          robot.userData.premiumMecha?.afterburnerCores?.filter((core) => core.visible).length ?? 0,
        motor: mechaEngine?.snapshot() ?? { amplitude: 0, velocity: 0, voices: 0 },
      },
      pods: podCount,
      armor,
      charge,
      music: music?.snapshot() ?? null,
      audio: audioCues?.snapshot() ?? null,
      arena: dynamicFlight && !!boss,
      europaSurface:
        dynamicFlight && sectorIndex === 5 ? (world.europaSurfaceState?.() ?? null) : null,
      europaArena:
        dynamicFlight && sectorIndex === 5 && boss
          ? {
              ...world.europaBossArenaState(),
              floorY: boss.userData.europaArenaFloorY,
              minimumCenterY: boss.userData.europaMinimumCenterY,
              bossCenterY: boss.position.y,
              // QA-only snapshot: the strike meshes must visibly reach the
              // same committed location as the real melee damage footprint.
              strike:
                bossIntent && ['ice-quake', 'cryo-pincer'].includes(bossIntent.kind)
                  ? {
                      kind: bossIntent.kind,
                      state: tactics().state,
                      target: [bossIntent.targetX, bossIntent.targetY],
                      claws:
                        boss
                          .getObjectByName('boss-europa-attack-vfx')
                          ?.userData.strikers.map((arm) => ({
                            side: arm.side,
                            visible: arm.node.visible,
                            contact: arm.hand.getWorldPosition(new T.Vector3()).toArray(),
                            flash: arm.impact.visible,
                          })) ?? [],
                    }
                  : null,
            }
          : null,
      bossTargets:
        boss?.userData.parts.map((p, i) => ({
          hp: p.hp,
          discovered: Boolean(weakpointEvidence[i]?.revealed),
          contacts: weakpointEvidence[i]?.contacts ?? 0,
          open: !dynamicFlight || bossTargetOpen(i),
          angle: boss.userData.sabotage
            ? p.angle
            : wrapAngle(
                bossWeakPointAngle(sectorIndex, i) +
                  (dynamicFlight
                    ? sectorIndex === 7
                      ? orbitAngle + boss.rotation.y
                      : tactics().heading
                    : 0),
              ),
          position: p.mesh.getWorldPosition(new T.Vector3()).toArray(),
        })) ?? [],
      bossParts: boss?.userData.parts.filter((p) => p.hp > 0).length ?? 0,
      sabotage: boss?.userData.sabotage
        ? {
            ...sabotagedSystem(boss.userData.parts),
            visual: boss.userData.reactorVisual,
            orbit: {
              angle: orbitAngle,
              pilotWorldPosition: reactorOrbitalPosition(
                player.position,
                boss.position,
                orbitAngle,
              ).toArray(),
              coreWorldPosition: boss.position.toArray(),
              physicallyOrbiting: true,
              roomStationary: true,
            },
            hall: {
              radius: boss.userData.grandHall.userData.radius,
              clearOrbitRadius: boss.userData.grandHall.userData.safeOrbitRadius,
              facilities: boss.userData.grandHall.userData.facilities.length,
              wallSegments: boss.userData.grandHall.userData.walls,
              centralReactor: true,
              ...world.reactorGrandHallState(),
            },
          }
        : null,
      bossDriveShock:
        boss?.userData.driveShockPlumes?.map((plume, i) => ({
          side: i ? 1 : -1,
          visible: plume.visible,
          length: plume.scale.y,
          generatorAlive: boss.userData.parts[i].hp > 0,
        })) ?? [],
      seconds: elapsed,
      shield: hp,
      hits: score,
      bombs,
      energy,
      boss: !!boss,
      bossHp,
      bossIntegrity: boss
        ? bossIntegrityRatio(boss.userData.parts, bossHp, bossCombat?.max ?? 1400)
        : 0,
      bossPhase: bossCombat?.phase ?? 0,
      bossPrepared: !!preparedBoss,
      bossShadersWarm,
      bossModelId: boss?.uuid ?? null,
      preparedBossModelId: preparedBoss?.uuid ?? null,
      bossAge: bossCombat?.age ?? 0,
      bossZ: boss?.position.z ?? null,
      coreOpen: bossCombat?.coreOpen ?? false,
      collapseTime,
      warpDeparture,
      marsCleanse,
      marsPendingRoll,
      devastadorEscape:
        boss?.userData.sabotage && state === 'collapsing'
          ? {
              ...devastadorEscapeAt(collapseTime, {
                boostedSeconds: devastadorEscapeBoostSeconds,
              }),
              boostedSeconds: devastadorEscapeBoostSeconds,
              assisted: devastadorEscapeAssisted,
            }
          : null,
      podsDetached,
      podMode,
      podBlocks,
      podPositions: podMeshes.map((p) => ({ x: p.position.x, y: p.position.y, z: p.position.z })),
      fiveCats: squad?.snapshot() ?? null,
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
      bankAngle: player.rotation.z,
      dash: {
        active: dashRemaining > 0,
        remaining: dashRemaining,
        cooldown: dashCooldown,
        direction: dashSide,
        energyCost: MECHA_DASH.energyCost,
        trail: dashTrail.snapshot(),
      },
      heroScale: player.scale.x,
      shipScale: shipModule.scale.x,
      shipModuleVisible: shipModule.visible,
      robotVisible: robot.visible,
      robotScale: robot.scale.x,
      breakableTargets: obstacles
        .filter((o) => o.hp !== null && o.life > 0)
        .map((o) => ({
          kind: o.o.userData.kind,
          hp: o.hp,
          x: o.o.position.x,
          y: o.o.position.y,
          z: o.o.position.z,
        })),
      player: { x: player.position.x, y: player.position.y },
      flightBounds: { horizontal: flightLimit(), minY: -1, maxY: verticalFlightLimit() },
      playerDepth: player.position.z,
      camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        fov: camera.fov,
        bank: camera.rotation.z,
      },
      fighterWave: lastFighterWave ? { ...lastFighterWave } : null,
      cityPhysicsDebris: dynamicFlight && sectorIndex === 0 ? world.cityDestructionSnapshot() : [],
      cityFallingSolids:
        dynamicFlight && sectorIndex === 0 ? world.cityScriptedFallingSnapshot() : [],
      orbitalAscentCinematic:
        dynamicFlight && sectorIndex === 0 ? world.orbitalAscentSnapshot() : null,
      cityArchitecture: dynamicFlight && sectorIndex === 0 ? world.cityArchitectureSnapshot() : [],
      city35Details: dynamicFlight && sectorIndex === 0 ? world.city35DetailSnapshot() : [],
      cityPhysicalSolids: dynamicFlight && sectorIndex === 0 ? world.cityLocalSolidsSnapshot() : [],
      cityCameraOcclusion:
        dynamicFlight && sectorIndex === 0 ? world.cityCameraOcclusionSnapshot() : [],
      cityImpactCount,
      encounterKinds: enemies.filter((e) => !e.dead).map((e) => e.kind),
      targets: enemies
        .filter((e) => !e.dead)
        .map((e) => ({
          kind: e.kind,
          role: e.role,
          tactic: e.subbossTactic?.motion ?? null,
          attack: e.subbossTactic?.attack ?? null,
          charging: e.attackGlow?.visible ?? false,
          x: e.o.position.x,
          y: e.o.position.y + e.hitY,
          z: e.o.position.z,
          life: e.life,
          chilled: e.chilled,
          burning: e.burning,
          phase: e.combatPhase,
        })),
      tunnel: obstacles.some((o) => o.o.userData.kind === 'tunnel'),
      europaTunnel:
        dynamicFlight && sectorIndex === 5
          ? obstacles
              .filter((obstacle) => obstacle.life > 0 && obstacle.o.userData.europaBreach)
              .map((obstacle) => ({
                // QA evidence: actual wall and panel state, not an animated sprite.
                breached: obstacle.o.userData.breached,
                breachDepth: obstacle.o.position.z - 220,
                warningProgress: obstacle.o.userData.breachWarningProgress,
                warningVisible:
                  obstacle.o.getObjectByName('europa-tunnel-breach-warning')?.visible ?? false,
                panelVisible:
                  obstacle.o.getObjectByName('europa-tunnel-breach-panel')?.visible ?? false,
                debrisVisible:
                  obstacle.o.getObjectByName('europa-tunnel-falling-debris')?.visible ?? false,
                debrisY:
                  obstacle.o
                    .getObjectByName('europa-tunnel-falling-debris')
                    ?.children.slice(0, 4)
                    .map((part) => part.position.y) ?? [],
                remainingSolidPanels: obstacle.o.userData.solids.filter(
                  (solid) => solid.breachPanel,
                ).length,
              }))
          : [],
      obstacleKinds: obstacles.map((o) => o.o.userData.kind),
      cityDestruction:
        dynamicFlight && sectorIndex === 0 && enableCitySetpieces
          ? {
              ...cityDestructionAt(elapsed),
              pacing: stageOneEncounterWindows(
                elapsed,
                orbitalLaunchSequence.snapshot().phase,
                cityOrbitReadyAt,
                true,
              ),
              triggered: [...cityDestructionTriggered],
              ground: world.cityDestructionGroundState?.() ?? null,
              impacts: world.cityDestructionImpactState?.() ?? null,
              wrecks: obstacles
                .filter(({ o }) => o.userData.kind === 'city-hanging-train')
                .map(({ o }) => ({
                  z: o.position.z,
                  collisionActive: o.userData.solidOn,
                  solidCount: o.userData.solids.length,
                  safeLane: o.userData.safeLane,
                  angle: o.userData.nodes.pivot.rotation.z,
                  laneGuidesVisible: o.userData.nodes.safe.visible,
                  powerlineSparksVisible: o.userData.nodes.sparks?.visible ?? false,
                })),
            }
          : null,
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
      cancelObstacleWarmup();
      frameAudit.clear();
      renderCostAudit.clear();
      frameAuditContext = null;
      document.body.classList.remove(
        'in-mission',
        'stage-intro',
        'left-handed',
        'ranking-intermission',
      );
      $('pauseMenu').hidden = true;
      $('settingsMenu').hidden = true;
      music?.destroy();
      audioCues?.destroy();
      mechaEngine?.destroy();
      cinematicStage?.destroy();
      localization.destroy();
      cleanups.forEach((fn) => fn());
      clearWorld();
      hostileShotPool.clear();
      particlePool.clear();
      player.userData.flames.forEach((f) => f.material.dispose());
      cockpit?.destroy();
      shotMaterials.forEach((m) => m.dispose());
      upgradedShotMaterials.forEach((m) => m.dispose());
      squad?.destroy();
      barrierVisual.geometry.dispose();
      barrierVisual.material.dispose();
      marsDust?.geometry.dispose();
      marsDust?.material.dispose();
      warpStreaks?.geometry.dispose();
      warpStreaks?.material.dispose();
      routeRenderer?.destroy();
      dashTrail.destroy();
      asteroidInterior?.destroy();
      player.userData.paint?.forEach((m) => m.dispose());
      shipModule.traverse((o) => {
        o.geometry?.dispose();
        if (o.material?.userData.paintModule) o.material.dispose();
      });
      renderer.dispose?.();
    },
  };
}
