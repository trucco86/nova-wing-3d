import { test, expect } from '@playwright/test';

test('boss warning precedes arrival, stays clear of controls and respects pause', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(57));
  const warning = page.locator('#bossIncoming');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('CHEFE SE APROXIMANDO');
  expect(await page.evaluate(() => window.fixture.game.snapshot().boss)).toBe(false);
  expect(await warning.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  const box = await warning.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThan(viewport.height / 2);
  await page.screenshot({ path: info.outputPath('boss-warning.png') });
  await page.locator('#pause').click();
  await expect(warning).toBeHidden();
  await page.evaluate(() => window.fixture.advance(10));
  await page.locator('#pauseResume').click();
  await expect(warning).toBeVisible();
  await page.evaluate(() => window.fixture.advance(5));
  await expect(warning).toBeHidden();
  await page.evaluate(() => window.fixture.advance(3.5));
  expect(await page.evaluate(() => window.fixture.game.snapshot().boss)).toBe(true);
  await expect(warning).toBeHidden();
  expect(errors).toEqual([]);
});
