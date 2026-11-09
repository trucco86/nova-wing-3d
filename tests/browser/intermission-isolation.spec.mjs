import { test, expect } from '@playwright/test';

// Regression from the real 390px iOS screenshot: BOOST/FIRE/joystick were
// above shop purchase tiles. Test the complete state transition, not z-index
// in isolation.
test('after a stage, only the hangar and campaign map accept input', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0&xp=740');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.hangar());

  await expect(page.locator('#shop')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/intermission-active/);
  await expect(page.locator('body')).not.toHaveClass(/in-mission/);
  for (const id of ['touch', 'hud', 'hudNotices', 'bottom', 'loadout', 'sectorTag']) {
    await expect(page.locator('#' + id)).toBeHidden();
    expect(await page.locator('#' + id).evaluate((node) => node.inert)).toBe(true);
  }

  // Keyboard inputs must be inert even when the previous mission held BOOST.
  await page.keyboard.press('Shift');
  await page.keyboard.press('Space');
  const idle = await page.evaluate(() => window.fixture.game.snapshot());
  expect(idle.state).toBe('shop');
  expect(idle.controls.fire).toBe(false);
  expect(idle.controls.boost).toBe(false);

  const buy = page.locator('#buyvolley');
  await buy.scrollIntoViewIfNeeded();
  const hit = await buy.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.id;
  });
  expect(hit).toBe('buyvolley');
  const credits = idle.credits;
  await buy.click();
  const purchased = await page.evaluate(() => window.fixture.game.snapshot());
  expect(purchased.volley).toBe(1);
  expect(purchased.credits).toBeLessThan(credits);
  await page.screenshot({ path: info.outputPath('hangar-no-game-controls.png') });

  await page.locator('#nextSector').click();
  await expect(page.locator('#shop')).toBeHidden();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#touch')).toBeHidden();
  await page.locator('#mapBack').click();
  await expect(page.locator('#shop')).toBeVisible();
  await expect(page.locator('#touch')).toBeHidden();

  await page.locator('#nextSector').click();
  await page.locator('#mapLaunch').click();
  await expect(page.locator('body')).not.toHaveClass(/intermission-active/);
  expect(await page.locator('#touch').evaluate((node) => node.inert)).toBe(false);
  expect((await page.evaluate(() => window.fixture.game.snapshot())).state).toBe('playing');
});
