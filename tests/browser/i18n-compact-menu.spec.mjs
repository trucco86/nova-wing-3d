import { test, expect } from '@playwright/test';

for (const [lang, mission, hub] of [
  ['pt', '01 / MISSÃO', '03 / CENTRAL DO PILOTO'],
  ['en', '01 / MISSION', '03 / PILOT HUB'],
  ['es', '01 / MISIÓN', '03 / CENTRO DEL PILOTO'],
]) {
  test(`compact menu respects ${lang} language`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#pressStart').click();
    await page.locator('#optionsFromMenu').click();
    await page.locator('#settingLanguage').selectOption(lang);
    await page.locator('#settingsClose').click();
    await page.locator('#menuPlay').click();
    await expect(page.locator('#menuScreenLabel')).toHaveText(mission);
    await page.locator('#menuBack').click();
    await page.locator('#menuHub').click();
    await expect(page.locator('#menuScreenLabel')).toHaveText(hub);
  });
}
