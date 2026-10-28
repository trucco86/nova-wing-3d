import { test, expect } from '@playwright/test';

test('Five Cats intro shows five readable wingmen with Bia leading, then releases flight', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0&intro=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(1.2));
  const intro = await page.evaluate(() => window.fixture.game.snapshot().fiveCats);
  expect(intro.visible).toHaveLength(5);
  expect(intro.visible.find((ship) => ship.pilot === 'bia').x).toBe(0);
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeLessThan(0.1);
  await expect(page.locator('#squadFormationStatus')).toBeVisible();
  await page.screenshot({ path: info.outputPath('bia-five-cats-formation-mobile.png') });
  await page.evaluate(() => window.fixture.advance(4.1));
  expect(await page.evaluate(() => window.fixture.game.snapshot().fiveCats.intro)).toBe(0);
  await expect(page.locator('#squadFormationStatus')).toBeHidden();
  await page.evaluate(() => window.fixture.advance(0.6));
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeGreaterThan(0.5);
});

test('Plasma Titan and Five Cats Overdrive fire physical shots without covering center HUD', async ({
  page,
}, info) => {
  test.setTimeout(100000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const plasma = page.locator('#plasmaTitan');
  await page.locator('#strategyDrawer summary').click();
  await expect(plasma).toBeVisible();
  await plasma.click();
  await page.evaluate(() => window.fixture.advance(0.35));
  const data = await page.evaluate(() => window.fixture.game.snapshot());
  expect(data.fiveCats.plasmaTime).toBeGreaterThan(0);
  expect(data.entities.shots).toBeGreaterThan(0);
  expect(data.strategy.arcana).toBeLessThan(100);
  await page.screenshot({ path: info.outputPath('plasma-titan-mobile.png') });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.locator('#strategyDrawer summary').click();
  await page.locator('#fiveCatsOverdrive').click();
  await page.evaluate(() => window.fixture.advance(0.2));
  const overdrive = await page.evaluate(() => window.fixture.game.snapshot().fiveCats);
  expect(overdrive.overdriveTime).toBeGreaterThan(0);
  expect(overdrive.visible).toHaveLength(4);
  await expect(page.locator('#squadSuperStatus')).toBeVisible();
  await page.screenshot({ path: info.outputPath('five-cats-overdrive-mobile.png') });
});
