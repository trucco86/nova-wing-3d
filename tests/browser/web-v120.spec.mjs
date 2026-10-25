import { test, expect } from '@playwright/test';

test('subboss reaches combat quickly and telegraphs its distinct attack', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // Seek the real windup frame after the longer first-sector approach.
  // The subboss now spawns after 22% of a 130-second level, not at 19.8s.
  const before = await page.evaluate(() => {
    for (let i = 0; i < 48; i++) {
      window.fixture.game.collect('shield');
      window.fixture.advance(1);
      const state = window.fixture.game.snapshot();
      const subboss = state.targets.find((enemy) => enemy.kind === 'subboss');
      if (subboss?.charging && subboss.z > -100 && subboss.z < -75) return state;
    }
    return window.fixture.game.snapshot();
  });
  const subboss = before.targets.find((enemy) => enemy.kind === 'subboss');
  expect(subboss).toMatchObject({
    tactic: 'strafe',
    attack: 'RAJADA FRONTAL',
    charging: true,
    phase: 1,
  });
  expect(subboss.z).toBeGreaterThan(-100);
  await expect(page.locator('#subState')).toContainText('RAJADA FRONTAL');
  const labels = await page.evaluate(() => {
    const stage = document.querySelector('#stage').getBoundingClientRect();
    const subboss = document.querySelector('#subState').getBoundingClientRect();
    return { stageBottom: stage.bottom, subbossTop: subboss.top };
  });
  expect(labels.subbossTop).toBeGreaterThan(labels.stageBottom + 4);
  await page.screenshot({ path: info.outputPath('subboss-charge.png') });

  await page.locator('#pause').click();
  await page.evaluate(() => window.fixture.advance(2));
  expect(await page.evaluate(() => window.fixture.game.snapshot().targets)).toEqual(before.targets);
  await page.locator('#pauseResume').click();
  await page.evaluate(() => window.fixture.advance(0.7));
  const fired = await page.evaluate(() => window.fixture.game.snapshot());
  expect(fired.targets.find((enemy) => enemy.kind === 'subboss').charging).toBe(false);
  expect(fired.entities.hostile).toBeGreaterThan(before.entities.hostile);

  const frames = await page.evaluate(async () => {
    const values = [];
    let previous = performance.now();
    for (let i = 0; i < 30; i++) {
      const now = await new Promise((resolve) => requestAnimationFrame(resolve));
      window.fixture.game.step(0);
      values.push(now - previous);
      previous = now;
    }
    return values.slice(1).sort((a, b) => a - b);
  });
  await info.attach('subboss-frame-times', {
    body: JSON.stringify(
      {
        viewport: page.viewportSize(),
        renderer: 'Chromium SwiftShader CI',
        samples: frames.length,
        medianFrameMs: frames[Math.floor(frames.length / 2)],
        p95FrameMs: frames[Math.floor(frames.length * 0.95)],
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  expect(frames.every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
  await page.screenshot({ path: info.outputPath('subboss-volley.png') });
  expect(errors).toEqual([]);
});
