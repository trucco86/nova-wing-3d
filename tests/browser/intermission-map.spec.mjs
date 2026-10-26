import { test, expect } from '@playwright/test';

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
