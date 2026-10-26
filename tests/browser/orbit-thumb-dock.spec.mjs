import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

const overlaps = (a, b, tolerance = 1) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - tolerance &&
  a.x + a.width > b.x + tolerance &&
  a.y < b.y + b.height - tolerance &&
  a.y + a.height > b.y + tolerance;

test('P0 touch orbit dock remains thumb-reachable and radar has a separate telemetry lane', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Real thumb input requires touch viewport');
  test.setTimeout(240000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 5 });
    await expect(page.locator('#orbitControls')).toBeVisible();
    await expect(page.locator('#tacticalPanel')).toBeVisible();
    const geo = await page.evaluate(() => {
      const box = (selector) => {
        const el = document.querySelector(selector);
        if (!el || el.hidden || getComputedStyle(el).display === 'none') return null;
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        orbit: box('#orbitControls'),
        left: box('#orbitLeft'),
        right: box('#orbitRight'),
        actions: box('#touch .actions'),
        stick: box('#stick'),
        radar: box('#tacticalPanel'),
        boss: box('#bossHUD'),
        rpg: box('#strategyControls'),
        camera: box('#cameraView'),
        status: box('.status'),
        score: box('.score'),
      };
    });
    for (const id of ['orbit', 'left', 'right', 'actions', 'radar']) {
      expect(geo[id], id + ' must be visible').not.toBeNull();
    }
    for (const id of ['left', 'right']) {
      const button = geo[id];
      expect(button.width, id + ' touch width').toBeGreaterThanOrEqual(60);
      expect(button.height, id + ' touch height').toBeGreaterThanOrEqual(60);
      expect(button.x, id + ' viewport left').toBeGreaterThanOrEqual(0);
      expect(button.x + button.width, id + ' viewport right').toBeLessThanOrEqual(viewport.width);
      expect(button.y, id + ' viewport top').toBeGreaterThanOrEqual(0);
      expect(button.y + button.height, id + ' viewport bottom').toBeLessThanOrEqual(
        viewport.height,
      );
    }
    expect(overlaps(geo.orbit, geo.actions), 'orbit must not block five primary actions').toBe(
      false,
    );
    expect(overlaps(geo.orbit, geo.stick), 'orbit must not obstruct joystick').toBe(false);
    expect(geo.orbit.x, 'orbit belongs to the right thumb area').toBeGreaterThan(
      viewport.width * 0.25,
    );
    expect(
      geo.actions.y - (geo.orbit.y + geo.orbit.height),
      'orbit remains immediately above actions',
    ).toBeGreaterThanOrEqual(0);
    expect(
      geo.actions.y - (geo.orbit.y + geo.orbit.height),
      'orbit must stay close to actions',
    ).toBeLessThanOrEqual(48);
    for (const id of ['boss', 'rpg', 'camera', 'status', 'score', 'orbit', 'actions']) {
      expect(overlaps(geo.radar, geo[id]), 'radar must not overlap ' + id).toBe(false);
    }

    const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    const tapTarget = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.id,
      center(geo.left),
    );
    expect(tapTarget, 'actual left thumb touch must reach orbital button').toBe('orbitLeft');
    const before = await page.evaluate(() => window.fixture.game.snapshot().strategy.orbitAngle);
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...center(geo.left), id: 41 }],
    });
    await page.evaluate(() => window.fixture.advance(1.2));
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    const after = await page.evaluate(() => window.fixture.game.snapshot().strategy.orbitAngle);
    expect(after, 'holding the actual orbit button must steer the boss encounter').toBeLessThan(
      before - 0.35,
    );
    await page.screenshot({
      path: info.outputPath('orbit-thumb-dock-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
  expect(errors).toEqual([]);
});
