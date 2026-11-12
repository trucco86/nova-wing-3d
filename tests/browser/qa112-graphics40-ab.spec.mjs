import { test, expect } from '@playwright/test';

test('QA112 Graphics 4.0: identical-camera A/B captures prove visible architectural relief with bounded GPU cost', async ({ page }, info) => {
  test.setTimeout(210000);
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' &&
        /WebGLProgram|Shader Error|VALIDATE_STATUS false|shader compilation/i.test(msg.text()))
      problems.push(msg.text());
  });
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  const comparisons = [];
  for (const [label, seconds] of [['launch', 0], ['district', 6], ['approach', 7]]) {
    if (seconds) await page.evaluate((value) => window.fixture.advance(value), seconds);
    const before = await page.evaluate(() => window.fixture.graphics40Visible(false));
    expect(before.roots).toBe(2);
    expect(before.stats.calls).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath('qa112-' + label + '-baseline.png') });

    const after = await page.evaluate(() => window.fixture.graphics40Visible(true));
    expect(after.roots).toBe(2);
    expect(after.stats.calls).toBeGreaterThanOrEqual(before.stats.calls);
    expect(after.stats.calls - before.stats.calls).toBeLessThanOrEqual(10);
    expect(after.stats.triangles).toBeGreaterThanOrEqual(before.stats.triangles);
    await page.screenshot({ path: info.outputPath('qa112-' + label + '-graphics40.png') });
    comparisons.push({
      label,
      before: before.stats,
      after: after.stats,
      extraCalls: after.stats.calls - before.stats.calls,
      extraTriangles: after.stats.triangles - before.stats.triangles,
    });
  }
  expect(comparisons.some((x) => x.extraTriangles > 0), 'new facade geometry must be truly rendered in stage 1').toBe(true);
  expect(problems).toEqual([]);
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.state).toBe('playing');
  expect(snapshot.sector).toBe(1);
  await info.attach('graphics40-measured-A-B', {
    body: JSON.stringify({ device: info.project.name, comparisons }),
    contentType: 'application/json',
  });
});
