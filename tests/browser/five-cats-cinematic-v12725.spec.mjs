import { test, expect } from '@playwright/test';
import { clickMenu } from './menu-navigation.mjs';

test('opening shows Five Cats portrait with real cinematic text and skips cleanly into gameplay', async ({
  page,
}, info) => {
  test.setTimeout(100000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await clickMenu(page, '#start');
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.locator('#cinematicSpeaker')).toHaveText('NARRADOR');
  await expect(page.locator('#cinematicPortrait')).toBeHidden();
  await expect(page.locator('#cinematicCanvas')).toBeVisible();
  await page.screenshot({ path: info.outputPath('five-ships-opening-' + info.project.name + '.png') });
  await expect(page.locator('#cinematicSpeaker')).toHaveText('BIA', { timeout: 15000 });
  await expect(page.locator('#cinematicPortrait')).toHaveAttribute('data-pilot', 'bia');
  await expect(page.locator('#cinematicPortrait')).toBeVisible();
  await page.screenshot({ path: info.outputPath('bia-radio-cinematic-' + info.project.name + '.png') });
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#menu')).toBeHidden();
  expect(errors).toEqual([]);
});
