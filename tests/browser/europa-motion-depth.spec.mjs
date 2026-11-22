import { test, expect } from '@playwright/test';

test('QA172 Europa tower and canyon move toward and past the real player camera', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const before = await page.evaluate(() => {
    window.fixture.advanceToMissionTime(12);
    return window.fixture.alienWorldState('ice');
  });
  expect(before.heroBatchCount).toBe(1);
  expect(before.canyon?.visible).toBe(true);
  await page.screenshot({ path: info.outputPath('qa172-europa-tower-far.png') });

  const after = await page.evaluate(() => {
    window.fixture.advanceToMissionTime(18);
    return window.fixture.alienWorldState('ice');
  });
  expect(after.heroDepth).toBeGreaterThan(before.heroDepth + 35);
  expect(after.canyon.travel).toBeGreaterThan(before.canyon.travel + 200);
  expect(after.canyon.gatewayDepth).toBeGreaterThan(before.canyon.gatewayDepth + 50);
  expect(after.canyon.cliffDepth).toBeGreaterThan(before.canyon.cliffDepth + 20);
  expect(after.canyon.crystalDepth).toBeGreaterThan(before.canyon.crystalDepth + 20);
  await page.screenshot({ path: info.outputPath('qa172-europa-tower-nearer.png') });

  const departed = await page.evaluate(() => {
    window.fixture.advanceToMissionTime(60);
    return window.fixture.alienWorldState('ice');
  });
  expect(departed.heroDepth).toBe(160);
  expect(departed.canyon.gatewayDepth).toBe(160);
  expect(departed.heroBatchCount).toBe(1, 'unique tower leaves once, not deleted/recreated');
  expect(errors).toEqual([]);
});
