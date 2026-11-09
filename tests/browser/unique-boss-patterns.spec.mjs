import { test, expect } from '@playwright/test';

// Exercise actual game clocks, boss models, combat intents, HUD and radar.
// No DOM mock or synthetic threat plan: same encounter players can QA.
for (const family of [
  { sector: 0, name: 'Rok', kinds: ['rok-pincer', 'rok-ram'] },
  { sector: 1, name: 'Stingray', kinds: ['stingray-scissor', 'stingray-sting'] },
  { sector: 2, name: 'Carbide', kinds: ['drill-ram', 'drill-crosscut'] },
  { sector: 8, name: 'Orion', kinds: ['orion-gravity-pulse', 'orion-iris-shear'] },
]) {
  test(
    family.name + ' real signature warning matches its physical radar',
    async ({ page }, info) => {
      test.setTimeout(110000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/__dynamic.html?sector=' + family.sector + '&qaBoss=' + family.sector);
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('#bossHUD')).toBeVisible();

      const evidence = await page.evaluate((expectedKinds) => {
        const { game, advance } = window.fixture;
        let sample = null;
        for (let i = 0; i < 680; i++) {
          advance(0.05, { renderAfter: false });
          const state = game.snapshot();
          if (
            state.boss &&
            state.bossIntent &&
            expectedKinds.includes(state.bossIntent.kind) &&
            state.tactics.state === 'windup'
          ) {
            advance(0);
            const radar = document.getElementById('battleRadar');
            const rect = document.getElementById('radarThreatRect');
            const ellipse = document.getElementById('radarThreatEllipse');
            sample = {
              sector: state.sector,
              kind: state.bossIntent.kind,
              label: state.bossIntent.label,
              origin: state.bossIntent.origin,
              radarMode: radar.getAttribute('data-mode'),
              radarLabel: radar.getAttribute('aria-label'),
              warning: document.getElementById('attackWarning').textContent,
              rect: rect.style.display === 'block',
              ellipse: ellipse.style.display === 'block',
              safe: !document.getElementById('radarSafePoint').hidden,
            };
            break;
          }
        }
        return sample;
      }, family.kinds);

      expect(evidence, family.name + ' must reach an original physical warning').not.toBeNull();
      expect(evidence.sector).toBe(family.sector + 1);
      expect(family.kinds).toContain(evidence.kind);
      expect(evidence.origin).toMatch(/^signature-/);
      expect(evidence.radarMode).toBe('physical');
      expect(evidence.radarLabel).toContain(evidence.kind);
      expect(evidence.warning).toContain(evidence.label);
      expect(evidence.rect || evidence.ellipse).toBe(true);
      expect(evidence.safe).toBe(true);
      await page.screenshot({
        path: info.outputPath(
          'unique-boss-' + family.name.toLowerCase() + '-' + info.project.name + '.png',
        ),
      });
      expect(errors).toEqual([]);
    },
  );
}
