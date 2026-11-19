import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('Five Cats launch shows the real lead ship and four escorts, then releases flight', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0&intro=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(1.2));
  const intro = await page.evaluate(() => window.fixture.game.snapshot().fiveCats);
  expect(intro.visible).toHaveLength(4);
  expect(intro.visible.some((ship) => ship.pilot === 'bia')).toBe(false);
  expect(intro.playerIsLeader).toBe(true);
  expect(intro.introPilot).toBe('bia');
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeLessThan(0.1);
  await expect(page.locator('#squadFormationStatus')).toBeVisible();
  await page.screenshot({ path: info.outputPath('bia-five-cats-formation-mobile.png') });
  await page.evaluate(() => window.fixture.advance(4.1));
  expect(await page.evaluate(() => window.fixture.game.snapshot().fiveCats.intro)).toBe(0);
  await expect(page.locator('#squadFormationStatus')).toBeHidden();
  await page.evaluate(() => window.fixture.advance(0.6));
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeGreaterThan(0.5);
});

test('stage-one hangar uses four readable camera shots without changing the active fighter', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/__dynamic.html?sector=0&intro=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const observed = [];
  let previous = 0;
  for (const at of [0.3, 1.5, 2.9, 4.5]) {
    await page.evaluate((dt) => window.fixture.advance(dt), at - previous);
    previous = at;
    const data = await page.evaluate(() => window.fixture.game.snapshot());
    observed.push(data.fiveCats.launchShot);
    expect(data.fiveCats.playerIsLeader).toBe(true);
    expect(data.fiveCats.visible).toHaveLength(4);
    expect(data.seconds).toBe(0);
    if (at === 1.5 || at === 2.9)
      await page.screenshot({ path: info.outputPath('launch-shot-' + at + '.png') });
  }
  expect(observed).toEqual(['hangar-wide', 'pilot-close', 'exit-front', 'handoff']);
});

test('skipping story from public menu still launches Five Cats from the hangar', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'play');
  await page.locator('#start').click();
  await expect(page.locator('#cinematic')).toBeVisible();
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await page.locator('#mapLaunch').click();
  await expect(page.locator('#squadFormationStatus')).toBeVisible();
  await expect(page.locator('#squadFormationStatus')).toContainText(
    /HANGAR|MOTORES|DECOLAGEM|CONTROLE/,
  );
  await page.screenshot({ path: info.outputPath('stage-one-hangar-after-story-skip.png') });
});

test('optional preflight teaches and validates real controls before the same selected ship launches', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'play');
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#mapTrain')).toBeVisible();
  await page.locator('#mapTrain').click();
  await expect(page.locator('#preflightTraining')).toBeVisible();
  await expect(page.locator('#campaignMap')).toBeHidden();
  await expect(page.locator('#trainingProgress')).toContainText('0 / 6');
  for (const code of ['ArrowRight', 'Space', 'Shift', 'q', 't', 'c'])
    await page.keyboard.press(code);
  await expect(page.locator('#trainingProgress')).toContainText('6 / 6');
  await page.screenshot({ path: info.outputPath('preflight-practice-before-launch.png') });
  await page.locator('#trainingLaunch').click();
  await expect(page.locator('#preflightTraining')).toBeHidden();
  await expect(page.locator('#campaignMap')).toBeHidden();
  await expect(page.locator('#squadFormationStatus')).toBeVisible();
});

test('pilot explicitly skips hangar cutscene and keeps the same craft', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'play');
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await page.locator('#mapLaunch').click();
  await expect(page.locator('#launchSkip')).toBeVisible();
  await expect(page.locator('#squadFormationStatus')).toBeVisible();
  await page.locator('#launchSkip').click();
  await expect(page.locator('#launchSkip')).toBeHidden();
  await expect(page.locator('#squadFormationStatus')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/stage-intro/);
});

test('Plasma Titan and Five Cats Overdrive fire physical shots without covering center HUD', async ({
  page,
}, info) => {
  test.setTimeout(100000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const plasma = page.locator('#plasmaTitan');
  await page.locator('#strategyDrawer summary').click();
  if (info.project.name === 'mobile') await page.locator('[data-rpg-category="specials"]').click();
  await expect(plasma).toBeVisible();
  await plasma.click();
  await page.evaluate(() => window.fixture.advance(0.35));
  const data = await page.evaluate(() => window.fixture.game.snapshot());
  expect(data.fiveCats.plasmaTime).toBeGreaterThan(0);
  expect(data.entities.shots).toBeGreaterThan(0);
  expect(data.strategy.arcana).toBeLessThan(100);
  await page.screenshot({ path: info.outputPath('plasma-titan-mobile.png') });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.locator('#strategyDrawer summary').click();
  if (info.project.name === 'mobile') await page.locator('[data-rpg-category="specials"]').click();
  await page.locator('#fiveCatsOverdrive').click();
  await page.evaluate(() => window.fixture.advance(0.2));
  const overdrive = await page.evaluate(() => window.fixture.game.snapshot().fiveCats);
  expect(overdrive.overdriveTime).toBeGreaterThan(0);
  expect(overdrive.visible).toHaveLength(4);
  await expect(page.locator('#squadSuperStatus')).toBeVisible();
  await page.screenshot({ path: info.outputPath('five-cats-overdrive-mobile.png') });
});
