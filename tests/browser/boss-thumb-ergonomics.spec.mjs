import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

const intersects = (a, b) =>
  a.x < b.x + b.width - 2 &&
  a.x + a.width > b.x + 2 &&
  a.y < b.y + b.height - 2 &&
  a.y + a.height > b.y + 2;

test('mobile boss orbit stays above left steering, clear of fire, boost and stick', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 5 });
    const g = await page.evaluate(() => {
      const get = (id) => {
        const element = document.querySelector(id);
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      const buttons = Object.fromEntries(
        ['podsTouch', 'rollTouch', 'bombTouch', 'robotTouch', 'fireTouch', 'boostTouch'].map(
          (id) => [id, get('#' + id)],
        ),
      );
      return {
        orbit: get('#orbitControls'),
        left: get('#orbitLeft'),
        right: get('#orbitRight'),
        stick: get('#stick'),
        actions: get('#touch .actions'),
        reticle: get('#aimReticle'),
        buttons,
      };
    });
    expect(g.orbit.y, 'orbital controls must stay in the lower half').toBeGreaterThan(
      viewport.height * 0.5,
    );
    expect(g.orbit.x + g.orbit.width, 'orbit dock belongs to the left steering lane').toBeLessThan(
      viewport.width * 0.5,
    );
    expect(
      g.stick.y - (g.orbit.y + g.orbit.height),
      'orbit is immediately above steering',
    ).toBeGreaterThanOrEqual(8);
    expect(g.stick.y - (g.orbit.y + g.orbit.height)).toBeLessThanOrEqual(24);
    expect(intersects(g.orbit, g.reticle), 'orbit must not cover the aiming reticle').toBe(false);
    expect(intersects(g.orbit, g.stick), 'orbit must not obscure steering').toBe(false);
    expect(intersects(g.orbit, g.actions), 'orbit must not obscure right thumb').toBe(false);
    expect(intersects(g.left, g.right)).toBe(false);
    expect(g.left.height).toBeGreaterThanOrEqual(60);
    expect(g.left.width).toBeGreaterThanOrEqual(60);
    expect(g.right.height).toBeGreaterThanOrEqual(60);
    expect(g.right.width).toBeGreaterThanOrEqual(60);
    const actions = Object.entries(g.buttons);
    for (const [name, b] of actions) {
      expect(b.width, name + ' width').toBeGreaterThanOrEqual(viewport.width < 551 ? 60 : 52);
      expect(b.height, name + ' height').toBeGreaterThanOrEqual(52);
      expect(b.x, name + ' left').toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, name + ' right').toBeLessThanOrEqual(viewport.width);
      expect(b.y + b.height, name + ' bottom').toBeLessThanOrEqual(viewport.height);
    }
    for (let i = 0; i < actions.length; i++)
      for (let j = i + 1; j < actions.length; j++)
        expect(
          intersects(actions[i][1], actions[j][1]),
          'overlap ' + actions[i][0] + '/' + actions[j][0],
        ).toBe(false);
    expect(g.buttons.fireTouch.x).toBeGreaterThan(g.buttons.robotTouch.x);
    expect(g.buttons.boostTouch.x + g.buttons.boostTouch.width).toBeGreaterThanOrEqual(
      g.buttons.fireTouch.x - 8,
    );
    const x = g.left.x + g.left.width / 2;
    const y = g.left.y + g.left.height / 2;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 7 }],
    });
    await page.evaluate(() => window.fixture.advance(0.9));
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    const after = await page.evaluate(() => window.fixture.game.snapshot());
    expect(after.strategy.orbitAngle).toBeLessThan(-0.3);
    await page.screenshot({
      path: info.outputPath('boss-thumb-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
  expect(errors).toEqual([]);
});
