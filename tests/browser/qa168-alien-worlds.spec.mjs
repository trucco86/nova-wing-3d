import { test, expect } from '@playwright/test';

// QA168 captures the LIVE WebGL gameplay, never a mock concept image.
// Each destination has an arrival shot, a mid-level scenic shot, and its
// real boss scenario so that art review can compare depth and readability.
const destinations = [
  { index: 4, theme: 'sun', label: 'venus' },
  { index: 5, theme: 'ice', label: 'europa' },
  { index: 6, theme: 'nebula', label: 'neptune' },
  { index: 8, theme: 'void', label: 'orion' },
  { index: 9, theme: 'throne', label: 'titan' },
];

for (const { index, theme, label } of destinations) {
  test(`QA168 ${label}: atmosphere/architecture/boss are readable on real canvas`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/__dynamic.html?sector=${index}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

    await page.evaluate(() => window.fixture.advance(7));
    await page.screenshot({ path: info.outputPath(`qa168-${label}-arrival.png`) });

    await page.evaluate(() => window.fixture.advance(23));
    const world = await page.evaluate(
      (chosenTheme) => window.fixture.alienWorldState(chosenTheme),
      theme,
    );
    expect(world?.exists).toBe(true);
    expect(world?.visible).toBe(true);
    if (theme === 'ice') {
      expect(world.heroBatchCount).toBe(1);
      expect(world.heroX).toBeLessThan(-150);
      expect(world.heroDepth).toBeGreaterThanOrEqual(-650);
      expect(world.heroDepth).toBeLessThanOrEqual(-285);
      await page.screenshot({ path: info.outputPath('qa168-europa-hero-vault-30s.png') });
    }
    expect(world?.visualOnly).toBe(true);
    expect(world.structures.length).toBeGreaterThanOrEqual(5);
    expect(world.globeVisible).toBe(false);
    expect(world.ringsAttachedToSaturn).toBe(false);
    expect(world.render?.calls).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath(`qa168-${label}-environment.png`) });

    await page.goto(`/__dynamic.html?qaBoss=${index}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.advance(0.5));
    const boss = await page.evaluate(() => window.fixture.game.snapshot());
    expect(boss).toBeTruthy();
    await page.screenshot({ path: info.outputPath(`qa168-${label}-boss.png`) });
  });
}
