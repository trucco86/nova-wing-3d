import * as T from 'three';
import {
  fighter,
  createWorld,
  postProcessor,
  bossModel,
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
  const world = createWorld(scene, random),
    post = postProcessor(renderer, scene, camera);
  post.resize(innerWidth, innerHeight);
  const gold = glowMaterial('#ffbc65', 2),
    buildingMat = metal('#173344');
  const cyan = glowMaterial('#51ffd8'),
    green = glowMaterial('#64ffe4', 4),
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
    obstacleCd = 0,
    invuln = 0,
    roll = 0,
    rollCd = 0,
    boosting = false,
    bossHp = 200,
    bossCd = 0,
    msgTime = 0,
    muted = false,
    visualTime = 0,
    shake = 0,
    lastStage = -1;
  const keys = new Set(),
    stick = { x: 0, y: 0 };
  let touchFire = false,
    touchBoost = false,
    audioCtx;
  function sound(freq = 400, duration = 0.07, type = 'sawtooth', vol = 0.025) {
    if (muted || !audioCtx) return;
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
    o.start();
    o.stop(audioCtx.currentTime + duration);
  }
  function message(t) {
    $('message').textContent = t;
    $('comms').classList.add('active');
    msgTime = 5;
  }
  function dispose(o) {
    scene.remove(o);
  }
  function explode(pos, n = 16, color = 0xffa04a) {
    if (n > 3) sound(100, 0.2, 'sawtooth', 0.035);
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
    if (state !== 'playing' || !Number.isFinite(d) || d <= 0 || invuln > 0 || roll > 0) return;
    hp = Math.max(0, hp - d);
    shake = 0.35;
    invuln = 1.1;
    $('flash').style.opacity = '.3';
    setTimeout(() => ($('flash').style.opacity = '0'), 150);
    sound(60, 0.25);
    if (hp <= 0) finish(false);
  }
  function kill(e) {
    explode(e.o.position);
    score += e.boss ? 50 : 1;
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
    for (let e of enemies) if (!e.dead) kill(e);
    for (let b of hostile) dispose(b.o);
    hostile = [];
    if (boss) {
      explode(boss.position, 40);
      damageBoss(35);
    }
    $('flash').style.background = '#baffff';
    $('flash').style.opacity = '.35';
    shake = 0.5;
    explode(player.position.clone().add(new T.Vector3(0, 0, -30)), 50, 0x59ffc8);
    setTimeout(() => {
      $('flash').style.opacity = '0';
      $('flash').style.background = '#f43f43';
    }, 180);
    sound(45, 0.8, 'sawtooth', 0.08);
  }
  function fire() {
    if (state !== 'playing' || shotCd > 0) return;
    for (let s of [-1, 1]) {
      let o = new T.Mesh(laserGeo, green);
      let a = halo(0x52ffcc, 1.8, 0.45);
      o.add(a);
      o.rotation.x = Math.PI / 2;
      o.position.copy(player.position);
      o.position.x += s * 0.8;
      o.position.z -= 3;
      scene.add(o);
      shots.push({ o, life: 2 });
    }
    sound(900);
    shotCd = 0.135;
  }
  function enemy() {
    let o = fighter(true);
    o.scale.setScalar(0.65);
    o.rotation.y = Math.PI;
    const x = rnd(-24, 24),
      y = rnd(1, 19);
    o.position.set(x, y, -200);
    scene.add(o);
    enemies.push({ o, x, y, phase: rnd(0, 6), cd: rnd(1, 3), life: 2, dead: false });
  }
  function bullet(pos, target) {
    let o = new T.Mesh(orbGeo, enemyOrbMat);
    o.add(halo(0xff4265, 2.6, 0.8));
    o.position.copy(pos);
    scene.add(o);
    hostile.push({ o, v: target.clone().sub(pos).normalize().multiplyScalar(58), life: 6 });
  }
  function makeBoss() {
    boss = bossModel();
    boss.position.set(0, 10, -100);
    scene.add(boss);
    $('bossHUD').hidden = false;
    message('BIA / Caça-líder ROK à frente. Concentre o fogo no núcleo!');
  }
  function damageBoss(amount) {
    if (state !== 'playing' || !boss || !Number.isFinite(amount) || amount <= 0) return;
    bossHp = Math.max(0, bossHp - amount);
    if (bossHp === 0) {
      explode(boss.position, 70);
      dispose(boss);
      boss = null;
      finish(true);
    }
  }
  function finish(win) {
    state = win ? 'won' : 'lost';
    $('result').hidden = false;
    $('resultTitle').textContent = win ? 'SETOR LIBERTADO' : 'NAVE ABATIDA';
    $('resultText').textContent =
      `${score} acertos · ${Math.floor(elapsed / 60)}m ${String(Math.floor(elapsed % 60)).padStart(2, '0')}s de voo. ${win ? 'Five Cats: caminho aberto. A Devastador ainda está lá fora.' : 'Use o giro para bloquear disparos e os anéis para recuperar escudo.'}`;
    $('resultLabel').textContent = win ? 'MISSÃO CUMPRIDA' : 'TENTE NOVAMENTE';
  }
  function clearWorld() {
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
    if (boss) dispose(boss);
    boss = null;
  }
  function start() {
    clearWorld();
    reticle.visible = false;
    $('comms').classList.remove('active');
    world.reset();
    lastStage = -1;
    shake = 0;
    boosting = false;
    touchFire = touchBoost = false;
    elapsed = 0;
    score = 0;
    hp = 100;
    bombs = 3;
    energy = 100;
    shotCd = 0;
    spawnCd = 2;
    ringCd = 8;
    obstacleCd = 12;
    invuln = 2;
    roll = 0;
    rollCd = 0;
    bossHp = 200;
    bossCd = 2;
    keys.clear();
    stick.x = stick.y = 0;
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    state = 'playing';
    $('menu').hidden = true;
    $('result').hidden = true;
    $('bossHUD').hidden = true;
    document.body.classList.remove('menu');
    $('pause').textContent = 'Ⅱ';
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume().catch(() => {});
    } catch {
      /* Optional browser capability; gameplay remains available. */
    }
    message('BIA / Five Cats na escuta. Vamos tirar Marvin desta cidade.');
  }
  function pause() {
    if (state === 'playing') {
      state = 'paused';
      message('PAUSADO · pressione P ou Ⅱ para continuar');
      $('pause').textContent = '▶';
    } else if (state === 'paused') {
      state = 'playing';
      $('pause').textContent = 'Ⅱ';
      message('Missão retomada.');
    }
  }
  $('start').onclick = start;
  $('restart').onclick = start;
  $('pause').onclick = pause;
  $('sound').onclick = () => {
    muted = !muted;
    $('sound').textContent = muted ? 'SOM OFF' : 'SOM ON';
  };
  addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
      e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyB' || e.code === 'KeyX') bomb();
    if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'KeyZ') doRoll();
    if (e.code === 'KeyP' || e.code === 'Escape') pause();
    if (e.code === 'Enter' && state === 'menu') start();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => {
    keys.clear();
    touchFire = touchBoost = false;
    stick.x = stick.y = 0;
    if (state === 'playing') pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pause();
  });
  let stickId = null;
  function stickMove(e) {
    const r = $('stick').getBoundingClientRect(),
      dx = e.clientX - r.left - r.width / 2,
      dy = e.clientY - r.top - r.height / 2,
      len = Math.max(r.width * 0.35, Math.hypot(dx, dy));
    stick.x = dx / len;
    stick.y = -dy / len;
    $('nub').style.transform = `translate(${stick.x * 35}px,${-stick.y * 35}px)`;
  }
  $('stick').onpointerdown = (e) => {
    stickId = e.pointerId;
    $('stick').setPointerCapture(e.pointerId);
    stickMove(e);
  };
  $('stick').onpointermove = (e) => {
    if (e.pointerId === stickId) stickMove(e);
  };
  for (let ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
    $('stick').addEventListener(ev, () => {
      stickId = null;
      stick.x = stick.y = 0;
      $('nub').style.transform = '';
    });
  for (let [id, set] of [
    ['fireTouch', (v) => (touchFire = v)],
    ['boostTouch', (v) => (touchBoost = v)],
  ]) {
    let b = $(id);
    b.onpointerdown = (e) => {
      b.setPointerCapture(e.pointerId);
      set(true);
    };
    for (let ev of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(ev, () => set(false));
  }
  $('rollTouch').onpointerdown = doRoll;
  $('bombTouch').onpointerdown = bomb;
  function update(dt) {
    if (state !== 'playing') return;
    elapsed += dt;
    shotCd -= dt;
    invuln -= dt;
    rollCd -= dt;
    msgTime -= dt;
    if (msgTime <= 0) $('comms').classList.remove('active');
    let dx =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
        stick.x,
      dy =
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) +
        stick.y;
    boosting = (keys.has('ShiftLeft') || keys.has('ShiftRight') || touchBoost) && energy > 5;
    energy = clamp(energy + dt * (boosting ? -28 : 15), 0, 100);
    const speed = boosting ? 90 : 48;
    reticle.visible = true;
    reticle.position.set(player.position.x, player.position.y, -60);
    player.position.x = clamp(
      player.position.x + dx * dt * 24,
      -Math.min(25, camera.aspect * 20),
      Math.min(25, camera.aspect * 20),
    );
    player.position.y = clamp(player.position.y + dy * dt * 20, -1, 23);
    player.rotation.z = T.MathUtils.lerp(player.rotation.z, -dx * 0.48, dt * 8);
    player.rotation.x = T.MathUtils.lerp(player.rotation.x, dy * 0.14, dt * 8);
    player.rotation.y = T.MathUtils.lerp(player.rotation.y, -dx * 0.12, dt * 8);
    if (roll > 0) {
      roll -= dt;
      player.rotation.z = Math.PI * 2 * (1 - roll / 0.65);
    }
    player.visible = invuln <= 0 || Math.floor(invuln * 12) % 2 === 0;
    camera.position.x = T.MathUtils.lerp(camera.position.x, player.position.x * 0.72, dt * 3);
    camera.position.y = T.MathUtils.lerp(camera.position.y, 6 + player.position.y * 0.64, dt * 3);
    camera.fov = T.MathUtils.lerp(camera.fov, boosting ? 70 : 60, dt * 4);
    camera.updateProjectionMatrix();
    camera.lookAt(camera.position.x * 0.9, camera.position.y - 1.5, -70);
    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      camera.position.x += Math.sin(visualTime * 70) * shake * 0.3;
      camera.position.y += Math.cos(visualTime * 65) * shake * 0.2;
    }
    if ((keys.has('Space') || touchFire) && shotCd <= 0) fire();
    spawnCd -= dt;
    if (spawnEncounters && elapsed < 145 && spawnCd <= 0) {
      for (let i = 0; i < (elapsed > 65 ? 3 : 2); i++) enemy();
      spawnCd = elapsed > 65 ? 2.7 : 3.5;
    }
    if (elapsed >= 145 && !boss) makeBoss();
    const phase = elapsed < 50 ? 0 : elapsed < 100 ? 1 : elapsed < 145 ? 2 : 3;
    const names = ['APROXIMAÇÃO', 'CIDADE DAS MÁQUINAS', 'FROTA DE MARVIN', 'CAÇA-LÍDER ROK'];
    $('stage').textContent = names[phase];
    if (phase !== lastStage) {
      lastStage = phase;
      $('chapter').textContent = String(phase + 1).padStart(2, '0');
      if (phase === 1) message('BIA / Torres de dados à frente. Mantenha o corredor livre!');
      if (phase === 2) message('BIA / A frota de Marvin está chegando. Prepare as bombas.');
    }

    for (let e of enemies) {
      if (e.dead) continue;
      e.o.position.z += dt * (speed + 12);
      e.o.position.x = e.x + Math.sin(elapsed * 1.1 + e.phase) * 5;
      e.o.position.y = e.y + Math.sin(elapsed + e.phase) * 2;
      e.cd -= dt;
      if (e.cd <= 0 && e.o.position.z < -15) {
        bullet(e.o.position, player.position);
        e.cd = 2.3;
      }
      if (e.o.position.distanceTo(player.position) < 3.8) {
        hit(22);
        kill(e);
      }
      if (e.o.position.z > 40) {
        dispose(e.o);
        e.dead = true;
      }
    }
    if (boss) {
      boss.position.z = T.MathUtils.lerp(boss.position.z, -65, dt * 0.4);
      boss.position.x = Math.sin(elapsed * 0.5) * 17;
      boss.position.y = 10 + Math.sin(elapsed * 0.7) * 7;
      bossCd -= dt;
      if (bossCd < 0) {
        for (let s of [-1, 0, 1])
          bullet(
            boss.position.clone().add(new T.Vector3(s * 12, 0, 10)),
            player.position.clone().add(new T.Vector3(s * 3, 0, 0)),
          );
        bossCd = bossHp < 90 ? 0.6 : 1.1;
      }
    }
    for (let b of shots) {
      const prev = b.o.position.z;
      b.o.position.z -= dt * 190;
      b.life -= dt;
      for (let e of enemies) {
        if (
          !e.dead &&
          e.o.position.z <= prev + 3 &&
          e.o.position.z >= b.o.position.z - 3 &&
          Math.abs(e.o.position.x - b.o.position.x) < 3.4 &&
          Math.abs(e.o.position.y - b.o.position.y) < 2
        ) {
          e.life--;
          b.life = 0;
          if (e.life <= 0) kill(e);
          break;
        }
      }
      if (
        boss &&
        boss.position.z + 10 <= prev + 3 &&
        boss.position.z + 10 >= b.o.position.z - 4 &&
        Math.abs(b.o.position.x - boss.position.x) < 5 &&
        Math.abs(b.o.position.y - boss.position.y) < 5
      ) {
        damageBoss(2);
        b.life = 0;
        explode(b.o.position, 2, 0x88ffee);
      }
    }
    for (let b of hostile) {
      b.o.position.addScaledVector(b.v, dt);
      b.life -= dt;
      if (b.o.position.distanceTo(player.position) < 2.1) {
        hit(10);
        b.life = 0;
        if (roll > 0) explode(b.o.position, 5, 0x77ffff);
      }
    }
    ringCd -= dt;
    if (spawnEncounters && ringCd < 0 && elapsed < 145) {
      const o = new T.Mesh(new T.TorusGeometry(3, 0.26, 8, 28), gold);
      o.position.set(rnd(-20, 20), rnd(2, 18), -170);
      scene.add(o);
      rings.push({ o, life: 10 });
      ringCd = 12;
    }
    for (let r of rings) {
      r.o.position.z += speed * dt;
      r.o.rotation.z += dt;
      if (
        Math.abs(r.o.position.z - player.position.z) < 3 &&
        Math.hypot(r.o.position.x - player.position.x, r.o.position.y - player.position.y) < 3.8
      ) {
        hp = Math.min(100, hp + 20);
        score += 3;
        r.life = 0;
        sound(1400, 0.25, 'sine');
        message('ESCUDO RESTAURADO +20');
      }
      if (r.o.position.z > 40) r.life = 0;
    }
    obstacleCd -= dt;
    if (spawnEncounters && obstacleCd <= 0 && elapsed < 145) {
      let o = new T.Group();
      o.add(box(7, 35, 7, buildingMat, 0, 10, 0));
      o.add(box(7.2, 1, 7.2, cyan, 0, 20, 0));
      o.position.set(rnd(-23, 23), -7, -230);
      scene.add(o);
      obstacles.push({ o, life: 10 });
      obstacleCd = 8;
    }
    for (let o of obstacles) {
      o.o.position.z += speed * dt;
      if (
        Math.abs(o.o.position.z - player.position.z) < 5 &&
        Math.abs(o.o.position.x - player.position.x) < 5
      ) {
        hit(30);
      }
      if (o.o.position.z > 50) o.life = 0;
    }
    for (let arr of [shots, hostile, rings, obstacles])
      for (let i = arr.length - 1; i >= 0; i--)
        if (arr[i].life <= 0) {
          dispose(arr[i].o);
          arr.splice(i, 1);
        }
    enemies = enemies.filter((e) => !e.dead);
    $('shieldValue').textContent = Math.ceil(hp) + ' / 100';
    $('speedValue').textContent = boosting ? '890' : '480';
    $('shield').style.width = hp + '%';
    $('score').textContent = String(score).padStart(3, '0');
    $('bombs').textContent = '◆ '.repeat(bombs) || '—';
    $('energy').style.width = energy + '%';
    $('progress').style.width = Math.min(100, (elapsed / 180) * 100) + '%';
    $('bossHealth').style.width = Math.max(0, bossHp / 2) + '%';
  }
  let last = now();
  function tick(dt, nowMs) {
    const now = nowMs;
    if (state !== 'paused') {
      visualTime += dt;
      world.update(dt, visualTime, boosting ? 90 : 48, state === 'playing');
      for (let f of player.userData.flames)
        f.scale.y = (boosting ? 1.8 : 1) + Math.sin(now * 0.03) * 0.15;
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
    if (state === 'playing') update(dt);
    else if (state === 'menu') {
      player.visible = true;
      const small = camera.aspect < 1;
      player.position.set(small ? 0 : 5, small ? 3.2 : 6, small ? 0 : 7);
      player.rotation.set(0.12, -0.45 + Math.sin(now * 0.0003) * 0.08, -0.12);
      camera.position.set(0, 11, 32);
      camera.lookAt(0, 5, -60);
    }
    post.render();
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
    pause,
    fire,
    bomb,
    roll: doRoll,
    step,
    // These are internal domain events, never installed on window or WebMCP.
    damage: hit,
    damageBoss,
    snapshot: () => ({
      state,
      seconds: elapsed,
      shield: hp,
      hits: score,
      bombs,
      energy,
      boss: !!boss,
      bossHp,
      rolling: roll > 0,
      player: { x: player.position.x, y: player.position.y },
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
      cleanups.forEach((fn) => fn());
      clearWorld();
      renderer.dispose?.();
    },
  };
}
