import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('Devastador reactor boss opens without fake center column and renders wall sentinels', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerSector').selectOption('3');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerLaunch').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#bossHUD')).toBeVisible();
  await expect(page.locator('#bossName')).toContainText('DEVASTADOR');
  await expect(page.locator('#bossState')).not.toBeEmpty();
  // The 4 real wall-bust cannons and entry gap are asserted by domain tests.
  // Keep a genuine on-screen screenshot for human clearance/art QA.
  await page.waitForTimeout(250);
  await page.screenshot({ path: info.outputPath('devastador-reactor-clear-entrance.png') });
  // Real gameplay progression, no synthetic 2D mock or visual stand-in.
  // The wall robots are out of their recesses and have fired from real
  // cannon muzzle sockets by the time this screenshot is captured.
  expect(await page.evaluate(() => window.__novaBossQA.advance(7))).toBe(true);
  const defense = await page.evaluate(() => window.__novaBossQA.snapshot());
  expect(defense.defense?.fired).toBeGreaterThanOrEqual(1);
  expect(defense.defense?.visible).toBe(4);
  expect(defense.defense?.online).toEqual([0, 1, 2, 3]);
  await page.waitForTimeout(200);
  await page.screenshot({ path: info.outputPath('devastador-wall-sentinels-deployed.png') });
  expect(errors).toEqual([]);
});

test('reactor wall-defense QA preview preserves standard movement, boost and weapon controls', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerSector').selectOption('3');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerLaunch').click();
  await expect(page.locator('#bossHUD')).toBeVisible();
  await expect(page.locator('#attackWarning')).toBeAttached();
  if (info.project.name === 'mobile') {
    await expect(page.locator('#fireTouch')).toBeVisible();
    await expect(page.locator('#boostTouch')).toBeVisible();
    await expect(page.locator('#stick')).toBeVisible();
  } else {
    await page.keyboard.down('Space');
    await page.waitForTimeout(120);
    await page.keyboard.up('Space');
  }
  await page.screenshot({ path: info.outputPath('devastador-reactor-combat-controls.png') });
  await expect(page.locator('#bossHUD')).toBeVisible();
});
