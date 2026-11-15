import { test, expect } from '@playwright/test';

test('fighter roles charge and attack while desktop and touch controls remain usable', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(2.75));
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  // QA117: two genuine hostiles form the Normal introduction, rather than
  // background traffic. Both must display their firing telegraph.
  expect(before.targets.filter((e) => e.charging).map((e) => e.role)).toEqual([
    'pursuer',
    'interceptor',
  ]);
  expect(before.targets.filter((e) => e.kind === 'fighter')).toHaveLength(2);
  await page.screenshot({ path: info.outputPath('fighter-charge.png') });
  await page.locator('#pause').click();
  await page.evaluate(() => window.fixture.advance(2));
  expect((await page.evaluate(() => window.fixture.game.snapshot())).targets).toEqual(
    before.targets,
  );
  await page.locator('#pauseResume').click();
  await page.evaluate(() => window.fixture.advance(0.6));
  const firstVolley = await page.evaluate(() => window.fixture.game.snapshot());
  expect(firstVolley.targets.filter((e) => e.kind === 'fighter')).toHaveLength(2);
  expect(firstVolley.entities.hostile).toBeGreaterThan(0);
  expect(firstVolley.entities.hostile).toBeLessThanOrEqual(6);
  const frames = await page.evaluate(async () => {
    const values = [];
    let previous = performance.now();
    for (let i = 0; i < 30; i++) {
      const now = await new Promise((resolve) => requestAnimationFrame(resolve));
      window.fixture.game.step(0); // Render the real scene without advancing combat.
      values.push(now - previous);
      previous = now;
    }
    return values;
  });
  const sorted = frames.slice(1).sort((a, b) => a - b);
  const metrics = {
    viewport: page.viewportSize(),
    renderer: 'Chromium SwiftShader CI',
    samples: sorted.length,
    medianFrameMs: sorted[Math.floor(sorted.length / 2)],
    p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
  };
  await info.attach('fighter-frame-times', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  expect(sorted.every((n) => Number.isFinite(n) && n >= 0)).toBe(true);
  await page.evaluate(() => window.fixture.advance(5.2));
  const nextWave = await page.evaluate(() => window.fixture.game.snapshot());
  expect(nextWave.targets.some((e) => e.role === 'interceptor')).toBe(true);
  // The bomber is third in rotation, arriving a further fighter interval later.
  await page.evaluate(() => {
    for (let i = 0; i < 12; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5);
    }
  });
  const later = await page.evaluate(() => window.fixture.game.snapshot());
  expect(later.targets.some((e) => e.role === 'bomber')).toBe(true);
  await page.screenshot({ path: info.outputPath('fighter-bomber.png') });
  expect(errors).toEqual([]);
});
