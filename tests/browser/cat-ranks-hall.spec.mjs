import { test, expect } from '@playwright/test';

test('the Five Cats hall shows five officer records and cat-head medals', async ({
  page,
}, info) => {
  await page.goto('/');
  const panel = page.locator('#catRanks');
  await expect(panel).toBeVisible();
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  await expect(panel).toHaveAttribute('open', '');
  await expect(page.locator('#catRankCards article')).toHaveCount(5);
  await expect(page.locator('#catRankCards')).toContainText('BIA');
  await expect(page.locator('#catRankCards')).toContainText('JENIFER');
  await expect(page.locator('#catRankCards')).toContainText('Recruta');
  await expect(page.locator('#catRankCards svg.cat-crest')).toHaveCount(5 * 13);
  await page.screenshot({ path: info.outputPath('five-cats-service-hall.png') });
});

test('pilot selection exposes uniform badge and rank progress without losing existing cat selection', async ({
  page,
}) => {
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
  const scrolls = await page
    .locator('#catRankCards')
    .evaluate((node) => node.scrollHeight > node.clientHeight);
  expect(scrolls).toBe(true);
});

test('uniform preview rotates cosmetic 3D grades without granting points or medals', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#prepareSquad').click();
  await page.locator('#hangarPilot').click();
  const selection = page.locator('#squadSelection');
  await expect(page.locator('#pilotUniformPreviewStatus')).toContainText('conquistado');
  await expect(selection).toHaveAttribute('data-uniform-grade', '0');
  await page.locator('#pilotUniformPreview').click();
  await expect(selection).toHaveAttribute('data-uniform-grade', '1');
  await expect(page.locator('#pilotUniformPreviewStatus')).toContainText('APENAS PRÉVIA');
  await expect(page.locator('#pilotRankProgress')).toContainText('0 / 120 PS');
  await expect(page.locator('#catSquadRank')).toContainText('0 PS');
  for (let i = 0; i < 4; i++) await page.locator('#pilotUniformPreview').click();
  await expect(selection).toHaveAttribute('data-uniform-grade', '0');
  await expect(page.locator('#pilotUniformPreviewStatus')).toContainText('conquistado');
  await page.locator('#pilotUniformPreview').click();
  await page.locator('#pilot-bob').click();
  await expect(selection).toHaveAttribute('data-uniform-grade', '0');
  await expect(page.locator('#profileName')).toHaveText('BOB');
});

test('reward debrief remains hidden until a real mission is recorded', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#shopServiceSummary')).toBeHidden();
  await expect(page.locator('#resultServiceSummary')).toBeHidden();
  await page.locator('#prepareSquad').click();
  await expect(page.locator('#pilotRankProgress')).toContainText('0 / 120 PS');
});

test('medals display distinct feline award motifs instead of identical badges', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('#catRanks');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  const motifs = await page.locator('#catRankCards article').first()
    .locator('.cat-medal-chip svg').evaluateAll((icons) =>
      icons.map((svg) => ({
        id: svg.dataset.medal, motif: svg.dataset.motif,
        mark: svg.querySelector('[data-medal-mark]')?.outerHTML ?? '',
      })),
    );
  expect(motifs).toHaveLength(12);
  expect(new Set(motifs.map((medal) => medal.id)).size).toBe(12);
  expect(new Set(motifs.map((medal) => medal.motif)).size).toBeGreaterThanOrEqual(9);
  expect(motifs.every((medal) => medal.mark.length > 45)).toBe(true);
  expect(motifs.find((m) => m.id === 'lightning-tail').motif).toBe('lightning');
  expect(motifs.find((m) => m.id === 'marvin-shadow').motif).toBe('eclipse');
});

test('tapping a medal on touch screens shows its name, status and real unlock condition', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const panel = page.locator('#catRanks');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  const medal = panel.locator('article').first().locator('.cat-medal-chip[data-earned="false"]').first();
  await medal.click();
  await expect(page.locator('#catMedalDetails')).toContainText('BLOQUEADA');
  await expect(page.locator('#catMedalDetails')).toContainText('Derrote seu primeiro chefe');
  const box = await medal.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(38);
  expect(box.height).toBeGreaterThanOrEqual(38);
});
