import { test, expect } from '@playwright/test';

test('physical boss warning shows actual danger, attack origin and a reachable safe direction', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=9&qaBoss=9');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => window.fixture.game.snapshot().developerScenario)).toMatchObject(
    {
      sector: 9,
      encounter: 'boss',
    },
  );
  await page.evaluate(() => window.fixture.advance(9.2));
  const radar = page.locator('#battleRadar');
  await expect(radar).toHaveAttribute('data-mode', 'physical');
  await expect(page.locator('#radarThreatMap')).toBeVisible();
  await expect(page.locator('#radarAttackOrigin')).toBeVisible();
  await expect(page.locator('#radarThreatEllipse')).toBeVisible();
  await expect(page.locator('#radarSafePoint')).toBeVisible();
  await expect(page.locator('#radarGuide')).toHaveAttribute('data-danger', 'true');
  await expect(page.locator('#radarGuide')).toContainText('ZONA SEGURA');
  await page.screenshot({ path: info.outputPath('boss-threat-radar.png') });
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.fixture.advance(1.1));
  await page.keyboard.up('KeyD');
  await expect(page.locator('#radarGuide')).toHaveAttribute('data-danger', 'false');
  await expect(page.locator('#radarGuide')).toContainText('SEGURO');
  await expect(page.locator('#attackWarning')).toHaveAttribute('data-severity', 'info');
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => window.fixture.advance(0.05));
    const rect = await radar.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(size.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(size.height * 0.7);
    expect(rect.x).toBeGreaterThan(size.width * 0.65);
    await page.screenshot({ path: info.outputPath('boss-radar-' + size.width + '.png') });
  }
  expect(errors).toEqual([]);
});
