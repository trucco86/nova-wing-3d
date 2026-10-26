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


test('mecha design review renders frontal side and rear wing parity plus neon tiers', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  for (const [view, tier] of [
    ['front', 0],
    ['front', 3],
    ['front', 6],
    ['side', 6],
    ['rear', 6],
  ]) {
    await page.goto(`/__visual.html?mode=mecha-review&view=${view}&tier=${tier}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('body')).toHaveAttribute('data-review-view', view);
    await expect(page.locator('body')).toHaveAttribute('data-review-tier', String(tier));
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    const bounds = await canvas.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(300);
    expect(bounds.height).toBeGreaterThanOrEqual(250);
    await page.screenshot({ path: info.outputPath(`mecha-${view}-tier${tier}.png`) });
  }

  expect(errors).toEqual([]);
});
