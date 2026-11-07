import { test, expect } from '@playwright/test';

test('stage 1 explores both flanks beyond the old invisible roadbox without ghost collisions', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(1.2));
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  expect(before.sector).toBe(1);
  expect(before.player.x).toBeCloseTo(0, 1);
  expect(before.cityPhysicalSolids.some((s) => s.kind === 'avenue-rail')).toBe(true);

  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.fixture.advance(2.65));
  await page.keyboard.up('KeyD');
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.player.x).toBeGreaterThan(40);
  expect(state.player.x).toBeLessThanOrEqual(72);
  await page.screenshot({ path: info.outputPath('city-open-right-flank.png') });

  await page.keyboard.down('KeyA');
  await page.evaluate(() => window.fixture.advance(6.1));
  await page.keyboard.up('KeyA');
  state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.player.x).toBeLessThan(-36);
  expect(state.player.x).toBeGreaterThanOrEqual(-72);
  await page.screenshot({ path: info.outputPath('city-open-left-flank.png') });

  // The thin real curb exists well below the fighter's normal cruise height.
  const rail = state.cityPhysicalSolids.find((s) => s.kind === 'avenue-rail');
  expect(rail.y).toBeLessThan(-2);
  expect(rail.halfY).toBeLessThan(3);
  expect(errors).toEqual([]);
});
