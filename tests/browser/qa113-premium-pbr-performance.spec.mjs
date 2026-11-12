import { test, expect } from '@playwright/test';

// A real pixel-difference gate prevents invisible mesh additions from being
// accepted solely because a triangle counter increased.
async function scenePixelDelta(page, basePng, premiumPng) {
  return page.evaluate(
    async ([base64Before, base64After]) => {
      const load = (data) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = 'data:image/png;base64,' + data;
        });
      const [before, after] = await Promise.all([load(base64Before), load(base64After)]);
      const canvas = document.createElement('canvas');
      canvas.width = before.width;
      canvas.height = before.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('No QA canvas pixel reader');
      context.drawImage(before, 0, 0);
      const a = context.getImageData(0, 0, canvas.width, canvas.height).data;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(after, 0, 0);
      const b = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let visible = 0,
        sampled = 0;
      for (let y = Math.floor(canvas.height * 0.1); y < canvas.height * 0.86; y += 3)
        for (let x = 0; x < canvas.width; x += 3) {
          const i = (y * canvas.width + x) * 4;
          sampled++;
          if (
            Math.max(
              Math.abs(a[i] - b[i]),
              Math.abs(a[i + 1] - b[i + 1]),
              Math.abs(a[i + 2] - b[i + 2]),
            ) >= 10
          )
            visible++;
        }
      return visible / sampled;
    },
    [basePng.toString('base64'), premiumPng.toString('base64')],
  );
}

test('QA113: detailed PBR city and a single shared reflection probe stay within WebGL budget', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const problems = [];
  page.on('pageerror', (err) => problems.push(err.message));
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      /WebGLProgram|Shader Error|VALIDATE_STATUS false|shader compilation|WebGL: INVALID/i.test(
        msg.text(),
      )
    )
      problems.push(msg.text());
  });
  const mobile = info.project.name === 'mobile';
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 768 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const details = await page.evaluate(() => window.fixture.graphics40Details());
  expect(details).toHaveLength(2);
  expect(details.map((x) => x.variant).sort()).toEqual(['civic', 'industrial']);
  for (const tile of details) {
    expect(
      tile.reflectionFaces,
      'one locally generated cubemap with six low-resolution faces',
    ).toBe(6);
    expect(tile.reflectionsShared, 'reuse one reflection map for PBR glass and masonry').toBe(true);
    expect(tile.batches, 'four merged materials, no mesh per window').toBe(4);
    expect(tile.metrics.bytes, 'bounded buffer memory').toBeLessThan(3 * 1024 * 1024);
    expect(tile.buildings).toBeGreaterThanOrEqual(4);
  }
  const skyline = await page.evaluate(() => window.fixture.graphics40Horizon());
  expect(skyline).toBeTruthy();
  expect(skyline.visualOnly).toBe(true);
  expect(
    skyline.metrics.drawUnits,
    'non-physical portrait focal landmark is merged by material',
  ).toBe(3);
  expect(skyline.metrics.bytes).toBeLessThan(256 * 1024);
  await page.evaluate(() => window.fixture.advance(6));
  const original = await page.evaluate(() => window.fixture.graphics40Visible(false));
  const previousCanvas = await page.locator('#game').screenshot({
    path: info.outputPath('qa113-before-architecture.png'),
  });
  const premium = await page.evaluate(() => window.fixture.graphics40Visible(true));
  const updatedCanvas = await page.locator('#game').screenshot({
    path: info.outputPath('qa113-premium-reflective-architecture.png'),
  });
  const changedFraction = await scenePixelDelta(page, previousCanvas, updatedCanvas);
  expect(
    changedFraction,
    "premium geometry must visibly change the pilot's city view",
  ).toBeGreaterThan(0.002);
  expect(premium.stats.calls).toBeGreaterThanOrEqual(original.stats.calls);
  expect(premium.stats.calls - original.stats.calls).toBeLessThanOrEqual(10);
  expect(premium.stats.triangles).toBeGreaterThan(original.stats.triangles);
  expect(problems).toEqual([]);
  // Log compact evidence; screenshot attachments remain the visual record.
  console.info(
    'QA113_RENDER_COST=' +
      JSON.stringify({
        platform: info.project.name,
        original: original.stats,
        premium: premium.stats,
        changedFraction,
        details,
      }),
  );
  await info.attach('qa113-gpu-and-material-profile', {
    body: JSON.stringify({
      platform: info.project.name,
      original: original.stats,
      premium: premium.stats,
      changedFraction,
      details,
    }),
    contentType: 'application/json',
  });
});
