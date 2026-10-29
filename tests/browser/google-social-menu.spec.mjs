import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(
    'Google social sign-in stays below menu buttons with no floating overlap at ' +
      viewport.width +
      'x' +
      viewport.height,
    async ({ page }, info) => {
      test.setTimeout(120000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto('/');
      const auth = page.locator('#novaAuth');

      // PR previews and localhost deliberately disable Firebase OAuth. Reveal
      // only the layout: this does not pretend a Google session is authenticated.
      await auth.evaluate((element) => {
        element.hidden = false;
        element.open = true;
      });
      await expect(auth.locator('[data-auth-summary]')).toContainText('GOOGLE');
      await expect(auth.locator('[data-auth-login]')).toBeVisible();
      await expect(auth.locator('[data-auth-guest]')).toBeVisible();

      const verifyGeometry = () =>
        page.evaluate(() => {
          const rect = (node) => {
            const r = node.getBoundingClientRect();
            return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width };
          };
          const menu = document.getElementById('menu');
          const actions = menu.querySelector('.title-actions');
          const extras = menu.querySelector('.title-extras');
          const auth = menu.querySelector('#novaAuth');
          const login = auth.querySelector('[data-auth-login]');
          const computed = getComputedStyle(auth);
          return {
            parent: auth.parentElement.className,
            position: computed.position,
            menuScrollHeight: menu.scrollHeight,
            menuClientHeight: menu.clientHeight,
            actions: rect(actions),
            extras: rect(extras),
            auth: rect(auth),
            login: rect(login),
            windowWidth: innerWidth,
          };
        });
      const g = await verifyGeometry();
      expect(g.parent).toContain('title-content');
      expect(g.position).not.toBe('fixed');
      expect(g.position).not.toBe('absolute');
      expect(g.auth.y, 'account remains below both menu button groups').toBeGreaterThanOrEqual(
        g.extras.bottom - 1,
      );
      expect(g.extras.y).toBeGreaterThanOrEqual(g.actions.bottom - 1);
      expect(g.auth.x).toBeGreaterThanOrEqual(-1);
      expect(g.auth.right).toBeLessThanOrEqual(g.windowWidth + 1);
      expect(g.login.width).toBeLessThanOrEqual(g.auth.width + 1);
      await auth.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: info.outputPath('google-social-' + viewport.width + 'x' + viewport.height + '.png'),
      });

      // Open/close sign-in without moving or masking the menu actions.
      const startLayoutY = () =>
        page.locator('#start').evaluate((button) => {
          const menu = document.getElementById('menu');
          return button.getBoundingClientRect().top + menu.scrollTop + window.scrollY;
        });
      const initial = await startLayoutY();
      await auth.locator(':scope > summary').click();
      await expect(auth).not.toHaveAttribute('open', '');
      await auth.locator(':scope > summary').click();
      await expect(auth).toHaveAttribute('open', '');
      const after = await startLayoutY();
      expect(Math.abs(after - initial)).toBeLessThan(2);
      await page.locator('#start').scrollIntoViewIfNeeded();
      const hit = await page.locator('#start').evaluate((button) => {
        const r = button.getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button')
          ?.id;
      });
      if (hit !== 'start') {
        const diagnostic = await page.locator('#start').evaluate((button) => {
          const r = button.getBoundingClientRect();
          const center = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          const hit = document.elementFromPoint(center.x, center.y);
          const menu = document.querySelector('#menu');
          return {
            center, actual: hit?.outerHTML?.slice(0, 350) ?? null,
            button: { x: r.x, y: r.y, width: r.width, height: r.height },
            menuScroll: menu.scrollTop, menuHeight: menu.scrollHeight,
            viewport: { width: innerWidth, height: innerHeight },
          };
        });
        console.error('MENU_START_OCCLUSION', JSON.stringify(diagnostic));
      }
      expect(hit).toBe('start');

      // Reflow must also be stable in the detailed pilot and ship selector.
      await page.locator('#prepareSquad').click();
      await expect(page.locator('#squadSelection')).toBeVisible();
      const selection = await verifyGeometry();
      expect(selection.auth.x).toBeGreaterThanOrEqual(-1);
      expect(selection.auth.right).toBeLessThanOrEqual(selection.windowWidth + 1);
      expect(selection.auth.y).toBeGreaterThanOrEqual(selection.extras.bottom - 1);
      expect(errors).toEqual([]);
    },
  );
}
