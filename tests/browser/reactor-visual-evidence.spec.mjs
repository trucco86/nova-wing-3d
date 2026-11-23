import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

// Regression evidence for Stage 04 objective legibility. The developer
// position hook is used ONLY to stage camera snapshots; real traversal is
// separately asserted in exploration-vertical-slice.spec.mjs.
test('Stage 04 reactor modules stay actionable and visible in desktop/mobile UI', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerReactorQA').click();
  await expect(page.locator('#explorationOverlay')).toBeVisible();
  await expect(page.locator('#explorationViewport canvas')).toBeVisible();

  const modules = [
    { x: -38, z: -18, label: 'LABORATÓRIO DE SINAIS' },
    { x: 39, z: -55, label: 'PRAÇA DO REATOR' },
    { x: -37, z: -82, label: 'ARQUIVOS DA DEVASTADOR' },
  ];
  for (const [index, module] of modules.entries()) {
    const staged = await page.evaluate(
      ([x, z]) => window.__novaExploreQA.moveTo(x, z),
      [module.x, module.z],
    );
    expect(staged, 'QA camera staging must remain available').toBe(true);
    await expect(page.locator('#explorationDistrict')).toHaveText(module.label);
    const action = page.locator('#exploreScan');
    await expect(action).toBeVisible();
    await expect(action).toBeEnabled();
    await expect(action).toBeInViewport();
    const rect = await action.boundingBox();
    expect(rect).not.toBeNull();
    // This checks the actionable DOM target, not 3D line-of-sight.
    const hit = await page.evaluate(({ x, y }) => {
      const element = document.elementFromPoint(x, y);
      return Boolean(element?.closest('#exploreScan'));
    }, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    expect(hit, 'an overlay must not intercept the activation control').toBe(true);
    await page.screenshot({
      path: info.outputPath('reactor-module-' + (index + 1) + '-visual-evidence.png'),
      fullPage: false,
    });
    await action.click();
    await expect(page.locator('#explorationProgress')).toContainText(
      'MÓDULOS ' + (index + 1) + '/3',
    );
  }
  await expect(page.locator('#exploreLaunchCombat')).toBeVisible();
  await expect(page.locator('#exploreLaunchCombat')).toBeInViewport();
  await page.screenshot({
    path: info.outputPath('reactor-three-modules-ready-for-boss.png'),
    fullPage: false,
  });
  expect(errors).toEqual([]);
});
