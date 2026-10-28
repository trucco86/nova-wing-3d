import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(
    'menu actions align and ranking follows how-to at ' + viewport.width + 'x' + viewport.height,
    async ({ page }, info) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const menu = page.locator('#menu');
      await expect(menu).toBeVisible();
      const ranking = menu.locator('#novaRanking');
      const help = menu.locator('.title-help');
      await expect(ranking).toBeVisible();
      await expect(help).toBeVisible();
      const geometry = await page.evaluate(() => {
        const menu = document.querySelector('#menu');
        const selectors = [
          '#prepareSquad',
          '#start',
          '#optionsFromMenu',
          '#menuMusic',
          '#watchIntro',
        ];
        const buttons = selectors.map((selector) => {
          const node = menu.querySelector(selector);
          const r = node.getBoundingClientRect();
          return { selector, left: r.left, right: r.right, width: r.width, height: r.height };
        });
        const help = menu.querySelector('.title-help').getBoundingClientRect();
        const ranking = menu.querySelector('#novaRanking').getBoundingClientRect();
        return {
          buttons,
          helpBottom: help.bottom,
          rankTop: ranking.top,
          rankLeft: ranking.left,
          rankRight: ranking.right,
          viewportWidth: innerWidth,
          position: getComputedStyle(menu.querySelector('#novaRanking')).position,
        };
      });
      const first = geometry.buttons[0];
      for (const button of geometry.buttons) {
        expect(
          Math.abs(button.left - first.left),
          button.selector + ' left alignment',
        ).toBeLessThanOrEqual(2);
        expect(
          Math.abs(button.right - first.right),
          button.selector + ' right alignment',
        ).toBeLessThanOrEqual(2);
        expect(button.height, button.selector + ' touch target').toBeGreaterThanOrEqual(44);
      }
      expect(geometry.rankTop).toBeGreaterThanOrEqual(geometry.helpBottom - 1);
      expect(geometry.rankLeft).toBeGreaterThanOrEqual(-1);
      expect(geometry.rankRight).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.position).not.toBe('fixed');
      await ranking.scrollIntoViewIfNeeded();
      await ranking.locator(':scope > summary').click();
      await expect(ranking).toHaveAttribute('open', '');
      await expect(ranking.locator('.nova-rank-content')).toBeVisible();
      await page.screenshot({
        path: info.outputPath('uniform-menu-' + viewport.width + 'x' + viewport.height + '.png'),
        fullPage: true,
      });
    },
  );
}

test(
  'landscape menu scrolls to squad preparation without unreachable controls',
  async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    const prepare = page.locator('#prepareSquad');
    await prepare.scrollIntoViewIfNeeded();
    await expect(prepare).toBeInViewport();
    await prepare.click();
    await expect(page.locator('#squadSelection')).toBeVisible();
  },
);
