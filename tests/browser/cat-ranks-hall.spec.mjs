import { test, expect } from '@playwright/test';

test('the Five Cats hall shows five officer records and cat-head medals', async ({ page }, info) => {
  await page.goto('/');
  const panel = page.locator('#catRanks');
  await expect(panel).toBeVisible();
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  await expect(panel).toHaveAttribute('open', '');
  await expect(page.locator('#catRankCards article')).toHaveCount(5);
  await expect(page.locator('#catRankCards')).toContainText('BIA');
  await expect(page.locator('#catRankCards')).toContainText('JENIFER');
  await expect(page.locator('#catRankCards')).toContainText('RECRUTA');
  await expect(page.locator('#catRankCards svg.cat-crest')).toHaveCount(5 * 13);
  await page.screenshot({ path: info.outputPath('five-cats-service-hall.png') });
});

test('pilot selection exposes uniform badge and rank progress without losing existing cat selection', async ({ page }) => {
  await page.goto('/');
  await page.locator('#prepareSquad').click();
  await expect(page.locator('#squadSelection')).toBeVisible();
  await expect(page.locator('#pilotRankInsignia')).toContainText('Recruta');
  await page.locator('#pilot-jenifer').click();
  await expect(page.locator('#profileName')).toHaveText('JENIFER');
  await expect(page.locator('#pilotRankInsignia')).toContainText('Recruta');
  await expect(page.locator('#pilotUniform')).toHaveAttribute('data-grade', '0');
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-uniform-grade', '0');
  await page.locator('#hangarPilot').click();
  await expect(page.locator('#hangarKind')).toContainText('UNIFORME FELINO');
});

test('hall remains scrollable and within mobile viewport at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const panel = page.locator('#catRanks');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  await expect(page.locator('#catRankCards article')).toHaveCount(5);
  const bounds = await panel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
  const scrolls = await page.locator('#catRankCards').evaluate(
    (node) => node.scrollHeight > node.clientHeight,
  );
  expect(scrolls).toBe(true);
});
