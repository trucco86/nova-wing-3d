import { test, expect } from '@playwright/test';
import { SECTORS } from '../../src/campaign.js';

test('first subboss health stays at the top-right information edge on phones', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Subboss touch layout requires a phone viewport');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0&encounters=1');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const firstArrival = SECTORS[0].duration * 0.22;
    await page.evaluate((arrival) => {
      while (window.fixture.game.snapshot().seconds < arrival + 3) {
        window.fixture.game.collect('shield');
        window.fixture.advance(0.5);
      }
    }, firstArrival);
    await expect(page.locator('#subHUD')).toBeVisible();
    const bounds = await page.locator('#subHUD').boundingBox();
    const rail = await page.locator('#hudNotices').boundingBox();
    const quickRpg = await page.locator('#quickRpg').boundingBox();
    expect(bounds.x, 'Subboss card should not cover the central aiming lane').toBeGreaterThan(
      viewport.width * 0.58,
    );
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height, 'Subboss card should stay above the center').toBeLessThan(
      viewport.height * 0.49,
    );
    // A status card must not cover either quick-RPG button or an alert.
    const overlap = (a, b) =>
      a.x < b.x + b.width - 3 && a.x + a.width > b.x + 3 &&
      a.y < b.y + b.height - 3 && a.y + a.height > b.y + 3;
    expect(overlap(bounds, quickRpg), 'Subboss health overlaps quick-RPG actions').toBe(false);
    const state = await page.evaluate(() => window.fixture.game.snapshot());
    expect(state.encounterKinds).toContain('subboss');
    await page.screenshot({ path: info.outputPath('subboss-health-' + viewport.width + 'x' + viewport.height + '.png') });
    expect(rail.y).toBeLessThan(viewport.height / 2);
  }
  expect(errors).toEqual([]);
});