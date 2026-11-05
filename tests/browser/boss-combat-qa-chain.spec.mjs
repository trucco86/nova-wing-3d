import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

// P0: verify a real QA encounter end-to-end. Unit tests alone cannot prove
// that the actual game HUD and browser radar show the latched physical attack.
for (const scenario of [
  { sector: 4, label: 'Phoenix', kinds: ['plasma-dive', 'solar-sweep'] },
  { sector: 5, label: 'Europa', kinds: ['ice-quake', 'cryo-pincer'] },
]) {
  test(
    scenario.label + ' physical warning and radar agree with real boss intent',
    async ({ page }, info) => {
      test.setTimeout(120000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/__dynamic.html?sector=' + scenario.sector + '&qaBoss=' + scenario.sector);
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

      const data = await page.evaluate((kinds) => {
        const { game, advance } = window.fixture;
        let intent = null;
        // A QA clock, not an artificial DOM mock. No software-GPU draw needed
        // while seeking the telegraphed attack; render one actual checkpoint.
        for (let i = 0; i < 500; i++) {
          advance(0.05, { renderAfter: false });
          const state = game.snapshot();
          if (
            state.boss &&
            state.tactics.state === 'windup' &&
            state.bossIntent &&
            kinds.includes(state.bossIntent.kind)
          ) {
            intent = { ...state.bossIntent };
            break;
          }
        }
        if (!intent) return null;
        advance(0);
        const radar = document.getElementById('battleRadar');
        const rect = document.getElementById('radarThreatRect');
        const ellipse = document.getElementById('radarThreatEllipse');
        return {
          intent,
          radarMode: radar.getAttribute('data-mode'),
          radarLabel: radar.getAttribute('aria-label'),
          warning: document.getElementById('attackWarning').textContent,
          warningFull: document.getElementById('attackWarning').getAttribute('aria-label'),
          rectVisible: rect.style.display === 'block',
          ellipseVisible: ellipse.style.display === 'block',
          safeGuide: document.getElementById('radarGuide').textContent,
          safePoint: !document.getElementById('radarSafePoint').hidden,
          stage: game.snapshot().sector,
        };
      }, scenario.kinds);

      expect(data, 'boss must reach a readable windup without fabricated state').not.toBeNull();
      expect(data.stage).toBe(scenario.sector + 1);
      expect(scenario.kinds).toContain(data.intent.kind);
      expect(data.radarMode).toBe('physical');
      // Compact alert identifies the *physical attack*, not the boss name.
      // The original instruction remains accessible without covering gameplay.
      expect(data.warning.length).toBeLessThanOrEqual(39);
      expect(data.warningFull).toBe(data.intent.label);
      expect(data.warning).toContain(data.intent.label.split(' · ')[1]);
      expect(data.warning).toMatch(/DESVIE|AFASTE-SE|SUBA|MUDE ALTURA|ORBITE/);
      expect(data.radarLabel).toContain(data.intent.kind);
      expect(data.safePoint, 'a real dodge route is indicated').toBe(true);
      expect(data.safeGuide).toMatch(/ZONA SEGURA|SEGURO/);
      const expectedRectangle = ['solar-sweep', 'ice-quake', 'cryo-pincer'].includes(
        data.intent.kind,
      );
      expect(data.rectVisible, 'correct physical footprint on map').toBe(expectedRectangle);
      expect(data.ellipseVisible, 'correct physical footprint on map').toBe(!expectedRectangle);

      const radar = await page.locator('#battleRadar').boundingBox();
      expect(radar).not.toBeNull();
      const width = page.viewportSize().width;
      const height = page.viewportSize().height;
      expect(radar.x).toBeGreaterThanOrEqual(0);
      expect(radar.x + radar.width).toBeLessThanOrEqual(width + 1);
      expect(radar.y + radar.height).toBeLessThanOrEqual(height * 0.7);
      await page.screenshot({
        path: info.outputPath(
          'physical-' + scenario.label.toLowerCase() + '-' + info.project.name + '.png',
        ),
      });
      expect(errors).toEqual([]);
    },
  );
}

test('mobile QA Berserk is actionable and cannot persist power into campaign save', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const checkpoint = await page.evaluate(() => localStorage.getItem('nova-wing-3d-v1'));
  await openMenu(page, 'home');
  await page.locator('#menuQA').click();
  await expect(page.locator('#developerPanel')).toBeVisible();
  await page.locator('#developerSector').selectOption('5');
  await page.locator('#developerEncounter').selectOption('boss');
  await page.locator('#developerBerserkLaunch').click();
  await expect(page.locator('#developerSessionTag')).toContainText('SETOR 06');
  const action = page.locator('#qaBerserkAction');
  await expect(action).toBeVisible();
  await expect(action).toHaveText('ATIVAR BERSERK');
  await action.click();
  await expect(page.locator('body')).toHaveClass(/berserk-active/);
  await expect(page.locator('#qaBerserkStatus')).toContainText('ATIVO');
  await action.click();
  await expect(action).toContainText('REPETIR BERSERK');
  await page.screenshot({
    path: info.outputPath('berserk-europa-' + info.project.name + '.png'),
  });
  const after = await page.evaluate(() => localStorage.getItem('nova-wing-3d-v1'));
  expect(after, 'QA may not overwrite campaign progress').toBe(checkpoint);
  expect(errors).toEqual([]);
});
