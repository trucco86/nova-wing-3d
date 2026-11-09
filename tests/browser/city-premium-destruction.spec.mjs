import { test, expect } from '@playwright/test';

test('phase 1 city destruction stays grounded, hangs the train, and renders on desktop/mobile', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const initial = await page.evaluate(() => window.fixture.game.snapshot().cityPhysicsDebris);
  expect(initial.map((item) => item.kind)).toEqual(['billboard', 'car', 'facade', 'train']);
  expect(initial.every((item) => !item.impact)).toBe(true);

  await page.evaluate(() => window.fixture.advance(5.85));
  const billboard = await page.evaluate(() => window.fixture.game.snapshot().cityPhysicsDebris);
  expect(billboard[0].impact).toBe(true);
  expect(billboard[0].groundClearance).toBeGreaterThanOrEqual(-0.001);
  await page.screenshot({ path: info.outputPath('city-billboard-impact.png') });

  await page.evaluate(() => window.fixture.advance(7.25));
  const wreckage = await page.evaluate(() => window.fixture.game.snapshot().cityPhysicsDebris);
  expect(wreckage[1].impact).toBe(true);
  expect(wreckage[2].impact).toBe(true);
  expect(wreckage.slice(0, 3).every((part) => part.groundClearance >= -0.001)).toBe(true);
  await page.screenshot({ path: info.outputPath('city-fallen-car-and-facade.png') });

  await page.evaluate(() => window.fixture.advance(4.25));
  const train = await page.evaluate(() => window.fixture.game.snapshot().cityPhysicsDebris[3]);
  expect(train.active).toBe(true);
  expect(train.cable).toBe(true);
  expect(train.y).toBeGreaterThan(1);
  expect(train.groundClearance).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('city-maglev-hanging-obstacle.png') });

  const stats = await page.evaluate(() => window.fixture.renderStats());
  expect(stats).toBeTruthy();
  expect(stats.calls).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('stage 1 ship flies above low rails and is only blocked by actual objects', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.fixture.advance(3.0));
  await page.keyboard.up('KeyD');
  const ship = await page.evaluate(() => window.fixture.game.snapshot());
  expect(ship.player.x).toBeGreaterThan(60);
  expect(ship.player.x).toBeLessThanOrEqual(72.05);
  expect(ship.cityImpactCount).toBe(0);
  expect(
    ship.cityPhysicalSolids.some(
      (solid) => solid.kind === 'avenue-rail' && solid.y < -2 && solid.halfY < 3,
    ),
  ).toBe(true);
  expect(ship.cityPhysicsDebris.length).toBe(4);
  await page.screenshot({ path: info.outputPath('city-open-rail-free-flight.png') });
  expect(errors).toEqual([]);
});
