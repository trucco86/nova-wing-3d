import { expect } from '@playwright/test';

/** Advance the playable first-sector challenge with real keyboard BOOST input.
 * This helper never mutates the mission's internal launch or boss state.
 */
export async function completeOrbitalLaunch(page) {
  let state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.sector).toBe(1);
  if (state.orbitalLaunch.phase === 'city') {
    await page.evaluate(() => {
      const elapsed = window.fixture.game.snapshot().seconds;
      window.fixture.advance(Math.max(0.1, 23 - elapsed));
    });
    state = await page.evaluate(() => window.fixture.game.snapshot());
  }
  if (state.orbitalLaunch.phase === 'boost') {
    if (state.energy < 99) {
      await page.evaluate(() => {
        const energy = window.fixture.game.snapshot().energy;
        window.fixture.advance(Math.max(0, (100 - energy) / 15 + 0.3));
      });
    }
    await page.keyboard.down('Shift');
    await page.evaluate(() => window.fixture.advance(3.6));
    await page.keyboard.up('Shift');
    state = await page.evaluate(() => window.fixture.game.snapshot());
    expect(state.orbitalLaunch.phase).toBe('atmosphere');
    expect(state.orbitalLaunch.exhaustedAt).toBeLessThanOrEqual(5);
  }
  if (state.orbitalLaunch.phase === 'atmosphere') {
    await page.evaluate(() => {
      const elapsed = window.fixture.game.snapshot().orbitalLaunch.atmosphereSeconds;
      window.fixture.advance(Math.max(0, 38.2 - elapsed));
    });
  }
  state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.orbitalLaunch.phase).toBe('orbit');
  expect(state.orbitalLaunch.complete).toBe(true);
  return state;
}

export async function approachBrowserBoss(page, { secondsBefore = 7 } = {}) {
  await completeOrbitalLaunch(page);
  await page.evaluate((secondsBefore) => {
    const seconds = window.fixture.game.snapshot().seconds;
    window.fixture.advance(Math.max(0, 130 - secondsBefore - seconds));
  }, secondsBefore);
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.boss).toBe(false);
  return state;
}

export async function reachBrowserBoss(page, { bossAge = 4 } = {}) {
  await completeOrbitalLaunch(page);
  await page.evaluate((bossAge) => {
    const seconds = window.fixture.game.snapshot().seconds;
    window.fixture.advance(Math.max(0, 130 + bossAge - seconds));
  }, bossAge);
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.boss).toBe(true);
  return state;
}
