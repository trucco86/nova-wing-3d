import { test, expect } from '@playwright/test';

const overlaps = (a, b, gap = 2) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - gap &&
  a.x + a.width > b.x + gap &&
  a.y < b.y + b.height - gap &&
  a.y + a.height > b.y + gap;

test('P0 mobile RPG remains collapsed during flight and opens with reachable actions', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Tests require an actual touch viewport');
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
    const summary = drawer.locator('summary');
    await expect(summary).toBeVisible();
    await expect(drawer).not.toHaveAttribute('open');
    await expect(page.locator('#quickRpg')).toBeHidden();
    await expect(page.locator('#specialCast')).toBeHidden();

    const closed = await page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el || el.hidden || getComputedStyle(el).display === 'none') return null;
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        strategy: rect('#strategyControls'),
        trigger: rect('#strategyDrawer summary'),
        notices: rect('#hudNotices'),
        radar: rect('#tacticalPanel'),
      };
    });
    expect(closed.strategy).not.toBeNull();
    expect(closed.trigger).not.toBeNull();
    expect(closed.trigger.height).toBeGreaterThanOrEqual(44);
    expect(closed.strategy.x).toBeGreaterThanOrEqual(0);
    expect(closed.strategy.x + closed.strategy.width).toBeLessThanOrEqual(viewport.width);
    expect(closed.strategy.y + closed.strategy.height).toBeLessThan(
      viewport.height * (viewport.width > viewport.height ? 0.4 : 0.36),
    );
    expect(overlaps(closed.strategy, closed.notices), 'alerts cannot cover RPG toggle').toBe(false);
    expect(overlaps(closed.strategy, closed.radar), 'radar cannot cover RPG toggle').toBe(false);
    await page.screenshot({
      path: info.outputPath('rpg-folded-' + viewport.width + 'x' + viewport.height + '.png'),
    });

    // The advanced RPG controls are opt-in: verify real elementFromPoint
    // hit-targets after expansion, without forcing the panel open in gameplay.
    await summary.click();
    await expect(drawer).toHaveAttribute('open');
    await expect(page.locator('#quickRpg')).toBeVisible();
    await expect(page.locator('#specialCast')).toBeVisible();
    const expanded = await page.evaluate(() => {
      const panel = document.querySelector('#strategyDrawer > .rpgDrawerBody');
      const pane = panel.getBoundingClientRect();
      const actions = Object.fromEntries(
        ['arsenalSwitch', 'specialSwitch', 'specialCast'].map((id) => {
          const el = document.getElementById(id);
          const r = el.getBoundingClientRect();
          const x = r.x + r.width / 2;
          const y = r.y + r.height / 2;
          return [id, {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            hit: document.elementFromPoint(x, y)?.id ?? null,
          }];
        }),
      );
      return {
        panel: { x: pane.x, y: pane.y, width: pane.width, height: pane.height },
        overflowY: getComputedStyle(panel).overflowY,
        actions,
      };
    });
    expect(expanded.panel.x).toBeGreaterThanOrEqual(0);
    expect(expanded.panel.x + expanded.panel.width).toBeLessThanOrEqual(viewport.width);
    expect(expanded.panel.height).toBeGreaterThan(0);
    expect(expanded.overflowY).toBe('auto');
    for (const [id, bounds] of Object.entries(expanded.actions)) {
      expect(bounds.width, id + ' reachable width').toBeGreaterThanOrEqual(37);
      expect(bounds.height, id + ' reachable height').toBeGreaterThanOrEqual(44);
      expect(bounds.hit, id + ' receives the touch').toBe(id);
    }
    await page.screenshot({
      path: info.outputPath('rpg-open-' + viewport.width + 'x' + viewport.height + '.png'),
    });
    await summary.click();
    await expect(drawer).not.toHaveAttribute('open');
    await expect(page.locator('#quickRpg')).toBeHidden();
  }
  expect(errors).toEqual([]);
});
