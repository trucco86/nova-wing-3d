import { test, expect } from '@playwright/test';

// Real QA encounters, not isolated meshes. Stage 6 is intentionally unchanged
// mechanically; its telegraphed ice-quake now has physical-looking crystals.
for (const stage of [
  { sector: 5, name: 'europa' },
  { sector: 6, name: 'hydra' },
  { sector: 7, name: 'omega' },
  { sector: 9, name: 'marvin' },
]) {
  test(stage.name + ' advanced boss encounter preserves real radar and visual readiness', async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/__dynamic.html?sector=' + stage.sector + '&qaBoss=' + stage.sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();
    const evidence = await page.evaluate(() => {
      const { game, advance } = window.fixture;
      advance(8.3);
      const s = game.snapshot();
      return {
        sector: s.sector,
        boss: s.boss,
        bossParts: s.bossParts,
        phase: s.bossPhase,
        tactical: s.tactics?.state,
        hud: document.getElementById('bossHUD')?.hidden,
        warning: document.getElementById('attackWarning')?.textContent ?? '',
      };
    });
    expect(evidence.sector).toBe(stage.sector + 1);
    expect(evidence.boss).toBe(true);
    expect(evidence.bossParts).toBeGreaterThan(0);
    expect(evidence.hud).toBe(false);
    expect(['maneuver', 'windup', 'attack', 'recovery']).toContain(evidence.tactical);
    await page.screenshot({
      path: info.outputPath('advanced-boss-' + stage.name + '-' + info.project.name + '.png'),
    });
    expect(errors).toEqual([]);
  });
}
