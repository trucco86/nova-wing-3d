import { test, expect } from '@playwright/test';

test('City 3.3 shows premium facade details and active mid-stage construction in real WebGL', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveClass(/city-bright/);
  await page.screenshot({ path: info.outputPath('city33-01-premium-buildings.png') });
  await page.evaluate(() => window.fixture.advance(8));
  await page.screenshot({ path: info.outputPath('city33-02-busway-city-motion.png') });
  await page.evaluate(() => window.fixture.advance(7));
  await page.screenshot({ path: info.outputPath('city33-03-midstage-construction.png') });
  const measured = await page.evaluate(() => window.fixture.renderStats());
  expect(measured?.calls).toBeGreaterThan(0);
  expect(measured.calls).toBeLessThan(1100);
  expect(measured.triangles).toBeGreaterThan(0);
  await info.attach('city33-webgl-frame-budget.json', {
    body: Buffer.from(
      JSON.stringify(
        {
          profile: info.project.name,
          viewport: page.viewportSize(),
          renderer: measured,
          note: 'Software renderer sample; not physical-device FPS',
        },
        null,
        2,
      ),
    ),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
  expect((await page.evaluate(() => window.fixture.game.snapshot())).state).toBe('playing');
});
