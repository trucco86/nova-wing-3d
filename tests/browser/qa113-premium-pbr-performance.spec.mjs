import { test, expect } from '@playwright/test';

test('QA113: detailed PBR city and a single shared reflection probe stay within WebGL budget', async ({ page }, info) => {
  test.setTimeout(180000);
  const problems = [];
  page.on('pageerror', err => problems.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' &&
        /WebGLProgram|Shader Error|VALIDATE_STATUS false|shader compilation|WebGL: INVALID/i.test(msg.text()))
      problems.push(msg.text());
  });
  const mobile = info.project.name === 'mobile';
  await page.setViewportSize(mobile ? {width: 390, height: 844} : {width: 1366, height: 768});
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const details = await page.evaluate(() => window.fixture.graphics40Details());
  expect(details).toHaveLength(2);
  expect(details.map(x => x.variant).sort()).toEqual(['civic', 'industrial']);
  for (const tile of details) {
    expect(tile.reflectionFaces, 'one locally generated cubemap with six low-resolution faces').toBe(6);
    expect(tile.reflectionsShared, 'reuse one reflection map for PBR glass and masonry').toBe(true);
    expect(tile.batches, 'four merged materials, no mesh per window').toBe(4);
    expect(tile.metrics.bytes, 'bounded buffer memory').toBeLessThan(3 * 1024 * 1024);
    expect(tile.buildings).toBeGreaterThanOrEqual(4);
  }
  await page.evaluate(() => window.fixture.advance(6));
  const original = await page.evaluate(() => window.fixture.graphics40Visible(false));
  await page.screenshot({path: info.outputPath('qa113-before-architecture.png')});
  const premium = await page.evaluate(() => window.fixture.graphics40Visible(true));
  await page.screenshot({path: info.outputPath('qa113-premium-reflective-architecture.png')});
  expect(premium.stats.calls).toBeGreaterThanOrEqual(original.stats.calls);
  expect(premium.stats.calls - original.stats.calls).toBeLessThanOrEqual(10);
  expect(premium.stats.triangles).toBeGreaterThan(original.stats.triangles);
  expect(problems).toEqual([]);
  await info.attach('qa113-gpu-and-material-profile', {
    body: JSON.stringify({platform: info.project.name, original: original.stats, premium: premium.stats, details}),
    contentType: 'application/json',
  });
});
