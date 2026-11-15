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
  // The modern QA entry is intentionally compact; the tester opens details.
  await expect(panel).not.toHaveAttribute('open', '');
  await panel.locator('summary').click();
  await expect(panel).toHaveAttribute('open', '');
  await expect(page.locator('#developerBerserkLaunch')).toBeVisible();
  await page.locator('#developerSector').selectOption('1');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerBerserkLaunch').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#developerSessionTag')).toContainText('SETOR 02');
  const drawer = page.locator('#strategyDrawer');
  await expect(drawer).not.toHaveAttribute('open');
  await drawer.locator('summary').click();
  if (info.project.name === 'mobile') await page.locator('[data-rpg-category="berserk"]').click();
  const berserk = page.locator('#qaBerserkAction');
  await expect(berserk).toBeVisible();
  await expect(berserk).toContainText('ATIVAR BERSERK');
  await berserk.click();
  await expect(drawer).not.toHaveAttribute('open');
  await expect(page.locator('body')).toHaveClass(/berserk-active/);
  await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
  await drawer.locator('summary').click();
  if (info.project.name === 'mobile') await page.locator('[data-rpg-category="berserk"]').click();
  await expect(berserk).toContainText('REPETIR BERSERK');
  await berserk.click();
  await expect(drawer).not.toHaveAttribute('open');
  await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
  await page.screenshot({ path: info.outputPath('qa-berserk-activated.png') });
});
