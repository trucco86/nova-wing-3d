import { test, expect } from '@playwright/test';

test('QA153: mission timer stays compact, tracks real time and cat food awards points', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=1&encounters=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(8.1));
  await expect(page.locator('#missionChrono')).toContainText('00:08');
  const snapshot = await page.evaluate(() => window.fixture.game.snapshot());
  expect(snapshot.missionTime).toMatch(/^00:0[789]$/);
  const before = snapshot.hits;
  await page.evaluate(() => window.fixture.game.collect('pet:fish'));
  await page.evaluate(() => window.fixture.advance(0.1));
  const after = await page.evaluate(() => window.fixture.game.snapshot());
  expect(after.hits).toBeGreaterThanOrEqual(before + 24);
  expect(after.missionScoring.pickups).toBe(1);
  await page.screenshot({ path: info.outputPath('score-timer-cat-loot.png') });
  if (info.project.name === 'mobile') {
    const clock = await page.locator('#missionChrono').boundingBox();
    const pause = await page.locator('#pause').boundingBox();
    expect(clock).not.toBeNull();
    expect(pause).not.toBeNull();
    expect(clock.x + clock.width).toBeLessThanOrEqual(pause.x + 1);
  }
  await page.evaluate(() => window.fixture.game.pause());
  const paused = await page.locator('#missionChrono').innerText();
  await page.evaluate(() => window.fixture.advance(8));
  await expect(page.locator('#missionChrono')).toHaveText(paused);
  expect(errors).toEqual([]);
});
