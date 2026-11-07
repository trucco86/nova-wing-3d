import { test, expect } from '@playwright/test';

test('QA boss weapons fire visible distinct projectiles from a real encounter', async ({
  page,
}, info) => {
  test.setTimeout(140000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Capture two distinct combat families: Omega artillery and glacial Colossus.
  for (const sector of [5, 7]) {
    await page.goto('/__dynamic.html?sector=' + sector + '&qaBoss=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();
    const evidence = await page.evaluate(() => {
      const { game, advance } = window.fixture;
      let sample = null;
      for (let tick = 0; tick < 520; tick++) {
        advance(0.05, { renderAfter: false });
        const state = game.snapshot();
        if (state.boss && state.hostilePositions.length > 0) {
          sample = {
            sector: state.sector,
            bossAge: state.bossAge,
            projectiles: state.hostilePositions.length,
            first: state.hostilePositions[0],
          };
          break;
        }
      }
      advance(0);
      return sample;
    });
    expect(evidence, 'a real boss encounter must emit projectiles').not.toBeNull();
    expect(evidence.sector).toBe(sector + 1);
    expect(evidence.projectiles).toBeGreaterThan(0);
    expect(evidence.first.every(Number.isFinite)).toBe(true);
    await page.screenshot({
      path: info.outputPath(
        'boss-weapon-shot-sector-' + (sector + 1) + '-' + info.project.name + '.png',
      ),
    });
  }
  expect(errors).toEqual([]);
});
