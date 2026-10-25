import { test, expect } from '@playwright/test';

test('sector 1 visibly transitions from the city to orbit without browser errors', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  await page.evaluate(() => window.fixture.advance(9));
  const cityRoute = await page.evaluate(() => window.fixture.game.snapshot().route);
  expect(cityRoute.ascent).toBe(0);
  await page.screenshot({ path: info.outputPath('launch-city.png') });

  await page.evaluate(() => window.fixture.advance(62));
  const orbitRoute = await page.evaluate(() => window.fixture.game.snapshot().route);
  expect(orbitRoute.ascent).toBeGreaterThan(0.65);
  await expect(page.locator('#routeLabel')).toContainText('ASCENSÃO ORBITAL');
  await page.screenshot({ path: info.outputPath('launch-orbit-horizon.png') });
  expect(errors).toEqual([]);
});
