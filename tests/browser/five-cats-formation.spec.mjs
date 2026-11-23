import { test, expect } from '@playwright/test';

test('Five Cats launches real player fighter with four escorts from enclosed hangar', async ({
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
  expect(intro.visibleTagCount).toBe(0);
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeLessThan(0.1);
  await expect(page.locator('body')).toHaveClass(/launch-cinematic/);
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#touch')).toBeHidden();
  for (const selector of ['#cameraView', '#pilotSwitch', '#pilotName', '#loadout'])
    await expect(page.locator(selector)).toBeHidden();
  await expect(page.locator('#launchSkip')).toBeVisible();
  await page.screenshot({ path: info.outputPath('bia-five-cats-formation-mobile.png') });
  await page.evaluate(() => window.fixture.advance(5.6));
  expect(await page.evaluate(() => window.fixture.game.snapshot().fiveCats.intro)).toBe(0);
  await expect(page.locator('#squadFormationStatus')).toBeHidden();
  await page.evaluate(() => window.fixture.advance(0.6));
  expect(await page.evaluate(() => window.fixture.game.snapshot().seconds)).toBeGreaterThan(0.5);
});

test('stage-one departure has readable hangar, gate crossing and approach on desktop/mobile', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/__dynamic.html?sector=0&intro=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  let previous = 0;
  for (const [t, shot] of [
    [0.4, 'hangar'],
    [2.1, 'exit'],
    [2.6, 'exit'],
    [5.3, 'approach'],
  ]) {
    await page.evaluate((delta) => window.fixture.advance(delta), t - previous);
    previous = t;
    const state = await page.evaluate(() => window.fixture.game.snapshot());
    expect(state.fiveCats.launchShot).toBe(shot);
    expect(state.fiveCats.playerIsLeader).toBe(true);
    expect(state.fiveCats.visible).toHaveLength(4);
    expect(state.seconds).toBe(0);
    expect(state.fiveCats.visibleTagCount).toBe(0);
    await expect(page.locator('#hud')).toBeHidden();
    await expect(page.locator('#touch')).toBeHidden();
    for (const selector of ['#cameraView', '#pilotSwitch', '#pilotName', '#loadout'])
      await expect(page.locator(selector)).toBeHidden();
    await page.screenshot({ path: info.outputPath('launch-' + shot + '-' + Math.round(t * 10) + '.png') });
  }
  await page.evaluate(() => window.fixture.advance(1.5));
  await expect(page.locator('body')).not.toHaveClass(/launch-cinematic/);
  await expect(page.locator('#launchSkip')).toBeHidden();
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
