import { test, expect } from '@playwright/test';

test('record distinct sky/lighting for ten sectors in desktop and mobile', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (let sector = 0; sector < 10; sector++) {
    await page.goto('/__visual.html?sector=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('h1')).not.toBeEmpty();
    await page.screenshot({
      path: info.outputPath(
        'sector-' + String(sector + 1).padStart(2, '0') + '-' + info.project.name + '.png',
      ),
    });
  }
  expect(errors).toEqual([]);
});
