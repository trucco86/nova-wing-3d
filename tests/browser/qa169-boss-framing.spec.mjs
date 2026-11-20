import { test, expect } from '@playwright/test';

// Evidence to review actual model frontal readability AND the real player's
// combat warning. These are never doctored concept renders or fake radar DOM.
for (const { sector, name } of [
  { sector: 6, name: 'hydra' },
  { sector: 7, name: 'omega' },
  { sector: 9, name: 'marvin' },
]) {
  test('QA169 ' + name + ' face, flank and real melee warning', async ({ page }, info) => {
    test.setTimeout(120000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Both screenshots use the real authored 3D boss, not a painted artwork.
    for (const [view, lateral] of [['frontal', 0], ['off-axis', 17]]) {
      await page.goto('/__visual.html?sector=' + sector + '&lateral=' + lateral);
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      await page.screenshot({
        path: info.outputPath('qa169-' + name + '-' + view + '-' + info.project.name + '.png'),
      });
    }

    await page.goto('/__dynamic.html?sector=' + sector + '&qaBoss=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();
    const real = await page.evaluate(() => {
      const { game, advance } = window.fixture;
      let sample = null;
      for (let i = 0; i < 600; i++) {
        advance(0.05, { renderAfter: false });
        const snap = game.snapshot();
        if (
          snap.boss &&
          snap.tactics.state === 'windup' &&
          snap.bossIntent?.kind !== 'barrage' &&
          snap.bossIntent?.originMesh
        ) {
          advance(0);
          sample = {
            kind: snap.bossIntent.kind,
            mesh: snap.bossIntent.originMesh,
            targetX: snap.bossIntent.targetX,
            targetY: snap.bossIntent.targetY,
            radarMode: document.getElementById('battleRadar').getAttribute('data-mode'),
            radarText: document.getElementById('battleRadar').getAttribute('aria-label'),
          };
          break;
        }
      }
      return sample;
    });
    expect(real, name + ' must telegraph from a named visible 3D weapon').not.toBeNull();
    expect(real.mesh).toBeTruthy();
    expect(real.radarMode).toBe('physical');
    expect(real.radarText).toContain(real.kind);
    expect([real.targetX, real.targetY].every(Number.isFinite)).toBe(true);
    await page.screenshot({
      path: info.outputPath('qa169-' + name + '-attack-' + info.project.name + '.png'),
    });
    await info.attach('qa169-' + name + '-intent', {
      body: JSON.stringify(real),
      contentType: 'application/json',
    });
    expect(errors).toEqual([]);
  });
}
