import { openMenu } from './menu-navigation.mjs';
import { test, expect } from '@playwright/test';

test('Five Cats Orbit-9: 3D investigation, clue gating and real boss entry with no save writes', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await openMenu(page, 'central');
  const developer = page.locator('#developerPanel');
  await expect(developer).not.toHaveAttribute('hidden');
  await developer.locator('summary').click();
  await page.locator('#developerExplore').click();
  const overlay = page.locator('#explorationOverlay');
  await expect(overlay).toBeVisible();
  await expect(page.locator('#explorationViewport canvas')).toBeVisible();
  await expect(page.locator('#explorationProgress')).toContainText('0/3');
  await expect(page.locator('#exploreLaunchCombat')).toBeHidden();
  await expect(page.locator('#exploreScan')).toBeDisabled();
  await expect(page.locator('#explorationDistrict')).toHaveText('ÁTRIO DA ESTAÇÃO');
  await expect(page.locator('.exploration-map-signal')).toHaveCount(3);
  await expect(page.locator('#explorationMapPlayer')).toBeVisible();
  // Non-linear districts on both sides of the old corridor.
  await page.evaluate(() => window.__novaExploreQA.moveTo(-38, -18));
  await expect(page.locator('#explorationDistrict')).toHaveText('LABORATÓRIO DE SINAIS');
  await page.evaluate(() => window.__novaExploreQA.moveTo(39, -55));
  await expect(page.locator('#explorationDistrict')).toHaveText('PRAÇA DO REATOR');
  await page.evaluate(() => window.__novaExploreQA.moveTo(-37, -82));
  await expect(page.locator('#explorationDistrict')).toHaveText('ARQUIVOS DA ORBITA');
  await page.evaluate(() => window.__novaExploreQA.moveTo(0, 12));

  for (const [x, z] of [
    [-38, -18],
    [39, -55],
    [-37, -82],
  ]) {
    const accepted = await page.evaluate(
      ([px, pz]) => window.__novaExploreQA.moveTo(px, pz),
      [x, z],
    );
    expect(accepted).toBe(true);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
  }
  await expect(page.locator('#explorationProgress')).toContainText('3/3');
  await expect(page.locator('#exploreLaunchCombat')).toBeHidden();
  await page.evaluate(() => window.__novaExploreQA.moveTo(9, -92));
  await expect(page.locator('#exploreTalk')).toBeEnabled();
  await page.locator('#exploreTalk').click();
  // Scripted NPC dialogue presents three separate readable beats, then choices.
  await expect(page.locator('#explorationDialogue')).toBeVisible();
  await expect(page.locator('#explorationChoices')).toBeHidden();
  for (const index of [0, 1, 2]) {
    const state = await page.evaluate(() => window.__novaExploreQA.snapshot().dialogue);
    expect(state.index).toBe(index);
    await expect(page.locator('#exploreDialogueText')).not.toBeEmpty();
    await page.locator('#exploreDialogueNext').click();
  }
  await expect(page.locator('#explorationDialogue')).toBeHidden();
  await expect(page.locator('#explorationChoices')).toBeVisible();
  await page.locator('#exploreChoiceHidden').click();
  await expect(page.locator('#exploreLaunchCombat')).toBeVisible();
  const quest = await page.evaluate(() => window.__novaExploreQA.snapshot().quest);
  expect(quest.clues).toHaveLength(3);
  expect(quest.conversation).toBe('hidden-route');
  expect(quest.missionCompleted).toBe(false);
  expect(quest.rewardClaimed).toBe(false);
  const persisted = await page.evaluate(() => localStorage.getItem('nova-wing-3d-exploration-v1'));
  expect(persisted).toBeNull();

  await page.screenshot({
    path: info.outputPath('orbit9-three-clues-' + info.project.name + '.png'),
  });
  await page.locator('#exploreLaunchCombat').click();
  await expect(overlay).toBeHidden();
  await expect(page.locator('#bossHUD')).toBeVisible();
  const combat = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(combat.active).toBe(false);
  expect(errors).toEqual([]);
});

test('Orbit-9 QA exploration resets on exit and controls remain reachable on phones', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.locator('#developerExplore').click();
    await expect(page.locator('#explorationOverlay')).toBeVisible();
    const sizes = await page.evaluate(() => {
      const get = (id) => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      return [
        'explorationViewport',
        'exploreStick',
        'exploreBoost',
        'exploreExit',
        'exploreScan',
        'exploreCameraLeft',
        'exploreCameraRight',
        'exploreCameraZoom',
        'exploreSpin',
      ].map(get);
    });
    for (const rect of sizes) {
      expect(rect.width).toBeGreaterThan(32);
      expect(rect.height).toBeGreaterThan(32);
      expect(rect.x).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.y).toBeGreaterThanOrEqual(-1);
      expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
    // Bounding boxes can be inside the viewport while the WebGL canvas
    // still intercepts the touch. Assert the real element at the target center.
    for (const id of [
      'exploreExit',
      'exploreStick',
      'exploreBoost',
      'exploreScan',
      'exploreCameraLeft',
      'exploreCameraRight',
      'exploreCameraZoom',
      'exploreSpin',
    ]) {
      const isTopmost = await page.locator('#' + id).evaluate((button) => {
        const rect = button.getBoundingClientRect();
        const target = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return button === target || button.contains(target);
      });
      expect(isTopmost, id + ' must not be covered by the 3D canvas').toBe(true);
    }
    // Orbit and 360 sit next to the left thumb, immediately above the
    // analog, as in the ship's orbit UI. No HUD collision on phone rotations.
    const docking = await page.evaluate(() => {
      const rect = (selector) => {
        const b = document.querySelector(selector).getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      };
      return { rail: rect('.exploration-camera-tools'), stick: rect('#exploreStick') };
    });
    expect(Math.abs(docking.rail.left - docking.stick.left)).toBeLessThan(16);
    expect(docking.rail.bottom).toBeLessThanOrEqual(docking.stick.top - 4);
    await page.evaluate(() => window.__novaExploreQA.moveTo(-38, -18));
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('1/3');
    await page.screenshot({
      path: info.outputPath('orbit9-' + viewport.width + 'x' + viewport.height + '.png'),
    });
    await page.locator('#exploreExit').click();
    await expect(page.locator('#explorationOverlay')).toBeHidden();
    await expect(page.locator('#developerExplore')).toBeVisible();
  }
  await page.locator('#developerExplore').click();
  await expect(page.locator('#explorationProgress')).toContainText('0/3');
  await page.locator('#exploreExit').click();
});

test('Orbit-9 free roaming has solid reactor walls and an interactive minimap without persistence', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();
  const before = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(before.district).toBe('central');
  expect(before.player).toEqual({ x: 0, z: 12 });
  // The core is a physical blocker. QA teleport cannot bypass it.
  expect(await page.evaluate(() => window.__novaExploreQA.moveTo(0, -44))).toBe(false);
  expect(await page.evaluate(() => window.__novaExploreQA.moveTo(39, -55))).toBe(true);
  await expect(page.locator('#explorationDistrict')).toHaveText('PRAÇA DO REATOR');
  const playerMap = await page.locator('#explorationMapPlayer').evaluate((el) => ({
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.bottom),
  }));
  expect(playerMap.x).toBeGreaterThan(50);
  expect(playerMap.y).toBeGreaterThan(0);
  await page.locator('#exploreScan').click();
  await expect(page.locator('.exploration-map-signal.found')).toHaveCount(1);
  await page.screenshot({
    path: info.outputPath('orbit9-free-roam-map-' + info.project.name + '.png'),
  });
  await page.locator('#exploreExit').click();
  const saved = await page.evaluate(() => localStorage.getItem('nova-wing-3d-exploration-v1'));
  expect(saved).toBeNull();
});

test('selected Five Cats pilot is reused in Orbit-9 instead of a stock cat', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'hangar');
  await page.locator('#pilot-bob').click();
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-pilot', 'bob');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();
  const model = await page.evaluate(() => window.__novaExploreQA.snapshot().pilotModel);
  expect(model).toBe('orbit9-player-bob');
  await expect(page.locator('#explorationStatus')).toContainText('BOB');
  await page.screenshot({
    path: info.outputPath('orbit9-bob-3d-' + info.project.name + '.png'),
  });
  await page.locator('#exploreExit').click();
});

test('Orbit-9 lets the player orbit the third-person camera and inspect a wider survey view', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();
  const before = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(before.camera.mode).toBe('follow');
  expect(before.camera.yaw).toBe(0);
  await page.locator('#exploreCameraRight').click();
  let view = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(view.camera.yaw).toBeGreaterThan(0);
  await page.keyboard.press('KeyQ');
  view = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(view.camera.yaw).toBeCloseTo(0);
  await page.locator('#exploreCameraZoom').click();
  await expect(page.locator('#exploreCameraZoom')).toHaveAttribute('aria-pressed', 'true');
  view = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(view.camera.mode).toBe('survey');
  await page.keyboard.press('KeyC');
  await expect(page.locator('#exploreCameraZoom')).toHaveAttribute('aria-pressed', 'false');
  view = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(view.camera.mode).toBe('follow');
  await page.screenshot({
    path: info.outputPath('orbit9-orbit-camera-' + info.project.name + '.png'),
  });
  await page.locator('#exploreExit').click();
  await page.locator('#developerExplore').click();
  const reset = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(reset.camera).toEqual({ yaw: 0, mode: 'follow' });
  await page.locator('#exploreExit').click();
});

test('survivor dialogue can be cancelled and resumed without granting a forged route choice', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();
  for (const [x, z] of [
    [-38, -18],
    [39, -55],
    [-37, -82],
  ]) {
    await page.evaluate(([a, b]) => window.__novaExploreQA.moveTo(a, b), [x, z]);
    await page.locator('#exploreScan').click();
  }
  await page.evaluate(() => window.__novaExploreQA.moveTo(9, -92));
  await page.locator('#exploreTalk').click();
  await expect(page.locator('#explorationDialogue')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#explorationDialogue')).toBeHidden();
  await expect(page.locator('#explorationOverlay')).toBeVisible();
  expect(
    (await page.evaluate(() => window.__novaExploreQA.snapshot())).quest.conversation,
  ).toBeNull();
  await page.locator('#exploreTalk').click();
  await expect(page.locator('#exploreDialogueText')).toContainText('Os gatos chegaram');
  await page.locator('#exploreDialogueNext').click();
  await page.locator('#exploreDialogueNext').click();
  await page.locator('#exploreDialogueNext').click();
  await page.locator('#exploreChoiceRestore').click();
  const state = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(state.quest.conversation).toBe('restore-power');
  await expect(page.locator('#exploreTalk')).toBeDisabled();
  await page.locator('#exploreExit').click();
});

test('Orbit-9 walks with animated legs, analog thumb input and the same BOOST gesture as flight', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();

  const initial = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(initial.gait).not.toBeNull();
  expect(initial.gait.distance).toBe(0);
  const stick = page.locator('#exploreStick');
  const bounds = await stick.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8, y - 32, { steps: 5 });
  await page.waitForTimeout(550);
  const moving = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(moving.player.z).toBeLessThan(initial.player.z);
  expect(moving.gait.distance).toBeGreaterThan(1);
  expect(moving.gait.blend).toBeGreaterThan(0.4);
  expect(Math.abs(moving.gait.leftHip) + Math.abs(moving.gait.rightHip)).toBeGreaterThan(0.05);
  expect(moving.stick.z).toBeLessThan(-0.5);

  await page.mouse.up();
  // The thumbstick must reset immediately. The visual rig eases to rest using
  // simulated frame time, which can lag wall-clock time on shared SwiftShader CI.
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().gait.blend), {
      timeout: 2500,
    })
    .toBeLessThan(0.03);
  const stopped = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(stopped.stick).toEqual({ x: 0, z: 0 });

  // Keyboard Boost is unchanged; exploration maps it to walking speed.
  await page.keyboard.down('Shift');
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().boosting))
    .toBe(true);
  await page.keyboard.up('Shift');
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().boosting))
    .toBe(false);
  await page.locator('#exploreExit').click();
});

test('Orbit-9 movement stays screen-relative after camera orbit and 360° is beside the stick', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerExplore').click();
  const initial = await page.evaluate(() => window.__novaExploreQA.snapshot());
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(420);
  await page.keyboard.up('KeyW');
  const forward = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(forward.player.z).toBeLessThan(initial.player.z - 1);
  // Seven orbit steps of PI/7 point the camera at the opposite side of the
  // cat. Forward in SCREEN space is now +Z in the static station coordinates.
  for (let i = 0; i < 7; i++) await page.locator('#exploreCameraRight').click();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Math.abs(Math.abs(window.__novaExploreQA.snapshot().cameraVisualYaw) - Math.PI),
        ),
      { timeout: 4000 },
    )
    .toBeLessThan(0.12);
  const fromBack = await page.evaluate(() => window.__novaExploreQA.snapshot());
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(420);
  await page.keyboard.up('KeyW');
  const facingOtherWay = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(facingOtherWay.player.z).toBeGreaterThan(fromBack.player.z + 1);
  // A 360 spin is a character animation; the camera, quest and position are
  // unchanged. It must be reachable on the same left-hand control cluster.
  const spin = page.locator('#exploreSpin');
  await expect(spin).toBeVisible();
  await spin.click();
  expect((await page.evaluate(() => window.__novaExploreQA.snapshot())).spinning).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().spinning), {
      timeout: 3000,
    })
    .toBe(false);
  const finished = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(finished.player.z).toBeCloseTo(facingOtherWay.player.z, 1);
  expect(finished.quest.clues).toHaveLength(0);
  await page.locator('#exploreExit').click();
});
