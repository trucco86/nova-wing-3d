import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

const out = 'artifacts/native-4k60';
await mkdir(out, { recursive: true });

// Capture-only renderer policy: fixed native resolution. Gameplay sources stay byte-identical.
const fixtureSource = await readFile('tests/dynamic-scene.js', 'utf8');
const marker = 'const renderer = new T.WebGLRenderer(options);';
if (!fixtureSource.includes(marker)) throw new Error('Fixture renderer hook changed');
const nativeSource = fixtureSource.replace(marker, marker + '\n' +
  'const nativePixelRatio = renderer.setPixelRatio.bind(renderer); renderer.setPixelRatio = () => nativePixelRatio(1);');
const bundle = await build({ stdin: { contents: nativeSource, resolveDir: process.cwd() + '/tests', sourcefile: 'native-capture-fixture.js' },
  bundle: true, write: false, format: 'iife', minify: true });
const shell = await readFile('src/shell.html', 'utf8');
const css = await readFile('src/styles.css', 'utf8');
const pilot = await readFile('src/assets/bia-pilot.webp');
const cover = (await readFile('src/assets/cover.webp.base64', 'utf8')).trim();
await writeFile('artifacts/dynamic.html', shell
  .replace('/* BUILD:GAME */', () => bundle.outputFiles[0].text)
  .replace('/* BUILD:STYLES */', () => css.replaceAll('BUILD:COVER', 'data:image/webp;base64,' + cover))
  .replace('BUILD:PILOT', 'data:image/webp;base64,' + pilot.toString('base64'))
  .replace('BUILD:VERSION', 'native-capture'));

const FPS = 60, WIDTH = 3840, HEIGHT = 2160;
const plans = [
  { id: '01-flight', sector: 0, boss: false, warmup: 2, seconds: 8 },
  { id: '03-asteroids', sector: 2, boss: false, warmup: 20, seconds: 8 },
  { id: '03-boss-mecha', sector: 2, boss: true, warmup: 4, seconds: 8 },
  { id: '04-reactor', sector: 3, boss: true, warmup: 4, seconds: 8 },
];
const rehearsal = process.env.REHEARSAL === '1';
const shot = process.env.SECTOR !== undefined
  ? { id: String(Number(process.env.SECTOR)+1).padStart(2,'0') + (process.env.BOSS === '1' ? '-boss' : '-flight'), sector: Number(process.env.SECTOR), boss: process.env.BOSS === '1', warmup: 4, seconds: 30 }
  : plans[Number(process.env.SHOT_INDEX || 0)];
if (!shot) throw new Error('Unknown sample shot');
if (process.env.SAMPLE_SECONDS) shot.seconds = Number(process.env.SAMPLE_SECONDS);
if (process.env.WARMUP_SECONDS) shot.warmup = Number(process.env.WARMUP_SECONDS);
const report = { shot, sourceCommit: process.env.SOURCE_COMMIT, captureCommit: process.env.GITHUB_SHA,
  version: JSON.parse(await readFile('package.json', 'utf8')).version,
  renderPolicy: 'Capture-only renderer setPixelRatio fixed at 1; original game logic unchanged.',
  fixture: 'Private deterministic game fixture; checkpoint XP=2200/pods=3 for flight; existing developer boss scenario for bosses. No healing, damage overrides, entity removal or invulnerability.',
  simulationStep: 1 / FPS, width: WIDTH, height: HEIGHT, fps: FPS, frames: 0,
  duplicateFrames: 0, telemetry: [], errors: [], visualReview: 'PENDING', status: 'RUNNING' };
let browser, encoder;
const save = () => writeFile(out + '/' + shot.id + '.json', JSON.stringify(report, null, 2));
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  page.on('pageerror', e => report.errors.push(String(e)));
  const total = shot.warmup + shot.seconds;
  await page.addInitScript(({ total }) => {
    localStorage.setItem('nova-wing-preferences-v1', JSON.stringify({ graphics: 'high', language: 'pt', subtitles: false }));
    window.captureAudioContexts = [];
    window.AudioContext = class extends OfflineAudioContext {
      constructor() { super(2, (total + 1) * 48000, 48000); window.captureAudioContexts.push(this); }
      resume() { return Promise.resolve(); }
      suspend(time) { return time === undefined ? Promise.resolve() : super.suspend(time); }
    };
  }, { total });
  const query = '?sector=' + shot.sector + '&xp=2200&pods=3&encounters=1' + (shot.boss ? '&qaBoss=' + shot.sector : '');
  await page.goto('http://127.0.0.1:4187/__dynamic.html' + query);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 120000 });
  await page.locator('#pause').click();
  await page.locator('#pauseResume').click();
  await page.evaluate(({ sector, boss }) => {
    const held = new Set();
    const key = (code, on) => {
      if (held.has(code) === on) return;
      if (on) held.add(code); else held.delete(code);
      dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
    };
    const tap = code => { key(code, true); key(code, false); };
    let transformed = false, deployed = false, blockedSeconds = 0, target = null;
    window.captureControl = () => {
      const s = fixture.game.snapshot();
      if (s.state !== 'playing') throw new Error('Rejected non-gameplay state: ' + s.state);
      const p = s.player, z = s.playerDepth;
      const threats = s.hostilePositions.filter(q => q[2] > z - 35 && q[2] < z + 5 && Math.hypot(q[0]-p.x,q[1]-p.y) < 9);
      const enemies = s.targets.filter(q => q.z < z && q.z > -180);
      const parts = s.bossTargets.filter(q => q.hp > 0 && q.open)
        .sort((a,b) => Math.hypot(a.position[0]-p.x,a.position[1]-p.y)-Math.hypot(b.position[0]-p.x,b.position[1]-p.y));
      target = parts.length ? { x: parts[0].position[0], y: parts[0].position[1], z: parts[0].position[2] }
        : enemies.sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if (!target && s.boss && s.bossParts === 0 && s.coreOpen) target = { x: 0, y: 10, z: s.bossZ };
      let x = target?.x ?? 0, y = target?.y ?? 10;
      // Stay in the real asteroid corridor; do not change rock positions or collision.
      if (sector === 2 && !boss) {
        const course = s.asteroidInterior?.course;
        const offset = course?.offset ?? 0;
        x = 0; y = 10;
        if (offset > 950 && offset < 1250) { x = 13; y = 10; }
        blockedSeconds = course?.blocked ? blockedSeconds + 1/60 : 0;
        if (blockedSeconds > 2) throw new Error('Rejected asteroid blockage > 2 seconds');
        if (course?.recovering) throw new Error('Rejected asteroid recovery/backtracking');
      }
      if (threats.length) x = p.x + (threats[0][0] >= p.x ? -10 : 10);
      // Match actual dynamic-flight bounds; the old clamp made reactor valves unreachable.
      x = Math.max(-68, Math.min(68, x)); y = Math.max(0, Math.min(sector === 0 ? 180 : 92, y));
      key('ArrowLeft', p.x > x + 0.8); key('ArrowRight', p.x < x - 0.8);
      key('ArrowUp', p.y < y - 0.8); key('ArrowDown', p.y > y + 0.8);
      const aligned = target && Math.abs(target.x-p.x) < 6 && Math.abs(target.y-p.y) < 6;
      key('Space', Boolean(aligned) && s.charge < 1.45);
      key('ShiftLeft', s.orbitalLaunch?.phase === 'boost' && s.energy > 0);
      // Transform only in open boss arena, never inside the asteroid passage.
      if (sector === 2 && boss && target && !transformed) { tap('KeyT'); transformed = true; }
      if (target && s.pods > 0 && !deployed) { tap('KeyV'); deployed = true; }
      // Multi-lock is held only while targets exist; release when charge is ready.
      key('KeyN', Boolean(s.mecha.active && target && s.mecha.lockProgress < 0.95));
      if (threats.length && s.strategy.arcana > 50 && s.strategy.specialCd <= 0) tap('KeyG');
      // Orbit only towards an actual closed weak point, then stop.
      const phaseIndices = !s.sabotage ? s.bossTargets.map((_,i)=>i)
        : s.bossTargets.slice(0,4).some(q=>q.hp>0) ? [0,1,2,3]
        : s.bossTargets.slice(4,6).some(q=>q.hp>0) ? [4,5] : [6,7];
      const closed = phaseIndices.map(i=>s.bossTargets[i]).filter(q=>q && q.hp>0 && !q.open)
        .sort((a,b)=>Math.abs(Math.atan2(Math.sin(a.angle-s.strategy.orbitAngle),Math.cos(a.angle-s.strategy.orbitAngle)))-Math.abs(Math.atan2(Math.sin(b.angle-s.strategy.orbitAngle),Math.cos(b.angle-s.strategy.orbitAngle))))[0];
      const delta = closed ? Math.atan2(Math.sin(closed.angle-s.strategy.orbitAngle), Math.cos(closed.angle-s.strategy.orbitAngle)) : 0;
      key('KeyJ', !target && !!closed && delta < -0.2);
      key('KeyL', !target && !!closed && delta > 0.2);
      return { state: s.state, seconds: s.seconds, shield: s.shield, score: s.hits,
        bossHp: s.bossHp, parts: s.bossTargets.map(q=>q.hp), player: p,
        mecha: s.mecha.active, target, asteroid: s.asteroidInterior,
        orbit: s.strategy.orbitAngle, input: [...held] };
    };
  }, shot);
  if (rehearsal) {
    // Simulation-only diagnostics, never exported as video or counted as captured frames.
    for (let frame = 0; frame < total * FPS; frame++) {
      const info = await page.evaluate(() => {
        const info = captureControl();
        fixture.advance(1/60, { renderAfter: false });
        return info;
      });
      if (frame % FPS === 0) report.telemetry.push({frame,...info});
    }
    const first = report.telemetry[0], last = report.telemetry.at(-1);
    report.combatProgress = { scoreGained: last.score-first.score,
      bossDamage: first.bossHp-last.bossHp,
      partDamage: first.parts.reduce((a,b)=>a+b,0)-last.parts.reduce((a,b)=>a+b,0) };
    report.status = 'REHEARSAL_ONLY_NOT_CAPTURED';
    await save();
    await browser.close();
    process.exit(0);
  }
  await page.evaluate(() => {
    if (captureAudioContexts.length !== 1) throw new Error('Expected one original game audio context');
    window.captureAudio = captureAudioContexts[0];
    window.nextAudio = captureAudio.suspend(1/60);
    window.renderedAudio = captureAudio.startRendering();
  });
  encoder = spawn('ffmpeg', ['-y','-f','image2pipe','-vcodec','png','-framerate',String(FPS),'-i','pipe:0',
    '-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-fps_mode','passthrough',
    out + '/' + shot.id + '-silent.mp4'], { stdio: ['pipe','inherit','inherit'] });
  const encoderDone = once(encoder, 'close');
  let lastHash;
  for (let frame = 0; frame < total * FPS; frame++) {
    const info = await page.evaluate(({ shouldRender }) => {
      const telemetry = captureControl();
      fixture.advance(1/60, { renderAfter: shouldRender });
      const c = document.querySelector('#game');
      if (c.width !== 3840 || c.height !== 2160) throw new Error('Non-native canvas: ' + c.width + 'x' + c.height);
      return telemetry;
    }, { shouldRender: frame >= shot.warmup * FPS });
    await page.evaluate(() => nextAudio);
    if (frame % FPS === 0) {
      report.telemetry.push({ frame, ...info });
      await save();
      console.log(shot.id, frame, '/', total * FPS, info.state, info.score, info.bossHp);
    }
    if (frame >= shot.warmup * FPS) {
      const capture = await Promise.race([cdp.send('Page.captureScreenshot', {format: 'png', optimizeForSpeed: true, captureBeyondViewport: false}), new Promise((_, reject) => setTimeout(() => reject(new Error('Capture stalled for 120 seconds')), 120000))]);
      const buffer = Buffer.from(capture.data, 'base64');
      const hash = createHash('sha256').update(buffer).digest('hex');
      if (hash === lastHash) report.duplicateFrames++;
      lastHash = hash;
      if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain');
      report.frames++;
      if (report.frames === 1 || report.frames % 120 === 0)
        await writeFile(out + '/' + shot.id + '-' + report.frames + '.png', buffer);
    }
    await page.evaluate(frame => {
      window.nextAudio = captureAudio.suspend((frame + 2)/60);
      return OfflineAudioContext.prototype.resume.call(captureAudio);
    }, frame);
  }
  encoder.stdin.end();
  const [code] = await encoderDone;
  if (code !== 0) throw new Error('FFmpeg encoder exit ' + code);
  const audio = await page.evaluate(async () => {
    await nextAudio;
    await OfflineAudioContext.prototype.resume.call(captureAudio);
    const buffer = await renderedAudio;
    const bytes = new Uint8Array(buffer.length * 4), view = new DataView(bytes.buffer);
    for (let i=0;i<buffer.length;i++) for(let c=0;c<2;c++)
      view.setInt16(i*4+c*2, Math.max(-1,Math.min(1,buffer.getChannelData(c)[i]))*32767, true);
    let raw=''; for(let i=0;i<bytes.length;i+=8192) raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(raw);
  });
  await writeFile(out + '/' + shot.id + '.pcm', Buffer.from(audio,'base64'));
  const file = out + '/' + shot.id + '.mp4';
  execFileSync('ffmpeg',['-y','-i',out+'/'+shot.id+'-silent.mp4','-f','s16le','-ar','48000','-ac','2',
    '-ss',String(shot.warmup),'-i',out+'/'+shot.id+'.pcm','-t',String(shot.seconds),
    '-c:v','copy','-c:a','aac','-b:a','256k','-movflags','+faststart',file],{stdio:'inherit'});
  const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
  report.probe=probe;
  const v=probe.streams.find(s=>s.codec_type==='video');
  if(v.width!==WIDTH || v.height!==HEIGHT || v.avg_frame_rate!=='60/1' || +v.nb_read_frames!==shot.seconds*FPS)
    throw new Error('Encoded video failed native 4K60 frame-count check');
  if(report.duplicateFrames) throw new Error('Repeated adjacent capture frames: '+report.duplicateFrames);
  if(report.errors.length) throw new Error('Browser errors recorded');
  execFileSync('ffmpeg',['-y','-i',file,'-vf','scale=1920:1080','-c:v','libx264','-crf','22','-preset','fast',
    '-c:a','copy','-movflags','+faststart',out+'/'+shot.id+'-1080p60.mp4'],{stdio:'inherit'});
  report.status='TECHNICAL_SAMPLE_ONLY_VISUAL_REVIEW_PENDING';
  await rm(out+'/'+shot.id+'-silent.mp4');
  await rm(out+'/'+shot.id+'.pcm');
} catch(e) {
  report.status='REJECTED';
  report.errors.push(e.stack || String(e));
  console.error(JSON.stringify(report, null, 2));
  process.exitCode=1;
  encoder?.kill();
} finally {
  await save();
  await Promise.race([browser?.close(), new Promise(resolve => setTimeout(resolve, 10000))]);
  process.exit(process.exitCode || 0);
}
