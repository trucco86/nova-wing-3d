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
  // Hazards travel across the screen between spawn waves. Capture an actual
  // populated orbital frame rather than assuming a craft exists at second 73.
  const { snapshot, firstVisibleAt } = await page.evaluate(() => {
    let result = window.fixture.game.snapshot();
    let firstVisibleAt = -1;
    for (let i = 0; i < 81; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(1);
      result = window.fixture.game.snapshot();
      const spacecraft = result.obstacleKinds.some((kind) =>
        ['satellite', 'carrier', 'debris'].includes(kind),
      );
      if (i >= 60 && spacecraft) {
        firstVisibleAt = i + 1;
        break;
      }
    }
    return { snapshot: result, firstVisibleAt };
  });
  expect(firstVisibleAt, 'an orbital obstacle must appear in the 61-81s window').toBeGreaterThan(0);
  expect(snapshot.route.ascent).toBeGreaterThan(0.7);
  expect(
    snapshot.obstacleKinds.some((kind) => ['satellite', 'carrier', 'debris'].includes(kind)),
  ).toBe(true);
  expect(
    snapshot.obstacleKinds.some((kind) => ['gantry', 'reactor', 'tunnel'].includes(kind)),
  ).toBe(false);
  await page.screenshot({ path: info.outputPath('launch-space-obstacles.png') });
  expect(errors).toEqual([]);
});
