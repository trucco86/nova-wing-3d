import { test, expect } from '@playwright/test';

test('Graphics 3.0 wet city captures real High and Medium browser frames', async ({ page }, info) => {
  test.setTimeout(120000);
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /WebGL|shader|GL_INVALID|THREE.WebGLProgram/i.test(message.text()))
      runtimeErrors.push(message.text());
  });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  for (const quality of ['high', 'medium']) {
    await page.evaluate(() => window.fixture.game.pause());
    await page.locator('#pauseOptions').click();
    await page.locator('#settingGraphics').selectOption(quality);
    await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', quality);
    await page.locator('#settingsClose').click();
    await page.locator('#pauseResume').click();
    await page.evaluate(() => window.fixture.advance(0.3));
    await expect(page.locator('#game')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('graphics-30-city-' + quality + '-' + info.project.name + '.png'),
    });
  }
  expect(runtimeErrors).toEqual([]);
});
