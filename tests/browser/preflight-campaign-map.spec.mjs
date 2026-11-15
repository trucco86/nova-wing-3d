import { test, expect } from '@playwright/test';

test('campaign map opens before the first mission and launches the correct sector', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  if (info.project.name === 'mobile')
    await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&preflight=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#shop')).toBeHidden();
  await expect(page.locator('.campaign-node')).toHaveCount(10);
  await expect(page.locator('.campaign-node.next')).toHaveCount(1);
  await expect(page.locator('#mapProgress')).toContainText('0 / 10');
  await expect(page.locator('#mapSectorTitle')).toContainText('CIDADE DAS MÁQUINAS');
  await expect(page.locator('#mapBack')).toHaveText('VOLTAR AO MENU');
  await expect(page.locator('#mapLaunch')).toHaveText('INICIAR MISSÃO ↗');

  // Screenshot from real WebGL browser and live DOM before the first game frame.
  await page.screenshot({ path: info.outputPath('campaign-map-before-first-mission.png') });

  await page.locator('#mapLaunch').click();
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.sector).toBe(1);
  expect(state.state).toBe('playing');
  expect(state.seconds).toBe(0);
  await expect(page.locator('#campaignMap')).toBeHidden();
  await expect(page.locator('#stage')).toContainText('CIDADE DAS MÁQUINAS');
  expect(errors).toEqual([]);
});

test('preflight map back returns to menu, and Continue reopens correct checkpoint sector', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  if (info.project.name === 'mobile')
    await page.setViewportSize({ width: 320, height: 568 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=2&preflight=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#mapProgress')).toContainText('2 / 10');
  await expect(page.locator('#mapSectorTitle')).toContainText('CINTURÃO DE DESTROÇOS');
  await page.screenshot({ path: info.outputPath('campaign-map-before-checkpoint-stage.png') });

  await page.locator('.campaign-node[data-sector="10"]').click();
  await expect(page.locator('#mapSectorTitle')).toContainText('MARVIN');
  await expect(page.locator('#mapLaunch')).toBeEnabled();
  await page.locator('#mapBack').click();
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#continue')).toBeVisible();
  const persisted = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('nova-wing-3d-v1')).sector,
  );
  expect(persisted).toBe(2);

  await page.locator('#continue').click();
  await expect(page.locator('#campaignMap')).toBeVisible();
  await expect(page.locator('#mapSectorTitle')).toContainText('CINTURÃO DE DESTROÇOS');
  await page.locator('#mapLaunch').click();
  const state = await page.evaluate(() => window.fixture.game.snapshot());
  expect(state.state).toBe('playing');
  expect(state.sector).toBe(3);
  expect(state.credits).toBe(650);
  await expect(page.locator('#campaignMap')).toBeHidden();
  expect(errors).toEqual([]);
});

test('first-mission map fits compact mobile landscape with CTA always visible', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(180000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/__dynamic.html?sector=0&preflight=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const route = await page.locator('.campaign-node').evaluateAll((nodes) =>
    nodes.map((node) => {
      const r = node.getBoundingClientRect();
      return { x: r.left, y: r.top, right: r.right, bottom: r.bottom };
    }),
  );
  expect(route).toHaveLength(10);
  for (const rect of route) {
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(844);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeLessThanOrEqual(390);
  }
  const launch = await page.locator('#mapLaunch').boundingBox();
  expect(launch).not.toBeNull();
  expect(launch.y + launch.height).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath('campaign-map-first-stage-landscape.png') });
});
