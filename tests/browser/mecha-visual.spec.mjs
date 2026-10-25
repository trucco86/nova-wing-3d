import { test, expect } from '@playwright/test';

test('the flight mecha transforms, raises its cannon arms and keeps a visible visual record', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  // Advance beyond the initial invulnerability blink. The previous screenshots
  // were empty because the whole player hierarchy was invisible in that frame.
  await page.evaluate(() => window.fixture.advance(3.2));
  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');

  await page.evaluate(() => window.fixture.advance(0.5));
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  const visible = await page.evaluate(() => window.fixture.game.snapshot().playerVisible);
  expect(visible, 'robot and wings must be visible in the captured frame').toBe(true);
  await page.screenshot({ path: info.outputPath('mecha-shoulder-wings.png') });

  if (info.project.name === 'mobile') {
    await page.locator('#fireTouch').tap();
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
  }
  await page.evaluate(() => window.fixture.advance(0.2));
  expect(await page.evaluate(() => window.fixture.game.snapshot().playerVisible)).toBe(true);
  await page.screenshot({ path: info.outputPath('mecha-cannon-firing.png') });
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
