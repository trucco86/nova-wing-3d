import { test, expect } from '@playwright/test';

test('City 3.2 living metropolis renders ads, aerial crossing, illuminated districts and sky in the game', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveClass(/city-bright/);
  await page.screenshot({ path: info.outputPath('city32-01-opening-ads.png') });
  // A real game simulation, not a mocked scene-graph snapshot: 3D assets must
  // survive renderer initialization and early-stage travel on both projects.
  await page.evaluate(() => window.fixture.advance(5));
  await page.screenshot({ path: info.outputPath('city32-02-overhead-maglev.png') });
  await page.evaluate(() => window.fixture.advance(7));
  await page.screenshot({ path: info.outputPath('city32-03-districts-and-searchlights.png') });
  expect(runtimeErrors).toEqual([]);
  expect((await page.evaluate(() => window.fixture.game.snapshot())).state).toBe('playing');
});
