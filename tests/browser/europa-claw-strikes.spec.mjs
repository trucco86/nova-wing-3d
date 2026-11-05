import { test, expect } from '@playwright/test';

test('stage 6 Colossus physically extends claws to the latched ship lane, then switches to overhead hammer', async ({
  page,
}) => {
  test.setTimeout(110000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=5&qaBoss=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();

  const samples = [];
  for (const [age, kind, state, activeClaws] of [
    [8.9, 'cryo-pincer', 'windup', 2],
    [10.72, 'cryo-pincer', 'attack', 2],
    [20.9, 'ice-quake', 'windup', 1],
    [22.72, 'ice-quake', 'attack', 1],
  ]) {
    const snapshot = await page.evaluate((seconds) => {
      const { game, advance } = window.fixture;
      const now = game.snapshot().bossAge;
      if (seconds > now) advance(seconds - now);
      return game.snapshot();
    }, age);
    const strike = snapshot.europaArena?.strike;
    expect(snapshot.sector).toBe(6);
    expect(strike?.kind).toBe(kind);
    expect(strike?.state).toBe(state);
    expect(strike?.claws).toHaveLength(2);
    expect(strike.claws.filter((claw) => claw.visible)).toHaveLength(activeClaws);
    expect(snapshot.bossZ).toBeLessThanOrEqual(-155);
    expect(snapshot.entities.obstacles).toBe(0);
    if (state === 'attack') {
      // The body stays at the arena center. Actual appendage mesh, not a
      // duplicate floating sprite, must reach the ship's depth and committed
      // horizontal/vertical danger coordinates.
      for (const claw of strike.claws.filter((item) => item.visible)) {
        expect(Math.abs(claw.contact[0] - strike.target[0])).toBeLessThan(25);
        expect(Math.abs(claw.contact[1] - strike.target[1])).toBeLessThan(14);
        expect(Math.abs(claw.contact[2] - snapshot.playerDepth)).toBeLessThan(35);
        expect(claw.flash).toBe(true);
      }
    }
    samples.push(snapshot);
  }
  expect(samples[0].bossZ).toBeCloseTo(samples[1].bossZ, 1);
  expect(samples[2].bossZ).toBeCloseTo(samples[3].bossZ, 1);
  expect(errors).toEqual([]);
});
