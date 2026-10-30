import * as T from 'three';
import {
  createShowroomPilot,
  createShowroomShip,
  disposeShowroomModel,
} from './showroom-models.js';
import { pilotAt, shipAt } from './pilots.js';
import { loadSettings } from './ui-preferences.js';
import { resolveGraphicsQuality } from './graphics-quality.js';
import { installCinematicIbl } from './cinematic-lighting.js';

export function installShowroom({
  document = globalThis.document,
  window = globalThis.window,
} = {}) {
  const root = document.getElementById('squadSelection');
  const canvas = document.getElementById('hangarCanvas');
  if (!root || !canvas) return { destroy() {} };
  document.body.classList.add('showroom-web');
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer,
    scene,
    cinematicIbl,
    camera,
    mount,
    model,
    frame = 0,
    lastTime = 0,
    signature = '';
  let mode = 'ship',
    yaw = -0.55,
    pitch = 0.3,
    zoom = 1,
    auto = !reduced.matches;
  let pointer = null,
    disposed = false;
  const listeners = [];
  function on(target, event, handler) {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  }
  function active() {
    return (
      !disposed &&
      !root.hidden &&
      !document.getElementById('menu').hidden &&
      !document.hidden &&
      document.body.classList.contains('menu')
    );
  }
  function release() {
    if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
    pointer = null;
  }
  function initialize() {
    if (renderer) return true;
    try {
      renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      scene = new T.Scene();
      cinematicIbl = installCinematicIbl(renderer, scene);
      camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
      scene.add(new T.HemisphereLight('#c8e8ff', '#18252e', 2.2));
      const key = new T.DirectionalLight('#fff0d1', 4);
      key.position.set(4, 6, 6);
      scene.add(key);
      const rim = new T.DirectionalLight('#54d9f3', 5);
      rim.position.set(-5, 2, -4);
      scene.add(rim);
      mount = new T.Group();
      scene.add(mount);
      return true;
    } catch (_error) {
      $('hangarHint').textContent =
        'Visualização 3D indisponível neste dispositivo. A seleção continua disponível.';
      canvas.hidden = true;
      return false;
    }
  }
  function draw() {
    if (!renderer || !model || !active()) return;
    const width = Math.max(1, canvas.clientWidth),
      height = Math.max(1, canvas.clientHeight);
    if (
      canvas.width !== Math.round(width * renderer.getPixelRatio()) ||
      canvas.height !== Math.round(height * renderer.getPixelRatio())
    )
      renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the model vertically and horizontally, including tall mobile viewports.
    const radius = mode === 'ship' ? 7 : 2.6;
    const distance =
      ((radius / Math.sin(T.MathUtils.degToRad(17.5))) * Math.max(1, 1 / camera.aspect)) / zoom;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    mount.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
    canvas.dataset.yaw = yaw.toFixed(3);
    canvas.dataset.pitch = pitch.toFixed(3);
    canvas.dataset.zoom = zoom.toFixed(2);
  }
  function loop(time) {
    frame = 0;
    if (!active()) return;
    const dt = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    if (auto && !pointer) yaw += dt * 0.28;
    if (time - (loop.lastDraw || 0) > 32) {
      draw();
      loop.lastDraw = time;
    }
    if (auto) frame = window.requestAnimationFrame(loop);
  }
  function sync() {
    if (!active()) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      release();
      return;
    }
    if (!initialize()) return;
    let savedStorage = null;
    try {
      savedStorage = window.localStorage;
    } catch {
      /* private browsing */
    }
    const graphics = resolveGraphicsQuality(loadSettings(savedStorage).graphics, {
      coarsePointer: window.matchMedia('(pointer:coarse)').matches,
      deviceMemory: window.navigator?.deviceMemory ?? null,
    });
    cinematicIbl?.setQuality(graphics);
    const next = [
      mode,
      graphics,
      root.dataset.pilot,
      root.dataset.ship,
      root.dataset.shipColor,
      root.dataset.uniformGrade ?? '0',
      root.dataset.medalsCount ?? '0',
    ].join(':');
    if (next !== signature) {
      signature = next;
      if (model) {
        mount.remove(model);
        disposeShowroomModel(model);
      }
      model =
        mode === 'ship'
          ? createShowroomShip(root.dataset.ship, root.dataset.shipColor, graphics)
          : createShowroomPilot(
              root.dataset.pilot,
              Number(root.dataset.uniformGrade ?? 0),
              Number(root.dataset.medalsCount ?? 0),
            );
      mount.add(model);
      yaw = -0.55;
      pitch = mode === 'ship' ? 0.3 : 0;
      zoom = 1;
      canvas.dataset.subject = mode;
      canvas.dataset.model = mode === 'ship' ? root.dataset.ship : root.dataset.pilot;
      canvas.dataset.color = root.dataset.shipColor;
      $('hangarName').textContent =
        mode === 'ship' ? shipAt(root.dataset.ship).name : pilotAt(root.dataset.pilot).name;
      $('hangarKind').textContent =
        mode === 'ship'
          ? 'NAVE DE COMBATE / 360°'
          : 'PILOTO / UNIFORME FELINO MK-' + (Number(root.dataset.uniformGrade ?? 0) + 1);
      $('hangarShip').setAttribute('aria-pressed', String(mode === 'ship'));
      $('hangarPilot').setAttribute('aria-pressed', String(mode === 'pilot'));
    }
    draw();
    if (auto && !frame) {
      lastTime = window.performance.now();
      frame = window.requestAnimationFrame(loop);
    }
  }
  function setAuto(value) {
    auto = value;
    $('hangarAuto').setAttribute('aria-pressed', String(auto));
    $('hangarAuto').textContent = auto ? 'AUTO GIRO · ON' : 'AUTO GIRO · OFF';
    if (!auto) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else sync();
  }
  function manual() {
    setAuto(false);
  }
  on($('hangarShip'), 'click', () => {
    mode = 'ship';
    sync();
  });
  on($('hangarPilot'), 'click', () => {
    mode = 'pilot';
    sync();
  });
  on($('hangarAuto'), 'click', () => setAuto(!auto));
  on($('hangarReset'), 'click', () => {
    yaw = -0.55;
    pitch = mode === 'ship' ? 0.3 : 0;
    zoom = 1;
    draw();
  });
  on($('hangarLeft'), 'click', () => {
    manual();
    yaw -= Math.PI / 4;
    draw();
  });
  on($('hangarRight'), 'click', () => {
    manual();
    yaw += Math.PI / 4;
    draw();
  });
  on($('hangarZoomIn'), 'click', () => {
    zoom = Math.min(1.65, zoom + 0.15);
    draw();
  });
  on($('hangarZoomOut'), 'click', () => {
    zoom = Math.max(0.65, zoom - 0.15);
    draw();
  });
  on(canvas, 'pointerdown', (e) => {
    if (pointer || !active()) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    manual();
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  on(canvas, 'pointermove', (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    yaw += (e.clientX - pointer.x) * 0.012;
    pitch = T.MathUtils.clamp(pitch + (e.clientY - pointer.y) * 0.008, -Math.PI / 2, Math.PI / 2);
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    draw();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    on(canvas, event, (e) => {
      if (pointer?.id === e.pointerId) release();
    });
  on(canvas, 'keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', 'Home'].includes(e.key))
      return;
    e.preventDefault();
    e.stopPropagation();
    manual();
    if (e.key === 'ArrowLeft') yaw -= 0.15;
    if (e.key === 'ArrowRight') yaw += 0.15;
    if (e.key === 'ArrowUp') pitch = Math.max(-Math.PI / 2, pitch - 0.15);
    if (e.key === 'ArrowDown') pitch = Math.min(Math.PI / 2, pitch + 0.15);
    if (e.key === '+') zoom = Math.min(1.65, zoom + 0.15);
    if (e.key === '-') zoom = Math.max(0.65, zoom - 0.15);
    if (e.key === 'Home') {
      yaw = -0.55;
      pitch = mode === 'ship' ? 0.3 : 0;
      zoom = 1;
    }
    draw();
  });
  on(document, 'visibilitychange', sync);
  on(reduced, 'change', () => {
    setAuto(!reduced.matches);
    sync();
  });
  let menuVisible = document.body.classList.contains('menu');
  const observer = new window.MutationObserver((records) => {
    const visible = document.body.classList.contains('menu');
    const changed = visible !== menuVisible || records.some((record) => record.target === root);
    menuVisible = visible;
    if (changed) sync();
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: [
      'hidden',
      'data-pilot',
      'data-ship',
      'data-ship-color',
      'data-uniform-grade',
      'data-medals-count',
    ],
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const resize = new window.ResizeObserver(() => draw());
  resize.observe(canvas);
  setAuto(auto);
  sync();
  return {
    destroy() {
      disposed = true;
      release();
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      listeners.forEach((f) => f());
      disposeShowroomModel(model);
      cinematicIbl?.dispose();
      renderer?.dispose();
      document.body.classList.remove('showroom-web');
    },
  };
}
