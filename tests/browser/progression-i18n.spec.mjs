import { test, expect } from '@playwright/test';

for (const lang of ['en', 'es']) {
  test('trophy and feline rank copy follows Options language ' + lang, async ({ page }, info) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.locator('#optionsFromMenu').click();
    await page.locator('#settingLanguage').selectOption(lang);
    await page.locator('#settingsClose').click();
    const rankPanel = page.locator('#catRanks');
    await rankPanel.scrollIntoViewIfNeeded();
    await rankPanel.locator(':scope > summary').click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('#catRankCards article')).toHaveCount(5);

    const medals = page.locator('#catRankCards .cat-medal-chip');
    await expect(medals).toHaveCount(60);
    await expect(medals.first()).toHaveAttribute('aria-label',
      lang === 'en' ? /Bronze Claw/ : /Garra de Bronce/);
    await expect(page.locator('#catRankCards .cat-service-title').first()).toContainText(
      lang === 'en' ? 'Recruit' : 'Recluta',
    );
    const trophyPanel = page.locator('#novaTrophies');
    await trophyPanel.scrollIntoViewIfNeeded();
    await trophyPanel.locator(':scope > summary').click();
    await expect(page.locator('#novaTrophyList li')).toHaveCount(41);
    await expect(page.locator('#novaTrophyList')).toContainText(
      lang === 'en' ? 'Primary Weapons Only' : 'Solo con Armas Primarias',
    );
    await expect(page.locator('#novaTrophyList')).toContainText(
      lang === 'en' ? 'Secret trophy' : 'Trofeo secreto',
    );
    await page.screenshot({ path: info.outputPath('achievements-' + lang + '.png') });
    expect(errors).toEqual([]);
  });
}

test('switching from English back to PT-BR restores original feline title', async ({ page }) => {
  await page.goto('/');
  await page.locator('#optionsFromMenu').click();
  await page.locator('#settingLanguage').selectOption('en');
  await page.locator('#settingLanguage').selectOption('pt');
  await page.locator('#settingsClose').click();
  const panel = page.locator('#catRanks');
  await panel.scrollIntoViewIfNeeded();
  await panel.locator(':scope > summary').click();
  await expect(page.locator('#catRankCards .cat-service-title').first()).toContainText('Recruta');
});
