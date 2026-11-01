import { test, expect } from '@playwright/test';

const worlds = [
  [3, 'DEVASTADOR'],
  [4, 'VÊNUS'],
  [5, 'EUROPA'],
  [6, 'NETUNO'],
  [7, 'SATURNO'],
  [8, 'ÓRION'],
  [9, 'TITÃ'],
];
for (const [sector, destination] of worlds) {
  test(`destination ${sector + 1} is shown before entry into ${destination}`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    await page.goto('/__dynamic.html?sector=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const begin = await page.evaluate(() => window.fixture.game.snapshot());
    expect(begin.state).toBe('playing');
    await expect(page.locator('#routeLabel')).toContainText(destination);
    if (sector === 3)
      expect((await page.evaluate(() => window.fixture.game.snapshot())).directedShot).toBe(
        'chase',
      );
    await page.screenshot({ path: info.outputPath(`planet-${sector + 1}-01-space.png`) });
    await page.evaluate(() => window.fixture.advance(16));
    if (sector === 3)
      expect((await page.evaluate(() => window.fixture.game.snapshot())).directedShot).toBe(
        'chase',
      );
    await page.screenshot({ path: info.outputPath(`planet-${sector + 1}-02-entry.png`) });
    await page.evaluate(() => window.fixture.advance(10));
    await expect(page.locator('#routeLabel')).toContainText(destination);
    await page.screenshot({ path: info.outputPath(`planet-${sector + 1}-03-destination.png`) });
    const stats = await page.evaluate(() => window.fixture.renderStats());
    expect(stats.calls).toBeGreaterThan(0);
    expect(stats.calls).toBeLessThan(1100);
  });
}
