import { test, expect } from '@playwright/test';

test('NOVA-7 authored GLB is loaded in High, supports Medium fallback and no WebGL errors', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /WebGL|shader|GL_INVALID|THREE.WebGLProgram/i.test(msg.text()))
      errors.push(msg.text());
  });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.game.pause());
  await page.locator('#pauseOptions').click();
  await page.locator('#settingGraphics').selectOption('high');
  await page.locator('#settingsClose').click();
  await page.locator('#pauseResume').click();
  await expect
    .poll(async () => page.evaluate(() => window.fixture.game.snapshot().premiumAsset), {
      timeout: 20000,
    })
    .toBe('ready');
  await page.screenshot({ path: info.outputPath('nova7-authored-glb-high.png') });
  await page.evaluate(() => window.fixture.game.pause());
  await page.locator('#pauseOptions').click();
  await page.locator('#settingGraphics').selectOption('medium');
  await page.locator('#settingsClose').click();
  await page.locator('#pauseResume').click();
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'medium');
  await page.screenshot({ path: info.outputPath('nova7-original-medium.png') });
  await expect(page.locator('#game')).toBeVisible();
  expect(errors).toEqual([]);
});
