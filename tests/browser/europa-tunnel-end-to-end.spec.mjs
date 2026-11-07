import { test, expect } from '@playwright/test';

// Real developer-only scenario, not a fake WebGL mock or manually toggled
// shader. It uses the same obstacle physics, fighter update and world renderer
// as a full stage-6 mission, but starts at the part that needs visual review.
test('Europa ice tunnel breaks before a fighter enters, drops debris and returns to frozen terrain', async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=5&qaTunnel=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

  const start = await page.evaluate(() => window.fixture.game.snapshot());
  expect(start.developerScenario).toEqual({ sector: 5, encounter: 'tunnel' });
  expect(start.developerSession).toBe(true);
  expect(start.tunnel).toBe(true);
  expect(start.europaTunnel).toHaveLength(1);
  expect(start.europaTunnel[0].breached).toBe(false);
  expect(start.europaTunnel[0].remainingSolidPanels).toBe(1);
  expect(start.europaTunnel[0].panelVisible).toBe(true);
  expect(start.europaTunnel[0].warningVisible).toBe(false);
  expect(start.entities.enemies).toBe(0);
  expect(start.europaSurface.tunnelActive).toBe(true);
  expect(start.europaSurface.groundVisible).toBe(false);
  expect(start.europaSurface.orbitalVisible).toBe(false);
  await page.screenshot({
    path: info.outputPath('europa-tunnel-intact-' + info.project.name + '.png'),
  });

  const warning = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    for (let i = 0; i < 700; i++) {
      advance(0.05, { renderAfter: false });
      const current = game.snapshot();
      if (current.europaTunnel?.[0]?.warningProgress > 0.3) return current;
      if (!current.tunnel) break;
    }
    return game.snapshot();
  });
  expect(warning.tunnel).toBe(true);
  expect(warning.europaTunnel[0].breached).toBe(false);
  expect(warning.europaTunnel[0].warningVisible).toBe(true);
  expect(warning.europaTunnel[0].warningProgress).toBeGreaterThan(0.3);
  expect(warning.europaTunnel[0].remainingSolidPanels).toBe(1);
  expect(warning.europaTunnel[0].panelVisible).toBe(true);
  expect(warning.entities.enemies).toBe(0);
  await page.evaluate(() => window.fixture.advance(0, { renderAfter: true }));
  await page.screenshot({
    path: info.outputPath('europa-tunnel-warning-' + info.project.name + '.png'),
  });

  const breach = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    for (let i = 0; i < 700; i++) {
      advance(0.05, { renderAfter: false });
      const current = game.snapshot();
      if (current.europaTunnel?.[0]?.breached) return current;
      if (!current.tunnel) break;
    }
    return game.snapshot();
  });
  expect(breach.tunnel, 'physical tunnel must still be present at the breach').toBe(true);
  expect(breach.europaTunnel[0].breached).toBe(true);
  expect(breach.europaTunnel[0].remainingSolidPanels).toBe(0);
  expect(breach.europaTunnel[0].panelVisible).toBe(false);
  expect(breach.europaTunnel[0].debrisVisible).toBe(true);
  expect(breach.europaTunnel[0].warningVisible).toBe(false);
  expect(breach.targets.some((enemy) => enemy.kind === 'fighter' && enemy.x > 36)).toBe(true);
  expect(breach.europaSurface.tunnelActive).toBe(true);
  expect(breach.europaSurface.groundVisible).toBe(false);
  await page.evaluate(() => window.fixture.advance(0, { renderAfter: true }));
  await page.screenshot({
    path: info.outputPath('europa-tunnel-breach-' + info.project.name + '.png'),
  });

  const entered = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    for (let i = 0; i < 70; i++) {
      advance(0.05, { renderAfter: false });
      const current = game.snapshot();
      if (current.targets.some((enemy) => enemy.kind === 'fighter' && enemy.x < 30)) return current;
    }
    return game.snapshot();
  });
  expect(entered.tunnel).toBe(true);
  expect(entered.targets.some((enemy) => enemy.kind === 'fighter' && enemy.x < 30)).toBe(true);
  expect(
    entered.europaTunnel[0].debrisY.some((y, i) => y < breach.europaTunnel[0].debrisY[i]),
  ).toBe(true);
  await page.evaluate(() => window.fixture.advance(0, { renderAfter: true }));
  await page.screenshot({
    path: info.outputPath('europa-tunnel-fighter-entry-' + info.project.name + '.png'),
  });

  const exit = await page.evaluate(() => {
    const { game, advance } = window.fixture;
    for (let i = 0; i < 840; i++) {
      advance(0.05, { renderAfter: false });
      const current = game.snapshot();
      if (!current.tunnel) return current;
    }
    return game.snapshot();
  });
  expect(exit.tunnel).toBe(false);
  expect(exit.europaTunnel).toEqual([]);
  expect(exit.europaSurface.tunnelActive).toBe(false);
  expect(exit.europaSurface.groundVisible).toBe(true);
  expect(exit.europaSurface.surfaceVisible).toBe(true);
  expect(exit.europaSurface.destinationGlobeVisible).toBe(false);
  expect(exit.europaSurface.orbitalVisible).toBe(false);
  expect(exit.targets.some((enemy) => enemy.kind === 'fighter')).toBe(false);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.fixture.advance(0, { renderAfter: true }));
  await page.screenshot({
    path: info.outputPath('europa-icy-surface-after-tunnel-' + info.project.name + '.png'),
  });
});
