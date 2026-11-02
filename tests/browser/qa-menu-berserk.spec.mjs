import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('QA launcher is visible in the home menu, opens the lab, and starts Berserk', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'home');
  const qa = page.locator('#menuQA');
  await expect(qa).toBeVisible();
  await qa.scrollIntoViewIfNeeded();
  await qa.click();
  const panel = page.locator('#developerPanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('open', '');
  await expect(page.locator('#developerBerserkLaunch')).toBeVisible();
  await page.locator('#developerSector').selectOption('1');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerBerserkLaunch').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#developerSessionTag')).toContainText('SETOR 02');
  const berserk = page.locator('#qaBerserkAction');
  await expect(berserk).toBeVisible();
  await expect(berserk).toContainText('ATIVAR BERSERK');
  await berserk.click();
  await expect(page.locator('body')).toHaveClass(/berserk-active/);
  await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
  await expect(berserk).toContainText('REPETIR BERSERK');
  await berserk.click();
  await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
  await page.screenshot({ path: info.outputPath('qa-berserk-activated.png') });
});
