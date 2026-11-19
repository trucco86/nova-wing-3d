import * as T from 'three';
import { createShowroomShip, disposeShowroomModel } from './showroom-models.js';
import { createFlyingRobot } from './visuals.js';
import { pilotAt, shipAt, shipColorAt } from './pilots.js';
import { SKINS } from './customization.js';
import { PREFLIGHT_ACTIONS, PREFLIGHT_KEY_CODES, createPracticeProgress } from './preflight-practice.js';

const CONTROL_IDS = {
  left: 'trainingLeft',
  right: 'trainingRight',
  up: 'trainingUp',
  down: 'trainingDown',
  fire: 'trainingFire',
  boost: 'trainingBoost',
  roll: 'trainingRoll',
  transform: 'trainingTransform',
  camera: 'trainingCamera',
};

function actionFor(control) {
  return ['left', 'right', 'up', 'down'].includes(control) ? 'move' : control;
}

function paletteFor(loadout) {
  const base = shipColorAt(loadout.color);
  const chosen = SKINS.find((skin) => skin.id === loadout.skin);
  return chosen && chosen.id !== 'classic' ? chosen : base;
}

/**
 * Optional, isolated simulator. It reuses the real game fighter geometry and
 * selected colors, without starting sector timers, spawns or scoring.
 * No WebGL context is allocated until the player opens the training screen.
 */
export function createPreflightTraining({ document, window, onLaunch, onBack }) {
  const $ = (id) => document.getElementById(id);
  const root = $('preflightTraining');
  const canvas = $('trainingCanvas');
  const progress = createPracticeProgress();
  let renderer = null;
  let scene = null;
  let camera = null;
  let ship = null;
  let robot = null;
  let trainingActive = false;
  let frame = null;
  let previous = 0;
  let robotMode = false;
  let cameraIndex = 0;
  let roll = 0;
  let ignition = 0;
  let firing = 0;
  let target = null;
  let pulse = null;
  let fireCooldown = 0;
  let geometry = [];
  let materials = [];
  let selected = null;
  const held = new Set();

  function status() {
    const snap = progress.snapshot();
    $('trainingProgress').textContent = snap.count + ' / ' + snap.total + ' COMANDOS TESTADOS';
    $('trainingPrompt').textContent = snap.done
      ? 'TREINO CONCLUÍDO · PRONTO PARA A MISSÃO'
      : 'PRATIQUE: ' +
        PREFLIGHT_ACTIONS.find(({ id }) => id === snap.next)?.name +
        ' · ' +
        PREFLIGHT_ACTIONS.find(({ id }) => id === snap.next)?.keyboard;
    for (const action of PREFLIGHT_ACTIONS) {
      $('trainingTask-' + action.id).classList.toggle('completed', snap.completed.includes(action.id));
    }
    return snap;
  }

  function mark(control) {
    progress.mark(actionFor(control));
    status();
  }

  function initializeRenderer() {
    if (renderer) return true;
    if (!canvas?.getContext) return false;
    try {
      renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      scene = new T.Scene();
      scene.background = new T.Color('#061422');
      scene.fog = new T.Fog('#061422', 17, 70);
      camera = new T.PerspectiveCamera(54, 1, 0.1, 95);
      scene.add(new T.HemisphereLight('#a4e6ff', '#08101b', 2.6));
      const sun = new T.DirectionalLight('#d3ecff', 3.2);
      sun.position.set(5, 12, 6);
      scene.add(sun);
      const cyan = new T.MeshBasicMaterial({ color: '#41d9ff' });
      const faint = new T.MeshBasicMaterial({ color: '#1c4660', wireframe: true });
      materials = [cyan, faint];
      const floor = new T.Mesh(new T.PlaneGeometry(72, 80, 9, 12), faint);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, -5, -17);
      scene.add(floor);
      const ring = new T.Mesh(new T.TorusGeometry(3.6, 0.18, 6, 28), cyan);
      ring.position.set(0, 2.2, -14);
      scene.add(ring);
      target = ring;
      const boltGeometry = new T.SphereGeometry(0.42, 10, 6);
      pulse = new T.Mesh(boltGeometry, cyan);
      pulse.name = 'training-fire-projectile';
      pulse.visible = false;
      scene.add(pulse);
      geometry = [floor.geometry, ring.geometry, boltGeometry];
      camera.position.set(0, 7, 24);
      camera.lookAt(0, 0, 0);
      return true;
    } catch {
      renderer?.dispose();
      renderer = null;
      $('trainingPrompt').textContent = 'Prévia 3D indisponível · os comandos continuam disponíveis.';
      return false;
    }
  }

  function clearModels() {
    if (ship) {
      scene?.remove(ship);
      disposeShowroomModel(ship);
      ship = null;
    }
    if (robot) {
      scene?.remove(robot);
      disposeShowroomModel(robot);
      robot = null;
    }
  }

  function installModels(loadout) {
    if (!initializeRenderer()) return;
    clearModels();
    ship = createShowroomShip(loadout.ship, loadout.color);
    const palette = paletteFor(loadout);
    ship.traverse((part) => {
      if (!part.material?.color) return;
      if (part.material.userData.paintModule || part.material.userData.paintAccent === false)
        part.material.color.set(palette.color);
      if (part.material.userData.paintAccent) part.material.color.set(palette.accent);
    });
    ship.name = 'preflight-selected-playable-ship';
    ship.rotation.y = Math.PI;
    ship.position.set(0, 0, 0);
    ship.scale.setScalar(0.83);
    scene.add(ship);
    robot = createFlyingRobot();
    if (robot.userData.mechPaint) {
      robot.userData.mechPaint.primary.color.set(palette.color);
      robot.userData.mechPaint.accent.color.set(palette.accent);
    }
    robot.name = 'preflight-selected-mecha';
    robot.scale.setScalar(0.75);
    robot.visible = false;
    scene.add(robot);
  }

  function press(control) {
    if (!trainingActive) return;
    held.add(control);
    mark(control);
    if (control === 'transform') {
      robotMode = !robotMode;
      if (ship) ship.visible = !robotMode;
      if (robot) robot.visible = robotMode;
    }
    if (control === 'camera') cameraIndex = (cameraIndex + 1) % 3;
    if (control === 'roll') roll = Math.PI * 2;
    if (control === 'fire') firing = 0.4;
    if (control === 'boost') ignition = 1;
  }

  function release(control) {
    held.delete(control);
  }

  function step(dt) {
    if (!trainingActive) return;
    const left = held.has('left') || held.has('ArrowLeft') || held.has('KeyA');
    const right = held.has('right') || held.has('ArrowRight') || held.has('KeyD');
    const up = held.has('up') || held.has('ArrowUp') || held.has('KeyW');
    const down = held.has('down') || held.has('ArrowDown') || held.has('KeyS');
    const fire = held.has('fire') || held.has('Space');
    const boost = held.has('boost') || held.has('ShiftLeft') || held.has('ShiftRight');
    const dx = Number(right) - Number(left);
    const dy = Number(up) - Number(down);
    const craft = robotMode ? robot : ship;
    if (craft) {
      craft.position.x = T.MathUtils.clamp(craft.position.x + dx * dt * 11, -8, 8);
      craft.position.y = T.MathUtils.clamp(craft.position.y + dy * dt * 9, -3, 6);
      craft.rotation.z = roll > 0 ? roll : -dx * 0.2;
      if (roll > 0) roll = Math.max(0, roll - dt * 12);
    }
    if (fire) firing = 0.4;
    fireCooldown = Math.max(0, fireCooldown - dt);
    if ((fire || firing > 0.33) && pulse && fireCooldown === 0) {
      const current = robotMode ? robot : ship;
      pulse.visible = true;
      pulse.position.set(current?.position.x ?? 0, current?.position.y ?? 0, -3);
      fireCooldown = 0.2;
    }
    if (pulse?.visible) {
      pulse.position.z -= dt * 37;
      if (pulse.position.z < -18) pulse.visible = false;
    }
    firing = Math.max(0, firing - dt);
    ignition = boost ? 1 : Math.max(0, ignition - dt * 3);
    if (target) {
      target.material.opacity = 0.85 + Math.sin(previous * 0.002) * 0.1;
      target.scale.setScalar(1 + firing * 0.25);
      target.rotation.z += dt * 0.24;
    }
    const activeFlames = ship?.userData.flames ?? [];
    for (const flame of activeFlames) flame.scale.y = 1 + ignition * 1.1;
    if (camera) {
      const pos = cameraIndex === 0 ? [0, 7, 24] : cameraIndex === 1 ? [17, 7, 12] : [0, 28, 10];
      camera.position.lerp(new T.Vector3(...pos), Math.min(1, dt * 4));
      camera.lookAt(craft?.position.x ?? 0, craft?.position.y ?? 0, -4);
    }
  }

  function draw(time) {
    if (!trainingActive) return;
    const dt = Math.min(0.05, Math.max(0, (time - previous) / 1000 || 0));
    previous = time;
    step(dt);
    if (renderer && scene && camera) {
      const width = Math.max(1, canvas.clientWidth || 700);
      const height = Math.max(1, canvas.clientHeight || 350);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    frame = window.requestAnimationFrame?.(draw) ?? null;
  }

  function open(loadout) {
    selected = { ...loadout };
    progress.reset();
    held.clear();
    cameraIndex = 0;
    robotMode = false;
    ignition = firing = roll = fireCooldown = 0;
    if (pulse) pulse.visible = false;
    root.hidden = false;
    trainingActive = true;
    $('trainingShipLabel').textContent =
      pilotAt(loadout.pilot).name + ' · ' + shipAt(loadout.ship).name;
    installModels(loadout);
    status();
    previous = window.performance?.now?.() ?? 0;
    if (frame === null) frame = window.requestAnimationFrame?.(draw) ?? null;
    $('trainingBack').focus?.({ preventScroll: true });
  }

  function close() {
    trainingActive = false;
    root.hidden = true;
    held.clear();
    if (frame !== null) window.cancelAnimationFrame?.(frame);
    frame = null;
    clearModels();
    // Do not keep a second WebGL context alive during the actual gameplay.
    for (const resource of geometry) resource.dispose();
    for (const material of materials) material.dispose();
    geometry = [];
    materials = [];
    target = pulse = null;
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    renderer = scene = camera = null;
  }

  for (const [control, id] of Object.entries(CONTROL_IDS)) {
    const button = $(id);
    if (!button) continue;
    button.onpointerdown = (event) => {
      event.preventDefault?.();
      press(control);
      button.setPointerCapture?.(event.pointerId);
    };
    button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => release(control);
    // Keyboard or assistive-tech clicks do not require synthetic pointer events.
    button.onclick = (event) => {
      // Pointer interaction already ran onpointerdown. Keyboard activation
      // produces detail=0 and must not double-toggle ROBÔ or CÂMERA.
      if (!event || event.detail === 0) {
        press(control);
        release(control);
      }
    };
  }
  const onKeyDown = (event) => {
    if (!trainingActive || event.ctrlKey || event.altKey || event.metaKey) return;
    const action = PREFLIGHT_KEY_CODES[event.code];
    if (action) {
      event.preventDefault?.();
      if (!event.repeat && !held.has(event.code)) {
        if (action === 'move') mark('move');
        else {
          press(action);
          // Keyboard held state is tracked by its actual key code.
          release(action);
        }
      }
      held.add(event.code);
    }
  };
  const onKeyUp = (event) => {
    held.delete(event.code);
  };
  window.addEventListener?.('keydown', onKeyDown, true);
  window.addEventListener?.('keyup', onKeyUp, true);
  $('trainingBack').onclick = () => {
    close();
    onBack();
  };
  $('trainingLaunch').onclick = () => {
    close();
    onLaunch();
  };

  return {
    open,
    close,
    press,
    release,
    step,
    snapshot() {
      return { active: trainingActive, selected, ...progress.snapshot(), robotMode, cameraIndex };
    },
    destroy() {
      close();
      window.removeEventListener?.('keydown', onKeyDown, true);
      window.removeEventListener?.('keyup', onKeyUp, true);
    },
  };
}
