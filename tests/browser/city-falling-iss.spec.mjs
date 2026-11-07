import { test, expect } from '@playwright/test';

test('stage-one falling billboard forces an actual dodge; empty flank remains free', async ({
  page,
}, info) => {
  test.setTimeout(130000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const hit = await page.evaluate(() => {
    window.fixture.advance(9.6);
    return window.fixture.game.snapshot();
  });
  expect(hit.sector).toBe(1);
  const sign = hit.cityFallingSolids.find((piece) => piece.kind === 'falling-billboard');
  expect(sign).toBeTruthy();
  expect(sign.active).toBe(true);
  expect(
    hit.cityImpactCount,
    'flying straight into an actual falling sign must cause contact',
  ).toBeGreaterThan(0);
  expect(Math.abs(hit.player.x - sign.center[0])).toBeGreaterThanOrEqual(sign.half[0] + 5.3);
  await page.screenshot({
    path: info.outputPath('falling-sign-solid-' + info.project.name + '.png'),
  });

  // The pilot may take the wide right flank, past the former invisible ±36 wall.
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.fixture.advance(2.4));
  await page.keyboard.up('KeyD');
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  expect(before.player.x).toBeGreaterThan(36);
  await page.evaluate(() => window.fixture.advance(7.2));
  const dodged = await page.evaluate(() => window.fixture.game.snapshot());
  expect(dodged.cityImpactCount).toBe(0);
  expect(dodged.lives).toBe(3);
  await page.screenshot({
    path: info.outputPath('falling-sign-free-flank-' + info.project.name + '.png'),
  });
  expect(errors).toEqual([]);
});

test('Earth ascent shows varied drifting debris and a brief recognizable ISS orbit pass', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(22.4));
  await page.keyboard.down('ShiftLeft');
  await page.evaluate(() => window.fixture.advance(3.8));
  await page.keyboard.up('ShiftLeft');
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.orbitalLaunch.phase).toBe('atmosphere');

  state = await page.evaluate(() => {
    window.fixture.advance(21);
    return window.fixture.game.snapshot();
  });
  expect(state.orbitalAscentCinematic).toBeTruthy();
  expect(state.orbitalAscentCinematic.iss).toBe(false);
  const debris = state.orbitalAscentCinematic.fragments;
  expect(debris.length).toBeGreaterThan(0);
  expect(new Set(debris.map((piece) => Math.round(piece.x))).size).toBeGreaterThan(1);
  await page.screenshot({
    path: info.outputPath('ascent-diverse-debris-' + info.project.name + '.png'),
  });

  state = await page.evaluate(() => {
    window.fixture.advance(10);
    return window.fixture.game.snapshot();
  });
  expect(state.orbitalAscentCinematic.iss).toBe(true);
  expect(state.orbitalAscentCinematic.issSeconds).toBeLessThan(6.5);
  await page.screenshot({ path: info.outputPath('iss-over-earth-' + info.project.name + '.png') });

  state = await page.evaluate(() => {
    window.fixture.advance(8);
    return window.fixture.game.snapshot();
  });
  expect(state.orbitalAscentCinematic.iss).toBe(false);
  expect(state.orbitalLaunch.complete).toBe(true);
  expect(errors).toEqual([]);
});
