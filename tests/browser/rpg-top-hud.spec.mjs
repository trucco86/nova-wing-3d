import { test, expect } from '@playwright/test';

const overlaps = (a, b, gap = 2) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - gap &&
  a.x + a.width > b.x + gap &&
  a.y < b.y + b.height - gap &&
  a.y + a.height > b.y + gap;

test('P0 mobile RPG shortcuts remain in the upper HUD and never block the flight corridor', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Tests require actual touch viewport');
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
    const geo = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element || element.hidden || getComputedStyle(element).display === 'none') return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const buttons = Object.fromEntries(
        ['arsenalSwitch', 'specialSwitch', 'specialCast'].map((id) => [id, box('#' + id)]),
      );
      const pointerTargets = Object.fromEntries(
        Object.entries(buttons).map(([id, bounds]) => [
          id,
          bounds
            ? document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
                ?.id
            : null,
        ]),
      );
      return {
        strategy: box('#strategyControls'),
        drawer: box('#strategyDrawer'),
        quick: box('#quickRpg'),
        notices: box('#hudNotices'),
        radar: box('#tacticalPanel'),
        aim: box('#aimReticle'),
        buttons,
        pointerTargets,
      };
    });

    expect(geo.strategy).not.toBeNull();
    expect(geo.drawer).not.toBeNull();
    expect(geo.quick).not.toBeNull();
    expect(
      geo.strategy.y + geo.strategy.height,
      'RPG must stay above central combat lane',
    ).toBeLessThan(viewport.height * (viewport.width > viewport.height ? 0.4 : 0.34));
    expect(geo.strategy.x).toBeGreaterThanOrEqual(0);
    expect(geo.strategy.x + geo.strategy.width).toBeLessThanOrEqual(viewport.width);
    expect(overlaps(geo.strategy, geo.notices), 'warnings must have a separate top lane').toBe(
      false,
    );
    expect(overlaps(geo.strategy, geo.radar), 'RPG must never cover boss radar').toBe(false);
    const y = Object.values(geo.buttons).map((button) => button?.y);
    expect(new Set(y).size, 'all RPG shortcuts must share one top row').toBe(1);
    for (const [id, bounds] of Object.entries(geo.buttons)) {
      expect(bounds, id + ' stays mounted').not.toBeNull();
      expect(bounds.width, id + ' has a usable touch width').toBeGreaterThanOrEqual(37);
      expect(bounds.height, id + ' has a usable touch height').toBeGreaterThanOrEqual(44);
      expect(geo.pointerTargets[id], id + ' is not intercepted by another overlay').toBe(id);
    }
    await page.screenshot({
      path: info.outputPath('rpg-top-rail-' + viewport.width + 'x' + viewport.height + '.png'),
    });

    // Opening advanced tactical options is deliberate; they must be scrollable
    // without pushing the permanent RPG shortcuts into the middle of the screen.
    await page.locator('#strategyDrawer summary').click();
    await expect(page.locator('#strategyDrawer')).toHaveAttribute('open');
    await expect(page.locator('#quickRpg')).toHaveCSS('visibility', 'visible');
    await expect(page.locator('#specialCast')).toBeVisible();
    const opened = await page.locator('#strategyDrawer').boundingBox();
    expect(opened.y).toBeLessThan(viewport.height * 0.45);
    expect(opened.height).toBeLessThanOrEqual(Math.min(viewport.height * 0.19, 110) + 2);
    const cast = await page.locator('#specialCast').boundingBox();
    const activeTarget = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, {
      x: cast.x + cast.width / 2,
      y: cast.y + cast.height / 2,
    });
    expect(activeTarget, 'cast button stays clickable while details are open').toBe('specialCast');
    await page.locator('#strategyDrawer summary').click();
    await expect(page.locator('#strategyDrawer')).not.toHaveAttribute('open');
  }
  expect(errors).toEqual([]);
});
