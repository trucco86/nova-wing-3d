import { openMenu } from './menu-navigation.mjs';
import { test, expect } from '@playwright/test';

test('mission and hangar are separate clear actions in the compact menu', async ({ page }) => {
  await page.goto('/');
  await openMenu(page, 'play');
  await expect(page.locator('#start')).toBeVisible();
  await page.locator('#menuBack').click();
  await openMenu(page, 'hangar');
  await expect(page.locator('#squadSelection')).toBeVisible();
  await expect(page.locator('#pilot-jenifer')).toBeVisible();
});

test('DEV QA opens a chosen sector boss without any leaderboard action', async ({ page }) => {
  await page.goto('/');
  await openMenu(page, 'central');
  const panel = page.locator('#developerPanel');
  await expect(panel).toBeVisible();
  await panel.locator(':scope > summary').click();
  await expect(page.locator('#developerSector option')).toHaveCount(10);
  await page.locator('#developerSector').selectOption('9');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerLaunch').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#bossHUD')).toBeVisible();
  await expect(page.locator('#developerSessionTag')).toContainText('SETOR 10');
  await expect(page.locator('#developerSessionTag')).toContainText('SEM RANK');
});
