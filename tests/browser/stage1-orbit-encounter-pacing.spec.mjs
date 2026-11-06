import { test, expect } from '@playwright/test';

test('stage 1 does not insert new combat during hanging train, mandatory Super Boost and atmospheric climb', async ({ page }, info) => {
  test.setTimeout(160000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&citySetpieces=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  const warning = await page.evaluate(() => {
    window.fixture.advance(18.3);
    return window.fixture.game.snapshot();
  });
  expect(warning.orbitalLaunch.phase).toBe('city');
  expect(warning.cityDestruction.pacing.exclusiveTransit).toBe(true);
  expect(warning.cityDestruction.pacing.canSpawnSubboss).toBe(false);
  expect(warning.cityDestruction.pacing.canSpawnBase).toBe(false);
  expect(warning.cityDestruction.wrecks[0].collisionActive).toBe(true);
  await page.screenshot({ path: info.outputPath('stage1-maglev-exclusive-' + info.project.name + '.png') });

  const boost = await page.evaluate(() => {
    window.fixture.advance(4.05);
    return window.fixture.game.snapshot();
  });
  expect(boost.orbitalLaunch.phase).toBe('boost');
  expect(boost.cityDestruction.pacing.exclusiveTransit).toBe(true);
  expect(boost.cityDestruction.pacing.canSpawnGround).toBe(false);
  await page.screenshot({ path: info.outputPath('stage1-boost-gate-' + info.project.name + '.png') });

  await page.keyboard.down('ShiftLeft');
  const climb = await page.evaluate(() => {
    window.fixture.advance(3.8);
    return window.fixture.game.snapshot();
  });
  await page.keyboard.up('ShiftLeft');
  expect(climb.orbitalLaunch.phase).toBe('atmosphere');
  expect(climb.cityDestruction.pacing.exclusiveTransit).toBe(true);
  expect(climb.cityDestruction.pacing.canSpawnSubboss).toBe(false);

  const orbit = await page.evaluate(() => {
    window.fixture.advance(38.1);
    return window.fixture.game.snapshot();
  });
  expect(orbit.orbitalLaunch.phase).toBe('orbit');
  expect(orbit.cityDestruction.pacing.exclusiveTransit).toBe(true);
  expect(orbit.cityDestruction.pacing.canSpawnBase).toBe(false);
  await page.screenshot({ path: info.outputPath('stage1-earth-orbit-recovery-' + info.project.name + '.png') });

  const reenter = await page.evaluate(() => {
    window.fixture.advance(5.1);
    return window.fixture.game.snapshot();
  });
  expect(reenter.cityDestruction.pacing.exclusiveTransit).toBe(false);
  expect(reenter.cityDestruction.pacing.canSpawnSubboss).toBe(false);
  const subboss = await page.evaluate(() => {
    window.fixture.advance(9.0);
    return window.fixture.game.snapshot();
  });
  expect(subboss.cityDestruction.pacing.canSpawnSubboss).toBe(true);
  expect(subboss.cityDestruction.pacing.subbossIntroQuiet).toBe(true);
  expect(subboss.cityDestruction.pacing.canSpawnBase).toBe(false);
  expect(errors).toEqual([]);
});
