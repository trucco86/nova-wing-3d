import { test, expect } from '@playwright/test';

test('cockpit instruments show real speed, weapon, map and active cat-specific paws', async ({
  page,
}, info) => {
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(3.2));
  await page.keyboard.press('KeyC');
  await page.evaluate(() => window.fixture.advance(0.1));
  const deck = page.locator('#cockpitPanel');
  await expect(deck).toBeVisible();
  const before = await page.evaluate(() => window.fixture.game.snapshot());
  await expect(page.locator('#cockpitPilot')).toHaveText('BIA');
  await expect(page.locator('#cockpitSpeedValue')).toHaveText(String(before.flightSpeed));
  await expect(page.locator('#cockpitWeapon')).not.toBeEmpty();
  await expect(page.locator('#cockpitMap')).toBeVisible();
  expect(before.cockpit.paws).toBe(2);
  expect(before.cockpit.pilot).toBe('bia');
  await page.screenshot({ path: info.outputPath('cockpit-bia-' + info.project.name + '.png') });

  if (info.project.name === 'mobile') await page.locator('#pilotSwitch').tap();
  else await page.keyboard.press('KeyM');
  await page.evaluate(() => window.fixture.advance(0.05));
  const switched = await page.evaluate(() => window.fixture.game.snapshot());
  expect(switched.loadout.pilot).toBe('bob');
  expect(switched.loadout.ship).toBe('aegis');
  expect(switched.cockpit.pilot).toBe('bob');
  expect(switched.cockpit.pawScale).not.toBe(before.cockpit.pawScale);
  expect(switched.combatMultipliers.speed).not.toBe(before.combatMultipliers.speed);
  expect(switched.maxShield).toBeGreaterThan(before.maxShield);
  await expect(page.locator('#cockpitPilot')).toHaveText('BOB');
  await expect(page.locator('#cockpitShip')).toHaveText('AEGIS-R');
  await page.screenshot({ path: info.outputPath('cockpit-bob-' + info.project.name + '.png') });
  expect(await page.evaluate(() => window.fixture.game.switchPilot())).toBe(false);
});

test('fatal damage means craft retreat, not a dead cat; a reserve pilot takes command', async ({
  page,
}, info) => {
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const damaged = await page.evaluate(() => {
    window.fixture.advance(3.2);
    window.fixture.game.damage(9999);
    return window.fixture.game.snapshot();
  });
  expect(damaged.state).toBe('respawning');
  expect(damaged.lives).toBe(2);
  expect(damaged.pilotRelay.damaged).toContain('bia');
  await expect(page.locator('#message')).toContainText('NAVE AVARIADA');
  const replacement = await page.evaluate(() => {
    window.fixture.advance(1.6);
    return window.fixture.game.snapshot();
  });
  expect(replacement.state).toBe('playing');
  expect(replacement.loadout.pilot).toBe('bob');
  expect(replacement.shield).toBe(replacement.maxShield);
  await expect(page.locator('#pilotHudName')).toHaveText('BOB');
  await expect(page.locator('#pilotName')).toContainText('NAVES');
  await page.screenshot({ path: info.outputPath('craft-handoff-' + info.project.name + '.png') });
});
