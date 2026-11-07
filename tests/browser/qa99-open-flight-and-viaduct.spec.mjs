import { test, expect } from '@playwright/test';

async function ready(page, suffix = '') {
  await page.goto('/__dynamic.html?sector=0&citySetpieces=' + (suffix || '0'));
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // A real option change: visible High-quality bridges require physical decks.
  await page.evaluate(() => {
    const selector = document.getElementById('settingGraphics');
    selector.value = 'high';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('body')).toHaveAttribute('data-graphics-quality', 'high');
}

test('flight stick/keyboard can reach the skyline, camera follows, flight remains free', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(7.8));
  await page.keyboard.up('KeyW');
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.flightBounds.maxY).toBe(116);
  expect(state.player.y).toBeGreaterThan(80);
  expect(state.camera.y).toBeGreaterThan(55);
  await page.screenshot({ path: info.outputPath('skyline-open-vertical-' + info.project.name + '.png') });
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.fixture.advance(3));
  await page.keyboard.up('KeyD');
  state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.player.x).toBeGreaterThan(36);
  expect(state.player.x).toBeLessThanOrEqual(72);
  expect(state.player.y).toBeGreaterThan(80);
  await page.screenshot({ path: info.outputPath('skyline-high-right-flank-' + info.project.name + '.png') });
  expect(errors).toEqual([]);
});

test('a visible elevated overpass deck stops a climbing ship instead of allowing phasing', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.fixture.advance(2.35));
  await page.keyboard.up('KeyW');
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  expect(before.player.y).toBeGreaterThan(45);
  expect(before.player.y).toBeLessThan(64);
  const collisionsBefore = before.cityImpactCount;
  await page.evaluate(() => window.fixture.advance(1.55));
  const near = await page.evaluate(() => window.fixture.game.snapshot());
  expect(near.cityImpactCount).toBeGreaterThan(collisionsBefore);
  expect(
    near.cityPhysicalSolids.some((solid) => solid.kind === 'overpass-deck' && solid.active),
    'the real overpass is visible and physically active',
  ).toBe(true);
  expect(near.player.y).toBeLessThan(59, 'ship cannot cross the overhead deck');
  await page.screenshot({ path: info.outputPath('overpass-physical-contact-' + info.project.name + '.png') });
  expect(errors).toEqual([]);
});

test('mobile joystick upward holds direction until reaching higher air corridor', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Requires actual touch/stick layout');
  test.setTimeout(120000);
  await ready(page);
  const stick = page.locator('#stick');
  const bounds = await stick.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height * 0.18);
  await expect
    .poll(async () => page.evaluate(() => window.fixture.game.snapshot().controls.stickY))
    .toBeGreaterThan(0.3);
  await page.evaluate(() => window.fixture.advance(7.8));
  await page.mouse.up();
  const after = await page.evaluate(() => window.fixture.game.snapshot());
  expect(after.player.y).toBeGreaterThan(80);
  expect(after.camera.y).toBeGreaterThan(55);
  await page.screenshot({ path: info.outputPath('mobile-directional-up-entire-skyline.png') });
});
