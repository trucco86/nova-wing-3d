import { test, expect } from '@playwright/test';
import { inspectCityPhysics } from '../../tools/gameplay-physics-observer.mjs';
import { playerProfiles, steeringPlan } from '../../tools/gameplay-player-profiles.mjs';

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
  test('physics observer city: ' + profile, async ({ page }, info) => {
    test.setTimeout(120000);
    const route = '/__dynamic.html?sector=0&citySetpieces=0';
    const plan = steeringPlan(profile);
    const samples = [];
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.advance(1.2));
    for (const step of plan) {
      const batch = await steer(page, info.project.name, step.direction, () =>
        page.evaluate((ticks) => {
          const { advance, game } = window.fixture;
          const result = [];
          for (let i = 0; i < ticks; i++) {
            advance(0.1, { renderAfter: false });
            const state = game.snapshot();
            result.push({
              sector: state.sector,
              state: state.state,
              seconds: state.seconds,
              player: state.player,
              playerDepth: state.playerDepth,
              cityPhysicalSolids: state.cityPhysicalSolids,
              cityCameraOcclusion: state.cityCameraOcclusion,
              cityImpactCount: state.cityImpactCount,
            });
          }
          advance(0);
          return result;
        }, step.ticks),
      );
      samples.push(...batch);
    }
    const report = inspectCityPhysics(samples);
    const path = info.outputPath(profile + '-city.png');
    await page.screenshot({ path });
    await info.attach('city-physics-checkpoint', { path, contentType: 'image/png' });
    await info.attach('city-physics-telemetry.json', {
      body: Buffer.from(
        JSON.stringify(
          {
            ...report,
            commit: process.env.GITHUB_SHA ?? null,
            route,
            profile,
            plan,
            project: info.project.name,
            viewport: page.viewportSize(),
            errors,
            samples,
          },
          null,
          2,
        ),
      ),
      contentType: 'application/json',
    });
    expect(errors).toEqual([]);
    expect(report.status, 'missing or malformed physics evidence').not.toBe('BLOCKED');
  });
}
