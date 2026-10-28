import { test, expect } from '@playwright/test';

test('Five Cats Orbit-9: 3D investigation, clue gating and real boss entry with no save writes', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
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

  for (const [x, z] of [[-12, -15], [13, -37], [-8, -59]]) {
    const accepted = await page.evaluate(([px, pz]) => window.__novaExploreQA.moveTo(px, pz), [x, z]);
    expect(accepted).toBe(true);
    await expect(page.locator('#exploreScan')).toBeEnabled();
    await page.locator('#exploreScan').click();
  }
  await expect(page.locator('#explorationProgress')).toContainText('3/3');
  await expect(page.locator('#exploreLaunchCombat')).toBeHidden();
  await page.evaluate(() => window.__novaExploreQA.moveTo(8, -77));
  await expect(page.locator('#exploreTalk')).toBeEnabled();
  await page.locator('#exploreTalk').click();
  // The decision stays visible across multiple animation frames.
  await expect(page.locator('#explorationChoices')).toBeVisible();
  await page.waitForTimeout(120);
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

  await page.screenshot({ path: info.outputPath('orbit9-three-clues-' + info.project.name + '.png') });
  await page.locator('#exploreLaunchCombat').click();
  await expect(overlay).toBeHidden();
  await expect(page.locator('#bossHUD')).toBeVisible();
  const combat = await page.evaluate(() => window.__novaExploreQA.snapshot());
  expect(combat.active).toBe(false);
  expect(errors).toEqual([]);
});

test('Orbit-9 QA exploration resets on exit and controls remain reachable on phones', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.goto('/');
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
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      return ['explorationViewport', 'exploreMoveUp', 'exploreMoveDown',
        'exploreMoveLeft', 'exploreMoveRight', 'exploreExit', 'exploreScan'].map(get);
    });
    for (const rect of sizes) {
      expect(rect.width).toBeGreaterThan(32);
      expect(rect.height).toBeGreaterThan(32);
      expect(rect.x).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.y).toBeGreaterThanOrEqual(-1);
      expect(rect.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
    await page.evaluate(() => window.__novaExploreQA.moveTo(-12, -15));
    await page.locator('#exploreScan').click();
    await expect(page.locator('#explorationProgress')).toContainText('1/3');
    await page.screenshot({ path: info.outputPath('orbit9-' + viewport.width + 'x' + viewport.height + '.png') });
    await page.locator('#exploreExit').click();
    await expect(page.locator('#explorationOverlay')).toBeHidden();
    await expect(page.locator('#developerExplore')).toBeVisible();
  }
  await page.locator('#developerExplore').click();
  await expect(page.locator('#explorationProgress')).toContainText('0/3');
  await page.locator('#exploreExit').click();
});
