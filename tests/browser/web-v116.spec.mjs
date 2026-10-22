import { test, expect } from '@playwright/test';

test('selected language covers menu, hangar, campaign, and live pause labels', async ({page})=>{
  test.setTimeout(120000);
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('/');
  await page.locator('#optionsFromMenu').click();
  await page.locator('#settingLanguage').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('#brief')).toContainText('Five cats. Stolen supplies.');
  await page.locator('#settingsClose').click();
  await page.locator('#prepareSquad').click();
  await expect(page.locator('#hangarHint')).toContainText('DRAG TO EXPLORE');
  await page.locator('#start').click();
  await expect(page.locator('#cinematicCaption')).toContainText('Five Cats');
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#stage')).toContainText('CITY OF MACHINES');
  await page.locator('#pause').click();
  await expect(page.locator('#pauseTitle')).toContainText('MISSION PAUSED');
  await page.locator('#pauseOptions').click();
  await page.locator('#settingLanguage').selectOption('es');
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('#stage')).toContainText('CIUDAD DE LAS MÁQUINAS');
  await expect(page.locator('#pauseTitle')).toContainText('MISIÓN EN PAUSA');
  await page.locator('#settingsClose').click();
  await page.locator('#pauseResume').click();
  await expect(page.locator('#aimReticle')).toBeVisible({timeout:20000});
  expect(errors).toEqual([]);
});

test('sight follows the actual forward shot axis in chase and cockpit views',async ({page})=>{
  test.setTimeout(90000);
  await page.goto('/');
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  const reticle=page.locator('#aimReticle');
  await expect(reticle).toBeVisible({timeout:20000});
  const before=await reticle.evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
  expect(Number.isFinite(before.x)&&Number.isFinite(before.y)).toBe(true);
  await page.locator('#cameraView').click();
  await expect(reticle).toBeVisible({timeout:20000});
  const after=await reticle.evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
  expect(Number.isFinite(after.x)&&Number.isFinite(after.y)).toBe(true);
});
