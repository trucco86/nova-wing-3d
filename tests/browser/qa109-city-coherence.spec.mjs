import { test, expect } from '@playwright/test';

test('QA109: the city retains meaningful architecture, visible transit and grounded details in desktop/mobile', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: info.outputPath('qa109-01-urban-approach.png') });
  await page.evaluate(() => window.fixture.advance(5));
  await page.screenshot({ path: info.outputPath('qa109-02-maglev-and-street-supports.png') });
  await page.evaluate(() => window.fixture.advance(7));
  await page.screenshot({ path: info.outputPath('qa109-03-anchored-district-details.png') });

  const stats = await page.evaluate(() => window.fixture.renderStats());
  expect(stats?.calls, 'WebGL must draw the real scene').toBeGreaterThan(0);
  expect(stats.calls, 'city architecture must honor the established draw-call budget').toBeLessThan(
    1000,
  );
  expect(stats.triangles).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  const result = await page.evaluate(() => window.fixture.game.snapshot());
  expect(result.state).toBe('playing');
  expect(result.sector).toBe(1);
});
