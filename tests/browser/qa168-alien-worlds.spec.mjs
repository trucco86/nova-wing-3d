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

    if (theme === 'ice') {
      // Inspect continuous arrival checkpoints instead of validating only
      // 7s orbit and 30s full gameplay, which missed the broken black gap.
      let previous = 7;
      for (const second of [8, 10, 12, 16, 20, 24, 25]) {
        await page.evaluate((dt) => window.fixture.advance(dt), second - previous);
        const arrival = await page.evaluate(() => window.fixture.game.snapshot().europaSurface);
        expect(arrival).toBeTruthy();
        expect(arrival.orbitalVisible).toBe(false);
        if (second >= 8) {
          expect(arrival.destinationGlobeVisible).toBe(false);
        }
        if (second === 20 || second === 24) expect(arrival.surfaceVisible).toBe(true);
        if (second === 25) expect(arrival.destinationGlobeVisible).toBe(false);
        await page.screenshot({ path: info.outputPath(`qa168-europa-entry-${second}s.png`) });
        previous = second;
      }
      await page.evaluate(() => window.fixture.advance(5));
    } else {
      await page.evaluate(() => window.fixture.advance(23));
    }
    const world = await page.evaluate(
      (chosenTheme) => window.fixture.alienWorldState(chosenTheme),
      theme,
    );
    expect(world?.exists).toBe(true);
    expect(world?.visible).toBe(true);
    if (theme === 'ice') {
      expect(world.heroBatchCount).toBe(1);
      expect(world.heroX).toBeLessThan(-103);
      expect(world.heroDepth).toBeGreaterThanOrEqual(-750);
      expect(world.heroDepth).toBeLessThanOrEqual(-450);
      expect(world.canyon).not.toBeNull();
      expect(world.canyon.visible).toBe(true);
      expect(world.canyon.cyanCount).toBe(22);
      expect(world.canyon.cliffs).toBe(24);
      expect(world.canyon.bridges).toBe(8);
      expect(world.canyon.gateway).toBe(true);
      await page.screenshot({ path: info.outputPath('qa168-europa-hero-vault-30s.png') });
      await page.screenshot({ path: info.outputPath('qa168-europa-premium-crystal-canyon.png') });
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

test('QA168 Europa: live 520-unit frozen cave, ice spikes and destructible wall are visible on mobile', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?qaTunnel=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(0.5));
  const cave = await page.evaluate(() => window.fixture.europaCavernState());
  expect(cave).not.toBeNull();
  expect(cave.visualOnly).toBe(true);
  expect(cave.visible).toBe(true);
  expect(cave.length).toBe(520);
  expect(cave.breachPanel).toBe(true);
  expect(cave.renderCalls).toBeGreaterThan(0);
  expect(cave.batches).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'europa-cave-sculpted-wall', count: 38 }),
      expect.objectContaining({ name: 'europa-cave-vaulted-ceiling', count: 22 }),
      expect.objectContaining({ name: 'europa-cave-hanging-ice-stalactites', count: 36 }),
      expect.objectContaining({ name: 'europa-cave-monumental-entrance', count: 10 }),
      expect.objectContaining({ name: 'europa-cave-faceted-gate-skin', count: 36 }),
    ]),
  );
  await page.screenshot({ path: info.outputPath('qa168-europa-frozen-cathedral-cave.png') });
});
