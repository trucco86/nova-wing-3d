import { test, expect } from '@playwright/test';

async function setup(page) {
  await page.goto('/__dynamic.html?sector=0&citySetpieces=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => {
    const graphics = document.getElementById('settingGraphics');
    graphics.value = 'high';
    graphics.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'high');
}

test('underpass becomes translucent only while camera sightline is blocked; physics stays solid', async ({
  page,
}, info) => {
  test.setTimeout(140000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await setup(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(2.35, { renderAfter: false }));
  await page.keyboard.up('KeyW');
  const result = await page.evaluate(() => {
    let mostObscured = null;
    for (let i = 0; i < 65; i++) {
      window.fixture.advance(0.1, { renderAfter: false });
      const state = window.fixture.game.snapshot();
      const fade = state.cityCameraOcclusion.find(
        (item) => item.tile === 'launch-city' && item.kind === 'lower',
      );
      if (fade && (!mostObscured || fade.fade > mostObscured.fade))
        mostObscured = { ...fade, impacts: state.cityImpactCount, player: state.player };
      if (fade?.fade > 0.7) break;
    }
    window.fixture.advance(0);
    return { mostObscured, state: window.fixture.game.snapshot() };
  });
  expect(result.mostObscured).toBeTruthy();
  expect(
    result.mostObscured.fade,
    'camera must detect the actual overhead structure',
  ).toBeGreaterThan(0.1);
  expect(result.mostObscured.opacity).toBeLessThan(0.91);
  expect(
    result.state.cityPhysicalSolids.some((solid) => solid.kind === 'overpass-deck' && solid.active),
    'bridge collider still exists while its surface fades',
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('occlusion-aware-underpass-' + info.project.name + '.png'),
  });
  await page.evaluate(() => {
    window.fixture.advance(5.5, { renderAfter: false });
    window.fixture.advance(0);
  });
  const clear = await page.evaluate(() => window.fixture.game.snapshot());
  const material = clear.cityCameraOcclusion.find(
    (item) => item.tile === 'launch-city' && item.kind === 'lower',
  );
  expect(material.opacity).toBeGreaterThan(0.95);
  await page.screenshot({
    path: info.outputPath('clear-city-after-underpass-' + info.project.name + '.png'),
  });
  expect(errors).toEqual([]);
});

test('flying above a bridge never fades it or creates an invisible blocking volume', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await setup(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(7.5, { renderAfter: false }));
  await page.keyboard.up('KeyW');
  const state = await page.evaluate(() => {
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(state.player.y).toBeGreaterThan(140);
  expect(state.cityImpactCount).toBe(0);
  expect(
    state.cityCameraOcclusion.every((item) => item.opacity > 0.96),
    'open air must stay fully opaque and should not be faded by distant bridges',
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('clean-upper-city-flyover-' + info.project.name + '.png'),
  });
});
