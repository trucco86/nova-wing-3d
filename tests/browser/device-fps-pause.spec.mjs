import { test, expect } from '@playwright/test';

test('physical-device FPS measurement is opt-in, pause-only and localized', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#pauseFrameAudit')).toBeHidden();
  await page.evaluate(() => window.fixture.game.pause());
  await expect(page.locator('#pauseMenu')).toBeVisible();
  const audit = page.locator('#pauseFrameAudit');
  await expect(audit).toBeVisible();
  await audit.locator('summary').click();
  await expect(audit.locator('summary')).toHaveText('DIAGNÓSTICO DE FPS · DISPOSITIVO');
  await expect(page.locator('#auditStart')).toBeEnabled();
  await expect(page.locator('#auditStop')).toBeDisabled();
  await expect(page.locator('#auditCopy')).toBeDisabled();
  await page.locator('#auditStart').click();
  await expect(page.locator('#auditStart')).toBeDisabled();
  await expect(page.locator('#auditStop')).toBeEnabled();
  await expect(page.locator('#auditReadout')).toContainText('Sem quadros medidos');
  await page.locator('#pauseResume').click();
  await expect(audit).toBeHidden();
  // The deterministic fixture does not run real RAF; it must not invent FPS data.
  await page.evaluate(() => window.fixture.advance(2));
  await page.evaluate(() => window.fixture.game.pause());
  await expect(audit).toBeVisible();
  await expect(page.locator('#auditCopy')).toBeDisabled();
  await page.locator('#auditStop').click();
  await expect(page.locator('#auditStart')).toBeEnabled();
  await expect(page.locator('#auditStop')).toBeDisabled();
  await page.screenshot({ path: info.outputPath('pause-device-fps-pt.png') });

  await page.locator('#pauseOptions').click();
  await page.locator('#settingLanguage').selectOption('en');
  await expect(audit.locator('summary')).toHaveText('FPS DIAGNOSTICS · DEVICE');
  await expect(page.locator('#auditStart')).toHaveText('START MEASURING');
  await page.locator('#settingLanguage').selectOption('es');
  await expect(audit.locator('summary')).toHaveText('DIAGNÓSTICO DE FPS · DISPOSITIVO');
  await expect(page.locator('#auditStop')).toHaveText('FINALIZAR');
  await page.locator('#settingsClose').click();
  expect(errors).toEqual([]);
});