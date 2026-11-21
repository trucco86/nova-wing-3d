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
  expect(state.stageArt.instanceCounts.hull).toBeGreaterThan(20);
  // No surviving NPC from the old standalone mission should remain in the
  // reactor-access minimap. Only the three active security modules are shown.
  await expect(page.locator('.exploration-map-survivor')).toHaveCount(0);
  expect(Object.values(state.stageArt.instanceCounts).reduce((a, b) => a + b, 0)).toBeGreaterThan(
    200,
  );
  // Explicit viewport evidence of the entry framing. Before this pass the
  // camera pointed sharply down and the cat stood on an empty blue floor.
  for (const viewportSize of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewportSize);
    await page.waitForTimeout(120);
    // Developer teleport snaps the camera immediately after the responsive
    // resize, making the visual framing deterministic under software WebGL.
    expect(await page.evaluate(() => window.__novaExploreQA.moveTo(0, 12))).toBe(true);
    const camera = await page.evaluate(() => window.__novaExploreQA.snapshot().cameraEye);
    if (viewportSize.width < viewportSize.height) {
      expect(camera.z).toBeGreaterThan(25);
    } else {
      expect(camera.z).toBeLessThanOrEqual(22);
    }
    await page.screenshot({
      path: info.outputPath('devastador-hangar-entry-' + viewportSize.width + '.png'),
    });
  }

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
