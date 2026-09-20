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
import { createMusic } from './audio.js';
import { createBossModel, disposeBoss } from './bosses.js';
import { fighter, createWorld, postProcessor, halo, glowMaterial, metal, box } from './visuals.js';
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
    respawnTime = 0,
    totalTime = 0,
    music = null,
    musicOn = true,
    bossVolley = 0;
  const podMeshes = [];
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    /* Storage is optional. */
  }
  const saved = readSave(storage);
  $('continue').hidden = !saved;
  const maxHp = () => 100 + armor * 25;
  const current = () => SECTORS[sectorIndex];
  function saveCheckpoint(next = sectorIndex) {
    writeSave(storage, { sector: next, credits, weapon, armor, pods: podCount });
  }
  function syncPods() {
    while (podMeshes.length < podCount) {
      const o = new T.Mesh(new T.OctahedronGeometry(0.65), cyan);
      o.add(halo('#69ffda', 2, 0.5));
      scene.add(o);
      podMeshes.push(o);
    }
    while (podMeshes.length > podCount) scene.remove(podMeshes.pop());
  }
  function collect(kind) {
    if (state !== 'playing') return;
    if (kind === 'blue') {
      weapon = Math.min(5, weapon + 1);
      blueRings++;
      if (blueRings % 3 === 0) podCount = Math.min(3, podCount + 1);
      syncPods();
      message('ARMA ' + WEAPONS[weapon] + ' · PODS ' + podCount);
    } else {
      hp = Math.min(maxHp(), hp + 25);
      message('ESCUDO +25');
    }
    credits += 15;
    sound(1400, 0.25, 'sine');
  }
  function showShop() {
    state = 'shop';
    keys.clear();
    touchFire = touchBoost = false;
    charge = 0;
    music?.pause();
    $('bossHUD').hidden = true;
    $('shop').hidden = false;
    $('shopTitle').textContent = 'SETOR ' + String(sectorIndex + 1).padStart(2, '0') + ' LIBERTADO';
    $('shopNext').textContent = 'PRÓXIMO: ' + SECTORS[sectorIndex + 1].name;
    renderShop();
    saveCheckpoint(sectorIndex + 1);
  }
  function renderShop() {
    $('shopCredits').textContent = credits + ' CR';
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
    if (state !== 'shop') return;
    sectorIndex++;
    enterSector();
    saveCheckpoint();
  }
  function enterSector() {
    clearWorld();
    world.reset();
    world.setSector(current());
    lastStage = -1;
    elapsed = 0;
    spawnCd = 2;
    ringCd = 4;
    obstacleCd = 9;
    subDone = rivalDone = baseDone = false;
    bossVolley = 0;
    bossCd = 2;
    bossHp = 200 + sectorIndex * 55;
    shotCd = 0;
    charge = 0;
    chargeLatch = false;
    invuln = 3;
    energy = 100;
    hp = Math.min(maxHp(), hp + 30);
    bombs = Math.min(5, bombs + 1);
    keys.clear();
    stick.x = stick.y = 0;
    touchFire = touchBoost = false;
    roll = 0;
    player.position.set(0, 6, 9);
    player.rotation.set(0, 0, 0);
    state = 'playing';
    $('shop').hidden = true;
    $('result').hidden = true;
    $('bossHUD').hidden = true;
    $('menu').hidden = true;
    document.body.classList.remove('menu');
    $('pause').textContent = 'Ⅱ';
    $('sectorLabel').textContent =
      (sectorIndex < 5 ? 'BLOCO I · ASCENSÃO' : 'BLOCO II · DEVASTADOR') +
      ' / ' +
      String(sectorIndex + 1).padStart(2, '0');
    $('chapter').textContent = String(sectorIndex + 1).padStart(2, '0');
    $('stage').textContent = current().name;
    syncPods();
    music?.start(sectorIndex);
    message(PILOTS[3 - lives] + ' / ' + current().brief);
  }
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
    if (hp <= 0) {
      lives--;
      if (lives <= 0) finish(false);
      else {
        state = 'respawning';
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
    explode(e.o.position);
    score += e.elite ? 15 : 1;
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
  function launchShot(x, damage = 2, charged = false) {
    const o = new T.Mesh(charged ? orbGeo : laserGeo, green);
    o.add(halo(WEAPON_COLORS[weapon], charged ? 6 : 1.8, 0.5));
    o.rotation.x = Math.PI / 2;
    o.position.copy(player.position);
    o.position.x += x;
    o.position.z -= 3;
    if (charged) o.scale.setScalar(5);
    scene.add(o);
    shots.push({ o, life: 2, damage, charged });
  }
  function fire() {
    if (state !== 'playing' || shotCd > 0) return;
    green.color.set(WEAPON_COLORS[weapon]).multiplyScalar(3);
    const count = SHOT_COUNTS[weapon];
    for (let i = 0; i < count; i++) launchShot((i - (count - 1) / 2) * 0.9, 2 + weapon);
    sound(900 + weapon * 110);
    shotCd = 0.135;
  }
  function enemy(kind = 'fighter') {
    let o = fighter(true);
    if (kind === 'base') {
      o = new T.Group();
      o.add(box(8, 12, 9, buildingMat, 0, -4, 0));
      o.add(box(10, 3, 10, metal('#483346'), 0, 3, 0));
      o.add(new T.Mesh(new T.SphereGeometry(1.8, 12, 8), enemyOrbMat));
      o.userData.owned = true;
    }
    const elite = kind !== 'fighter';
    o.scale.setScalar(elite ? (kind === 'subboss' ? 2.7 : 1.6) : 0.65);
    o.rotation.y = Math.PI;
    const x = rnd(-24, 24),
      y = rnd(1, 19);
    o.position.set(x, y, -200);
    scene.add(o);
    enemies.push({
      o,
      x,
      y,
      phase: rnd(0, 6),
      cd: rnd(1, 3),
      life: elite ? 35 + sectorIndex * 8 : 2 + Math.floor(sectorIndex / 3),
      dead: false,
      elite,
      kind,
    });
  }
  function bullet(pos, target) {
    if (hostile.length >= 180) return;
    let o = new T.Mesh(orbGeo, enemyOrbMat);
    o.add(halo(0xff4265, 2.6, 0.8));
    o.position.copy(pos);
    scene.add(o);
    hostile.push({ o, v: target.clone().sub(pos).normalize().multiplyScalar(58), life: 6 });
  }
  function makeBoss() {
    boss = createBossModel(current(), sectorIndex);
    boss.position.set(0, 10, -230);
    music?.start(sectorIndex, true);
    $('bossName').textContent = current().boss;
    scene.add(boss);
    $('bossHUD').hidden = false;
    message('ALERTA COLOSSAL / ' + current().boss + ' · DESTRUA OS GERADORES VERMELHOS');
  }
  function damageBoss(amount, target = null) {
    if (state !== 'playing' || !boss || !Number.isFinite(amount) || amount <= 0) return;
    const parts = boss.userData.parts.filter((p) => p.hp > 0);
    let part = target
      ? parts.find(
          (p) =>
            Math.hypot(
              target.x - boss.position.x - p.mesh.position.x,
              target.y - boss.position.y - p.mesh.position.y,
            ) < 6,
        )
      : parts[0];
    if (parts.length) {
      if (!part) return;
      part.hp = Math.max(0, part.hp - amount);
      if (part.hp === 0) {
        part.mesh.visible = false;
        explode(boss.position.clone().add(part.mesh.position), 24);
        credits += 35;
        message(
          'GERADOR DESTRUÍDO · ' +
            (parts.length === 1 ? 'NÚCLEO EXPOSTO' : 'MIRE NO OUTRO GERADOR'),
        );
      }
      return;
    }
    if (target && Math.hypot(target.x - boss.position.x, target.y - boss.position.y) > 7) return;
    bossHp = Math.max(0, bossHp - amount);
    if (bossHp === 0) {
      const dead = boss;
      explode(dead.position, 70);
      dispose(dead);
      disposeBoss(dead);
      boss = null;
      score += 50;
      credits += 250 + sectorIndex * 40;
      if (sectorIndex === SECTORS.length - 1) {
        finish(true);
      } else showShop();
    }
  }
  function finish(win) {
    music?.pause();
    state = win ? 'won' : 'lost';
    $('result').hidden = false;
    $('resultTitle').textContent = win ? 'A TERRA ESTÁ LIVRE' : 'NAVE ABATIDA';
    $('resultText').textContent =
      `${score} acertos · ${Math.floor(totalTime / 60)}m ${String(Math.floor(totalTime % 60)).padStart(2, '0')}s de voo. ${win ? 'Marvin derrotado. Os dez setores estão livres. Five Cats, missão cumprida.' : 'Use o giro para bloquear disparos e os anéis para recuperar escudo.'}`;
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
    if (boss) {
      dispose(boss);
      disposeBoss(boss);
    }
    boss = null;
  }
  function start(resume = false) {
    const checkpoint = resume === true ? readSave(storage) : null;
    sectorIndex = checkpoint?.sector ?? 0;
    credits = checkpoint?.credits ?? 0;
    weapon = checkpoint?.weapon ?? 0;
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
    score = 0;
    hp = maxHp();
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
      if (!music) music = createMusic(audioCtx);
      music.setEnabled(musicOn);
    } catch {
      /* Optional browser capability; gameplay remains available. */
    }
    enterSector();
    bombs = 3;
  }
  function pause() {
    if (state === 'playing') {
      state = 'paused';
      music?.pause();
      message('PAUSADO · pressione P ou Ⅱ para continuar');
      $('pause').textContent = '▶';
    } else if (state === 'paused') {
      state = 'playing';
      $('pause').textContent = 'Ⅱ';
      message('Missão retomada.');
      music?.resume();
    }
  }
  $('start').onclick = () => start();
  $('continue').onclick = () => start(true);
  $('nextSector').onclick = nextSector;
  for (const k of Object.keys(SHOP)) $('buy' + k).onclick = () => buy(k);
  $('music').onclick = () => {
    musicOn = !musicOn;
    music?.setEnabled(musicOn);
    $('music').textContent = musicOn ? '♪ ON' : '♪ OFF';
  };
  $('podsTouch').onclick = () => {
    podsDetached = !podsDetached;
  };
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
    if (e.code === 'KeyV') podsDetached = !podsDetached;
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
    totalTime += dt;
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
    const holding = keys.has('Space') || touchFire;
    if (holding) {
      charge = Math.min(1.5, charge + dt);
      chargeLatch = true;
    } else if (chargeLatch) {
      if (charge >= 0.8) {
        launchShot(0, 20 + weapon * 12, true);
        sound(160, 0.4, 'sawtooth', 0.06);
      }
      charge = 0;
      chargeLatch = false;
    }
    $('chargeBar').style.width = (charge / 1.5) * 100 + '%';
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
    if (spawnEncounters && elapsed < current().duration && spawnCd <= 0) {
      for (let i = 0; i < 2 + Math.floor(sectorIndex / 4); i++) enemy();
      spawnCd = 3.4 - sectorIndex * 0.12;
    }
    if (spawnEncounters && !subDone && elapsed > current().duration * 0.32) {
      subDone = true;
      enemy('subboss');
      message('SUBCHEFE / CRUZADOR DE INTERCEPTAÇÃO');
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
    if (elapsed >= current().duration && !boss) makeBoss();
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
    $('pilotName').textContent = PILOTS[3 - lives] + ' / ' + lives + ' VIDAS';
    $('weaponLabel').textContent = WEAPONS[weapon] + ' · ' + credits + ' CR · PODS ' + podCount;
    podCd -= dt;
    podMeshes.forEach((p, i) => {
      const a = visualTime * 1.8 + (i * Math.PI * 2) / Math.max(1, podCount);
      p.position.set(
        player.position.x + Math.cos(a) * (podsDetached ? 8 : 4),
        player.position.y + Math.sin(a) * 2,
        player.position.z - (podsDetached ? 12 : 0),
      );
      p.rotation.y += dt * 2;
    });
    if (podCount > 0 && podCd <= 0) {
      podCd = 0.65;
      for (const p of podMeshes) {
        launchShot(p.position.x - player.position.x, 3 + weapon);
        const shot = shots[shots.length - 1];
        shot.o.position.copy(p.position);
        if (podCount === 3) shot.homing = true;
      }
    }

    for (let e of enemies) {
      if (e.dead) continue;
      e.o.position.z += dt * (e.elite ? (e.o.position.z < -55 ? speed : 6) : speed + 12);
      e.o.position.x =
        e.kind === 'base'
          ? e.x * 0.7
          : e.x + Math.sin(elapsed * (e.kind === 'rival' ? 2 : 1.1) + e.phase) * 5;
      e.o.position.y = e.kind === 'base' ? -1 : e.y + Math.sin(elapsed + e.phase) * 2;
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
      boss.position.z = T.MathUtils.lerp(boss.position.z, -88, dt * 0.7);
      boss.position.x = Math.sin(elapsed * 0.3) * 7;
      boss.position.y = 10 + Math.sin(elapsed * 0.4) * 3;
      boss.userData.rotors.forEach((o, i) => (o.rotation.z += dt * (i % 2 ? -0.14 : 0.2)));
      boss.userData.core.scale.setScalar(1 + Math.sin(visualTime * 5) * 0.07);
      const remaining = boss.userData.parts.filter((p) => p.hp > 0).length;
      $('bossState').textContent = remaining ? 'GERADORES ' + remaining + '/2' : 'NÚCLEO EXPOSTO';
      bossCd -= dt;
      $('attackWarning').textContent =
        bossCd < 0.65
          ? '⚠ ' + ['RAJADA FRONTAL', 'ESPIRAL DE PLASMA', 'BARREIRA LATERAL'][sectorIndex % 3]
          : '';
      if (bossCd <= 0) {
        bossVolley++;
        const origin = boss.position.clone().add(new T.Vector3(0, 0, 22));
        const count = 5 + Math.floor(sectorIndex / 3);
        for (let i = 0; i < count; i++) {
          let target = player.position.clone();
          const offset = i - (count - 1) / 2;
          if (sectorIndex % 3 === 0) target.x += offset * 7;
          if (sectorIndex % 3 === 1) {
            const angle = (i * Math.PI * 2) / count + bossVolley * 0.55;
            target.x += Math.cos(angle) * 16;
            target.y += Math.sin(angle) * 12;
          }
          if (sectorIndex % 3 === 2) {
            target.x = offset * 10;
            target.y = 4 + (bossVolley % 3) * 6;
          }
          bullet(origin, target);
        }
        bossCd = bossHp < (200 + sectorIndex * 55) * 0.45 ? 1.2 : 2;
      }
    } else $('attackWarning').textContent = '';
    for (let b of shots) {
      const prev = b.o.position.z;
      if (b.homing) {
        const target = boss ? boss.position : enemies.find((e) => !e.dead)?.o.position;
        if (target) {
          b.o.position.x = T.MathUtils.lerp(b.o.position.x, target.x, dt * 3);
          b.o.position.y = T.MathUtils.lerp(b.o.position.y, target.y, dt * 3);
        }
      }
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
          const weak = Math.abs(e.o.position.x - b.o.position.x) < 1.2;
          e.life -= (b.damage ?? 2) * (weak ? 2 : 1);
          b.life = 0;
          if (e.life <= 0) kill(e);
          break;
        }
      }
      if (
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
    }
    for (let b of hostile) {
      b.o.position.addScaledVector(b.v, dt);
      b.life -= dt;
      if (b.o.position.distanceTo(player.position) < 2.1) {
        if (!(weapon === 5 && podCount === 3)) hit(10);
        b.life = 0;
        if (roll > 0) explode(b.o.position, 5, 0x77ffff);
      }
    }
    ringCd -= dt;
    if (spawnEncounters && ringCd < 0 && elapsed < current().duration) {
      const o = new T.Mesh(
        new T.TorusGeometry(3, 0.26, 8, 28),
        Math.floor(elapsed / 6) % 3 !== 0 ? cyan : gold,
      );
      o.position.set(rnd(-20, 20), rnd(2, 18), -170);
      scene.add(o);
      rings.push({ o, life: 10, kind: Math.floor(elapsed / 6) % 3 !== 0 ? 'blue' : 'shield' });
      ringCd = 6;
    }
    for (let r of rings) {
      r.o.position.z += speed * dt;
      r.o.rotation.z += dt;
      if (
        Math.abs(r.o.position.z - player.position.z) < 3 &&
        Math.hypot(r.o.position.x - player.position.x, r.o.position.y - player.position.y) < 3.8
      ) {
        score += 3;
        r.life = 0;
        collect(r.kind);
      }
      if (r.o.position.z > 40) r.life = 0;
    }
    obstacleCd -= dt;
    if (spawnEncounters && obstacleCd <= 0 && elapsed < current().duration) {
      let o = new T.Group();
      if (sectorIndex < 2) o.add(box(7, 35, 7, buildingMat, 0, 10, 0));
      else o.add(new T.Mesh(new T.IcosahedronGeometry(4, 1), buildingMat));
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
    $('shieldValue').textContent = Math.ceil(hp) + ' / ' + maxHp();
    $('speedValue').textContent = boosting ? '890' : '480';
    $('shield').style.width = (hp / maxHp()) * 100 + '%';
    $('score').textContent = String(score).padStart(3, '0');
    $('bombs').textContent = '◆ '.repeat(bombs) || '—';
    $('energy').style.width = energy + '%';
    $('progress').style.width = Math.min(100, (elapsed / current().duration) * 100) + '%';
    $('bossHealth').style.width = Math.max(0, (bossHp / (200 + sectorIndex * 55)) * 100) + '%';
  }
  let last = now();
  function tick(dt, nowMs) {
    const now = nowMs;
    if (state === 'playing') music?.update(dt);
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
    collect,
    buy,
    nextSector,
    snapshot: () => ({
      state,
      sector: sectorIndex + 1,
      lives,
      credits,
      weapon: weapon + 1,
      pods: podCount,
      armor,
      charge,
      music: music?.snapshot() ?? null,
      bossParts: boss?.userData.parts.filter((p) => p.hp > 0).length ?? 0,
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
      music?.destroy();
      cleanups.forEach((fn) => fn());
      clearWorld();
      renderer.dispose?.();
    },
  };
}
