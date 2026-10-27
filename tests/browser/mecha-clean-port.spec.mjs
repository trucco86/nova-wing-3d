import { test, expect } from '@playwright/test';

test('new mecha chassis transforms and maintains propulsion under live flight input', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  if (info.project.name === 'mobile') {
    await page.locator('#robotTouch').tap();
  } else {
    await page.keyboard.press('KeyT');
  }
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.fixture.advance(0.85));
  await page.screenshot({ path: info.outputPath('mecha-front-flight.png') });

  await page.keyboard.down('ShiftLeft');
  await page.evaluate(() => window.fixture.advance(0.4));
  await page.screenshot({ path: info.outputPath('mecha-boost.png') });
  await page.keyboard.up('ShiftLeft');

  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.state).toBe('playing');
  expect(state.energy).toBeLessThan(100);
  expect(errors).toEqual([]);
});
