import { test, expect } from '@playwright/test';

test('QA114: supported skyline aperture and corridor ribs are visible within the existing GPU batch budget', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /WebGLProgram|Shader Error|VALIDATE_STATUS false|shader compilation/i.test(message.text())
    )
      errors.push(message.text());
  });
  const mobile = info.project.name === 'mobile';
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 768 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const structure = await page.evaluate(() => ({
    skyline: window.fixture.graphics40Horizon(),
    districts: window.fixture.graphics40Details(),
  }));
  expect(structure.skyline.aperture).toEqual({
    radius: 43,
    innerRadius: 36.5,
    segments: 12,
    supportedSkywayY: 157,
    nonPlayable: true,
  });
  expect(structure.skyline.metrics.drawUnits).toBe(3);
  expect(structure.skyline.metrics.bytes).toBeLessThan(256 * 1024);
  expect(structure.districts).toHaveLength(2);
  for (const district of structure.districts) {
    expect(district.batches).toBe(4);
    expect(district.supportedSideRibbons).toBeGreaterThanOrEqual(4);
    expect(district.metrics.bytes).toBeLessThan(3 * 1024 * 1024);
  }
  await page.evaluate(() => window.fixture.advance(6));
  const baseline = await page.evaluate(() => window.fixture.graphics40Visible(false));
  const baselineImage = await page.locator('#game').screenshot({
    path: info.outputPath('qa114-city-before.png'),
  });
  const premium = await page.evaluate(() => window.fixture.graphics40Visible(true));
  const premiumImage = await page.locator('#game').screenshot({
    path: info.outputPath('qa114-city-aperture-and-facades.png'),
  });
  expect(premium.roots).toBe(2);
  const deltaCalls = premium.stats.calls - baseline.stats.calls;
  const deltaTriangles = premium.stats.triangles - baseline.stats.triangles;
  expect(deltaCalls).toBeGreaterThanOrEqual(0);
  expect(deltaCalls).toBeLessThanOrEqual(8);
  expect(deltaTriangles).toBeGreaterThan(0);
  expect(deltaTriangles).toBeLessThan(21000);
  const changedFraction = await page.evaluate(
    async ([beforeBase64, afterBase64]) => {
      const read = (value) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = 'data:image/png;base64,' + value;
        });
      const [a, b] = await Promise.all([read(beforeBase64), read(afterBase64)]);
      const canvas = document.createElement('canvas');
      canvas.width = a.width;
      canvas.height = a.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('No canvas pixel compare context');
      ctx.drawImage(a, 0, 0);
      const baselinePixels = ctx.getImageData(0, 0, a.width, a.height).data;
      ctx.clearRect(0, 0, a.width, a.height);
      ctx.drawImage(b, 0, 0);
      const premiumPixels = ctx.getImageData(0, 0, a.width, a.height).data;
      let changed = 0,
        samples = 0;
      for (let y = Math.floor(a.height * 0.1); y < a.height * 0.86; y += 3)
        for (let x = 0; x < a.width; x += 3) {
          const index = (y * a.width + x) * 4;
          const diff = Math.max(
            Math.abs(baselinePixels[index] - premiumPixels[index]),
            Math.abs(baselinePixels[index + 1] - premiumPixels[index + 1]),
            Math.abs(baselinePixels[index + 2] - premiumPixels[index + 2]),
          );
          if (diff >= 10) changed++;
          samples++;
        }
      return changed / samples;
    },
    [baselineImage.toString('base64'), premiumImage.toString('base64')],
  );
  expect(
    changedFraction,
    'new premium shapes must be visible in the actual WebGL canvas',
  ).toBeGreaterThan(mobile ? 0.01 : 0.002);
  expect(errors).toEqual([]);
  console.info(
    'QA114_GPU=' +
      JSON.stringify({
        platform: info.project.name,
        baseline: baseline.stats,
        premium: premium.stats,
        deltaCalls,
        deltaTriangles,
        changedFraction,
        districts: structure.districts.map(({ variant, supportedSideRibbons, metrics }) => ({
          variant,
          supportedSideRibbons,
          metrics,
        })),
      }),
  );
  await info.attach('qa114-graphics-performance', {
    body: JSON.stringify({
      baseline: baseline.stats,
      premium: premium.stats,
      deltaCalls,
      deltaTriangles,
      changedFraction,
      structure,
    }),
    contentType: 'application/json',
  });
});
