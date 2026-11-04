import { test, expect } from '@playwright/test';

test('Europa stage 6 boss arena remains open and its Colossus never clips the ice floor', async ({
  page,
}, info) => {
  test.setTimeout(100000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=5&qaBoss=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();

  for (const age of [0.05, 3.4, 8.5, 11.2, 14.6, 22.6]) {
    const snapshot = await page.evaluate((seconds) => {
      const { game, advance } = window.fixture;
      const now = game.snapshot().bossAge;
      if (seconds > now) advance(seconds - now);
      const state = game.snapshot();
      return {
        stage: state.sector,
        boss: state.boss,
        age: state.bossAge,
        arena: state.europaArena,
        obstacles: state.entities.obstacles,
        orbit: state.strategy.orbitAngle,
      };
    }, age);
    expect(snapshot.stage).toBe(6);
    expect(snapshot.boss).toBe(true);
    expect(snapshot.arena?.active).toBe(true);
    expect(snapshot.arena?.foregroundHidden).toBe(true);
    expect(snapshot.arena?.carrierHidden).toBe(true);
    expect(snapshot.arena?.backdropDepth).toBeLessThanOrEqual(-260);
    expect(snapshot.arena.bossCenterY).toBeGreaterThanOrEqual(
      snapshot.arena.minimumCenterY - 0.001,
    );
    expect(snapshot.obstacles).toBe(0);
  }

  const radar = page.locator('#battleRadar');
  await expect(radar).toBeVisible();
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => window.fixture.advance(0.1));
    const state = await page.evaluate(() => window.fixture.game.snapshot());
    expect(state.europaArena.foregroundHidden).toBe(true);
    expect(state.entities.obstacles).toBe(0);
    await page.screenshot({
      path: info.outputPath('europa-wide-clear-arena-' + size.width + '.png'),
    });
  }
  expect(errors).toEqual([]);
});

test('other bosses retain their environmental states without Europa arena toggles', async ({ page }) => {
  test.setTimeout(80000);
  for (const sector of [4, 7]) {
    await page.goto('/__dynamic.html?sector=' + sector + '&qaBoss=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const result = await page.evaluate(() => {
      const { game, advance } = window.fixture;
      advance(1);
      return game.snapshot();
    });
    expect(result.boss).toBe(true);
    expect(result.europaArena).toBeNull();
  }
});
