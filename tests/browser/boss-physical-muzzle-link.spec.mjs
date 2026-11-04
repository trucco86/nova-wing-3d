import { test, expect } from '@playwright/test';

for (const family of [{ sector: 5, name: 'Europa' }, { sector: 7, name: 'Omega' }]) {
  test(family.name + ' boss projectile visibly leaves a physical muzzle in live combat', async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/__dynamic.html?sector=' + family.sector + '&qaBoss=' + family.sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();

    const evidence = await page.evaluate((sector) => {
      const { game, advance } = window.fixture;
      for (let tick = 0; tick < 720; tick++) {
        advance(0.05, { renderAfter: false });
        const state = game.snapshot();
        const live = state.bossShotLinks.filter((shot) => shot.bossIndex === sector);
        if (live.length) {
          advance(0);
          return {
            sector: state.sector,
            count: live.length,
            length: live[0].length,
            origin: live[0].origin,
            projectile: live[0].projectile,
            muzzleDistance: Math.hypot(
              live[0].projectile[0] - live[0].origin[0],
              live[0].projectile[1] - live[0].origin[1],
              live[0].projectile[2] - live[0].origin[2],
            ),
            pool: state.hostileProjectilePool,
          };
        }
      }
      return null;
    }, family.sector);
    expect(evidence, 'real boss shot must have a short visible physical-origin link').not.toBeNull();
    expect(evidence.sector).toBe(family.sector + 1);
    expect(evidence.count).toBeGreaterThan(0);
    expect(evidence.length).toBeGreaterThan(0.6);
    expect(Math.abs(evidence.length - evidence.muzzleDistance)).toBeLessThan(0.01);
    expect(evidence.pool.active).toBeGreaterThan(0);
    await page.screenshot({
      path: info.outputPath('physical-boss-shot-' + family.name.toLowerCase() + '-' + info.project.name + '.png'),
    });
    expect(errors).toEqual([]);
  });
}
