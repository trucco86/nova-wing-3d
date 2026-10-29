import { openMenu } from './menu-navigation.mjs';
import { test, expect } from '@playwright/test';

test('portrait cover keeps full artwork fit and menu actions inside a phone viewport', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/showroom-web/);
  const fit = await page.locator('#menu').evaluate((node) => {
    const style = getComputedStyle(node, '::before');
    return { bgSize: style.backgroundSize };
  });
  expect(fit.bgSize).toContain('contain');
  const bounds = await page.locator('#pressStart').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: info.outputPath('cover-fit-390x844.png') });
});

test('ranking prioritizes scores, with consent and explanations behind collapsible controls', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openMenu(page, 'central');
  const ranking = page.locator('#novaRanking');
  await ranking.locator(':scope > summary').click();
  await expect(ranking).toHaveAttribute('open', '');
  await expect(ranking.locator('.rank-leaderboard')).toBeVisible();
  const infoPanel = ranking.locator('.rank-info');
  await expect(infoPanel).not.toHaveAttribute('open');
  await infoPanel.locator('summary').click();
  await expect(infoPanel).toHaveAttribute('open', '');
  await expect(infoPanel.locator('.rank-help')).toBeVisible();
  const enrollment = ranking.locator('.rank-enroll');
  await expect(enrollment).not.toHaveAttribute('open');
  await enrollment.locator('summary').click();
  await expect(enrollment.locator('[data-rank-consent]')).toBeVisible();
  await expect(enrollment.locator('[data-rank-delete]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('rank-compact-phone.png') });
});

test('first stage shows persistent boost instruction only in the upper HUD', async ({
  page,
}, info) => {
  test.setTimeout(110000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(23));
  const notice = page.locator('#launchBoostNotice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('SHIFT / BOOST');
  const box = await notice.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y + box.height).toBeLessThan(844 * 0.48);
  await expect(page.locator('#boostTouch')).toHaveClass(/launch-required/);
  await page.screenshot({ path: info.outputPath('boost-cue-top-mobile.png') });
  await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(3.6));
  await page.keyboard.up('Shift');
  await expect(notice).toBeHidden();
  await expect(page.locator('#boostTouch')).not.toHaveClass(/launch-required/);
});
