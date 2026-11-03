import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(
    'cover centers original artwork and gates the interface behind PRESS START at ' +
      viewport.width,
    async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('#menu')).toHaveAttribute('data-screen', 'splash');
      await expect(page.locator('#pressStart')).toBeVisible();
      await expect(page.locator('#menuPrimary')).toBeHidden();
      await expect(page.locator('#novaAuth')).toBeHidden();
      await expect(page.locator('#novaRanking')).toBeHidden();
      const art = await page.locator('#menu').evaluate((node) => ({
        background: getComputedStyle(node, '::before').backgroundSize,
        width: node.getBoundingClientRect().width,
        scrollWidth: node.scrollWidth,
      }));
      expect(art.background).toContain('contain');
      expect(art.scrollWidth).toBeLessThanOrEqual(art.width + 2);
      const press = await page.locator('#pressStart').boundingBox();
      expect(press.x).toBeGreaterThanOrEqual(-1);
      expect(press.x + press.width).toBeLessThanOrEqual(viewport.width + 1);
      await page.screenshot({
        path: info.outputPath('cover-press-start-' + viewport.width + '.png'),
      });

      await page.locator('#pressStart').click();
      await expect(page.locator('#menu')).toHaveAttribute('data-screen', 'home');
      const menu = page.locator('#menuPrimary');
      await expect(menu.locator('button')).toHaveCount(3);
      for (const name of ['JOGAR', 'HANGAR', 'CENTRAL']) await expect(menu).toContainText(name);
      await expect(page.locator('#start')).toBeHidden();
      await expect(page.locator('#novaRanking')).toBeHidden();
      await page.screenshot({
        path: info.outputPath('three-choice-menu-' + viewport.width + '.png'),
      });
    },
  );
}

test('JOGAR, HANGAR and CENTRAL expose existing actions without changing missions', async ({
  page,
}) => {
  await page.goto('/');
  await openMenu(page, 'play');
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#continue')).toBeHidden();
  await page.locator('#menuBack').click();
  await openMenu(page, 'hangar');
  await expect(page.locator('#squadSelection')).toBeVisible();
  await expect(page.locator('#pilot-jenifer')).toBeVisible();
  await page.locator('#pilot-jenifer').click();
  await expect(page.locator('#profileName')).toHaveText('JENIFER');
  await page.locator('#menuBack').click();
  await openMenu(page, 'central');
  await expect(page.locator('#novaRanking')).toBeVisible();
  await expect(page.locator('#novaTrophies')).toBeVisible();
  await expect(page.locator('#catRanks')).toBeVisible();
  await expect(page.locator('#optionsFromMenu')).toBeVisible();
  await page.locator('#menuBack').click();
  await expect(page.locator('#menuPrimary')).toBeVisible();
  await expect(page.locator('#squadSelection')).toBeHidden();
});

test('Enter opens initial splash, Escape returns from submenus without starting a mission', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu')).toHaveAttribute('data-screen', 'home');
  await page.locator('#menuHub').click();
  await expect(page.locator('#menu')).toHaveAttribute('data-screen', 'central');
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toHaveAttribute('data-screen', 'home');
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#cinematic')).toBeHidden();
});
