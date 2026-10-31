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

test('undefeated city subboss visibly retreats without rewards or blocking the orbital boss', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const arrival = SECTORS[0].duration * 0.22;
  const engaged = await page.evaluate((target) => {
    const maxSteps = Math.ceil(target * 2) + 16;
    for (let i = 0; i < maxSteps; i++) {
      const state = window.fixture.game.snapshot();
      if (state.seconds >= target) {
        window.fixture.advance(0);
        return window.fixture.game.snapshot();
      }
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5, { renderAfter: false });
    }
    const stalled = window.fixture.game.snapshot();
    throw new Error(
      'Subboss approach stalled at ' + stalled.seconds.toFixed(1) +
        's; state=' + stalled.state + '; orbital=' + stalled.orbitalLaunch.phase,
    );
  }, arrival + 20);
  expect(engaged.encounterKinds).toContain('subboss');
  await expect(page.locator('#subHUD')).toBeVisible();
  const retreat = await page.evaluate(() => {
    for (let i = 0; i < 8; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5, { renderAfter: false });
    }
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  const fleeing = retreat.targets.find((target) => target.kind === 'subboss');
  expect(fleeing).toBeDefined();
  expect(fleeing.z).toBeLessThan(-125);
  await expect(page.locator('#subState')).toContainText('RETIRADA');
  await page.screenshot({ path: info.outputPath('first-subboss-withdrawal.png') });

  const escaped = await page.evaluate(() => {
    for (let i = 0; i < 8; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5, { renderAfter: false });
    }
    window.fixture.advance(0);
    return window.fixture.game.snapshot();
  });
  expect(escaped.encounterKinds).not.toContain('subboss');
  // Sixteen explicit shield pickups grant 240 credits. Autonomous blue/shield
  // rings may grant extra 15-credit pickups, but an escaped subboss must not
  // grant the separate 90-credit elite defeat reward.
  const incidentalCredits = escaped.credits - engaged.credits - 16 * 15;
  expect(
    incidentalCredits,
    'pickup earnings cannot become an elite kill reward',
  ).toBeGreaterThanOrEqual(0);
  expect(incidentalCredits, 'subboss retreat must never pay 90 defeat credits').toBeLessThan(90);
  expect(escaped.boss).toBe(false);
  await expect(page.locator('#subHUD')).toBeHidden();

  await page.keyboard.down('Shift');
  await page.evaluate(() => window.fixture.advance(3.6));
  await page.keyboard.up('Shift');
  expect((await page.evaluate(() => window.fixture.game.snapshot())).orbitalLaunch.phase).toBe(
    'atmosphere',
  );
  const completed = await page.evaluate((duration) => {
    // Keep original 0.05s physics steps, pickup and boss assertions, but
    // stop with useful diagnostics rather than an unbounded Playwright hang.
    const maxSteps = Math.ceil((duration + 18) * 2);
    for (let i = 0; i < maxSteps; i++) {
      const state = window.fixture.game.snapshot();
      if (state.seconds >= duration + 1) {
        window.fixture.advance(0);
        return window.fixture.game.snapshot();
      }
      window.fixture.game.collect('shield');
      window.fixture.advance(0.5, { renderAfter: false });
    }
    const stalled = window.fixture.game.snapshot();
    throw new Error(
      'Orbit completion stalled at ' + stalled.seconds.toFixed(1) +
        's; state=' + stalled.state + '; orbital=' +
        stalled.orbitalLaunch.phase + '; launchComplete=' +
        stalled.orbitalLaunch.complete + '; boss=' + stalled.boss,
    );
  }, SECTORS[0].duration);
  expect(completed.orbitalLaunch.complete).toBe(true);
  expect(completed.boss).toBe(true);
  expect(completed.encounterKinds).not.toContain('subboss');
  await page.screenshot({ path: info.outputPath('orbit-boss-after-subboss-retreat.png') });
  expect(errors).toEqual([]);
});
