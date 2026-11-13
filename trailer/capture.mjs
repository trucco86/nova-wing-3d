import { chromium } from '@playwright/test';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fps = Number(process.env.TRAILER_FPS || 10);
const viewport = { width: 1280, height: 720 };
const destination = resolve('artifacts/nova-wing-trailer');
const framesDir = join(destination, 'frames');
const baseURL = 'http://127.0.0.1:4173';
if (!Number.isInteger(fps) || fps < 5 || fps > 30) throw new Error('Invalid trailer FPS');
await mkdir(framesDir, { recursive: true });

const scenes = [
  { id: 'city-premium-43', query: 'sector=0&encounters=1&citySetpieces=1', start: 0.5, seconds: 4.0, hold: ['Space'], verifyCity: true },
  { id: 'city-boost', query: 'sector=0&encounters=1&citySetpieces=1', start: 23, seconds: 3.0, hold: ['Space', 'Shift'] },
  { id: 'mars', query: 'sector=1&encounters=1', start: 27, seconds: 4.0, hold: ['Space'] },
  { id: 'asteroid', query: 'sector=2&encounters=1&asteroidCourse=1', start: 24, seconds: 4.0, hold: ['Space'] },
  { id: 'five-cats-mecha', query: 'sector=0&encounters=1', start: 4, seconds: 3.5, robot: true, hold: ['Space'] },
  { id: 'orbital-boss', query: 'sector=3&qaBoss=3&encounters=1', start: 0.4, seconds: 3.5, hold: ['Space'] },
  { id: 'marvin-endgame', query: 'sector=9&qaBoss=9&encounters=1', start: 0.4, seconds: 4.0, hold: ['Space'] },
];

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
  await page.waitForFunction(() => document.body.dataset.audioReady === 'true' || document.body.dataset.audioReady === 'error', { timeout: 180000 });
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
    await page.evaluate((seconds) => window.fixture.advance(seconds), scene.start);
    if (scene.verifyCity) {
      const city = await page.evaluate(() => window.fixture.city122State());
      if (!city.moon.fractured || !city.moon.visible || !city.tiles.every((tile) => tile.outerLots > 20)) {
        throw new Error('QA122 City 4.3 / fractured moon not present; refusing to mislabel old game footage');
      }
    }
    if (scene.robot) await page.keyboard.press('KeyT');
    for (const key of scene.hold || []) await page.keyboard.down(key);

    const framesInScene = Math.round(scene.seconds * fps);
    const sceneStart = frame;
    for (let index = 0; index < framesInScene; index++) {
      await page.evaluate((dt) => window.fixture.advance(dt), 1 / fps);
      await page.screenshot({
        path: join(framesDir, String(frame).padStart(6, '0') + '.png'),
        timeout: 120000,
        animations: 'disabled',
      });
      frame++;
    }
    for (const key of [...(scene.hold || [])].reverse()) await page.keyboard.up(key);
    const metrics = await page.evaluate(() => ({
      draw: window.fixture.renderStats(),
      state: window.fixture.game.snapshot().state,
      sector: window.fixture.game.snapshot().sector,
    }));
    if (!metrics.draw || metrics.draw.calls <= 0 || metrics.draw.triangles <= 0) {
      throw new Error('Scene ' + scene.id + ' did not render real WebGL triangles');
    }
    report.scenes.push({ id: scene.id, firstFrame: sceneStart, frames: frame - sceneStart, ...metrics });
    console.log('[capture] ' + scene.id + ': ' + (frame - sceneStart) + ' genuine gameplay frames');
  }
  report.frames = frame;
  if (frame < 180) throw new Error('Trailer too short: ' + frame + ' frames');
  if (runtimeErrors.length) throw new Error('Runtime/WebGL failures: ' + runtimeErrors.join('\n'));

  const output = join(destination, 'nova-wing-gameplay-real-preview.mp4');
  const ffmpegArgs = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-framerate', String(fps),
    '-i', join(framesDir, '%06d.png'),
    '-i', musicPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'fps=24,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-c:a', 'aac', '-b:a', '192k',
    '-t', String(frame / fps),
    '-movflags', '+faststart',
    output,
  ];
  const encoded = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (encoded.status !== 0) throw new Error('ffmpeg failed: ' + encoded.stderr);
  if ((await stat(output)).size < 500000) throw new Error('Video output unexpectedly small');
  report.output = output;
  report.durationSeconds = frame / fps;
  await writeFile(join(destination, 'provenance.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('[complete] ' + output + ' (' + report.durationSeconds + 's)');
} finally {
  await browser.close();
}
