import { test, expect } from '@playwright/test';

test('stage 6 Colossus physically extends claws to the latched ship lane, then switches to overhead hammer', async ({
  page,
}, info) => {
  test.setTimeout(110000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=5&qaBoss=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();

  const samples = [];
  for (const [age, kind, state, strikingClaws] of [
    [8.9, 'cryo-pincer', 'windup', 0],
    [10.72, 'cryo-pincer', 'attack', 2],
    [11.7, 'cryo-pincer', 'recovery', 0],
    [14.5, 'cryo-pincer', 'maneuver', 0],
    [20.9, 'ice-quake', 'windup', 0],
    [22.72, 'ice-quake', 'attack', 1],
    [23.8, 'ice-quake', 'recovery', 0],
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
    expect(strike.claws.filter((claw) => claw.visible)).toHaveLength(2);
    expect(strike.claws.filter((claw) => claw.flash)).toHaveLength(strikingClaws);
    expect(snapshot.bossZ).toBeLessThanOrEqual(-155);
    expect(snapshot.entities.obstacles).toBe(0);
    if (state === 'attack') {
      // The body stays at the arena center. Actual appendage mesh, not a
      // duplicate floating sprite, must reach the ship's depth and committed
      // horizontal/vertical danger coordinates.
      for (const claw of strike.claws.filter((item) => item.flash)) {
        expect(Math.abs(claw.contact[0] - strike.target[0])).toBeLessThan(25);
        expect(Math.abs(claw.contact[1] - strike.target[1])).toBeLessThan(14);
        expect(Math.abs(claw.contact[2] - snapshot.playerDepth)).toBeLessThan(35);
        expect(claw.flash).toBe(true);
        expect(claw.visualScale).toBeLessThanOrEqual(0.38);
        expect(claw.flashRadius).toBeLessThan(0.45);
      }
    }
    if (state === 'attack' || state === 'recovery' || state === 'maneuver')
      await page.screenshot({
        path: info.outputPath('qa172-colossus-' + kind + '-' + state + '.png'),
      });
    samples.push(snapshot);
  }
  expect(samples[0].bossZ).toBeCloseTo(samples[1].bossZ, 1);
  expect(samples[4].bossZ).toBeCloseTo(samples[5].bossZ, 1);
  expect(errors).toEqual([]);
});
