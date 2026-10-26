import { test, expect } from '@playwright/test';
import { SECTORS } from '../../src/campaign.js';

test('Options starts in Normal and changes actual damage without persisting the mode', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  await page.evaluate(() => window.fixture.game.pause());
  await page.locator('#pauseOptions').click();
  await expect(page.locator('#settingDifficulty')).toHaveValue('normal');
  await page.locator('#settingDifficulty').selectOption('easy');
  expect((await page.evaluate(() => window.fixture.game.snapshot())).settings.difficulty).toBe(
    'easy',
  );
  await page.screenshot({ path: info.outputPath('options-difficulty-easy.png') });
  await page.locator('#settingsClose').click();
  await page.locator('#pauseResume').click();
  await page.evaluate(() => {
    window.fixture.advance(3.1);
    window.fixture.game.damage(20);
  });
  expect((await page.evaluate(() => window.fixture.game.snapshot())).shield).toBe(86);
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  expect((await page.evaluate(() => window.fixture.game.snapshot())).settings.difficulty).toBe(
    'normal',
  );
  expect(runtimeErrors).toEqual([]);
});

test('first subboss remains visible with a protected opening and quieter escort traffic', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  const firstArrival = SECTORS[0].duration * 0.22;
  const state = await page.evaluate((arrival) => {
    while (window.fixture.game.snapshot().seconds < arrival + 3) {
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5);
    }
    return window.fixture.game.snapshot();
  }, firstArrival);

  expect(state.encounterKinds).toContain('subboss');
  expect(state.encounterKinds, 'supply-base enemy must not obstruct the opening').not.toContain(
    'base',
  );
  expect(state.orbitalLaunch.complete).toBe(false);
  expect(
    state.obstacleKinds.some((kind) => ['satellite', 'carrier', 'debris'].includes(kind)),
  ).toBe(false);
  expect(state.obstacleKinds, 'no leftover city obstacle should block the subboss opening').toEqual(
    [],
  );
  await expect(page.locator('#subHUD')).toBeVisible();
  await page.screenshot({ path: info.outputPath('first-subboss-normal.png') });
  expect(runtimeErrors).toEqual([]);
});
