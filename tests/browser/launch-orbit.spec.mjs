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

test('space hazards replace urban gantries and remain visible as dodging obstacles', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const snapshot = await page.evaluate(() => {
    for (let i = 0; i < 73; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(1);
    }
    return window.fixture.game.snapshot();
  });
  expect(snapshot.route.ascent).toBeGreaterThan(0.7);
  expect(snapshot.obstacleKinds.some((kind) => ['satellite', 'carrier', 'debris'].includes(kind))).toBe(true);
  expect(snapshot.obstacleKinds.some((kind) => ['gantry', 'reactor', 'tunnel'].includes(kind))).toBe(false);
  await page.screenshot({ path: info.outputPath('launch-space-obstacles.png') });
  expect(errors).toEqual([]);
});
