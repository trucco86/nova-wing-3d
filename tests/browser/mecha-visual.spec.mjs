import { test, expect } from '@playwright/test';

test('the flight mecha transforms, raises its cannon arms and keeps a visual record', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#menu')).toBeHidden();

  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');

  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('mecha-shoulder-wings.png') });

  if (info.project.name === 'mobile') {
    await page.locator('#fireTouch').tap();
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
  }
  await page.screenshot({ path: info.outputPath('mecha-cannon-firing.png') });
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
