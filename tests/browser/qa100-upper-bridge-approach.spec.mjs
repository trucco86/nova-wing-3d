import { test, expect } from '@playwright/test';

test('stage-one upper skybridge physically stops the ship in its real approaching position', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(
    state.cityPhysicalSolids.filter((solid) => solid.kind === 'upper-bridge-deck').length,
  ).toBe(6); // 3 per scrolling tile, present in Medium and High

  // Climb to a deck's actual 92-unit altitude, then HOLD POSITION.
  // The moving bridge is expected to arrive on its own, not a test-only
  // manually teleported obstacle.
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(4.0, { renderAfter: false }));
  await page.keyboard.up('KeyW');
  const approach = await page.evaluate(() => {
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(approach.player.y).toBeGreaterThan(77);
  expect(approach.player.y).toBeLessThan(106);
  const beforeImpact = approach.cityImpactCount;
  await page.evaluate(() => window.fixture.advance(4.0));
  state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.cityImpactCount).toBeGreaterThan(beforeImpact);
  expect(Math.abs(state.player.x)).toBeLessThan(5, 'bridge contact may not teleport the ship sideways');
  expect(state.player.y).toBeLessThan(92 - 2.1 - 2.3 + 0.2);
  await page.screenshot({
    path: info.outputPath('upper-bridge-physical-intercept-' + info.project.name + '.png'),
  });
  expect(errors).toEqual([]);
});

test('stage-one upper skybridge leaves the genuinely open sky route above the deck', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(7.7, { renderAfter: false }));
  await page.keyboard.up('KeyW');
  const state = await page.evaluate(() => {
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(state.flightBounds.maxY).toBe(184);
  expect(state.player.y).toBeGreaterThan(138);
  expect(state.player.y).toBeLessThanOrEqual(184);
  expect(state.camera.y).toBeGreaterThan(80);
  expect(state.cityImpactCount, 'real empty air above upper skybridge should stay free').toBe(0);
  await page.screenshot({
    path: info.outputPath('upper-bridge-fly-above-' + info.project.name + '.png'),
  });
  expect(errors).toEqual([]);
});
