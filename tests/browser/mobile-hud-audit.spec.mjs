import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

const overlaps = (a, b, tolerance = 2) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - tolerance &&
  a.x + a.width > b.x + tolerance &&
  a.y < b.y + b.height - tolerance &&
  a.y + a.height > b.y + tolerance;

test('NW-03 P0: controls remain accessible and HUD regions do not collide on small phones', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch ergonomics requires a coarse-pointer project');
  test.setTimeout(120000);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0&xp=740');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 6 });
    await expect(page.locator('#bossHUD')).toBeVisible();
    await expect(page.locator('#quickRpg')).toBeVisible();
    await expect(page.locator('#touch')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element || element.hidden) return null;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        controls: box('#strategyControls'),
        boss: box('#bossHUD'),
        touch: box('#touch'),
        stick: box('#stick'),
        actions: box('#touch .actions'),
        orbit: box('#orbitControls'),
        score: box('.score'),
        status: box('.status'),
        buttons: Object.fromEntries(
          ['podsTouch', 'rollTouch', 'bombTouch', 'robotTouch', 'boostTouch', 'fireTouch'].map(
            (id) => [id, box('#' + id)],
          ),
        ),
      };
    });

    expect(overlaps(geometry.controls, geometry.boss), 'RPG vs. boss HUD').toBe(false);
    expect(geometry.boss.x, 'boss HP must stay at the right information edge').toBeGreaterThan(
      viewport.width * 0.6,
    );
    expect(overlaps(geometry.controls, geometry.touch), 'RPG vs. touch controls').toBe(false);
    expect(overlaps(geometry.boss, geometry.touch), 'boss HUD vs. touch').toBe(false);
    // The touch wrapper deliberately covers the full footer but receives no input.
    // Only its actual interactive children must stay clear of the boss orbit controls.
    expect(overlaps(geometry.orbit, geometry.stick), 'orbit vs. stick').toBe(false);
    expect(overlaps(geometry.orbit, geometry.actions), 'orbit vs. thumb actions').toBe(false);
    expect(overlaps(geometry.status, geometry.score), 'HP vs. score').toBe(false);
    for (const [id, button] of Object.entries(geometry.buttons)) {
      expect(button, id + ' must remain visible').not.toBeNull();
      expect(button.width, id + ' width').toBeGreaterThanOrEqual(60);
      expect(button.height, id + ' height').toBeGreaterThanOrEqual(60);
      expect(button.x, id + ' left').toBeGreaterThanOrEqual(0);
      expect(button.x + button.width, id + ' right').toBeLessThanOrEqual(viewport.width);
      expect(button.y + button.height, id + ' bottom').toBeLessThanOrEqual(viewport.height);
    }
    const buttons = Object.entries(geometry.buttons);
    for (let i = 0; i < buttons.length; i++)
      for (let j = i + 1; j < buttons.length; j++)
        expect(overlaps(buttons[i][1], buttons[j][1]), buttons[i][0] + '/' + buttons[j][0]).toBe(
          false,
        );

    await page.evaluate(() => {
      window.fixture.game.tacticalAction('precision');
      window.fixture.advance(0.65);
    });
    // Armored hull now receives small noncritical damage. Keep its confirmation
    // in the upper information lane, never over the center or thumb controls.
    await expect(page.locator('#hitFeedback')).toHaveAttribute('data-impact', 'boss');
    await expect(page.locator('#hitFeedback')).toContainText(/ACERTO \\+\\d+/);
    const marker = await page.locator('#hitFeedback').boundingBox();
    expect(marker).not.toBeNull();
    expect(marker.width).toBeLessThanOrEqual(125);
    expect(marker.y + marker.height).toBeLessThan(viewport.height * 0.49);
    expect(await page.locator('#hitFeedback').evaluate((el) => el.parentElement.id)).toBe(
      'hudNotices',
    );
    await page.screenshot({
      path: info.outputPath('nw03-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
});
