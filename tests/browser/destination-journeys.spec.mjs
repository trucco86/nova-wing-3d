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

test('Saturn stage 8 plays an open orbit, dense ice-ring crossing and clear final arena', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=7');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#routeLabel')).toContainText('SATURNO');
  await page.evaluate(() => window.fixture.advance(13));
  await expect(page.locator('#routeLabel')).toContainText('ANEL EXTERNO');
  await page.screenshot({ path: info.outputPath('saturn-outer-' + info.project.name + '.png') });
  await page.evaluate(() => window.fixture.advance(28));
  await expect(page.locator('#routeLabel')).toContainText('CAMPO DE GELO');
  await page.screenshot({ path: info.outputPath('saturn-ice-ring-' + info.project.name + '.png') });
  await page.evaluate(() => window.fixture.advance(46));
  await expect(page.locator('#routeLabel')).toContainText('COURAÇADO');
  await page.screenshot({
    path: info.outputPath('saturn-boss-approach-' + info.project.name + '.png'),
  });
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.sector).toBe(8);
  expect(snapshot.boss).toBe(false);
  const render = await page.evaluate(() => window.fixture.renderStats());
  expect(render.calls).toBeGreaterThan(0);
  expect(render.calls).toBeLessThan(1100);
  expect(errors).toEqual([]);
});
