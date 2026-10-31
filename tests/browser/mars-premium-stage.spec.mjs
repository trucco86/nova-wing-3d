import { test, expect } from '@playwright/test';

test('Mars is visibly a new planet with its own desert, two moons and rover', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  const exceptions = [];
  page.on('pageerror', (e) => exceptions.push(e.message));
  await page.goto('/__dynamic.html?sector=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const start = await page.evaluate(() => window.fixture.game.snapshot());
  expect(start.state).toBe('playing');
  expect(start.sector).toBe(2);
  await page.screenshot({ path: info.outputPath('mars-01-desert-moons.png') });
  await page.evaluate(() => window.fixture.advance(4));
  await page.screenshot({ path: info.outputPath('mars-02-curiosity-rocks.png') });
  await page.evaluate(() => window.fixture.advance(8));
  await page.screenshot({ path: info.outputPath('mars-03-deep-desert.png') });
  const frame = await page.evaluate(() => window.fixture.renderStats());
  expect(frame?.calls).toBeGreaterThan(0);
  expect(frame?.triangles).toBeGreaterThan(0);
  expect(frame.calls).toBeLessThan(1100);
  expect(exceptions).toEqual([]);
  await info.attach('mars-webgl-sample.json', {
    body: Buffer.from(JSON.stringify({
      viewport: page.viewportSize(),
      project: info.project.name,
      measured: frame,
      note: 'Browser WebGL sample, not measured physical iPhone GPU performance',
    }, null, 2)),
    contentType: 'application/json',
  });
});
