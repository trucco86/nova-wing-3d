import { test, expect } from '@playwright/test';

test('web route, orbital ascent and final black hole render without shader errors', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const [sector, time] of [
    [0, 12],
    [2, 30],
    [9, 10],
  ]) {
    await page.goto('/__dynamic.html?sector=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate((time) => window.fixture.advance(time), time);
    await expect(page.locator('#routeLabel')).toContainText(sector === 2 ? 'ASCENSÃO' : 'CURVA');
    await page.screenshot({ path: info.outputPath('route-' + sector + '.png') });
  }
  expect(errors).toEqual([]);
});
test('2D perspective supports controls, pause and return to the same mission', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=2&arcade=1');
  await page.evaluate(() => window.fixture.advance(8.1));
  await expect(page.locator('#arcadePanel')).toBeVisible();
  if (info.project.name === 'mobile') {
    await page.locator('#fireTouch').dispatchEvent('pointerdown', { pointerId: 7 });
    await page
      .locator('#stick')
      .dispatchEvent('pointerdown', { pointerId: 8, clientX: 80, clientY: 260 });
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.down('ArrowRight');
  }
  await page.evaluate(() => window.fixture.advance(1));
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.arcade.shots.length).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('arcade.png') });
  await page.locator('#pause').click();
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await page.evaluate(() => window.fixture.advance(2));
  expect(await page.evaluate(() => window.fixture.game.snapshot().arcade)).toEqual(before.arcade);
  await page.locator('#pause').click();
  await page.evaluate(() => window.fixture.advance(18));
  await expect(page.locator('#arcadePanel')).toBeHidden();
  expect(await page.evaluate(() => window.fixture.game.snapshot().state)).toBe('playing');
  await page.screenshot({ path: info.outputPath('arcade-return.png') });
  expect(errors).toEqual([]);
});
test('hangar equips purchased paint and preserves it on reload', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.goto('/__dynamic.html?sector=0');
  await page.evaluate(() => window.fixture.hangar());
  await expect(page.locator('#shop')).toBeVisible();
  await page.locator('#customization summary').click();
  await page.locator('#skin-ember').click();
  await expect(page.locator('#skin-ember')).toContainText('EQUIPADA');
  await page.screenshot({ path: info.outputPath('paint-shop.png') });
  await page.locator('#nextSector').click();
  await page.evaluate(() => window.fixture.advance(0.1));
  await page.screenshot({ path: info.outputPath('paint-equipped.png') });
  await page.goto('/');
  await page.locator('#continue').click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('nova-wing-3d-v1')).cosmetics.skin),
  ).toBe('ember');
});
