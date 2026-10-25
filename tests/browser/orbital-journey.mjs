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

/** Observe an actual shielded interval; the boss rotates independently of mission time. */
export async function waitForBrowserArmoredFront(page, { maxSeconds = 35, dt = 0.05 } = {}) {
  const state = await page.evaluate(
    ({ maxSeconds, dt }) => {
      const game = window.fixture.game;
      for (let i = 0; i < maxSeconds / dt; i++) {
        const current = game.snapshot();
        if (
          current.boss &&
          current.bossAge >= 3.1 &&
          current.bossTargets.length === 2 &&
          current.bossTargets.every((part) => !part.open)
        ) {
          game.orbit(0);
          return current;
        }
        window.fixture.advance(dt, dt);
      }
      game.orbit(0);
      return game.snapshot();
    },
    { maxSeconds, dt },
  );
  expect(state.boss).toBe(true);
  expect(state.bossTargets).toHaveLength(2);
  expect(state.bossAge).toBeGreaterThanOrEqual(3.1);
  expect(state.bossTargets.every((part) => !part.open)).toBe(true);
  return state;
}

/** Use actual orbital inputs until the first generator is aligned and exposed. */
export async function aimAtBrowserFirstGenerator(page, { maxSeconds = 9, dt = 0.05 } = {}) {
  const state = await page.evaluate(
    ({ maxSeconds, dt }) => {
      const game = window.fixture.game;
      for (let i = 0; i < maxSeconds / dt; i++) {
        const current = game.snapshot();
        if (!current.arena || !current.bossTargets[0]?.hp) break;
        const point = current.bossTargets[0];
        const delta = Math.atan2(
          Math.sin(point.angle - current.strategy.orbitAngle),
          Math.cos(point.angle - current.strategy.orbitAngle),
        );
        if (point.open && Math.abs(delta) < 0.35 && current.bossAge >= 3) {
          game.orbit(0);
          return current;
        }
        game.orbit(Math.sign(delta));
        window.fixture.advance(dt, dt);
      }
      game.orbit(0);
      return game.snapshot();
    },
    { maxSeconds, dt },
  );
  expect(state.arena).toBe(true);
  expect(state.bossTargets[0].hp).toBeGreaterThan(0);
  expect(state.bossTargets[0].open).toBe(true);
  const delta = Math.atan2(
    Math.sin(state.bossTargets[0].angle - state.strategy.orbitAngle),
    Math.cos(state.bossTargets[0].angle - state.strategy.orbitAngle),
  );
  expect(Math.abs(delta)).toBeLessThan(0.35);
  return state;
}

/** Dispatch one real precision shot and stop on its first visible impact, not a fixed timer. */
export async function fireBrowserPrecision(page, { maxSeconds = 2 } = {}) {
  const result = await page.evaluate((maxSeconds) => {
    const game = window.fixture.game;
    const before = game.snapshot();
    const fired = game.tacticalAction('precision');
    let event = null;
    for (let i = 0; fired && i < maxSeconds / 0.025; i++) {
      window.fixture.advance(0.025, 0.025);
      const feedback = document.getElementById('hitFeedback');
      if (feedback && !feedback.hidden && feedback.getAttribute('data-impact')) {
        event = {
          type: feedback.getAttribute('data-impact'),
          label: feedback.textContent,
        };
        break;
      }
    }
    return { fired, event, before, after: game.snapshot() };
  }, maxSeconds);
  expect(result.fired).toBe(true);
  expect(result.event, 'real shot must register a visible collision').not.toBeNull();
  expect(result.after.tactics.impactTime).toBeGreaterThan(0);
  return result;
}
