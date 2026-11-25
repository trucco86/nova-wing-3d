import { test, expect } from '@playwright/test';
import {
  dodgeDecision,
  dodgeKeys,
  dodgeTouchOffset,
} from '../../tools/gameplay-boss-dodge-policy.mjs';
import {
  summarizeEncounter,
  compareEncounters,
} from '../../tools/gameplay-boss-encounter-metrics.mjs';

async function runEncounter(page, info, sector, reactive) {
  await page.goto('/__dynamic.html?sector=' + sector + '&qaBoss=' + sector);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();
  const samples = [];
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  const mobile = info.project.name === 'mobile';
  const touch = mobile ? await page.context().newCDPSession(page) : null;
  const stick = mobile ? await page.locator('#stick').boundingBox() : null;
  let pressed = [];
  let touching = false;
  try {
    if (mobile && !stick) throw new Error('Missing mobile joystick');
    // Separate fixture executions start at the same authored encounter.
    // Only the reactive route consumes the visible radar guide.
    for (let i = 0; i <= 120; i++) {
      const state = await page.evaluate(() => {
        const s = window.fixture.game.snapshot();
        const radar = document.getElementById('battleRadar');
        const guide = document.getElementById('radarGuide');
        const danger = guide.getAttribute('data-danger');
        return {
          age: s.bossAge,
          shield: s.shield,
          player: s.player,
          state: s.state,
          boss: s.boss,
          phase: s.tactics.state,
          cycle: s.tactics.cycle,
          kind: s.bossIntent?.kind ?? null,
          mode: radar.getAttribute('data-mode'),
          danger: danger === 'true' ? true : danger === 'false' ? false : null,
          guide: guide.hidden ? null : guide.textContent,
        };
      });
      if (!state.boss || state.state !== 'playing') break;
      const decision = reactive ? dodgeDecision(state) : { x: 0, y: 0, reason: 'passive' };
      const keys = dodgeKeys(decision);
      samples.push({ ...state, decision, input: keys });
      if (i === 120) break;
      if (touch) {
        if (touching) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
          touching = false;
        }
        if (keys.length) {
          const center = {
            x: stick.x + stick.width / 2,
            y: stick.y + stick.height / 2,
            id: 1,
          };
          const offset = dodgeTouchOffset(decision, Math.min(stick.width, stick.height) * 0.4);
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [center],
          });
          touching = true;
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ ...center, x: center.x + offset.x, y: center.y + offset.y }],
          });
        }
      } else {
        for (const key of pressed.filter((key) => !keys.includes(key))) {
          await page.keyboard.up(key);
        }
        for (const key of keys.filter((key) => !pressed.includes(key))) {
          await page.keyboard.down(key);
        }
        pressed = keys;
      }
      await page.evaluate(() => window.fixture.advance(0.25, { renderAfter: false }));
    }
    await page.evaluate(() => window.fixture.advance(0));
    const label = reactive ? 'reactive' : 'passive';
    const path = info.outputPath(label + '-boss.png');
    await page.screenshot({ path });
    await info.attach(label + '-checkpoint', { path, contentType: 'image/png' });
  } finally {
    for (const key of pressed) await page.keyboard.up(key);
    if (touch) {
      if (touching) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await touch.detach();
    }
    page.off('pageerror', onError);
  }
  return { samples, errors, metrics: summarizeEncounter(samples) };
}

for (const encounter of [
  { sector: 0, name: 'Rok' },
  { sector: 5, name: 'Colossus' },
]) {
  test('boss reactive probe: ' + encounter.name, async ({ page }, info) => {
    test.setTimeout(180000);
    const passive = await runEncounter(page, info, encounter.sector, false);
    const reactive = await runEncounter(page, info, encounter.sector, true);
    const comparison = compareEncounters(passive.metrics, reactive.metrics);
    await info.attach('boss-comparison.json', {
      body: Buffer.from(JSON.stringify({ encounter, passive, reactive, comparison }, null, 2)),
      contentType: 'application/json',
    });
    expect(passive.errors).toEqual([]);
    expect(reactive.errors).toEqual([]);
    expect(passive.metrics.attackWindows, 'passive physical warnings').toBeGreaterThan(0);
    expect(reactive.metrics.attackWindows, 'reactive physical warnings').toBeGreaterThan(0);
    // No arbitrary success assertion for shield loss; report differences for review.
    expect(comparison.releaseAuthorized).toBe(false);
  });
}
