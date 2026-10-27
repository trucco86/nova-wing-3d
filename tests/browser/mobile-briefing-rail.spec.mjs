import { test, expect } from '@playwright/test';

const intersects = (a, b, margin = 1) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - margin &&
  a.x + a.width > b.x + margin &&
  a.y < b.y + b.height - margin &&
  a.y + a.height > b.y + margin;

const positions = (page) =>
  page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el || el.hidden) return null;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return null;
      const { x, y, width, height } = el.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      briefing: box('#hud .mission'),
      comms: box('#comms'),
      rpg: box('#strategyControls'),
      radar: box('#tacticalPanel'),
      score: box('.score'),
      shield: box('.status'),
    };
  });

test('P0 mobile stage introduction and pilot radio never compete for the upper HUD', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile upper rail needs touch viewport');
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('body')).toHaveClass(/stage-intro/);
    await expect(page.locator('#hud .mission')).toBeVisible();
    await expect(page.locator('#comms')).toBeHidden();

    const intro = await positions(page);
    expect(intro.briefing).not.toBeNull();
    expect(intro.rpg).not.toBeNull();
    expect(intro.briefing.y + intro.briefing.height, 'briefing stays in upper safe zone').toBeLessThan(
      size.height * (size.width > size.height ? 0.42 : 0.40),
    );
    for (const key of ['rpg', 'score', 'shield', 'radar']) {
      expect(intersects(intro.briefing, intro[key]), 'briefing must avoid ' + key).toBe(false);
    }
    await page.screenshot({
      path: info.outputPath('intro-top-rail-' + size.width + 'x' + size.height + '.png'),
    });

    await page.evaluate(() => window.fixture.advance(3.3));
    await expect(page.locator('body')).not.toHaveClass(/stage-intro/);
    await expect(page.locator('#hud .mission')).toBeHidden();
    await expect(page.locator('#comms')).toBeVisible();
    const flight = await positions(page);
    expect(flight.briefing).toBeNull();
    expect(flight.comms).not.toBeNull();
    for (const key of ['rpg', 'score', 'shield', 'radar']) {
      expect(intersects(flight.comms, flight[key]), 'pilot radio must avoid ' + key).toBe(false);
    }
    expect(flight.comms.y + flight.comms.height, 'radio stays in top rail').toBeLessThan(
      size.height * (size.width > size.height ? 0.4 : 0.39),
    );
    await page.screenshot({
      path: info.outputPath('radio-top-rail-' + size.width + 'x' + size.height + '.png'),
    });
  }
  expect(errors).toEqual([]);
});
