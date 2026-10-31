import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('graphics profiles switch during options and persist after reload', async ({ page }) => {
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#optionsFromMenu').click();
  const quality = page.locator('#settingGraphics');
  await expect(quality).toBeVisible();
  await quality.selectOption('medium');
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'medium');
  await quality.selectOption('high');
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'high');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'high');
  await openMenu(page, 'central');
  await page.locator('#optionsFromMenu').click();
  await expect(page.locator('#settingGraphics')).toHaveValue('high');
});
