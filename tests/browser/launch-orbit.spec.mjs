import { test, expect } from '@playwright/test';

test('sector 1 needs BOOST depletion, then spends time climbing above the city', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  await page.evaluate(() => window.fixture.advance(23));
  const city = await page.evaluate(() => window.fixture.game.snapshot());
  expect(city.orbitalLaunch.phase).toBe('boost');
  expect(city.route.ascent).toBe(0);
  await expect(page.locator('#routeLabel')).toContainText('SEGURE BOOST');
  await page.screenshot({ path: info.outputPath('launch-city-before-boost.png') });

  await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(3.6));
  await page.keyboard.up('Shift');
  const exhausted = await page.evaluate(() => window.fixture.game.snapshot());
  expect(exhausted.orbitalLaunch.phase).toBe('atmosphere');
  expect(exhausted.orbitalLaunch.exhaustedAt).toBeLessThanOrEqual(5);
  await page.screenshot({ path: info.outputPath('launch-boost-depleted.png') });

  await page.evaluate(() => window.fixture.advance(19));
  const sky = await page.evaluate(() => window.fixture.game.snapshot());
  expect(sky.orbitalLaunch.phase).toBe('atmosphere');
  expect(sky.route.ascent).toBeGreaterThan(0.5);
  expect(sky.orbitalLaunch.amount).toBeLessThan(1);
  await expect(page.locator('#routeLabel')).toContainText('ATMOSFERA');
  await page.screenshot({ path: info.outputPath('launch-through-atmosphere.png') });

  await page.evaluate(() => window.fixture.advance(20));
  const orbit = await page.evaluate(() => window.fixture.game.snapshot());
  expect(orbit.orbitalLaunch.phase).toBe('orbit');
  expect(orbit.orbitalLaunch.complete).toBe(true);
  await expect(page.locator('#routeLabel')).toContainText('ÓRBITA TERRESTRE');
  await page.screenshot({ path: info.outputPath('launch-orbit-horizon.png') });
  expect(errors).toEqual([]);
});

test('space obstacles arrive only after the BOOST-powered urban exit', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  let citySeen = false;
  for (let i = 0; i < 23; i++) {
    const state = await page.evaluate(() => {
      window.fixture.game.collect('shield');
      window.fixture.advance(1);
      return window.fixture.game.snapshot();
    });
    if (state.obstacleKinds.some((kind) => ['gantry', 'reactor'].includes(kind))) citySeen = true;
  }
  expect(citySeen).toBe(true);
  await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(3.6));
  await page.keyboard.up('Shift');
  expect((await page.evaluate(() => window.fixture.game.snapshot())).orbitalLaunch.phase).toBe(
    'atmosphere',
  );

  // No industrial gantries OR orbital blocks should enter the camera lane
  // while the pilot is still crossing the atmosphere, even at late ascent.
  let atmosphereSeen = false;
  let reachedOrbit = false;
  for (let i = 0; i < 52; i++) {
    const state = await page.evaluate(() => {
      window.fixture.game.collect('shield');
      window.fixture.advance(1);
      return window.fixture.game.snapshot();
    });
    if (state.orbitalLaunch.phase === 'atmosphere') {
      atmosphereSeen = true;
      expect(state.obstacleKinds, 'atmospheric climb must stay clear of obstacles').toEqual([]);
    }
    if (state.orbitalLaunch.phase === 'orbit') {
      reachedOrbit = true;
      break;
    }
  }
  expect(atmosphereSeen).toBe(true);
  expect(reachedOrbit).toBe(true);
  let spaceSeen = false;
  for (let i = 0; i < 35; i++) {
    const state = await page.evaluate(() => {
      window.fixture.game.collect('shield');
      window.fixture.advance(0.6);
      return window.fixture.game.snapshot();
    });
    expect(state.orbitalLaunch.phase).toBe('orbit');
    if (state.obstacleKinds.some((kind) => ['satellite', 'carrier', 'debris'].includes(kind))) {
      spaceSeen = true;
      break;
    }
  }
  expect(spaceSeen).toBe(true);
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.orbitalLaunch.complete).toBe(true);
  expect(
    snapshot.obstacleKinds.some((kind) => ['gantry', 'reactor', 'tunnel'].includes(kind)),
  ).toBe(false);
  await page.screenshot({ path: info.outputPath('launch-space-obstacles.png') });
  expect(errors).toEqual([]);
});
