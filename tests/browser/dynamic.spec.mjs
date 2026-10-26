import { test, expect } from '@playwright/test';
import {
  reachBrowserBoss,
  waitForBrowserArmoredFront,
  aimAtBrowserFirstGenerator,
  fireBrowserPrecision,
} from './orbital-journey.mjs';

test('Five Cats selection compares pilots, ships and illustrated loadout before flight', async ({
  page,
}, info) => {
  // Two screenshots took over 20s on the software-rendered CI runner.
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('#squadSelection')).toBeHidden();
  await page.screenshot({ path: info.outputPath('cover.png') });
  await page.locator('#prepareSquad').click();
  await expect(page.locator('#squadSelection')).toBeVisible();
  await page.locator('#pilot-calvin').click();
  await expect(page.locator('#profileName')).toHaveText('CALVINHO');
  await expect(page.locator('#profileSkill')).toHaveText('FLUXO ARCANO');
  await page.locator('#ship-aegis').click();
  await expect(page.locator('#selectedShipName')).toHaveText('AEGIS-R');
  await page.locator('#ship-color-gold').click();
  await expect(page.locator('#ship-color-gold')).toHaveClass(/selected/);
  await page.locator('#loadoutCatalog summary').click();
  await expect(page.locator('.loadout-catalog article')).toHaveCount(8);
  await page.screenshot({ path: info.outputPath('five-cats-selection.png'), fullPage: true });
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#pilotName')).toContainText('CALVINHO');
  await expect(page.locator('#rpgLevel')).toContainText('EV 1');
  expect(errors).toEqual([]);
});

test('web route, orbital ascent and final black hole render without shader errors', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const [sector, time, expected] of [
    [0, 28, 'SEGURE BOOST'],
    [1, 30, 'CURVA'],
    [2, 30, 'ASCENSÃO'],
    [9, 10, 'ROTA DE APROXIMAÇÃO'],
  ]) {
    await page.goto('/__dynamic.html?sector=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate((time) => window.fixture.advance(time), time);
    await expect(page.locator('#routeLabel')).toContainText(expected);
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
  await page.locator('#pauseResume').click();
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
      await page.evaluate(() => window.fixture.advance(1.1));
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

test('strategic progression, spells and orbital flanks render with keyboard and touch', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const xp of [0, 740, 160]) {
    await page.goto('/__dynamic.html?xp=' + xp + '&pods=2');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.advance(2));
    await page.screenshot({ path: info.outputPath('evolution-' + xp + '.png') });
  }
  await expect(page.locator('#quickRpg')).toBeVisible();
  await expect(page.locator('#specialCast')).toBeVisible();
  await expect(page.locator('#rpgLevel')).toContainText('EV 6');
  expect(
    await page
      .locator('#quickRpg button')
      .evaluateAll((buttons) =>
        buttons.every((button) => button.scrollWidth <= button.clientWidth),
      ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('rpg-quick-access.png') });
  if (info.project.name === 'mobile') await page.locator('#arsenalSwitch').tap();
  else await page.keyboard.press('KeyF');
  await page.evaluate(() => window.fixture.advance(0.1));
  await expect(page.locator('#arsenalSwitch')).toContainText('GEADA');
  await page.locator('#strategyDrawer summary').click();
  await page.screenshot({ path: info.outputPath('loadout-drawer.png') });
  await expect(page.locator('#strategyStatus')).toContainText('ATAQUE');
  await expect(page.locator('#rpgNext')).toContainText('ARCANO');
  await page.locator('#specialCast').click();
  await page.evaluate(() => window.fixture.advance(0.1));
  expect(
    await page.evaluate(() => window.fixture.game.snapshot().strategy.barrier),
  ).toBeGreaterThan(3);
  await page.screenshot({ path: info.outputPath('barrier.png') });
  await page.locator('#strategyDrawer summary').click();
  await page.locator('#pause').click();
  const paused = await page.evaluate(() => window.fixture.game.snapshot());
  await page.evaluate(() => window.fixture.advance(1));
  expect(await page.evaluate(() => window.fixture.game.snapshot().strategy)).toEqual(
    paused.strategy,
  );
  await page.locator('#pauseResume').click();
  await page.evaluate(() => {
    window.fixture.advance(8);
    window.fixture.game.cycleSpecial();
    window.fixture.game.castSpecial();
    window.fixture.advance(0.15);
  });
  expect(
    await page.evaluate(() => window.fixture.game.snapshot().shotDirections.length),
  ).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('nova-radial.png') });
  await reachBrowserBoss(page, { bossAge: 6 });
  await expect(page.locator('#orbitControls')).toBeVisible();
  await page.screenshot({ path: info.outputPath('arena-front.png') });
  if (info.project.name === 'mobile') {
    const box = await page.locator('#orbitLeft').boundingBox();
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 7 }],
    });
    await page.evaluate(() => window.fixture.advance(1.3));
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.down('KeyJ');
    await page.evaluate(() => window.fixture.advance(1.3));
    await page.keyboard.up('KeyJ');
  }
  const orbital = await page.evaluate(() => window.fixture.game.snapshot());
  expect(orbital.bossTargets[0].open).toBe(true);
  expect(orbital.bossTargets[1].open).toBe(false);
  expect(orbital.strategy.orbitAngle).toBeLessThan(-1);
  await page.screenshot({ path: info.outputPath('arena-flank.png') });
  if (info.project.name === 'mobile') {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.fixture.advance(0.1));
    const bounds = await page.locator('#strategyControls').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    const bossBounds = await page.locator('#bossHUD').boundingBox();
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(bossBounds.y);
    await expect(page.locator('.mission')).toBeHidden();
    await expect(page.locator('#pilotHudAvatar')).toBeVisible();
    await expect(page.locator('#pilotHudAvatar')).toHaveAttribute('data-pilot', 'bia');
    const statusBounds = await page.locator('.status').boundingBox();
    const scoreBounds = await page.locator('.score').boundingBox();
    expect(statusBounds.x + statusBounds.width).toBeLessThanOrEqual(scoreBounds.x);
    for (const id of ['podsTouch', 'rollTouch', 'bombTouch', 'boostTouch', 'fireTouch']) {
      const button = await page.locator(`#${id}`).boundingBox();
      expect(button.width).toBeGreaterThanOrEqual(60);
      expect(button.height).toBeGreaterThanOrEqual(60);
    }
    const orbitBounds = await page.locator('#orbitControls').boundingBox();
    const stickBounds = await page.locator('#stick').boundingBox();
    const actionBounds = await page.locator('#touch .actions').boundingBox();
    // The transparent touch wrapper spans the footer; the true hit targets are
    // the stick and the action grid. The orbit strip must not overlap either.
    expect(orbitBounds.y + orbitBounds.height).toBeLessThanOrEqual(stickBounds.y + 2);
    expect(orbitBounds.x + orbitBounds.width).toBeLessThanOrEqual(actionBounds.x);
    await page.screenshot({ path: info.outputPath('strategy-portrait.png') });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => window.fixture.advance(0.1));
    const compactTouch = await page.locator('#touch').boundingBox();
    const compactStick = await page.locator('#stick').boundingBox();
    const compactActions = await page.locator('.actions').boundingBox();
    expect(compactTouch.x).toBeGreaterThanOrEqual(0);
    expect(compactTouch.x + compactTouch.width).toBeLessThanOrEqual(320);
    expect(compactStick.x + compactStick.width).toBeLessThanOrEqual(compactActions.x);
    await expect(page.locator('.score')).toBeHidden();
    await expect(page.locator('#bossName')).toBeHidden();
    await expect(page.locator('#bossState')).toBeVisible();
    await page.screenshot({ path: info.outputPath('strategy-compact-320.png') });
  }
  expect(errors).toEqual([]);
});

test('three detailed tank robot and enemy fighter variants render', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (let variant = 0; variant < 3; variant++) {
    await page.goto('/__visual.html?mode=ground&variant=' + variant);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.screenshot({ path: info.outputPath('enemy-variant-' + variant + '.png') });
  }
  expect(errors).toEqual([]);
});

test('orbital radar, scanner and reserve attacks work without covering the combat center', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await reachBrowserBoss(page, { bossAge: 29 });
  await expect(page.locator('#tacticalPanel')).toBeVisible();
  await expect(page.locator('#tacticState')).toContainText('BATERIA');
  await page.locator('#strategyDrawer summary').click();
  await page.locator('#scanBoss').click();
  await page.evaluate(() => window.fixture.advance(0.1));
  await expect(page.locator('#radarWeak')).toBeVisible();
  await page.screenshot({ path: info.outputPath('tactical-scan.png') });
  await page.locator('#homingBarrage').click();
  await page.locator('#strategyDrawer summary').click();
  await page.evaluate(() => window.fixture.advance(0.1));
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.entities.shots).toBeGreaterThan(0);
  expect(state.tactics.energy).toBeLessThan(1);
  await page.screenshot({ path: info.outputPath('tactical-barrage.png') });
  await page.evaluate(() => window.fixture.advance(3));
  await page.screenshot({ path: info.outputPath('tactical-motion.png') });
  await page.goto('/__dynamic.html?sector=0');
  await reachBrowserBoss(page, { bossAge: 5 });
  await waitForBrowserArmoredFront(page);
  const blocked = await fireBrowserPrecision(page);
  expect(blocked.event.type).toBe('blocked');
  expect(blocked.after.bossTargets[0].hp).toBe(blocked.before.bossTargets[0].hp);
  await expect(page.locator('#hitFeedback')).toBeVisible();
  await expect(page.locator('#hitFeedback')).toHaveAttribute('data-impact', 'blocked');
  await expect(page.locator('#hitFeedback')).toHaveCSS('font-size', '0px');
  const blockedFeedback = await page.locator('#hitFeedback').boundingBox();
  expect(blockedFeedback.width).toBeLessThanOrEqual(24);
  expect(blockedFeedback.height).toBeLessThanOrEqual(24);
  await page.screenshot({ path: info.outputPath('blocked-impact-compact.png') });
  if (info.project.name === 'mobile') {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 5 });
    await waitForBrowserArmoredFront(page);
    const portraitBlocked = await fireBrowserPrecision(page);
    expect(portraitBlocked.event.type).toBe('blocked');
    expect(portraitBlocked.after.bossTargets[0].hp).toBe(portraitBlocked.before.bossTargets[0].hp);
    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#hitFeedback')).toHaveAttribute('data-impact', 'blocked');
    await expect(page.locator('#hitFeedback')).toBeVisible();
    await page.screenshot({ path: info.outputPath('blocked-impact-portrait.png') });
  }
  await page.goto('/__dynamic.html?sector=0');
  await reachBrowserBoss(page, { bossAge: 5 });
  await aimAtBrowserFirstGenerator(page);
  const confirmed = await fireBrowserPrecision(page);
  expect(['boss', 'weak']).toContain(confirmed.event.type);
  expect(confirmed.after.bossTargets[0].hp).toBeLessThan(confirmed.before.bossTargets[0].hp);
  await expect(page.locator('#hitFeedback')).toBeVisible();
  await expect(page.locator('#hitFeedback')).toContainText(/ACERTO|PONTO FRACO/);
  await page.screenshot({ path: info.outputPath('confirmed-impact.png') });
  expect(errors).toEqual([]);
});
