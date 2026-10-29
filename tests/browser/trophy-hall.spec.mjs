import { openMenu } from './menu-navigation.mjs';
import { test, expect } from '@playwright/test';

test('Hall da Fama opens in the menu and shows all forty-one trophy cards', async ({
  page,
}, info) => {
  await page.goto('/');
  await openMenu(page, 'central');
  const panel = page.locator('#novaTrophies');
  await expect(panel).toBeVisible();
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  await expect(panel).toHaveAttribute('open', '');
  await expect(page.locator('#novaTrophyList li')).toHaveCount(41);
  await expect(page.locator('#novaTrophyCounter')).toHaveText('0 / 41');
  await expect(page.locator('#novaTrophyPoints')).toContainText('0 pontos');
  await expect(page.locator('#novaTrophyList')).toContainText('Só na Bala');
  await expect(page.locator('#novaTrophyList')).toContainText('Troféu secreto');
  await page.screenshot({ path: info.outputPath('hall-of-fame.png') });
});

test('narrow mobile trophy drawer stays inside the screen without covering combat', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await openMenu(page, 'central');
  const panel = page.locator('#novaTrophies');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
  const list = page.locator('#novaTrophyList');
  await expect(list).toBeVisible();
  const overflow = await list.evaluate((node) => node.scrollHeight > node.clientHeight);
  expect(overflow).toBe(true);
  await expect(page.locator('#novaTrophyToast')).toHaveCount(0);
});
