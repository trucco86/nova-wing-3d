import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('Orbit-9 Stage 04 visual pass renders all four distinct carrier districts without breaking quest controls', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerReactorQA').click();
  await expect(page.locator('#explorationViewport canvas')).toBeVisible();
  // The initial transmission toast already auto-hides during real gameplay.
  // Suppress that transient overlay for unobstructed architecture screenshots.
  await page.locator('#explorationStatus').evaluate((node) => {
    node.hidden = true;
  });

  const state = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(state.stageArt.name).toBe('orbit9-devastador-stage-art');
  expect(state.stageArt.referencesStage).toBe(3);
  expect(state.stageArt.districtLandmarks).toEqual(['central', 'science', 'reactor', 'archive']);
  expect(Object.values(state.stageArt.instanceCounts).reduce((a, b) => a + b, 0)).toBeGreaterThan(
    200,
  );
  for (const [x, z, district, file] of [
    [0, 12, 'central', 'atrium'],
    [-38, -18, 'science', 'signal-lab'],
    [39, -55, 'reactor', 'coolant-plaza'],
    [-37, -82, 'archive', 'archive-banks'],
  ]) {
    expect(await page.evaluate(([a, b]) => window.__novaExploreQA.moveTo(a, b), [x, z])).toBe(true);
    const landed = await page.evaluate(() => window.__novaExploreQA.snapshot());
    expect(landed.district).toBe(district);
    // QA camera must land beside the cat immediately, not fly through solid
    // structures from the previous test location and capture a blocking slab.
    expect(Math.hypot(landed.cameraEye.x - x, landed.cameraEye.z - z)).toBeLessThan(18);
    await page.waitForTimeout(100);
    await page.screenshot({ path: info.outputPath('orbit9-devastador-' + file + '.png') });
  }
  await expect(page.locator('#exploreScan')).toBeEnabled();
  await page.locator('#exploreScan').click();
  await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 1/3');
  await page.locator('#exploreExit').click();
  expect(await page.evaluate(() => localStorage.getItem('nova-wing-3d-exploration-v1'))).toBeNull();
});
