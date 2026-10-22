import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('v1.14 menu theme, prologue, care HUD and mission remain usable', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#criticalWarning')).toBeHidden();
  await expect(page.locator('#petCareHud')).toBeHidden();
  await expect(page.locator('#gameVersion')).toHaveText(`v${version}`);

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
  await expect(page.locator('#petCareHud')).toBeHidden();
  await page.locator('#pause').click();
  await expect(page.locator('#pauseCare')).toContainText('LATINHA 0');
  await expect(page.locator('#pauseCare')).toContainText('AREIA 0');
  await page.locator('#pauseResume').click();
  expect(errors).toEqual([]);
});
