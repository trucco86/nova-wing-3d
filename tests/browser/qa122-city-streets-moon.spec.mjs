import { test, expect } from '@playwright/test';

test('QA122: Stage 1 renders populated streets and a distinctive cracked moon in the real desktop/mobile WebGL frame', async ({
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
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const opening = await page.evaluate(() => window.fixture.city122State());
  expect(opening.moon.visible).toBe(true);
  expect(opening.moon.fractured).toBe(true);
  expect(opening.moon.realOrbitalMoonVisible).toBe(false);
  expect(Math.abs(opening.moon.x)).toBeLessThan(220);
  expect(opening.moon.y).toBeGreaterThan(250);
  expect(opening.citySky).toBe(1);
  expect(opening.tiles).toHaveLength(2);
  for (const tile of opening.tiles) {
    expect(tile.visible).toBe(true);
    expect(tile.lots).toBeGreaterThan(20);
    expect(tile.occupiedSidewalks).toBeGreaterThan(20);
    expect(tile.storefronts).toBeGreaterThan(190);
    expect(tile.mediumBatches).toBe(4);
    expect(tile.highBatches).toBe(2);
  }
  await page.screenshot({
    path: info.outputPath('qa122-streets-and-moon-' + info.project.name + '.png'),
  });
  await page.evaluate(() => window.fixture.advance(6));
  const after = await page.evaluate(() => window.fixture.city122State());
  for (const [i, tile] of after.tiles.entries()) {
    expect(tile.occupiedSidewalks).toBe(opening.tiles[i].occupiedSidewalks);
    expect(tile.lots).toBe(opening.tiles[i].lots);
    expect(tile.visible).toBe(true);
  }
  const render = await page.evaluate(() => window.fixture.renderStats());
  expect(render.calls).toBeGreaterThan(0);
  expect(render.calls).toBeLessThan(1100);
  expect(render.triangles).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
