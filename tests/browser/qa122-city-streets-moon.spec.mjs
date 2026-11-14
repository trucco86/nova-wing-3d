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
  expect(opening.moon.z).toBeLessThan(-1900);
  expect(opening.moon.z).toBeGreaterThan(-2400);
  expect(opening.moon.backgroundDepth).toBe(1);
  expect(opening.moon.orbitalFractured).toBe(true);
  expect(opening.citySky).toBe(1);
  expect(opening.tiles).toHaveLength(2);
  for (const tile of opening.tiles) {
    expect(tile.visible).toBe(true);
    expect(tile.lots).toBeGreaterThan(20);
    expect(tile.outerLots).toBeGreaterThan(25);
    expect(tile.groundCells).toBeGreaterThan(50);
    expect(tile.groundKinds).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]));
    expect(tile.vaporPlumes).toBeGreaterThan(0);
    expect(tile.groundSignals).toBeGreaterThan(0);
    expect(tile.outerKinds).toEqual(
      expect.arrayContaining(['parking', 'garden', 'delivery', 'plaza', 'service', 'access']),
    );
    expect(tile.occupiedSidewalks).toBeGreaterThan(20);
    expect(tile.occupiedSidewalks).toBeGreaterThan(tile.lots + tile.outerLots);
    expect(tile.storefronts).toBeGreaterThan(190);
    expect(tile.mediumBatches).toBe(5);
    expect(tile.trees).toBeGreaterThan(0);
    expect(tile.pedestrians).toBeGreaterThan(0);
    expect(tile.adScreens).toBeGreaterThanOrEqual(7);
    expect(tile.highBatches).toBe(3);
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
