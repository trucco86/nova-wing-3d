import { openMenu } from './menu-navigation.mjs';
import { test, expect } from '@playwright/test';

async function openMidstageReactor(page) {
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerReactorQA').click();
  await expect(page.locator('#explorationOverlay')).toBeVisible();
  await expect(page.locator('#explorationViewport canvas')).toBeVisible();
  await expect(page.locator('#explorationTitle')).toContainText('ACESSO AO REATOR');
  await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 0/3');
  await expect(page.locator('#exploreScan')).toHaveText('ATIVAR');
  await expect(page.locator('#exploreScan')).toHaveAttribute(
    'aria-label',
    'Ativar módulo do reator',
  );
  const game = await page.evaluate(() => window.__novaExploreQA.snapshot().game);
  expect(game.sector).toBe(4);
  expect(game.state).toBe('reactor-access');
  expect(game.reactorAccess.started).toBe(true);
  expect(game.reactorAccess.completed).toBe(false);
}

test('Stage 04 activates three modules before resuming the SAME reactor boss encounter', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openMidstageReactor(page);
  await expect(page.locator('#developerExplore')).toHaveCount(0);
  await expect(page.locator('#exploreLaunchCombat')).toBeHidden();
  await expect(page.locator('#exploreScan')).toBeDisabled();
  await expect(page.locator('#exploreTalk')).toBeHidden();
  await expect(page.locator('#explorationDialogue')).toBeHidden();
  await expect(page.locator('#explorationChoices')).toBeHidden();
  await expect(page.locator('.exploration-map-signal')).toHaveCount(3);
  // Three labeled devices must exist in the 3D world, not only on the map.
  const inWorld = await page.evaluate(() => window.__novaExploreQA.snapshot().moduleVisuals);
  expect(inWorld).toHaveLength(3);
  expect(inWorld.map(({ x, z }) => [x, z])).toEqual([
    [-38, -18],
    [39, -55],
    [-37, -82],
  ]);
  // The disembark is part of Stage 04, but only the walking scene renders:
  // neither the campaign clock nor the underlying flight should keep ticking.
  const suspended = await page.evaluate(() => window.__novaExploreQA.snapshot().game.seconds);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__novaExploreQA.snapshot().game.seconds)).toBe(suspended);

  for (const [x, z, district, modules] of [
    [-38, -18, 'LABORATÓRIO DE SINAIS', 1],
    [39, -55, 'PRAÇA DO REATOR', 2],
    [-37, -82, 'ARQUIVOS DA DEVASTADOR', 3],
  ]) {
    expect(await page.evaluate(([a, b]) => window.__novaExploreQA.moveTo(a, b), [x, z])).toBe(true);
    await expect(page.locator('#explorationDistrict')).toHaveText(district);
    expect(
      await page.evaluate(
        (i) => window.__novaExploreQA.snapshot().moduleVisuals[i].visible,
        modules - 1,
      ),
    ).toBe(true);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS ' + modules + '/3');
  }
  await expect(page.locator('#exploreLaunchCombat')).toBeVisible();
  await expect(page.locator('#exploreLaunchCombat')).toBeDisabled();
  // Returning to the REAL fighter docking bay is required, not instant
  // re-entry from the remote archive.
  expect(await page.evaluate(() => window.__novaExploreQA.moveTo(17, 12))).toBe(true);
  await expect(page.locator('#exploreLaunchCombat')).toBeEnabled();
  const prior = await page.evaluate(() => window.__novaExploreQA.snapshot().game);
  expect(prior.reactorAccess.completed).toBe(false);
  await page.screenshot({ path: info.outputPath('devastador-access-three-modules.png') });
  await page.locator('#exploreLaunchCombat').click();
  await expect(page.locator('#explorationOverlay')).toBeHidden();
  const after = await page.evaluate(() => window.__novaExploreQA.snapshot().game);
  expect(after.sector).toBe(4);
  expect(after.state).toBe('playing');
  expect(after.reactorAccess.completed).toBe(true);
  expect(after.reactorAccess.started).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('nova-wing-3d-exploration-v1'))).toBeNull();
  // Prove that the actual reactor encounter starts, not just the flight HUD.
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().game.boss), {
      timeout: 30000,
    })
    .toBe(true);
  await expect(page.locator('#bossHUD')).toBeVisible();
  const boss = await page.evaluate(() => window.__novaExploreQA.snapshot().game);
  expect(boss.sector).toBe(4);
  expect(boss.reactorAccess.completed).toBe(true);
  await page.screenshot({ path: info.outputPath('devastador-boss-after-three-modules.png') });
  expect(errors).toEqual([]);
});

test('Stage 04 walking controls, orbit and 360 remain usable on mobile landscape and portrait', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await openMidstageReactor(page);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const rectangles = await page.evaluate(() => {
      const get = (id) => {
        const rect = document.getElementById(id).getBoundingClientRect();
        const found = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return {
          id,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          accessible: !!found && (found.id === id || document.getElementById(id).contains(found)),
        };
      };
      return [
        'exploreStick',
        'exploreBoost',
        'exploreScan',
        'exploreExit',
        'exploreCameraLeft',
        'exploreCameraRight',
        'exploreCameraZoom',
        'exploreSpin',
      ].map(get);
    });
    for (const item of rectangles) {
      expect(item.width, item.id).toBeGreaterThan(32);
      expect(item.height, item.id).toBeGreaterThan(32);
      expect(item.left, item.id).toBeGreaterThanOrEqual(-1);
      expect(item.top, item.id).toBeGreaterThanOrEqual(-1);
      expect(item.right, item.id).toBeLessThanOrEqual(viewport.width + 1);
      expect(item.bottom, item.id).toBeLessThanOrEqual(viewport.height + 1);
      expect(item.accessible, item.id).toBe(true);
    }
    const rail = await page.evaluate(() => {
      const a = document.querySelector('.exploration-camera-tools').getBoundingClientRect();
      const stick = document.getElementById('exploreStick').getBoundingClientRect();
      return { left: a.left, bottom: a.bottom, stickLeft: stick.left, stickTop: stick.top };
    });
    expect(Math.abs(rail.left - rail.stickLeft)).toBeLessThan(16);
    expect(rail.bottom).toBeLessThanOrEqual(rail.stickTop - 4);
    await page.screenshot({
      path: info.outputPath('devastador-controls-' + viewport.width + '.png'),
    });
  }
  await page.locator('#exploreSpin').click();
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().spinning))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().spinning), {
      timeout: 2500,
    })
    .toBe(false);
  await page.locator('#exploreExit').click();
  await expect(page.locator('#explorationOverlay')).toBeHidden();
  await expect(page.locator('#pauseMenu')).toBeVisible();
});

test('the original reactor blocker and mini-map still work without a second save system', async ({
  page,
}) => {
  test.setTimeout(90000);
  await openMidstageReactor(page);
  const state = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(state.district).toBe('central');
  expect(state.player).toEqual({ x: 0, z: 12 });
  expect(await page.evaluate(() => window.__novaExploreQA.moveTo(0, -44))).toBe(false);
  expect(await page.evaluate(() => window.__novaExploreQA.moveTo(39, -55))).toBe(true);
  await expect(page.locator('#explorationDistrict')).toHaveText('PRAÇA DO REATOR');
  await page.locator('#exploreScan').click();
  await expect(page.locator('.exploration-map-signal.found')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('nova-wing-3d-exploration-v1'))).toBeNull();
});

test('the Five Cats pilot selected in the hangar disembarks in the stage-04 reactor', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'hangar');
  await page.locator('#pilot-bob').click();
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-pilot', 'bob');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerReactorQA').click();
  expect((await page.evaluate(() => window.__novaExploreQA.snapshot())).pilotModel).toBe(
    'orbit9-player-bob',
  );
  await expect(page.locator('#explorationStatus')).toContainText('BOB');
});

test('the cat moves relative to the orbital camera before unlocking the core', async ({ page }) => {
  test.setTimeout(90000);
  await openMidstageReactor(page);
  // Gameplay begins only after the full tunnel landing camera move.
  await expect(page.locator('#explorationOverlay')).toHaveAttribute('data-reactor-beat', 'walk', { timeout: 10000 });
  const before = await page.evaluate(() => window.__novaExploreQA.snapshot());
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().player.z), {
      timeout: 5000,
    })
    .toBeLessThan(before.player.z - 0.5);
  await page.keyboard.up('KeyW');
  for (let i = 0; i < 7; i++) await page.locator('#exploreCameraRight').click();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.abs(Math.abs(window.__novaExploreQA.snapshot().cameraVisualYaw) - Math.PI),
        ),
      { timeout: 3500 },
    )
    .toBeLessThan(0.12);
  const reverse = await page.evaluate(() => window.__novaExploreQA.snapshot());
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().player.z), {
      timeout: 5000,
    })
    .toBeGreaterThan(reverse.player.z + 0.5);
  await page.keyboard.up('KeyW');
  expect(
    (await page.evaluate(() => window.__novaExploreQA.snapshot())).game.reactorAccess.completed,
  ).toBe(false);
});

test('Stage 04 walks to all three reactor modules without QA teleport and reaches the boss', async ({
  page,
}, info) => {
  test.setTimeout(210000);
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await openMidstageReactor(page);
  const initial = await page.evaluate(() => window.__novaExploreQA.snapshot().player);

  // Drive the actual keyboard event handlers and measured per-frame walking
  // physics. The developer-only moveTo/teleport method is never invoked.
  async function walk(key, axis, target, decreasing) {
    await page.keyboard.down(key);
    try {
      const position = expect.poll(
        () => page.evaluate((field) => window.__novaExploreQA.snapshot().player[field], axis),
        { timeout: 40000, intervals: [50, 80, 100] },
      );
      if (decreasing) await position.toBeLessThanOrEqual(target);
      else await position.toBeGreaterThanOrEqual(target);
    } finally {
      await page.keyboard.up(key);
    }
  }

  await page.keyboard.down('Shift');
  try {
    // Keep a corridor above the solid pillars and reactor core, then follow
    // safe side corridors to the signal laboratory and reactor plaza.
    await walk('KeyW', 'z', -18, true);
    await walk('KeyA', 'x', -35, true);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 1/3');

    await walk('KeyD', 'x', 38, false);
    await walk('KeyW', 'z', -54, true);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 2/3');

    // Maintenance bays are now PHYSICAL. Route east of the racks, cross
    // between corridors at z=-15, then use the western aisle to archives.
    await walk('KeyD', 'x', 43, false);
    await walk('KeyS', 'z', -15, false);
    await walk('KeyA', 'x', -43, true);
    await walk('KeyW', 'z', -70, true);
    await page.keyboard.up('Shift');
    await walk('KeyW', 'z', -78.5, true);
    await walk('KeyD', 'x', -37, false);
    // If a slow renderer/runner overshoots the target, correct on foot using
    // the SAME player controls. Do not use the privileged QA teleport.
    for (let attempt = 0; attempt < 4; attempt++) {
      const { x, z } = await page.evaluate(() => window.__novaExploreQA.snapshot().player);
      if (Math.hypot(x + 37, z + 82) < 5) break;
      if (x < -41) await walk('KeyD', 'x', -38, false);
      else if (x > -33) await walk('KeyA', 'x', -36, true);
      if (z < -86) await walk('KeyS', 'z', -83, false);
      else if (z > -78) await walk('KeyW', 'z', -81, true);
    }
    const archive = await page.evaluate(() => window.__novaExploreQA.snapshot().player);
    expect(
      Math.hypot(archive.x + 37, archive.z + 82),
      'the pilot must physically reach the archive module: ' + JSON.stringify(archive),
    ).toBeLessThan(8.5);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 3/3');
  } finally {
    await page.keyboard.up('Shift');
  }

  const walked = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(walked.player).not.toEqual(initial);
  expect(walked.quest.clues).toHaveLength(3);
  expect(walked.game.state).toBe('reactor-access');
  await page.screenshot({ path: info.outputPath('devastador-three-modules-real-walk.png') });
  await expect(page.locator('#exploreLaunchCombat')).toBeDisabled();
  // Re-board on foot: keep the center-right passage outside the core
  // collider and the new solid maintenance-bay volumes.
  await walk('KeyD', 'x', 12, false);
  await walk('KeyS', 'z', 11, false);
  await expect(page.locator('#exploreLaunchCombat')).toBeEnabled();
  await page.screenshot({ path: info.outputPath('devastador-return-to-dock.png') });
  await page.locator('#exploreLaunchCombat').click();
  await expect(page.locator('#explorationOverlay')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().game.boss), {
      timeout: 40000,
    })
    .toBe(true);
  await expect(page.locator('#bossHUD')).toBeVisible();
  await page.screenshot({ path: info.outputPath('devastador-boss-after-real-walk.png') });
  expect(failures).toEqual([]);
});
