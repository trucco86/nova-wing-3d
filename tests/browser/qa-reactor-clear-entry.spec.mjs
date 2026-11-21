import { test, expect } from '@playwright/test';

test('QA171 stage 4 renders an open reactor entrance and preserves the 360-degree boss arena', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=3&qaBoss=3');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();
  const first = await page.evaluate(() => {
    window.fixture.advance(4.2);
    const s = window.fixture.game.snapshot();
    return {
      sector: s.sector,
      boss: s.boss,
      sabotage: s.sabotage,
      orbit: s.strategy.orbitAngle,
    };
  });
  expect(first.sector).toBe(4);
  expect(first.boss).toBe(true);
  expect(first.sabotage.hall.active).toBe(true);
  expect(first.sabotage.hall.centralReactor).toBe(true);
  expect(first.sabotage.hall.clearOrbitRadius).toBe(190);
  expect(first.orbit).toBe(0);
  await page.screenshot({
    path: info.outputPath('qa171-reactor-clear-entrance-' + info.project.name + '.png'),
  });

  const flanking = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    game.orbit(1);
    advance(2, { renderAfter: false });
    game.orbit(0);
    advance(0);
    const s = game.snapshot();
    return {
      sector: s.sector,
      boss: s.boss,
      orbit: s.strategy.orbitAngle,
      targets: s.bossTargets,
      hall: s.sabotage?.hall,
    };
  });
  expect(flanking.sector).toBe(4);
  expect(flanking.boss).toBe(true);
  expect(Math.abs(flanking.orbit)).toBeGreaterThan(1);
  expect(flanking.targets.length).toBe(8);
  expect(flanking.hall.active).toBe(true);
  await page.screenshot({
    path: info.outputPath('qa171-reactor-clear-flank-' + info.project.name + '.png'),
  });
  expect(errors).toEqual([]);
});
