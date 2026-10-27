import { test, expect } from '@playwright/test';

test('scatter cannon is bought/equipped in hangar and fires a real close-range cone', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.hangar());
  await expect(page.locator('#shop')).toBeVisible();

  const buy = page.locator('#buyscatter');
  const equip = page.locator('#equipScatter');
  await expect(buy).toBeEnabled();
  await expect(equip).toBeDisabled();
  await buy.click();
  await expect(equip).toBeEnabled();
  await expect(page.locator('#scatterInfo')).toContainText('PULSO');
  await equip.click();
  await expect(page.locator('#scatterInfo')).toContainText('DISPERSÃO');
  await page.screenshot({ path: info.outputPath('scatter-equipped-hangar.png') });

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('nova-wing-3d-v1')));
  expect(persisted.scatterOwned).toBe(true);
  expect(persisted.fireMode).toBe('scatter');

  await page.locator('#nextSector').click();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await page.locator('#mapLaunch').click();
  await expect(page.locator('#campaignMap')).toBeHidden();
  await page.evaluate(() => window.fixture.game.fire());
  const shot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(shot.entities.shots).toBe(5);
  expect(shot.scatterOwned).toBe(true);
  expect(shot.fireMode).toBe('scatter');
  if (info.project.name === 'mobile') {
    const infoBounds = await page.locator('#scatterInfo').boundingBox();
    expect(infoBounds, 'equipment UI stays off the main combat view').toBeNull();
  }
  await page.screenshot({ path: info.outputPath('scatter-in-flight.png') });
  expect(errors).toEqual([]);
});
