import { test, expect } from '@playwright/test';
import { gameplayReport } from '../gameplay-quality-report.mjs';

const scenarios = [
  { name: 'city', route: 'sector=0', sector: 1 },
  { name: 'mars', route: 'sector=1', sector: 2 },
  { name: 'reactor', route: 'sector=3&qaBoss=3', sector: 4 },
  { name: 'europa', route: 'sector=5&qaTunnel=5', sector: 6 },
];

for (const scenario of scenarios) {
  test('gameplay observer: ' + scenario.name, async ({ page }, info) => {
    test.setTimeout(120000);
    const checks = [];
    const checkpoints = [];
    const errors = [];
    let error = null;
    page.on('pageerror', (event) => errors.push(event.message));
    const snapshot = () => page.evaluate(() => window.fixture.game.snapshot());
    const advance = (seconds) => page.evaluate((time) => window.fixture.advance(time), seconds);
    const check = (id, ok, expected, observed) => {
      checks.push({ id, ok: Boolean(ok), expected, observed });
    };
    const capture = async (name) => {
      const state = await snapshot();
      const path = info.outputPath(name + '.png');
      await page.screenshot({ path });
      await info.attach(name, { path, contentType: 'image/png' });
      checkpoints.push({
        name,
        seconds: state.seconds,
        player: state.player,
        shield: state.shield,
        state: state.state,
        screenshot: name + '.png',
      });
      return state;
    };

    try {
      await page.goto('/__dynamic.html?' + scenario.route);
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      const initial = await capture('start');
      check('sector', initial.sector === scenario.sector, scenario.sector, initial.sector);

      if (scenario.name === 'city') {
        await advance(1.2);
        const before = await snapshot();
        if (info.project.name === 'mobile') {
          const stick = await page.locator('#stick').boundingBox();
          if (!stick) throw new Error('Joystick not visible');
          const touch = await page.context().newCDPSession(page);
          const point = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2, id: 1 };
          try {
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: [point],
            });
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ ...point, x: stick.x + stick.width * 0.9 }],
            });
            await advance(2.65);
          } finally {
            await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await touch.detach();
          }
        } else {
          await page.keyboard.down('KeyD');
          try {
            await advance(2.65);
          } finally {
            await page.keyboard.up('KeyD');
          }
        }
        const after = await capture('right-flank');
        const dx = after.player.x - before.player.x;
        check('steering', dx > 10, 'rightward displacement > 10', dx);
        check('lateral-bound', Math.abs(after.player.x) <= 72, '|x| <= 72', after.player.x);
      } else if (scenario.name === 'mars') {
        await advance(16);
        await capture('atmospheric-entry');
        await advance(14);
        await capture('surface');
        const route = await page.locator('#routeLabel').textContent();
        check('mars-surface', route.includes('SUPERFÍCIE DE MARTE'), 'Mars surface', route);
      } else if (scenario.name === 'reactor') {
        await advance(4.2);
        const entry = await capture('reactor-entry');
        const radius = entry.sabotage?.hall?.clearOrbitRadius;
        check('arena', entry.boss && radius === 190, 'boss and clear radius 190', radius);
        await page.evaluate(() => {
          const { game, advance } = window.fixture;
          game.orbit(1);
          advance(2, { renderAfter: false });
          game.orbit(0);
          advance(0);
        });
        const flank = await capture('reactor-flank');
        const angle = flank.strategy.orbitAngle;
        check('orbit', Math.abs(angle - entry.strategy.orbitAngle) > 1, 'angle delta > 1', angle);
      } else {
        const panel = initial.europaTunnel?.[0];
        check('intact-panel', panel?.remainingSolidPanels === 1, 1, panel?.remainingSolidPanels);
        await page.evaluate(() => {
          const { game, advance } = window.fixture;
          for (let i = 0; i < 1400; i++) {
            const state = game.snapshot();
            if (!state.tunnel || state.europaTunnel?.[0]?.breached) break;
            advance(0.05, { renderAfter: false });
          }
          advance(0);
        });
        const breach = await capture('tunnel-breach');
        const breached = breach.europaTunnel?.[0];
        check('breach', breached?.breached && breached?.debrisVisible, 'breach and debris', breached);
      }
    } catch (failure) {
      error = String(failure);
    }
    check('runtime-errors', errors.length === 0, [], errors);
    const report = gameplayReport({
      scenario: scenario.name,
      project: info.project.name,
      viewport: page.viewportSize(),
      commit: process.env.GITHUB_SHA,
      checks,
      checkpoints,
      error,
    });
    await info.attach('gameplay-quality.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
    expect(report.status, report.error || 'observer execution').not.toBe('BLOCKED');
  });
}
