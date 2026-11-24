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
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS ' + modules + '/3');
  }
  await expect(page.locator('#exploreLaunchCombat')).toBeVisible();
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
    // Long keyboard.down calls are fragile when CI briefly blurs the window:
    // the game intentionally clears held input on blur. Re-arm real keyboard
    // events every 6 world units, without invoking privileged movement APIs.
    const reached = (value) => (decreasing ? value <= target : value >= target);
    const snapshot = () => page.evaluate(() => window.__novaExploreQA.snapshot());
    let consecutiveStalls = 0;
    for (let segment = 0; segment < 90; segment++) {
      const before = await snapshot();
      const from = before.player[axis];
      if (reached(from)) return;
      const distance = Math.min(6, Math.abs(from - target));
      const waypoint = from + (decreasing ? -distance : distance);
      await page.keyboard.down(key);
      let timedOut = false;
      try {
        const position = expect.poll(
          () => page.evaluate((field) => window.__novaExploreQA.snapshot().player[field], axis),
          { timeout: 5500, intervals: [80, 120, 180] },
        );
        if (decreasing) await position.toBeLessThanOrEqual(waypoint);
        else await position.toBeGreaterThanOrEqual(waypoint);
      } catch {
        timedOut = true;
      } finally {
        await page.keyboard.up(key);
      }
      const after = await snapshot();
      if (reached(after.player[axis])) return;
      const gained = (after.player[axis] - from) * (decreasing ? -1 : 1);
      if (gained < 0.5) {
        consecutiveStalls++;
        // Recover once from a lost keydown/blur, but never ignore a physical
        // obstruction, stalled game loop or permanently locked input.
        if (consecutiveStalls >= 2)
          throw new Error(
            'Real walking blocked after input re-arm: ' +
              JSON.stringify({ key, axis, target, from, timedOut, before, after }),
          );
      } else {
        consecutiveStalls = 0;
      }
    }
    throw new Error(
      'Real walking did not reach ' + axis + '=' + target + ' in 90 real input segments',
    );
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

    // Return to the unobstructed upper corridor before crossing the hall.
    // The core at (0,-44) must remain solid, not be walked through.
    // Cross via the northern open aisle: the research pillar at (-22,-44)
    // blocks a direct westward crossing when keyboard/camera drift lowers Z.
    // Keep the test on real walking controls, without QA teleportation.
    await walk('KeyS', 'z', 8, false);
    // The northern aisle is clear of every physical obstacle. Keep BOOST for
    // the long, unobstructed crossing; disabling it early can turn a safe
    // traversal into a wall-clock timeout on a heavily loaded CI renderer.
    const aisle = await page.evaluate(() => window.__novaExploreQA.snapshot().player);
    expect(aisle.z).toBeGreaterThanOrEqual(8);
    await walk('KeyA', 'x', -32, true);
    // Use normal walking speed for the final meters near the archive so
    // polling does not overshoot the small physical interaction radius.
    await page.keyboard.up('Shift');
    await walk('KeyA', 'x', -36, true);
    await walk('KeyW', 'z', -80, true);
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
