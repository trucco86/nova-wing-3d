import { test, expect } from '@playwright/test';

// Real mobile pointer events + deterministic game simulation; screenshots are
// saved for visual QA rather than asserting pixel-dependent engine effects.
test('mobile: hold fighter 90 degrees, transform, dash with real side movement and new jet trails', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Only touch viewport exposes the roll control');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=3');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const button = page.locator('#rollTouch');
  await expect(button).toBeVisible();
  await expect(button).toHaveText('GIRO');

  const bounds = await button.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.evaluate(() => window.fixture.advance(0.45));
  const side = await page.evaluate(() => window.fixture.game.snapshot());
  expect(Math.abs(side.bankAngle + Math.PI / 2)).toBeLessThan(0.1);
  await page.screenshot({ path: info.outputPath('fighter-90-degree-bank.png') });
  // Genuine physical hold longer than short-tap threshold: no 360 after release.
  await page.waitForTimeout(260);
  await page.mouse.up();
  await page.evaluate(() => window.fixture.advance(0.45));
  const normal = await page.evaluate(() => window.fixture.game.snapshot());
  expect(Math.abs(normal.bankAngle)).toBeLessThan(0.08);

  await page.locator('#robotTouch').tap();
  await page.evaluate(() => window.fixture.advance(1.45));
  await expect(button).toHaveText('DASH');
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await button.tap();
  await page.evaluate(() => window.fixture.advance(0.12));
  const during = await page.evaluate(() => window.fixture.game.snapshot());
  expect(during.dash.active).toBe(true);
  expect(Math.abs(during.player.x - before.player.x)).toBeGreaterThan(3);
  await page.screenshot({ path: info.outputPath('mecha-lateral-dash.png') });
  await page.evaluate(() => window.fixture.advance(0.3));
  const after = await page.evaluate(() => window.fixture.game.snapshot());
  expect(after.dash.active).toBe(false);
  expect(after.dash.cooldown).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
