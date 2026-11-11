import { test, expect } from '@playwright/test';

test('QA110: premium city has grounded generic ads and a readable WebGL flight path', async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const mobile = info.project.name === 'mobile';
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 768 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const screenshots = [
    ['premium-city-01-grounded-ad-slots', 0],
    ['premium-city-02-maglev-signs', 5],
    ['premium-city-03-urban-retail', 9],
    ['premium-city-04-second-district', 14],
  ];
  for (const [name, advance] of screenshots) {
    if (advance) await page.evaluate((seconds) => window.fixture.advance(seconds), advance);
    await page.screenshot({ path: info.outputPath(name + '.png') });
    const stats = await page.evaluate(() => window.fixture.renderStats());
    expect(stats?.calls, 'real city WebGL draw calls').toBeGreaterThan(0);
    expect(stats.calls, 'stay within existing device draw-call budget').toBeLessThan(1000);
    expect(stats.triangles).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.state).toBe('playing');
  expect(snapshot.sector).toBe(1);
});
