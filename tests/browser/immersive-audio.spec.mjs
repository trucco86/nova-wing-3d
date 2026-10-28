import { test, expect } from '@playwright/test';

test('mechanical effects and turbine mix render audibly with exact mute and pause silence', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/__audio.html');
  await page.locator('#renderEffects').click();
  await expect(page.locator('body')).toHaveAttribute('data-effects-ready', 'true', {
    timeout: 90000,
  });
  const metrics = JSON.parse(await page.locator('#effectsMetrics').textContent());
  expect(metrics.finite).toBe(true);
  expect(metrics.peak).toBeLessThan(0.98);
  for (const segment of metrics.segments) {
    expect(segment.finite).toBe(true);
    if (['pause', 'mute'].includes(segment.name)) expect(segment.rms).toBeLessThan(0.00001);
    else expect(segment.rms, segment.name + ' must produce actual samples').toBeGreaterThan(0.001);
  }
  expect(metrics.afterDestroy.voices).toBe(0);
  expect(metrics.afterDestroy.engineActive).toBe(false);
  expect(metrics.afterDestroy.destroyed).toBe(true);
  const pending = page.waitForEvent('download');
  await page.locator('#effectsDownload').click();
  await (await pending).saveAs(info.outputPath('nova-wing-immersive-effects.wav'));
  await info.attach('effects-mix-metrics', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
});

test('real flight controls drive mechanical audio without extra contexts and stop it on pause or zero SFX volume', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    window.audioContextCount = 0;
    window.AudioContext = class extends Original {
      constructor(...args) {
        super(...args);
        window.audioContextCount++;
        window.lastAudioContext = this;
      }
    };
  });
  await page.goto('/__dynamic.html?sector=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // The fixture starts before a gesture. Use the actual resume control to unlock audio.
  await page.locator('#pause').click();
  await page.locator('#pauseResume').click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        window.fixture.advance(0.01);
        return window.fixture.game.snapshot().audio.engineActive;
      }),
    )
    .toBe(true);
  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');
  await page.evaluate(() => window.fixture.advance(0.05));
  let audio = await page.evaluate(() => window.fixture.game.snapshot().audio);
  expect(audio.lastCue).toBe('transformRobot');
  expect(audio.engineMode).toBe('robot');
  await page.keyboard.down('ShiftLeft');
  await page.evaluate(() => window.fixture.advance(0.1));
  audio = await page.evaluate(() => window.fixture.game.snapshot().audio);
  expect(audio.lastCue).toBe('boostIgnition');
  expect(audio.engineMode).toBe('boost');
  await page.keyboard.up('ShiftLeft');
  await page.locator('#pause').click();
  expect(await page.evaluate(() => window.fixture.game.snapshot().audio.engineActive)).toBe(false);
  expect(await page.evaluate(() => window.fixture.game.snapshot().audio.voices)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.lastAudioContext.state)).toBe('suspended');
  const pausedClock = await page.evaluate(() => window.lastAudioContext.currentTime);
  await page.evaluate(() => window.fixture.advance(1));
  expect(await page.evaluate(() => window.lastAudioContext.currentTime)).toBe(pausedClock);
  await page.locator('#pauseOptions').click();
  await page.locator('#settingSfx').press('Home');
  await expect(page.locator('#settingSfx')).toHaveValue('0');
  await page.locator('#settingsClose').click();
  await page.locator('#pauseResume').click();
  await expect.poll(() => page.evaluate(() => window.lastAudioContext.state)).toBe('running');
  await page.evaluate(() => window.fixture.advance(0.1));
  expect(await page.evaluate(() => window.fixture.game.snapshot().audio.engineActive)).toBe(false);
  expect(await page.evaluate(() => window.audioContextCount)).toBe(1);
});
