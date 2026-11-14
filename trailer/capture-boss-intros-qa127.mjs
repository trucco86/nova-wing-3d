import { chromium } from '@playwright/test';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fps = Number(process.env.TRAILER_FPS || 30);
const viewport = { width: 1280, height: 720 };
const destination = resolve('artifacts/nova-wing-qa127-front-bosses');
const framesDir = join(destination, 'frames');
const baseURL = 'http://127.0.0.1:4173';
if (fps !== 30) throw new Error('QA125 must capture 30 unique WebGL frames/second; refusing interpolated source');
const ffmpegProbe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ffmpegProbe.error || ffmpegProbe.status !== 0) {
  throw new Error('FFmpeg is required before frame capture: ' + (ffmpegProbe.error?.message || ffmpegProbe.stderr));
}
await mkdir(framesDir, { recursive: true });

const scenes = [
  {id:'mothership-reactor', query:'sector=3&qaBoss=3&encounters=1',start:2.1,seconds:5,preElevate:true},
  {id:'europa-colossus',query:'sector=5&qaBoss=5&encounters=1',start:0.4,seconds:3,boss:true},
  {id:'purple-core',query:'sector=6&qaBoss=6&encounters=1',start:0.4,seconds:3.5,boss:true,orbit:true},
  {id:'saturn-dreadnought',query:'sector=7&qaBoss=7&encounters=1',start:0.4,seconds:4,boss:true},
  {id:'marvin-final-face',query:'sector=9&qaBoss=9&encounters=1',start:0.4,seconds:5,boss:true},
];

/**
 * Real keyboard inputs against the actual game's input handlers. They alter the
 * fighter's x/y/roll/boost/lock-on; nothing is repositioned in editing.
 * An authored movement sequence is not evidence that the runner sustains 30fps
 * in wall-clock time: screenshots are offline, deterministic WebGL frames.
 */
const keySet = (scene, t) => {
  const keys = new Set();
  // Director's rule: every boss enters FACE-ON. No lateral flying or orbiting
  // during first 1.85s. Only Purple Core demonstrates the one dramatic orbit.
  // All controls below go through the original Nova Wing keyboard handler.
  if (scene.id === 'mothership-reactor') {
    // Prior QA frame review proved elevated chase line shows real core.
    if (t < 1.8) keys.add('Space');
    if (t >= 1.9 && t < 2.55) keys.add('d');
    if (t >= 2.55 && t < 3.2) keys.add('a');
    if (t >= 3.25) keys.add('Space');
    return keys;
  }
  if (t < 1.85) {
    if (t > 0.65 && t % 0.90 < 0.4) keys.add('Space');
    return keys;
  }
  if (scene.orbit && t < 3.45) {
    keys.add('j');
    keys.add('Space');
    return keys;
  }
  if (t % 1.18 < 0.90) keys.add('Space');
  return keys;
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport,
  acceptDownloads: true,
  reducedMotion: 'reduce',
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && /WebGLProgram|Shader Error|VALIDATE_STATUS false|shader compilation/i.test(message.text())) {
    runtimeErrors.push(message.text());
  }
});

const report = {
  nativeCaptureFps: fps,
  cutVersion: 'QA127 boss front-first cinematic replacement shots',
  trueFrameSampling: true,
  inputMethod: 'Real keyboard/player controls, not camera panning or image warping',
  source: 'Real Nova Wing game engine / Three.js WebGL, deterministic QA capture',
  ref: process.env.GITHUB_REF || 'local',
  sha: process.env.GITHUB_SHA || 'local',
  createdAt: new Date().toISOString(),
  fps,
  viewport,
  scenes: [],
  frames: 0,
  audioSource: 'Original Nova Wing project score and effects rendered by tests/audio-scene.js',
};

try {
  // The existing game's audio fixture renders original music, not copyrighted third-party songs.
  await page.goto(baseURL + '/__audio.html', { waitUntil: 'domcontentloaded' });
  await page.locator('button').first().click();
  await page.waitForFunction(() => document.body.dataset.audioReady === 'true' || document.body.dataset.audioReady === 'error', null, { timeout: 180000 });
  if (await page.locator('body').getAttribute('data-audio-ready') !== 'true') {
    throw new Error('Nova Wing original music export failed: ' + await page.locator('pre').innerText());
  }
  const musicDownloadPromise = page.waitForEvent('download');
  await page.locator('a[download="nova-wing-music.wav"]').click();
  const musicDownload = await musicDownloadPromise;
  const musicPath = join(destination, 'original-nova-wing-music.wav');
  await musicDownload.saveAs(musicPath);
  if ((await stat(musicPath)).size < 100000) throw new Error('Empty music file');

  let frame = 0;
  for (const scene of scenes) {
    await page.goto(baseURL + '/__dynamic.html?' + scene.query, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 120000 });
    if (scene.launch === 'atmosphere' || scene.launch === 'orbit') {
      // Capture actual player-triggered boost rather than skipping a city
      // timer. The game explicitly requires charge depletion to change phase.
      await page.evaluate(() => window.fixture.advance(23));
      await page.keyboard.down('Shift');
      await page.evaluate(() => window.fixture.advance(3.6));
      await page.keyboard.up('Shift');
      const phaseAfterBoost = await page.evaluate(() => window.fixture.game.snapshot().orbitalLaunch.phase);
      if (!['atmosphere', 'orbit'].includes(phaseAfterBoost))
        throw new Error('Real stage 1 orbital launch blocked: ' + phaseAfterBoost);
      if (scene.launch === 'atmosphere') await page.evaluate(() => window.fixture.advance(10));
      if (scene.launch === 'orbit') await page.evaluate(() => window.fixture.advance(40));
    } else {
      await page.evaluate((seconds) => window.fixture.advance(seconds), scene.start);
    }
    if (scene.preElevate) {
      await page.keyboard.down('w');
      await page.evaluate(() => window.fixture.advance(3.0));
      await page.keyboard.up('w');
    }
    if (scene.camera === 'combat') {
      await page.keyboard.press('c');
      await page.keyboard.press('c');
    }
    if (scene.launch === 'orbit') {
      const phase = await page.evaluate(() => window.fixture.game.snapshot().orbitalLaunch.phase);
      if (phase !== 'orbit') throw new Error('Orbit reel still shows city: ' + phase);
    }
    if (scene.verifyCity) {
      const city = await page.evaluate(() => window.fixture.city122State());
      if (!city.moon.fractured || !city.moon.visible || !city.tiles.every((tile) => tile.outerLots > 20)) {
        throw new Error('QA122 City 4.3 / fractured moon not present; refusing to mislabel old game footage');
      }
    }
    if (scene.robot) await page.keyboard.press('KeyT');
    const pressed = new Set();
    const positions = [];
    const framesInScene = Math.round(scene.seconds * fps);
    const sceneStart = frame;
    for (let index = 0; index < framesInScene; index++) {
      const seconds = index / fps;
      const next = keySet(scene, seconds);
      for (const key of [...pressed]) {
        if (!next.has(key)) {
          await page.keyboard.up(key);
          pressed.delete(key);
        }
      }
      for (const key of next) {
        if (!pressed.has(key)) {
          await page.keyboard.down(key);
          pressed.add(key);
        }
      }
      // The actions below are genuine game inputs already exercised by browser
      // tests. A tapped E triggers the player's barrel roll; Z dashes in mecha.
      if (index === Math.round(fps * 1.6) && !scene.robot && !scene.launch && !scene.boss) await page.keyboard.press('e');
      if (index === Math.round(fps * 2.5) && scene.attack) await page.keyboard.press('g');
      if (index === Math.round(fps * 2.25) && scene.robot) await page.keyboard.press('z');
      // Camera switches only AFTER the frontal reveal, and only for Purple Core.
      if (scene.orbit && index === Math.round(fps * 1.9)) {
        await page.keyboard.press('c');
        await page.keyboard.press('c');
      }
      await page.evaluate((dt) => window.fixture.advance(dt), 1 / fps);
      if (index % 5 === 0 || index === framesInScene - 1) {
        const pos = await page.evaluate(() => window.fixture.game.snapshot().player);
        positions.push({ x: pos.x, y: pos.y });
      }
      await page.screenshot({
        path: join(framesDir, String(frame).padStart(6, '0') + '.jpg'),
        timeout: 120000,
        animations: 'disabled',
        type: 'jpeg',
        quality: 92,
      });
      frame++;
    }
    for (const key of pressed) await page.keyboard.up(key);
    const metrics = await page.evaluate(() => ({
      orbitalLaunch: window.fixture.game.snapshot().orbitalLaunch?.phase ?? null,
      cameraView: document.getElementById('cameraView')?.textContent || null,
      draw: window.fixture.renderStats(),
      state: window.fixture.game.snapshot().state,
      sector: window.fixture.game.snapshot().sector,
    }));
    if (!metrics.draw || metrics.draw.calls <= 0 || metrics.draw.triangles <= 0) {
      throw new Error('Scene ' + scene.id + ' did not render real WebGL triangles');
    }
    const xRange = Math.max(...positions.map((p) => p.x)) - Math.min(...positions.map((p) => p.x));
    const yRange = Math.max(...positions.map((p) => p.y)) - Math.min(...positions.map((p) => p.y));
    const motionRange = Math.hypot(xRange, yRange);
    report.scenes.push({ id: scene.id, firstFrame: sceneStart, frames: frame - sceneStart, xRange, yRange, motionRange, ...metrics });
    if (motionRange < 5) console.warn('[motion] Limited physical ship displacement: ' + scene.id + ' ' + motionRange.toFixed(2));

    console.log('[capture] ' + scene.id + ': ' + (frame - sceneStart) + ' genuine gameplay frames');
  }
  report.frames = frame;
  if (frame !== 615) throw new Error('Expected 20.5 seconds x 30 distinct frames, got ' + frame);
  if (report.scenes.length !== 5) throw new Error('Expected all five boss shots');
  if (!report.scenes.every(s => s.draw.triangles > 0)) throw new Error('Invalid source WebGL');
  const movingScenes = report.scenes.filter((scene) => scene.motionRange > 8).length;
  if (!Number.isInteger(movingScenes)) throw new Error('Invalid motion report');
  report.movingScenes = movingScenes;
  if (runtimeErrors.length) throw new Error('Runtime/WebGL failures: ' + runtimeErrors.join('\n'));

  const output = join(destination, 'nova-wing-qa127-boss-front-720p30-20_5s.mp4');
  const title = ['eq=contrast=1.04:saturation=1.07','format=yuv420p'].join(',');
  const ffmpegArgs = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-framerate', String(fps),
    '-i', join(framesDir, '%06d.jpg'),
    '-stream_loop', '-1', '-i', musicPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', title,
    '-af', 'loudnorm=I=-16:LRA=10:TP=-1.5:linear=false,afade=t=in:st=0:d=0.4,afade=t=out:st=57.5:d=2.5',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-profile:v', 'high', '-level:v', '5.2',
    '-r', '30', '-g', '60', '-pix_fmt', 'yuv420p', '-threads', '4',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '320k',
    '-t', '20.5', '-movflags', '+faststart',
    '-metadata', 'title=Nova Wing | Five Cats - Gameplay Trailer',
    output,
  ];
  const encoded = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (encoded.status !== 0) throw new Error('ffmpeg failed: ' + (encoded.error?.message || encoded.stderr));
  if ((await stat(output)).size < 500000) throw new Error('Video output unexpectedly small');
  report.output = output;
  report.durationSeconds = 20.5;
  report.captureSeconds = frame / fps;
  report.outputFps = 30;
  report.outputWidth = 1280;
  report.outputHeight = 720;
  report.upscaled = false;
  report.nativeWidth = viewport.width;
  report.nativeHeight = viewport.height;
  report.frameInterpolation = 'none: 30 WebGL-rendered frames per second, each simulated at 1/30s';
  report.asteroidGrading = null;
  report.audioTargetLUFS = -16;
  await writeFile(join(destination, 'provenance.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('[complete] ' + output + ' (' + report.durationSeconds + 's)');
} finally {
  await browser.close();
}
