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
  await expect(page.locator('#arcadePanel')).toHaveCSS('opacity', '1');
  await expect(page.locator('#comms')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('#boostTouch')).toBeHidden();
  let touch;
  if (info.project.name === 'mobile') {
    touch = await page.context().newCDPSession(page);
    const fire = await page.locator('#fireTouch').boundingBox();
    const stick = await page.locator('#stick').boundingBox();
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2, id: 7 },
        { x: stick.x + stick.width * 0.75, y: stick.y + stick.height * 0.5, id: 8 },
      ],
    });
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.down('ArrowRight');
  }
  await page.evaluate(() => window.fixture.advance(1));
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.arcade.shots.length).toBeGreaterThan(0);
  expect(snapshot.arcade.player.x).toBeGreaterThan(170);
  await page.screenshot({ path: info.outputPath('arcade.png') });
  if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
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

test('wide flight and three camera perspectives render and switch with keyboard or touch', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.keyboard.down('ArrowRight');
  await page.evaluate(() => window.fixture.advance(2));
  await page.keyboard.up('ArrowRight');
  expect((await page.evaluate(() => window.fixture.game.snapshot())).player.x).toBeGreaterThan(25);
  await page.screenshot({ path: info.outputPath('wide-chase.png') });
  for (const mode of ['cockpit', 'combat', 'chase']) {
    if (info.project.name === 'mobile') await page.locator('#cameraView').tap();
    else await page.keyboard.press('KeyC');
    await page.evaluate(() => window.fixture.advance(2));
    expect(await page.evaluate(() => window.fixture.game.snapshot().cameraMode)).toBe(mode);
    if (mode === 'cockpit') {
      await expect(page.locator('#cockpitPanel')).toBeVisible();
      await page.keyboard.down('Space');
      await page.evaluate(() => window.fixture.advance(0.03));
      expect(
        await page.evaluate(() => window.fixture.game.snapshot().entities.shots),
      ).toBeGreaterThan(0);
    }
    await page.screenshot({ path: info.outputPath('camera-' + mode + '.png') });
    await page.keyboard.up('Space');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.down('ArrowLeft');
  await page.evaluate(() => window.fixture.advance(4));
  await page.keyboard.up('ArrowLeft');
  await page.screenshot({ path: info.outputPath('wide-portrait.png') });
  expect(errors).toEqual([]);
});
