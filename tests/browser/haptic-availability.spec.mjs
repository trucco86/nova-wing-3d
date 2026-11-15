import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('mobile browser without vibration API does not promise unavailable haptics', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch capability audit');
  await page.addInitScript(() => {
    // iOS Safari does not expose the standard vibration API.
    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#optionsFromMenu').tap();
  await expect(page.locator('#settingsMenu')).toBeVisible();
  await expect(page.locator('#settingVibration')).toBeDisabled();
  await expect(page.locator('#settingVibration')).not.toBeChecked();
  await expect(page.locator('#vibrationSupportHint')).toBeVisible();
  await expect(page.locator('#vibrationSupportHint')).toContainText(/navegador|browser/i);
  await page.screenshot({ path: info.outputPath('mobile-haptics-unavailable.png') });
});
