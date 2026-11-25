import { test, expect } from '@playwright/test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inspectCityPhysics } from '../../tools/gameplay-physics-observer.mjs';
import { inspectSweptCity } from '../../tools/gameplay-swept-observer.mjs';
import { playerProfiles, steeringPlan } from '../../tools/gameplay-player-profiles.mjs';
import { createGameplayReviewClip } from '../../tools/gameplay-observer-video.mjs';
import { gameplayReport } from '../gameplay-quality-report.mjs';

async function steer(page, project, direction, run) {
  if (!direction) return run();
  if (project !== 'mobile') {
    const key = direction > 0 ? 'KeyD' : 'KeyA';
    await page.keyboard.down(key);
    try {
      return await run();
    } finally {
      await page.keyboard.up(key);
    }
  }
  const stick = await page.locator('#stick').boundingBox();
  if (!stick) throw new Error('Missing touch joystick');
  const touch = await page.context().newCDPSession(page);
  const center = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2, id: 1 };
  try {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ ...center, x: center.x + direction * stick.width * 0.4 }],
    });
    return await run();
  } finally {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  }
}

for (const profile of Object.keys(playerProfiles)) {
  test('physics observer city: ' + profile, async ({ browser }, info) => {
    test.setTimeout(180000);
    const scenario = 'physics-' + profile;
    const route = '/__dynamic.html?sector=0&citySetpieces=0';
    const viewport = info.project.use.viewport ?? { width: 1366, height: 768 };
    const tempDir = await mkdtemp(join(tmpdir(), 'nova-physics-video-'));
    const context = await browser.newContext({
      baseURL: info.project.use.baseURL ?? 'http://127.0.0.1:4173',
      viewport,
      isMobile: Boolean(info.project.use.isMobile),
      hasTouch: Boolean(info.project.use.hasTouch),
      deviceScaleFactor: info.project.use.deviceScaleFactor ?? 1,
      recordVideo: {
        dir: tempDir,
        size: {
          width: Math.min(960, viewport.width),
          height: Math.min(540, viewport.height),
        },
      },
    });
    const page = await context.newPage();
    const recording = page.video();
    const started = Date.now();
    const plan = steeringPlan(profile);
    const samples = [];
    const errors = [];
    const checkpoints = [];
    const checks = [];
    let error = null;
    let eventSeconds;
    page.on('pageerror', (event) => errors.push(event.message));
    try {
      await page.goto(route);
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => window.fixture.advance(1.2));
      for (const step of plan) {
        const batch = await steer(page, info.project.name, step.direction, () =>
          page.evaluate(async (ticks) => {
            const { advance, game } = window.fixture;
            const result = [];
            for (let i = 0; i < ticks; i++) {
              advance(0.1);
              const state = game.snapshot();
              result.push({
                sector: state.sector,
                state: state.state,
                seconds: state.seconds,
                wallTime: Date.now(),
                player: state.player,
                playerDepth: state.playerDepth,
                cityPhysicalSolids: state.cityPhysicalSolids,
                cityCameraOcclusion: state.cityCameraOcclusion,
                cityImpactCount: state.cityImpactCount,
              });
              // Let the actual frame reach Playwright's video recorder.
              await new Promise((resolve) => setTimeout(resolve, 70));
            }
            return result;
          }, step.ticks),
        );
        samples.push(...batch);
      }
      const penetration = inspectCityPhysics(samples);
      const swept = inspectSweptCity(samples);
      checks.push({
        id: 'physics-coverage',
        ok: penetration.status !== 'BLOCKED' && swept.status !== 'BLOCKED',
        expected: 'valid penetration and swept telemetry',
        observed: { penetration: penetration.status, swept: swept.status, pairs: swept.pairs },
      });
      if (checks[0].ok === false) error = 'Missing or malformed physics evidence';
      const findings = [...penetration.findings, ...swept.findings].sort(
        (a, b) => a.detectedAt - b.detectedAt,
      );
      for (const finding of findings) {
        checks.push({
          id: finding.id,
          ok: false,
          expected: 'no candidate violation of ' + finding.rule,
          observed: finding,
        });
      }
      if (findings.length) {
        const event = samples.find((sample) => sample.seconds >= findings[0].detectedAt);
        if (event) eventSeconds = Math.max(0, (event.wallTime - started) / 1000);
      }
      const path = info.outputPath(profile + '-city.png');
      await page.screenshot({ path });
      await info.attach('city-physics-checkpoint', { path, contentType: 'image/png' });
      checkpoints.push({
        name: 'end-of-route',
        seconds: samples.at(-1)?.seconds,
        screenshot: profile + '-city.png',
      });
    } catch (failure) {
      error = String(failure);
    }
    checks.push({ id: 'runtime-errors', ok: !errors.length, expected: [], observed: errors });
    if (errors.length) error = error || errors.join(' | ');
    const report = gameplayReport({
      scenario,
      project: info.project.name,
      viewport,
      commit: process.env.GITHUB_SHA,
      checks,
      checkpoints,
      error,
    });
    report.physics = { route, profile, plan, samples };
    const directory = join('artifacts', 'gameplay-observer');
    await mkdir(directory, { recursive: true });
    try {
      await context.close();
      if (report.status !== 'OBSERVED_OK') {
        const file = scenario + '-' + info.project.name + '-review.mp4';
        const target = join(directory, file);
        const clip = await createGameplayReviewClip({
          source: await recording.path(),
          destination: target,
          eventSeconds,
        });
        report.video = {
          file,
          durationSeconds: clip.durationSeconds,
          startSeconds: clip.startSeconds,
          triggers: report.findings.map((finding) => finding.id),
          context: 'Approximate event time in a recorded real WebGL steering route',
        };
        await info.attach('gameplay-review.mp4', { path: target, contentType: 'video/mp4' });
      }
    } catch (failure) {
      report.status = 'BLOCKED';
      report.error = [report.error, 'Video evidence failed: ' + String(failure)]
        .filter(Boolean)
        .join(' | ');
    } finally {
      await context.close().catch(() => {});
      await rm(tempDir, { recursive: true, force: true });
    }
    const body = JSON.stringify(report, null, 2);
    await writeFile(join(directory, scenario + '-' + info.project.name + '.json'), body + '\n');
    await info.attach('city-physics-telemetry.json', {
      body: Buffer.from(body),
      contentType: 'application/json',
    });
    expect(report.status, report.error || 'physics observer').not.toBe('BLOCKED');
  });
}
