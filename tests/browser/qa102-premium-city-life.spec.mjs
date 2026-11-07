import { test, expect } from '@playwright/test';

test('premium city roofs and service movement enrich both tile depths without covering gameplay', async ({
  page,
}, info) => {
  test.setTimeout(140000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.city35Details).toHaveLength(2);
  const before = state.city35Details;
  expect(before.every((tile) => tile.pads >= 8 && tile.lifts > 0 && tile.vents === 0)).toBe(true);
  expect(before.every((tile) => tile.quality === 'medium')).toBe(true);
  expect(state.cityImpactCount).toBe(0);
  await page.screenshot({ path: info.outputPath('city35-medium-detailed-roofs-' + info.project.name + '.png') });

  state = await page.evaluate(() => {
    window.fixture.advance(9.0, { renderAfter: false });
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(state.city35Details[0].heights).not.toEqual(before[0].heights);
  expect(state.city35Details[0].heights).not.toEqual(state.city35Details[1].heights);
  expect(state.cityImpactCount).toBe(0);
  await page.screenshot({ path: info.outputPath('city35-service-lifts-parallax-' + info.project.name + '.png') });

  await page.evaluate(() => {
    const settings = document.getElementById('settingGraphics');
    settings.value = 'high';
    settings.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'high');
  state = await page.evaluate(() => {
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(state.city35Details.every((tile) => tile.quality === 'high')).toBe(true);
  expect(state.city35Details.every((tile) => tile.vents > 0 && tile.lifts >= 8)).toBe(true);
  await page.screenshot({ path: info.outputPath('city35-high-industrial-layer-' + info.project.name + '.png') });
  expect(errors).toEqual([]);
});

test('sector change isolates visual-only metropolis without changing ship collision or controls', async ({
  page,
}) => {
  await page.goto('/__dynamic.html?sector=0&citySetpieces=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const init = await page.evaluate(() => window.fixture.game.snapshot());
  const input = page.locator('#stick');
  await expect(input).toBeVisible();
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(3.1, { renderAfter: false }));
  await page.keyboard.up('KeyW');
  const state = await page.evaluate(() => {
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(state.player.y).toBeGreaterThan(init.player.y);
  expect(state.flightBounds.maxY).toBe(184);
  expect(state.cityImpactCount).toBe(0);
  expect(state.city35Details).toHaveLength(2);
});
