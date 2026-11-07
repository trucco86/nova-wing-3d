import { test, expect } from '@playwright/test';

test('stage 1 city escalates from normal traffic to collapse and hanging maglev, then mandatory boost', async ({
  page,
}, info) => {
  test.setTimeout(130000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // The billboard/hovercar are no longer ghost meshes. Dodge them while
  // reviewing visual beats and preserve the no-death orbital pacing contract.
  await page.keyboard.down('ArrowRight');
  await page.evaluate(() => window.fixture.advance(2.4));
  await page.keyboard.up('ArrowRight');
  const checkpoints = [
    [3.1, 'city-calm', 0],
    [6.5, 'city-under-fire', 1],
    [7.35, 'city-under-fire', 2],
    [9.6, 'city-under-fire', 3],
    [10.25, 'city-under-fire', 4],
    [12.4, 'facade-collapse', 6],
    [13.2, 'facade-collapse', 7],
    [14.6, 'train-failing', 9],
  ];
  for (const [seconds, phase, minimumBeats] of checkpoints) {
    const snap = await page.evaluate((at) => {
      const { game, advance } = window.fixture;
      advance(Math.max(0, at - game.snapshot().seconds));
      return game.snapshot();
    }, seconds);
    expect(snap.sector).toBe(1);
    expect(snap.cityDestruction?.phase).toBe(phase);
    expect(snap.cityDestruction?.triggered.length).toBeGreaterThanOrEqual(minimumBeats);
    expect(snap.orbitalLaunch.phase).toBe('city');
    const clearance = snap.cityDestruction?.ground;
    expect(clearance).toBeTruthy();
    expect(clearance.billboardBottomY).toBeGreaterThanOrEqual(clearance.floorY - 0.001);
    expect(clearance.vehicleBottomY).toBeGreaterThanOrEqual(clearance.floorY - 0.001);
    for (const bottom of clearance.facadeFragmentBottoms) {
      expect(bottom).toBeGreaterThanOrEqual(clearance.floorY - 0.001);
    }
    const impact =
      seconds === 7.35
        ? 'billboard'
        : seconds === 10.25
          ? 'vehicle'
          : seconds === 13.2
            ? 'facade'
            : null;
    if (impact) {
      expect(snap.cityDestruction.impacts[impact].visible).toBe(true);
      expect(snap.cityDestruction.impacts[impact].groundY).toBeGreaterThan(clearance.floorY);
      expect(snap.cityDestruction.impacts[impact].drawCount).toBe(5);
    }
    await page.screenshot({
      path: info.outputPath('stage1-destruction-' + seconds + '-' + info.project.name + '.png'),
    });
  }

  await page.keyboard.down('ArrowRight');
  const hanging = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    advance(2.25);
    return game.snapshot();
  });
  await page.keyboard.up('ArrowRight');
  expect(hanging.cityDestruction.phase).toBe('train-obstacle');
  expect(hanging.cityDestruction.wrecks).toHaveLength(1);
  expect(hanging.cityDestruction.wrecks[0].collisionActive).toBe(true);
  expect(hanging.cityDestruction.wrecks[0].solidCount).toBe(2);
  expect(hanging.cityDestruction.wrecks[0].safeLane).toBe('right');
  expect(hanging.cityDestruction.wrecks[0].laneGuidesVisible).toBe(true);
  expect(hanging.cityDestruction.wrecks[0].powerlineSparksVisible).toBe(true);
  expect(hanging.player.x).toBeGreaterThan(17);
  expect(hanging.lives).toBe(3);
  await page.screenshot({
    path: info.outputPath('stage1-hanging-train-obstacle-' + info.project.name + '.png'),
  });
  const after = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    advance(Math.max(0, 22.4 - game.snapshot().seconds));
    return game.snapshot();
  });
  expect(after.cityDestruction.phase).toBe('orbital-handoff');
  expect(after.cityDestruction.triggered).toHaveLength(10);
  expect(
    after.cityDestruction.ground.facadeFragmentBottoms.every(
      (bottom) => Math.abs(bottom - after.cityDestruction.ground.floorY) < 0.05,
    ),
  ).toBe(true);
  expect(after.lives).toBe(3);
  const boost = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    advance(Math.max(0, 23.25 - game.snapshot().seconds));
    return game.snapshot();
  });
  expect(boost.orbitalLaunch.phase).toBe('boost');
  expect(boost.orbitalLaunch.amount).toBe(0);
  await page.screenshot({ path: info.outputPath('stage1-super-boost-preserved.png') });
  expect(errors).toEqual([]);
});

test('only the first sector receives city destruction; Mars route has no train', async ({
  page,
}) => {
  test.setTimeout(100000);
  await page.goto('/__dynamic.html?sector=1&citySetpieces=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(24));
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.cityDestruction).toBeNull();
  expect(state.obstacleKinds).not.toContain('city-hanging-train');
});
