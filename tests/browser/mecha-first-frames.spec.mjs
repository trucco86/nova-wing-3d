import { test, expect } from '@playwright/test';

test('record the first frames of a mobile mecha transformation, not just its boosted pose', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');

  let elapsed = 0;
  for (const seconds of [0.08, 0.35, 0.85, 1.25]) {
    await page.evaluate((dt) => window.fixture.advance(dt), seconds - elapsed);
    elapsed = seconds;
    await page.screenshot({
      path: info.outputPath('mecha-first-frame-' + Math.round(seconds * 100) + 'cs.png'),
    });
  }
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.state).toBe('playing');
  expect(errors).toEqual([]);
});
