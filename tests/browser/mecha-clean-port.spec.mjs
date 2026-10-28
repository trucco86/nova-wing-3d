import { test, expect } from '@playwright/test';
import { SECTORS } from '../../src/campaign.js';

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
  await page.screenshot({ path: info.outputPath('mecha-chase-flight.png') });

  await page.keyboard.down('ShiftLeft');
  await page.evaluate(() => window.fixture.advance(0.4));
  await page.screenshot({ path: info.outputPath('mecha-boost.png') });
  await page.keyboard.up('ShiftLeft');

  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.state).toBe('playing');
  expect(state.energy).toBeLessThan(100);
  // Advance the real harbor mission timer; the orbital helper is sector-one-only.
  await page.evaluate(
    (duration) =>
      window.fixture.advance(Math.max(0, duration + 5 - window.fixture.game.snapshot().seconds)),
    SECTORS[1].duration,
  );
  expect(await page.evaluate(() => window.fixture.game.snapshot().boss)).toBe(true);
  await expect(page.locator('#bossHUD')).toBeVisible();
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('mecha-boss-combat.png') });
  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');
  await page.evaluate(() => window.fixture.advance(0.85));
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: info.outputPath('fighter-after-mecha.png') });
  expect(errors).toEqual([]);
});
