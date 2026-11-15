import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

const center = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

test('mobile RPG always closes and does not hide or block either boss orbit control', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Real mobile touch environment required');
  test.setTimeout(180000);
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

    const drawer = page.locator('#strategyDrawer');
    const summary = drawer.locator('summary');
    const orbit = page.locator('#orbitControls');
    await expect(drawer).not.toHaveAttribute('open');
    await expect(summary).toBeVisible();
    await expect(orbit).toBeVisible();

    const headerBefore = await summary.boundingBox();
    await summary.tap();
    await expect(drawer).toHaveAttribute('open');
    const headerOpen = await summary.boundingBox();
    expect(
      Math.abs(headerOpen.y - headerBefore.y),
      'RPG toggle must not jump away on open',
    ).toBeLessThan(2);
    await expect(drawer.locator('.rpgDrawerBody')).toBeVisible();

    await expect(page.locator('body')).toHaveClass(/rpg-tactical-paused/);
    const frozenBefore = await page.evaluate(() => window.fixture.game.snapshot());
    for (const id of ['orbitLeft', 'orbitRight']) {
      const button = page.locator('#' + id);
      await expect(button).toBeVisible();
      const rect = await button.boundingBox();
      const target = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.id,
        center(rect),
      );
      // QA140 intentionally prevents orbit input during tactical pause.
      // An outside tap closes the RPG; a subsequent touch can steer.
      expect(target, id + ' should be shielded while tactical RPG is open').toBe(
        'rpgTacticalScrim',
      );
    }
    await page.evaluate(() => window.fixture.advance(0.8));
    const frozenAfter = await page.evaluate(() => window.fixture.game.snapshot());
    expect(frozenAfter.strategy.orbitAngle).toBe(frozenBefore.strategy.orbitAngle);
    expect(frozenAfter.seconds).toBe(frozenBefore.seconds);

    // User can always close RPG by tapping its pinned heading, even if the
    // tactical content would otherwise need scrolling.
    await summary.tap();
    await expect(drawer).not.toHaveAttribute('open');
    await expect(orbit).toBeVisible();
    await summary.tap();
    await expect(drawer).toHaveAttribute('open');

    // First touch outside the modal dismisses it without accidental steering.
    // A second, deliberate press can begin the orbital maneuver immediately.
    const left = await page.locator('#orbitLeft').boundingBox();
    const before = await page.evaluate(() => window.fixture.game.snapshot().strategy.orbitAngle);
    await page.touchscreen.tap(center(left).x, center(left).y);
    await expect(drawer).not.toHaveAttribute('open');
    await expect(page.locator('body')).not.toHaveClass(/rpg-tactical-paused/);
    expect(await page.evaluate(() => window.fixture.game.snapshot().strategy.orbitAngle)).toBe(
      before,
    );
    expect(
      await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, center(left)),
    ).toBe('orbitLeft');
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...center(left), id: 76 }],
    });
    await page.evaluate(() => window.fixture.advance(1));
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    const after = await page.evaluate(() => window.fixture.game.snapshot().strategy.orbitAngle);
    expect(after, 'actual left orbit hold changes the pilot heading').toBeLessThan(before - 0.3);
    await expect(page.locator('#orbitRight')).toBeVisible();

    await page.screenshot({
      path: info.outputPath(
        'rpg-orbit-available-' + viewport.width + 'x' + viewport.height + '.png',
      ),
    });
  }
  expect(errors).toEqual([]);
});
