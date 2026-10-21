import { test, expect } from '@playwright/test';

test('v1.14 menu theme, prologue, care HUD and mission remain usable', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#criticalWarning')).toBeHidden();
  await expect(page.locator('#petCareHud')).toBeHidden();
  await expect(page.locator('#gameVersion')).toHaveText('v1.14.0');

  const menuTheme = page.locator('#menuMusic');
  await menuTheme.click();
  await expect(menuTheme).toContainText('PAUSAR TEMA');
  await menuTheme.click();
  await expect(menuTheme).toContainText('OUVIR TEMA');

  await page.locator('#watchIntro').click();
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#cinematicCaption')).toContainText('paz dos Five Cats');
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#menu')).toBeVisible();

  await page.locator('#start').click();
  await expect(page.locator('#cinematic')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#petCareHud')).toContainText('LATINHA 0');
  await expect(page.locator('#petCareHud')).toContainText('AREIA 0');
  expect(errors).toEqual([]);
});
