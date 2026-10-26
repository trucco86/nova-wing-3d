import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

test('combined P0 orbit controls and P1 campaign hangar work in one build on mobile', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Combined thumb flow runs on mobile');
  test.setTimeout(240000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0&xp=740');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 5 });
    await expect(page.locator('#orbitControls')).toBeVisible();
    await expect(page.locator('#tacticalPanel')).toBeVisible();
    const geo = await page.evaluate(() => {
      const rect = (sel) => {
        const el = document.querySelector(sel);
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      };
      const orbit = rect('#orbitControls');
      const actions = rect('#touch .actions');
      const radar = rect('#tacticalPanel');
      const overlaps = (a, b) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height &&
        a.y + a.height > b.y;
      const left = rect('#orbitLeft');
      return {
        orbitActionsOverlap: overlaps(orbit, actions),
        radarActionsOverlap: overlaps(radar, actions),
        target: document.elementFromPoint(left.x + left.width / 2, left.y + left.height / 2)
          ?.id,
      };
    });
    expect(geo.orbitActionsOverlap).toBe(false);
    expect(geo.radarActionsOverlap).toBe(false);
    expect(geo.target).toBe('orbitLeft');

    // Reload from a clean checkpoint: the hangar helper plays a full sector
    // before defeating its boss. It is not valid to call it while already
    // inside an active boss fight; the route and controls share the same build.
    await page.goto('/__dynamic.html?sector=0&xp=740');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.hangar());
    await expect(page.locator('#shop')).toBeVisible();
    await page.locator('#buyvolley').click();
    await page.locator('#buyrapid').click();
    const shopping = await page.evaluate(() => window.fixture.game.snapshot());
    expect(shopping.volley).toBe(1);
    expect(shopping.rapid).toBe(1);
    await page.locator('#nextSector').click();
    await expect(page.locator('#campaignMap')).toBeVisible();
    await expect(page.locator('.campaign-node')).toHaveCount(10);
    await expect(page.locator('#mapSectorTitle')).toContainText('DISTRITO PORTUÁRIO');
    await expect(page.locator('#mapLaunch')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('integrated-orbit-to-campaign-' + viewport.width + 'x' + viewport.height + '.png'),
    });
    await page.locator('#mapLaunch').click();
    const next = await page.evaluate(() => window.fixture.game.snapshot());
    expect(next.sector).toBe(2);
    expect(next.state).toBe('playing');
    expect(next.volley).toBe(1);
    expect(next.rapid).toBe(1);
    await expect(page.locator('#campaignMap')).toBeHidden();
  }
  expect(errors).toEqual([]);
});
