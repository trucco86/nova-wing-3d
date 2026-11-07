import { test, expect } from '@playwright/test';

test('stage 6 descends to a frozen surface without a second moon or flashing global deck', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  await page.goto('/__dynamic.html?sector=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const orbit = await page.evaluate(() => {
    window.fixture.advance(11);
    return window.fixture.game.snapshot();
  });
  expect(orbit.sector).toBe(6);
  expect(orbit.europaSurface?.orbitalVisible).toBe(true);
  expect(orbit.europaSurface?.surfaceVisible).toBe(false);

  const landing = await page.evaluate(() => {
    window.fixture.advance(15);
    return window.fixture.game.snapshot();
  });
  expect(landing.europaSurface?.orbitalVisible).toBe(false);
  expect(landing.europaSurface?.destinationGlobeVisible).toBe(false);
  expect(landing.europaSurface?.surfaceVisible).toBe(true);
  expect(landing.europaSurface?.groundVisible).toBe(true);
  expect(landing.europaSurface?.frostDensity).toBeGreaterThanOrEqual(0.002);
  expect(landing.europaSurface?.tunnelActive).toBe(false);

  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => window.fixture.advance(0.4));
    const snap = await page.evaluate(() => window.fixture.game.snapshot());
    expect(snap.europaSurface?.orbitalVisible).toBe(false);
    expect(snap.europaSurface?.destinationGlobeVisible).toBe(false);
    await page.screenshot({
      path: info.outputPath('europa-frozen-surface-' + size.width + '.png'),
    });
  }
  expect(pageErrors).toEqual([]);
});
