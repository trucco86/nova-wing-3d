import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

// Visual-only QA uses the existing developer entry and deterministic module
// placement. The real walking gate remains in exploration-vertical-slice.
test('QA177: reactor boss HUD has separate mission, HP and radio lanes in all viewports', async ({
  page,
}, info) => {
  test.setTimeout(140000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await openMenu(page, 'central');
  await page.locator('#developerPanel summary').click();
  await page.locator('#developerReactorQA').click();
  await expect(page.locator('#explorationOverlay')).toBeVisible();
  for (const [x, z] of [
    [-38, -18],
    [39, -55],
    [-37, -82],
  ]) {
    expect(await page.evaluate(([a, b]) => window.__novaExploreQA.moveTo(a, b), [x, z])).toBe(true);
    await page.locator('#exploreScan').click();
  }
  await expect(page.locator('#explorationProgress')).toContainText('MÓDULOS 3/3');
  await page.locator('#exploreLaunchCombat').click();
  await expect
    .poll(() => page.evaluate(() => window.__novaExploreQA.snapshot().game.boss), {
      timeout: 30000,
    })
    .toBe(true);
  await expect(page.locator('#bossHUD')).toBeVisible();

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const grab = (selector) => {
        const el = document.querySelector(selector);
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          visible: !el.hidden && style.display !== 'none' && style.visibility !== 'hidden',
          x: rect.left,
          y: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      return {
        mission: grab('#hud .mission'),
        boss: grab('#bossHUD'),
        notices: grab('#hudNotices'),
        pilot: grab('#hud .status'),
        score: grab('#hud .rightHUD'),
        orbit: grab('#orbitControls'),
        viewport: { width: innerWidth, height: innerHeight },
      };
    });
    const intersects = (a, b) =>
      a.visible &&
      b.visible &&
      Math.min(a.right, b.right) - Math.max(a.x, b.x) > 0.5 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 0.5;
    expect(layout.boss.visible, 'boss HP must remain visible').toBe(true);
    expect(layout.mission.visible, 'sector title is redundant during boss HP').toBe(false);
    for (const name of ['notices', 'pilot', 'score']) {
      expect(intersects(layout.boss, layout[name]), 'boss HP must not overlap ' + name).toBe(false);
    }
    for (const name of ['pilot', 'score', 'orbit']) {
      expect(
        intersects(layout.notices, layout[name]),
        'the alert and radio lane must not overlap ' + name,
      ).toBe(false);
    }
    for (const name of ['boss', 'notices']) {
      const rect = layout[name];
      expect(rect.x, name + ' left').toBeGreaterThanOrEqual(-1);
      expect(rect.y, name + ' top').toBeGreaterThanOrEqual(-1);
      expect(rect.right, name + ' right').toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.bottom, name + ' bottom').toBeLessThanOrEqual(viewport.height + 1);
    }
    await page.screenshot({
      path: info.outputPath('qa177-reactor-boss-hud-' + viewport.width + '.png'),
    });
  }

  // Critical warnings temporarily take precedence over a concurrent radio
  // transmission, but no DOM message, audio or mission state is deleted.
  const prioritization = await page.evaluate(() => {
    const critical = document.getElementById('criticalWarning');
    const comms = document.getElementById('comms');
    const initial = { hidden: critical.hidden, radio: comms.classList.contains('active') };
    critical.hidden = false;
    comms.classList.add('active');
    const radioHidden = getComputedStyle(comms).display === 'none';
    critical.hidden = initial.hidden;
    comms.classList.toggle('active', initial.radio);
    return radioHidden;
  });
  expect(prioritization, 'critical boss warnings outrank radio').toBe(true);
  expect(errors).toEqual([]);
});
