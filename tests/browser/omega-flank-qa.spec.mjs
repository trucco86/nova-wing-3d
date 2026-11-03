import { test, expect } from '@playwright/test';

const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

test('Saturn QA boss counters both real orbital flanks only after sustained exposure', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const side of [-1, 1]) {
    await page.goto('/__dynamic.html?sector=7&qaBoss=7');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();

    // The public developer scenario starts the real Saturn boss, and this
    // fixture drives the same orbit() input as the J/L / touch controls.
    // Its physical weakpoint angle is expressed in the inertial arena frame:
    // it changes with the hull's heading, but not with the camera's orbit.
    const result = await page.evaluate((side) => {
      const { game, advance } = window.fixture;
      const read = () => {
        const s = game.snapshot();
        return {
          playing: s.state === 'playing',
          sector: s.sector,
          boss: s.boss,
          angle: s.strategy.orbitAngle,
          target: s.bossTargets[0]?.angle ?? null,
          targetHp: s.bossTargets[0]?.hp ?? 0,
        };
      };
      const initial = read();
      game.orbit(side);
      advance(1.96, { renderAfter: false });
      game.orbit(0);
      const reachedFlank = read();
      // The pilot crossed the 75-degree detection boundary near the end
      // of the move; the full perception delay has not elapsed yet.
      advance(0.8, { renderAfter: false });
      const waiting = read();
      advance(1.2, { renderAfter: false });
      const responding = read();
      advance(0);
      return { initial, reachedFlank, waiting, responding };
    }, side);

    for (const entry of Object.values(result)) {
      expect(entry.playing, 'boss encounter must remain playable').toBe(true);
      expect(entry.sector).toBe(8);
      expect(entry.boss).toBe(true);
      expect(entry.targetHp).toBeGreaterThan(0);
    }
    expect(result.reachedFlank.angle * side).toBeGreaterThan(1.5);
    expect(result.reachedFlank.angle * side).toBeLessThan(1.7);
    expect(
      Math.abs(wrap(result.waiting.target - result.initial.target)),
      'orbital camera must not rotate the physical boss before the delay',
    ).toBeLessThan(0.025);
    expect(
      wrap(result.responding.target - result.waiting.target) * side,
      'actual boss must turn its hull toward the sustained left/right flank',
    ).toBeGreaterThan(0.08);
    await page.screenshot({
      path: info.outputPath(
        'saturn-omega-' + (side < 0 ? 'left' : 'right') + '-' + info.project.name + '.png',
      ),
    });
  }
  expect(errors).toEqual([]);
});

const center = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

test('Saturn mobile thumb orbit closes RPG and triggers delayed Omega turn on both sides', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Real mobile touch environment required');
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const side of [-1, 1]) {
      await page.goto('/__dynamic.html?sector=7&qaBoss=7');
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('#bossHUD')).toBeVisible();
      const drawer = page.locator('#strategyDrawer');
      await drawer.locator('summary').tap();
      await expect(drawer).toHaveAttribute('open');
      const button = page.locator(side < 0 ? '#orbitLeft' : '#orbitRight');
      await expect(button).toBeVisible();
      const rect = await button.boundingBox();
      expect(rect).not.toBeNull();
      const pos = center(rect);
      expect(
        await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, pos),
        'expanded RPG must not intercept the actual orbit button in Saturn battle',
      ).toBe(side < 0 ? 'orbitLeft' : 'orbitRight');

      const initialTarget = await page.evaluate(
        () => window.fixture.game.snapshot().bossTargets[0].angle,
      );
      const touch = await page.context().newCDPSession(page);
      try {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ ...pos, id: 8 }],
        });
        await expect(drawer).not.toHaveAttribute('open');
        await page.evaluate(() => window.fixture.advance(1.96, { renderAfter: false }));
      } finally {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await touch.detach();
      }
      const flank = await page.evaluate(() => window.fixture.game.snapshot());
      expect(flank.sector).toBe(8);
      expect(flank.boss).toBe(true);
      expect(flank.strategy.orbitAngle * side).toBeGreaterThan(1.5);
      expect(flank.strategy.orbitAngle * side).toBeLessThan(1.7);
      await page.evaluate(() => window.fixture.advance(0.8, { renderAfter: false }));
      const waiting = await page.evaluate(() => window.fixture.game.snapshot());
      expect(
        Math.abs(wrap(waiting.bossTargets[0].angle - initialTarget)),
        'Omega must remain stationary during lateral exposure window',
      ).toBeLessThan(0.025);
      await page.evaluate(() => window.fixture.advance(1.2));
      const responding = await page.evaluate(() => window.fixture.game.snapshot());
      expect(
        wrap(responding.bossTargets[0].angle - waiting.bossTargets[0].angle) * side,
        'actual touch orbit must trigger Omega hull counterturn',
      ).toBeGreaterThan(0.08);
      await expect(page.locator('#orbitLeft')).toBeVisible();
      await expect(page.locator('#orbitRight')).toBeVisible();
      await page.screenshot({
        path: info.outputPath(
          'omega-mobile-' +
            (side < 0 ? 'left' : 'right') +
            '-' +
            viewport.width +
            'x' +
            viewport.height +
            '.png',
        ),
      });
    }
  }
  expect(errors).toEqual([]);
});
