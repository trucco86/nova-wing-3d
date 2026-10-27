import { test, expect } from '@playwright/test';
import { translateText } from '../../src/i18n.js';

test('intermission hangar upgrades projectiles and cadence before campaign map and next sector', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&xp=740');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.hangar());
  await expect(page.locator('#shop')).toBeVisible();
  await expect(page.locator('#shopTitle')).toContainText('01');
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await page.locator('#buyvolley').click();
  await page.locator('#buyrapid').click();
  const upgraded = await page.evaluate(() => window.fixture.game.snapshot());
  expect(upgraded.volley).toBe(1);
  expect(upgraded.rapid).toBe(1);
  expect(upgraded.credits).toBeLessThan(before.credits);
  await page.screenshot({ path: info.outputPath('hangar-multishot-rapid.png') });
  await page.locator('#nextSector').click();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#shop')).toBeHidden();
  await expect(page.locator('.campaign-node')).toHaveCount(10);
  await expect(page.locator('.campaign-node.completed')).toHaveCount(1);
  await expect(page.locator('.campaign-node.next')).toHaveCount(1);
  await expect(page.locator('#mapSectorTitle')).toContainText('DISTRITO PORTUÁRIO');
  await expect(page.locator('#mapSectorThreat')).toContainText('Defesas costeiras');
  await expect(page.locator('#mapSectorBoss')).toContainText('NAVE-FERRÃO');
  if (page.viewportSize().width >= 701 && page.viewportSize().height <= 550) {
    // On small landscape screens the player must see route and launch
    // CTA without guessing there is important content below the fold.
    const launch = await page.locator('#mapLaunch').boundingBox();
    const briefing = await page.locator('#mapSectorTitle').boundingBox();
    expect(launch).not.toBeNull();
    expect(briefing).not.toBeNull();
    expect(launch.y + launch.height).toBeLessThanOrEqual(page.viewportSize().height);
    expect(briefing.y).toBeGreaterThanOrEqual(0);
  }
  await page.screenshot({ path: info.outputPath('campaign-map-10-stages.png') });
  await page.locator('#mapBack').click();
  await expect(page.locator('#shop')).toBeVisible();
  await page.locator('#nextSector').click();
  await page.locator('#mapLaunch').click();
  const next = await page.evaluate(() => window.fixture.game.snapshot());
  expect(next.sector).toBe(2);
  expect(next.state).toBe('playing');
  expect(next.volley).toBe(1);
  expect(next.rapid).toBe(1);
  await expect(page.locator('#campaignMap')).toBeHidden();
  await expect(page.locator('#shop')).toBeHidden();
  expect(errors).toEqual([]);
});

test('localized hangar and galaxy map remain reachable in a narrow viewport', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 568 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const lang of ['en', 'es']) {
    await page.goto('/__dynamic.html?sector=1');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.locator('#pause').click();
    await page.locator('#pauseOptions').click();
    await page.locator('#settingLanguage').selectOption(lang);
    await page.locator('#settingsClose').click();
    await page.locator('#pauseResume').click();
    await page.evaluate(() => window.fixture.hangar());
    const hangarBounds = await page.locator('#shop .hangar-card').boundingBox();
    expect(hangarBounds.y).toBeGreaterThanOrEqual(0);
    expect(hangarBounds.y + hangarBounds.height).toBeLessThanOrEqual(page.viewportSize().height);
    await expect(page.locator('#buyvolley')).toContainText(
      translateText('MULTITIRO · +1 PROJÉTIL', lang),
    );
    await page.locator('#buyvolley').click();
    await page.locator('#buyrapid').click();
    await page.screenshot({
      path: info.outputPath('hangar-' + lang + '-' + page.viewportSize().width + '.png'),
    });
    await page.locator('#nextSector').click();
    await expect(page.locator('#campaignMap')).toHaveAttribute(
      'aria-label',
      translateText('Mapa de progresso da campanha', lang),
    );
    await expect(page.locator('#mapSectorThreat')).toContainText(
      translateText('Detritos em alta velocidade e perfuradores', lang),
    );
    await expect(page.locator('.campaign-node.next small')).toHaveText(
      translateText('PRÓXIMA MISSÃO', lang),
    );
    const bounds = await page.locator('.campaign-map-card').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
    await page.locator('#mapLaunch').scrollIntoViewIfNeeded();
    const target = await page.locator('#mapLaunch').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.id;
    });
    expect(target).toBe('mapLaunch');
    await page.screenshot({
      path: info.outputPath('map-' + lang + '-' + page.viewportSize().width + '.png'),
    });
    await page.locator('#mapBack').click();
    await expect(page.locator('#shop')).toBeVisible();
    await page.locator('#nextSector').click();
    await page.locator('#mapLaunch').click();
    const next = await page.evaluate(() => window.fixture.game.snapshot());
    expect(next.state).toBe('playing');
    expect(next.sector).toBe(3);
    expect(next.volley).toBe(1);
    expect(next.rapid).toBe(1);
  }
  expect(errors).toEqual([]);
});

test('bomb supply pack adds real inventory and never exceeds eight slots', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.hangar());
  await expect(page.locator('#shop')).toBeVisible();
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await page.locator('#buybombPack').click();
  const after = await page.evaluate(() => window.fixture.game.snapshot());
  expect(after.bombs).toBe(Math.min(8, before.bombs + 3));
  expect(after.credits).toBeLessThan(before.credits);
  await expect(page.locator('#shopCredits')).toContainText(after.bombs + ' BOMBAS');
});
