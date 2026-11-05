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
        depth: state.bossZ,
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
    expect(snapshot.arena.floorY).toBeLessThan(-25);
    if (snapshot.age > 3) {
      expect(snapshot.depth).toBeGreaterThanOrEqual(-175);
      expect(snapshot.depth).toBeLessThanOrEqual(-145);
    }
    if (snapshot.age > 3) {
      expect(snapshot.arena.bossCenterY).toBeLessThan(40);
      expect(snapshot.arena.minimumCenterY).toBeLessThan(15);
    }
    expect(snapshot.obstacles).toBe(0);
  }

  const radar = page.locator('#battleRadar');
  await expect(radar).toBeVisible();
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => window.fixture.advance(0.9));
    const state = await page.evaluate(() => window.fixture.game.snapshot());
    if (size.width < size.height) {
      expect(state.camera.fov).toBeGreaterThan(82);
      expect(state.camera.fov).toBeLessThan(93);
    } else expect(state.camera.fov).toBeLessThan(86);
    // The original scene used -205 depth and 98° in portrait; this should
    // improve apparent size without touching mesh scale or weak-point hitboxes.
    const oldPresence = 1 / ((state.camera.z + 205) * Math.tan((98 * Math.PI) / 360));
    const actualPresence =
      1 / ((state.camera.z - state.bossZ) * Math.tan((state.camera.fov * Math.PI) / 360));
    if (size.width < size.height) expect(actualPresence).toBeGreaterThan(oldPresence * 1.3);
    expect(state.europaArena.foregroundHidden).toBe(true);
    expect(state.europaArena.floorY).toBeLessThan(-25);
    expect(state.europaArena.bossCenterY).toBeLessThan(40);
    expect(state.bossZ).toBeGreaterThanOrEqual(-175);
    expect(state.bossZ).toBeLessThanOrEqual(-145);
    expect(state.entities.obstacles).toBe(0);
    await page.screenshot({
      path: info.outputPath('europa-wide-clear-arena-' + size.width + '.png'),
    });
  }
  expect(errors).toEqual([]);
});

test('other bosses retain their environmental states without Europa arena toggles', async ({
  page,
}) => {
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
