import { test, expect } from '@playwright/test';

// Real mobile pointer events + deterministic game simulation; screenshots are
// saved for visual QA rather than asserting pixel-dependent engine effects.
test('mobile: hold fighter 90 degrees, transform, dash with real side movement and new jet trails', async ({
  page,
}, info) => {
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
  const neutral = await page.evaluate(() => window.fixture.game.snapshot());
  // Approved behavior: neutral touch DASH uses the previous steering side,
  // defaulting to right on a fresh robot session, and consumes real energy.
  expect(neutral.dash.active).toBe(true);
  expect(neutral.dash.direction).toBe(1);
  expect(neutral.energy).toBeLessThan(before.energy);
  await page.evaluate(() => window.fixture.advance(1.55));
  const beforeDirectional = await page.evaluate(() => window.fixture.game.snapshot());
  expect(beforeDirectional.dash.cooldown).toBe(0);

  // Live stick direction takes precedence over stored dash direction.
  const stick = page.locator('#stick');
  const stickBounds = await stick.boundingBox();
  await page.mouse.move(
    stickBounds.x + stickBounds.width * 0.84,
    stickBounds.y + stickBounds.height * 0.5,
  );
  await page.mouse.down();
  await expect
    .poll(async () => page.evaluate(() => window.fixture.game.snapshot().controls.stickX))
    .toBeGreaterThan(0.2);
  await button.tap();
  await page.evaluate(() => window.fixture.advance(0.12));
  const during = await page.evaluate(() => window.fixture.game.snapshot());
  await page.mouse.up();
  expect(during.dash.active).toBe(true);
  expect(Math.abs(during.player.x - beforeDirectional.player.x)).toBeGreaterThan(3);
  expect(during.mecha.dashJetSide).toBe(-during.dash.direction);
  expect(during.energy).toBeLessThan(beforeDirectional.energy);
  expect(during.dash.trail.visible).toBeGreaterThan(0);
  expect(during.mecha.boostCoreCount).toBe(0);
  await page.screenshot({ path: info.outputPath('mecha-lateral-dash.png') });
  await page.evaluate(() => window.fixture.advance(0.3));
  const after = await page.evaluate(() => window.fixture.game.snapshot());
  expect(after.dash.active).toBe(false);
  expect(after.dash.cooldown).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('desktop: a held Q banks vertically, a tapped E barrel-rolls, robot Z dashes with visible side thrust', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Keyboard desktop regression');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=3');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.down('q');
  await page.evaluate(() => window.fixture.advance(0.45));
  const held = await page.evaluate(() => window.fixture.game.snapshot());
  expect(Math.abs(held.bankAngle + Math.PI / 2)).toBeLessThan(0.1);
  await page.screenshot({ path: info.outputPath('desktop-fighter-90-degree-bank.png') });
  await page.keyboard.up('q');
  await page.evaluate(() => window.fixture.advance(0.4));
  const released = await page.evaluate(() => window.fixture.game.snapshot());
  expect(released.rolling).toBe(false);
  expect(Math.abs(released.bankAngle)).toBeLessThan(0.08);

  await page.keyboard.press('e');
  const tap = await page.evaluate(() => window.fixture.game.snapshot());
  expect(tap.rolling).toBe(true);
  await page.evaluate(() => window.fixture.advance(0.8));
  await page.keyboard.press('t');
  await page.evaluate(() => window.fixture.advance(1.4));
  const mode = await page.evaluate(() => window.fixture.game.snapshot());
  expect(mode.mecha.active).toBe(true);

  await page.keyboard.down('d');
  await page.keyboard.press('z');
  await page.evaluate(() => window.fixture.advance(0.12));
  const dash = await page.evaluate(() => window.fixture.game.snapshot());
  expect(dash.dash.active).toBe(true);
  expect(dash.mecha.dashJetSide).toBe(-dash.dash.direction);
  expect(dash.player.x).toBeGreaterThan(mode.player.x + 3);
  expect(dash.energy).toBeLessThan(mode.energy - 15);
  await page.screenshot({ path: info.outputPath('desktop-mecha-side-jet.png') });
  await page.keyboard.up('d');
  expect(errors).toEqual([]);
});

test('mobile: extended robot boost is measurably longer than the idle exhaust', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Mobile boost visual regression');
  await page.goto('/__dynamic.html?sector=3');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.locator('#robotTouch').tap();
  await page.evaluate(() => window.fixture.advance(1.45));
  const idle = await page.evaluate(() => window.fixture.game.snapshot());
  const booster = page.locator('#boostTouch');
  const bounds = await booster.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.evaluate(() => window.fixture.advance(0.55));
  const boosted = await page.evaluate(() => window.fixture.game.snapshot());
  expect(boosted.mecha.boostCoreCount).toBe(2);
  expect(boosted.mecha.thrustLength).toBeGreaterThan(idle.mecha.thrustLength * 2);
  await page.screenshot({ path: info.outputPath('mecha-extended-boost.png') });
  await page.mouse.up();
});
