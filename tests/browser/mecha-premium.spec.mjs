import { test, expect } from '@playwright/test';

test('premium mecha transforms and renders articulated shooting, BOOST plasma and movement', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');
  await expect(page.locator('#robotTouch')).toHaveText('NAVE');
  await page.evaluate(() => window.fixture.advance(0.8));
  const before = await page.screenshot({ path: info.outputPath('mecha-idle.png') });
  expect(before.length).toBeGreaterThan(13000);

  if (info.project.name === 'mobile') {
    const bounds = await page.locator('#boostTouch').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
  } else await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(0.5));
  await expect(page.locator('body')).toHaveClass(/boosting/);
  const boosted = await page.screenshot({ path: info.outputPath('mecha-boost.png') });
  expect(boosted.length).toBeGreaterThan(13000);
  if (info.project.name === 'mobile') await page.mouse.up();
  else await page.keyboard.up('Shift');

  if (info.project.name === 'mobile') await page.locator('#fireTouch').tap();
  else await page.keyboard.down('Space');
  await page.evaluate(() => window.fixture.advance(0.35));
  const shooting = await page.screenshot({ path: info.outputPath('mecha-shooting.png') });
  expect(shooting.length).toBeGreaterThan(13000);
  if (info.project.name !== 'mobile') await page.keyboard.up('Space');

  await page.getByRole('button', { name: 'Pausar jogo' }).click();
  await expect(page.locator('#pauseMenu')).toBeVisible();
  expect(errors).toEqual([]);
});
