import { test, expect } from '@playwright/test';

test('city-first mobile mission uses brighter city-only stage grade', async ({ page }, info) => {
  test.setTimeout(110000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveClass(/city-bright/);
  await expect(page.locator('body')).toHaveClass(/in-mission/);
  await expect(page.locator('#touch')).toBeVisible();
  await page.screenshot({ path: info.outputPath('city-31-electric-twilight-portrait.png') });
});
