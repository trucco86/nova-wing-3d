import { test, expect } from '@playwright/test';

const overlaps = (a, b, gap = 2) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - gap &&
  a.x + a.width > b.x + gap &&
  a.y < b.y + b.height - gap &&
  a.y + a.height > b.y + gap;

test('QA140 mobile radial RPG freezes the battle and keeps a compact circular HUD', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch radial menu is mobile-only');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const drawer = page.locator('#strategyDrawer');
    const trigger = drawer.locator('summary');
    await expect(trigger).toBeVisible();
    await expect(drawer).not.toHaveAttribute('open');
    const atRest = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el || el.hidden || getComputedStyle(el).display === 'none') return null;
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        trigger: box('#strategyDrawer summary'),
        notices: box('#hudNotices'),
        radar: box('#tacticalPanel'),
      };
    });
    expect(atRest.trigger.width).toBeGreaterThanOrEqual(48);
    expect(atRest.trigger.height).toBeGreaterThanOrEqual(48);
    expect(atRest.trigger.x).toBeGreaterThanOrEqual(0);
    expect(atRest.trigger.x + atRest.trigger.width).toBeLessThanOrEqual(viewport.width);
    expect(overlaps(atRest.trigger, atRest.notices)).toBe(false);
    expect(overlaps(atRest.trigger, atRest.radar)).toBe(false);
    await page.screenshot({ path: info.outputPath('rpg-closed-' + viewport.width + '.png') });

    await trigger.click();
    await expect(drawer).toHaveAttribute('open');
    await expect(page.locator('body')).toHaveClass(/rpg-tactical-paused/);
    await expect(page.locator('#rpgRadialMenu')).toBeVisible();
    await expect(page.locator('#rpgCategoryPanel')).toBeHidden();
    await expect(page.locator('#pauseMenu')).toBeHidden();
    const before = await page.evaluate(() => window.fixture.game.snapshot());
    await page.evaluate(() => window.fixture.advance(3));
    const after = await page.evaluate(() => window.fixture.game.snapshot());
    expect(after.seconds).toBe(before.seconds);
    expect(after.shield).toBe(before.shield);
    expect(after.entities.hostile).toBe(before.entities.hostile);
    expect(after.rpgTacticalPaused).toBe(true);
    await page.screenshot({ path: info.outputPath('rpg-radial-' + viewport.width + '.png') });

    for (const name of ['weapons', 'specials', 'berserk', 'utilities']) {
      await page.locator('[data-rpg-category="' + name + '"]').click();
      const panel = page.locator('#rpgCategoryPanel');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-category', name);
      await expect(page.locator('#rpgRadialMenu')).toBeHidden();
      const rect = await panel.boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
      await page.screenshot({
        path: info.outputPath('rpg-' + name + '-' + viewport.width + '.png'),
      });
      await page.locator('#rpgCategoryBack').click();
      await expect(page.locator('#rpgRadialMenu')).toBeVisible();
      expect((await page.evaluate(() => window.fixture.game.snapshot())).rpgTacticalPaused).toBe(true);
    }
    await page.locator('#rpgRadialClose').click();
    await expect(drawer).not.toHaveAttribute('open');
    await expect(page.locator('body')).not.toHaveClass(/rpg-tactical-paused/);
    await expect(page.locator('#pauseMenu')).toBeHidden();
  }
  expect(errors).toEqual([]);
});
