import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(
    'Google sign-in is available inside CENTRAL with no overlap at ' + viewport.width,
    async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await openMenu(page, 'central');
      const auth = page.locator('#novaAuth');
      await auth.evaluate((node) => {
        node.hidden = false;
        node.open = true;
      });
      await expect(auth.locator('[data-auth-summary]')).toContainText('GOOGLE');
      await expect(auth.locator('[data-auth-login]')).toBeVisible();
      await expect(auth.locator('[data-auth-guest]')).toBeVisible();
      const geometry = await auth.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const login = node.querySelector('[data-auth-login]').getBoundingClientRect();
        return {
          x: box.x,
          right: box.right,
          width: box.width,
          loginWidth: login.width,
          viewport: innerWidth,
          position: getComputedStyle(node).position,
        };
      });
      expect(geometry.x).toBeGreaterThanOrEqual(-1);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.loginWidth).toBeLessThanOrEqual(geometry.width + 1);
      expect(geometry.position).not.toBe('fixed');
      await auth.locator(':scope > summary').click();
      await expect(auth).not.toHaveAttribute('open', '');
      await auth.locator(':scope > summary').click();
      await expect(auth).toHaveAttribute('open', '');
      await page.screenshot({ path: info.outputPath('google-central-' + viewport.width + '.png') });
      await page.locator('#menuBack').click();
      await expect(auth).toBeHidden();
      await openMenu(page, 'play');
      await expect(page.locator('#start')).toBeVisible();
    },
  );
}
