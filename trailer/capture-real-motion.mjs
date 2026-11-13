import { chromium } from '@playwright/test';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fps = Number(process.env.TRAILER_FPS || 30);
const viewport = { width: 1920, height: 1080 };
const destination = resolve('artifacts/nova-wing-trailer-motion');
const framesDir = join(destination, 'frames');
const baseURL = 'http://127.0.0.1:4173';
if (fps !== 30) throw new Error('QA125 must capture 30 unique WebGL frames/second; refusing interpolated source');
const ffmpegProbe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (ffmpegProbe.error || ffmpegProbe.status !== 0) {
  throw new Error('FFmpeg is required before frame capture: ' + (ffmpegProbe.error?.message || ffmpegProbe.stderr));
}
await mkdir(framesDir, { recursive: true });

const scenes = [
  { id: 'city-living-streets', query: 'sector=0&encounters=1&citySetpieces=1', start: 0.5, seconds: 4.5, hold: ['Space'], verifyCity: true },
  { id: 'city-traffic-combat', query: 'sector=0&encounters=1&citySetpieces=1', start: 8, seconds: 4.5, hold: ['Space'] },
  { id: 'city-light-speed-boost', query: 'sector=0&encounters=1&citySetpieces=1', start: 23, seconds: 4.5, hold: ['Space', 'Shift'] },
  { id: 'city-orbital-ascent', query: 'sector=0&encounters=1&citySetpieces=1', start: 34, seconds: 4.5, hold: ['Space'] },
  { id: 'mars-arrival', query: 'sector=1&encounters=1', start: 10, seconds: 4.5, hold: ['Space'] },
  { id: 'mars-desert', query: 'sector=1&encounters=1', start: 28, seconds: 4.5, hold: ['Space'] },
  { id: 'mars-sandstorm', query: 'sector=1&encounters=1', start: 65, seconds: 4.5, hold: ['Space'] },
  { id: 'asteroid-run', query: 'sector=2&encounters=1&asteroidCourse=1', start: 23, seconds: 4.5, hold: ['Space'] },
  { id: 'mecha-transformation', query: 'sector=0&encounters=1', start: 3.5, seconds: 4.5, robot: true, hold: ['Space'] },
  { id: 'mothership-boss', query: 'sector=3&qaBoss=3&encounters=1', start: 0.4, seconds: 4.5, hold: ['Space'] },
  { id: 'saturn-ice-field', query: 'sector=7&encounters=1', start: 22, seconds: 4.5, hold: ['Space'] },
  { id: 'marvin-confrontation', query: 'sector=9&qaBoss=9&encounters=1', start: 0.4, seconds: 4.5, hold: ['Space'] },
];

/**
 * Real keyboard inputs against the actual game's input handlers. They alter the
 * fighter's x/y/roll/boost/lock-on; nothing is repositioned in editing.
 * An authored movement sequence is not evidence that the runner sustains 30fps
 * in wall-clock time: screenshots are offline, deterministic WebGL frames.
 */
const keySet = (scene, elapsed) => {
  const keys = new Set();
  const t = elapsed;
  if (t % 1.14 < 0.80) keys.add('Space'); // Charge/release actual player shots.
  if (scene.id.includes('boost') || (scene.id.includes('orbital') && t > 1.6)) {
    if (t % 3.7 < 1.7) keys.add('Shift');
  } else if (['asteroid-run','saturn-ice-field','marvin-confrontation'].includes(scene.id) && t > 2.7 && t < 3.6) {
    keys.add('Shift');
  }
  // Boss introduction remains clearly readable for its first 0.7 seconds.
  if (scene.id.includes('boss') || scene.id.includes('confrontation')) {
    if (t > 1.05 && t < 2.35) keys.add('j');
    if (t >= 2.35 && t < 3.75) keys.add('l');
    if (t < 0.7) return keys;
  }
  const offset = ({
    'city-traffic-combat': 0.70,
    'city-light-speed-boost': 1.10,
    'mars-arrival': 0.30,
    'mars-sandstorm': 0.90,
    'asteroid-run': 0.48,
    'mecha-transformation': 1.65,
    'saturn-ice-field': 1.35,
  })[scene.id] ?? 0;
  const phase = (t + offset) % 3.6;
  if (phase < 0.9) { keys.add('d'); keys.add('w'); }
  else if (phase < 1.8) { keys.add('a'); keys.add('s'); }
  else if (phase < 2.7) { keys.add('a'); keys.add('w'); }
  else { keys.add('d'); keys.add('s'); }
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
    await page.evaluate((seconds) => window.fixture.advance(seconds), scene.start);
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
      if (index === Math.round(fps * 1.6) && !scene.robot) await page.keyboard.press('e');
      if (index === Math.round(fps * 2.25) && scene.robot) await page.keyboard.press('z');
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
  if (frame !== 1620) throw new Error('Expected exactly 54 seconds x 30 native frames, got ' + frame);
  const movingScenes = report.scenes.filter((scene) => scene.motionRange > 8).length;
  if (movingScenes < 7) throw new Error('Motion validation failed: only ' + movingScenes + '/12 scenes show meaningful piloting');
  report.movingScenes = movingScenes;
  if (runtimeErrors.length) throw new Error('Runtime/WebGL failures: ' + runtimeErrors.join('\n'));

  const output = join(destination, 'nova-wing-4k30-native-motion-60s.mp4');
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const title = [
    // No interpolation: 30 genuinely distinct WebGL states every second.
    'scale=3840:2160:flags=lanczos',
    'tpad=stop_mode=clone:stop_duration=6',
    'eq=contrast=1.03:saturation=1.06',
    // Asteroid scene occupies seconds 31.5 to 36.0. Lift midtones, preserve silhouettes.
    "eq=brightness=0.043:gamma=1.23:contrast=1.07:eval=frame:enable='between(t,31.5,36.0)'",
    "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.85:t=fill:enable='gte(t,54)'",
    "drawtext=fontfile=" + font + ":text='NOVA WING':fontcolor=white:fontsize=192:x=(w-text_w)/2:y=735:enable='gte(t,54)'",
    "drawtext=fontfile=" + font + ":text='FIVE CATS':fontcolor=white@0.86:fontsize=75:x=(w-text_w)/2:y=1080:enable='gte(t,54)'",
    "drawtext=fontfile=" + font + ":text='NOVA WING':fontcolor=white:fontsize=142:x=195:y=1640:enable='between(t,0.5,2.8)'",
    "drawtext=fontfile=" + font + ":text='REAL GAMEPLAY - BUILD 1.27.122':fontcolor=white@0.85:fontsize=36:x=200:y=1830:enable='between(t,0.8,2.8)'",
    'fade=t=in:st=0:d=0.5',
    'fade=t=out:st=59.4:d=0.6',
    'format=yuv420p',
  ].join(',');
  const ffmpegArgs = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-framerate', String(fps),
    '-i', join(framesDir, '%06d.jpg'),
    '-stream_loop', '-1', '-i', musicPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', title,
    '-af', 'volume=0.84,afade=t=in:st=0:d=0.6,afade=t=out:st=57.5:d=2.5',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-profile:v', 'high', '-level:v', '5.2',
    '-r', '30', '-g', '60', '-pix_fmt', 'yuv420p', '-threads', '4',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '320k',
    '-t', '60', '-movflags', '+faststart',
    '-metadata', 'title=Nova Wing | Five Cats - Gameplay Trailer',
    output,
  ];
  const encoded = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (encoded.status !== 0) throw new Error('ffmpeg failed: ' + (encoded.error?.message || encoded.stderr));
  if ((await stat(output)).size < 500000) throw new Error('Video output unexpectedly small');
  report.output = output;
  report.durationSeconds = 60;
  report.captureSeconds = frame / fps;
  report.outputFps = 30;
  report.outputWidth = 3840;
  report.outputHeight = 2160;
  report.upscaled = true;
  report.nativeWidth = viewport.width;
  report.nativeHeight = viewport.height;
  report.frameInterpolation = 'none: 30 WebGL-rendered frames per second, each simulated at 1/30s';
  report.asteroidGrading = { scene: 'asteroid-run', start: 31.5, end: 36, gamma: 1.23, brightness: 0.043 };
  await writeFile(join(destination, 'provenance.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('[complete] ' + output + ' (' + report.durationSeconds + 's)');
} finally {
  await browser.close();
}
