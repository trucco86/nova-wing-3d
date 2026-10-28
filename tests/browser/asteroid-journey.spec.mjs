import { test, expect } from '@playwright/test';

test('sector 3 approaches, enters and fights within the mega-asteroid before unlocking escape', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=2');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  const initial = await page.evaluate(() => window.fixture.game.snapshot());
  expect(initial.sector).toBe(3);
  expect(initial.journey.phase).toBe('approach');
  expect(initial.asteroidInterior.entranceVisible).toBe(true);

  await page.evaluate(() => window.fixture.advance(18));
  const entrance = await page.evaluate(() => window.fixture.game.snapshot());
  expect(entrance.journey.phase).toBe('transition');
  expect(entrance.asteroidInterior.cavernVisible).toBe(true);
  await page.screenshot({ path: info.outputPath('asteroid-entrance.png') });

  await page.evaluate(() => window.fixture.advance(14));
  const cavern = await page.evaluate(() => window.fixture.game.snapshot());
  expect(cavern.journey.phase).toBe('interior');
  expect(cavern.asteroidInterior.cavernVisible).toBe(true);
  expect(cavern.asteroidInterior.arenaVisible).toBe(false);
  await page.screenshot({ path: info.outputPath('asteroid-interior.png') });

  await page.evaluate(() => window.fixture.advance(56));
  const core = await page.evaluate(() => window.fixture.game.snapshot());
  expect(core.journey.phase).toBe('boss');
  expect(core.boss).toBe(true);
  expect(core.asteroidInterior.arenaVisible).toBe(true);
  await page.screenshot({ path: info.outputPath('asteroid-boss-arena.png') });

  // A boss can only unlock the exit after its actual combat defeat.
  await page.evaluate(() => window.fixture.hangar());
  const cleared = await page.evaluate(() => window.fixture.game.snapshot());
  expect(cleared.journey.phase).toBe('complete');
  expect(cleared.state).toBe('shop');
  expect(errors).toEqual([]);
});
