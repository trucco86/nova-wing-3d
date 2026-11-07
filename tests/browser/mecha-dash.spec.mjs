import { test, expect } from '@playwright/test';

test('robot lateral dash changes lanes and ship retains roll, with desktop/mobile control labels', async ({
  page,
}, info) => {
  test.setTimeout(100000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(3.2));
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await page.keyboard.press('KeyT');
  await expect(page.locator('#rollTouch')).toHaveText('DASH');
  await expect(page.locator('#rollTouch')).toHaveAttribute('aria-label', /Esquiva lateral/);
  await page.keyboard.press('KeyQ');
  const begun = await page.evaluate(() => window.fixture.game.snapshot());
  expect(begun.rolling).toBe(false);
  expect(begun.mecha.dash.active).toBe(true);
  expect(begun.mecha.dash.direction).toBe(-1);
  expect(begun.player.x).toBeCloseTo(before.player.x, 4);
  await page.evaluate(() => window.fixture.advance(0.12));
  const moved = await page.evaluate(() => window.fixture.game.snapshot());
  expect(moved.player.x).toBeLessThan(before.player.x - 2);
  expect(moved.rolling).toBe(false);
  await page.screenshot({ path: info.outputPath('mecha-dash-left.png') });

  await page.evaluate(() => window.fixture.advance(1.7));
  if (info.project.name === 'mobile') {
    // Touch performs the dash at pointer-down. Neutral direction repeats the
    // previous (left) direction rather than forcing a ship-style barrel roll.
    await page.locator('#rollTouch').tap();
  } else {
    await page.keyboard.press('KeyE');
  }
  const second = await page.evaluate(() => window.fixture.game.snapshot());
  expect(second.mecha.dash.active).toBe(true);
  expect(second.mecha.dash.direction).toBe(info.project.name === 'mobile' ? -1 : 1);
  expect(second.rolling).toBe(false);
  await page.evaluate(() => window.fixture.advance(0.14));
  await page.screenshot({ path: info.outputPath('mecha-dash-again.png') });

  await page.evaluate(() => window.fixture.advance(2.8));
  await page.keyboard.press('KeyT');
  await expect(page.locator('#rollTouch')).toHaveText('GIRO');
  await page.keyboard.press('KeyQ');
  const ship = await page.evaluate(() => window.fixture.game.snapshot());
  expect(ship.mecha.active).toBe(false);
  expect(ship.rolling).toBe(true);
  expect(ship.mecha.dash.active).toBe(false);
  expect(errors).toEqual([]);
});
