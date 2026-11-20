import { test, expect } from '@playwright/test';

// Captures a REAL rendered boss in frontal, port-flank and stern positions.
// Screenshot artifacts are human visual evidence, not proof of frame rate.
test('QA166: PERFURADOR fits portrait camera and retains real orbit target views', async ({
  page,
}, info) => {
  test.setTimeout(130000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/__dynamic.html?sector=2&qaBoss=2');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();
  const first = await page.evaluate(() => {
    window.fixture.advance(8.3);
    const s = window.fixture.game.snapshot();
    return {
      sector: s.sector,
      boss: s.boss,
      fov: s.camera.fov,
      orbit: s.strategy.orbitAngle,
      generators: s.bossTargets,
      phase: s.journey.phase,
    };
  });
  expect(first.sector).toBe(3);
  expect(first.boss).toBe(true);
  expect(first.generators).toHaveLength(2);
  if (info.project.name === 'mobile') expect(first.fov).toBeGreaterThan(85);
  else expect(first.fov).toBeLessThan(82);
  expect(first.orbit).toBe(0);
  await page.screenshot({
    path: info.outputPath('qa166-perfurador-frontal-' + info.project.name + '.png'),
  });

  const left = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    game.collect('shield');
    game.orbit(-1);
    advance(2.55, { renderAfter: false });
    game.orbit(0);
    advance(0);
    const s = game.snapshot();
    return {
      sector: s.sector,
      boss: s.boss,
      orbit: s.strategy.orbitAngle,
      generators: s.bossTargets,
      fov: s.camera.fov,
    };
  });
  expect(left.boss).toBe(true);
  expect(left.orbit).toBeLessThan(-1.7);
  expect(left.generators).toHaveLength(2);
  expect(left.generators[0].hp).toBeGreaterThan(0);
  await page.screenshot({
    path: info.outputPath('qa166-perfurador-flanco-' + info.project.name + '.png'),
  });

  const rear = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    game.collect('shield');
    game.orbit(1);
    advance(6.65, { renderAfter: false });
    game.orbit(0);
    advance(0);
    const s = game.snapshot();
    return {
      sector: s.sector,
      boss: s.boss,
      orbit: s.strategy.orbitAngle,
      generators: s.bossTargets,
      fov: s.camera.fov,
    };
  });
  expect(rear.boss).toBe(true);
  expect(rear.orbit).toBeGreaterThan(2.3);
  expect(rear.generators[1].hp).toBeGreaterThan(0);
  if (info.project.name === 'mobile') expect(rear.fov).toBeGreaterThan(85);
  await page.screenshot({
    path: info.outputPath('qa166-perfurador-traseira-' + info.project.name + '.png'),
  });

  const hud = await page.locator('#bossHUD').boundingBox();
  expect(hud).not.toBeNull();
  const { width, height } = page.viewportSize();
  expect(hud.x).toBeGreaterThanOrEqual(0);
  expect(hud.y).toBeGreaterThanOrEqual(0);
  expect(hud.x + hud.width).toBeLessThanOrEqual(width + 1);
  expect(hud.y + hud.height).toBeLessThanOrEqual(height + 1);
  expect(errors).toEqual([]);
});
