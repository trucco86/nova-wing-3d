import { test, expect } from '@playwright/test';

test('required SUPER BOOST replaces the existing touch button and clears on atmosphere', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(120000);
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(24));
  await expect(page.locator('#boostTouch')).toHaveText('SUPER BOOST');
  await expect(page.locator('#boostTouch')).toHaveClass(/launch-required/);
  await expect(page.locator('#launchBoostNotice')).toBeVisible();
  const rect = await page.locator('#boostTouch').boundingBox();
  expect(rect.width).toBeGreaterThanOrEqual(60);
  expect(rect.height).toBeGreaterThanOrEqual(60);
  const activeTarget = await page.evaluate(({ x, y, width, height }) => {
    const boost = document.getElementById('boostTouch');
    const center = document.elementFromPoint(x + width / 2, y + height / 2);
    return center === boost || boost.contains(center);
  }, rect);
  expect(activeTarget).toBe(true);
  await page.screenshot({ path: info.outputPath('super-boost-required.png') });
  await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(3.5));
  await page.keyboard.up('Shift');
  const state = await page.evaluate(() => window.fixture.game.snapshot().orbitalLaunch);
  expect(state.phase).toBe('atmosphere');
  await expect(page.locator('#boostTouch')).toHaveText('BOOST');
  await expect(page.locator('#boostTouch')).not.toHaveClass(/launch-required/);
});

test('semi-moon thumb arc is staggered and both touch halves remain clear in portrait and landscape', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(100000);
  const positions = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ];
  for (const viewport of positions) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => {
      document.body.classList.remove('menu');
      document.body.classList.add('in-mission');
      document.getElementById('lockTouch').hidden = false;
    });
    const arc = await page.evaluate(() => {
      const ids = [
        'podsTouch',
        'rollTouch',
        'robotTouch',
        'bombTouch',
        'lockTouch',
        'boostTouch',
        'fireTouch',
      ];
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
      };
      return {
        buttons: Object.fromEntries(ids.map((id) => [id, rect(document.getElementById(id))])),
        analog: rect(document.getElementById('stick')),
        pointer: matchMedia('(pointer: coarse)').matches,
      };
    });
    expect(arc.pointer).toBe(true);
    const targets = Object.entries(arc.buttons);
    for (const [id, r] of targets) {
      expect(r.w, id).toBeGreaterThanOrEqual(60);
      expect(r.h, id).toBeGreaterThanOrEqual(60);
      expect(r.x, id).toBeGreaterThanOrEqual(-1);
      expect(r.bottom, id).toBeLessThanOrEqual(viewport.height + 1);
      expect(r.right, id).toBeLessThanOrEqual(viewport.width + 1);
      for (const [next, b] of targets) {
        if (next <= id) continue;
        const overlap =
          Math.max(0, Math.min(r.right, b.right) - Math.max(r.x, b.x)) *
          Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.y, b.y));
        expect(overlap, id + ' overlaps ' + next).toBe(0);
      }
    }
    expect(arc.buttons.rollTouch.y).toBeLessThan(
      arc.buttons.podsTouch.y,
      'semi-arc rises towards the top center, not a rectangular grid',
    );
    await page.screenshot({
      path: info.outputPath('half-moon-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
});
