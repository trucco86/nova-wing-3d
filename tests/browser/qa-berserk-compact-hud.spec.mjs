import { test, expect } from '@playwright/test';

const overlaps = (a, b) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - 2 &&
  a.x + a.width > b.x + 2 &&
  a.y < b.y + b.height - 2 &&
  a.y + a.height > b.y + 2;

test('QA Berserk stays accessible as a compact button without hiding the boss on mobile', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch layout is validated in the mobile browser');
  test.setTimeout(110000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const screen of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(screen);
    await page.goto('/__dynamic.html?sector=5&qaBoss=5');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#qaBerserkDock')).toBeVisible();
    await expect(page.locator('#bossHUD')).toBeVisible();
    const bounds = await page.evaluate(() => {
      const box = (id) => {
        const node = document.getElementById(id);
        if (!node || node.hidden || getComputedStyle(node).display === 'none') return null;
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      const dock = box('qaBerserkDock');
      const action = box('qaBerserkAction');
      return {
        dock,
        action,
        hud: box('bossHUD'),
        radar: box('tacticalPanel'),
        touch: box('touch'),
        notices: box('hudNotices'),
        pointer: document.elementFromPoint(
          action.x + action.width / 2,
          action.y + action.height / 2,
        )?.id,
      };
    });
    expect(bounds.dock).not.toBeNull();
    expect(bounds.dock.width).toBeLessThanOrEqual(135);
    expect(bounds.dock.height).toBeLessThanOrEqual(62);
    expect(bounds.action.height).toBeGreaterThanOrEqual(44);
    expect(bounds.pointer).toBe('qaBerserkAction');
    expect(overlaps(bounds.dock, bounds.hud), 'boss health stays visible').toBe(false);
    expect(overlaps(bounds.dock, bounds.radar), 'boss radar stays visible').toBe(false);
    expect(overlaps(bounds.dock, bounds.touch), 'thumb controls stay available').toBe(false);
    if (screen.width < screen.height) {
      expect(bounds.dock.y + bounds.dock.height).toBeLessThan(screen.height * 0.29);
    } else {
      expect(bounds.dock.x + bounds.dock.width).toBeLessThan(screen.width * 0.25);
    }
    await page.locator('#qaBerserkAction').click();
    await expect(page.locator('body')).toHaveClass(/berserk-active/);
    await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
    await page.screenshot({
      path: info.outputPath('compact-berserk-boss-' + screen.width + 'x' + screen.height + '.png'),
    });
  }
  expect(errors).toEqual([]);
});
