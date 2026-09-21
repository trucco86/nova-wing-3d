import { test, expect } from '@playwright/test';
test('WebGL starts, renders, plays and pauses without runtime errors', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /INICIAR MISSÃO/ })).toBeEnabled();
  // A disabled WebGL context is a failure in this required CI job, never a skipped pass.
  expect(await page.locator('#brief').innerText()).not.toContain('não conseguiu');
  await page.getByRole('button', { name: /INICIAR MISSÃO/ }).click();
  await expect(page.locator('#menu')).toBeHidden();
  await page.locator('#music').click();
  await expect(page.locator('#music')).toHaveText('♪ OFF');
  await page.locator('#music').click();
  await expect(page.locator('#stage')).toContainText('CIDADE DAS MÁQUINAS');
  if (info.project.name === 'mobile') {
    await expect(page.locator('#touch')).toBeVisible();
    await page.locator('#bombTouch').tap();
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.press('KeyB');
    await page.keyboard.up('Space');
  }
  await expect(page.locator('#bombs')).toHaveText('◆ ◆');
  await page.getByRole('button', { name: 'Pausar jogo' }).click();
  await expect(page.locator('#message')).toContainText('PAUSADO');
  await expect(page.locator('#pause')).toHaveText('▶');
  await expect(page.locator('#game')).toHaveJSProperty(
    'width',
    info.project.name === 'mobile' ? 844 : 1366,
  );
  await page.screenshot({ path: test.info().outputPath('mission.png') });
  expect(errors).toEqual([]);
});
test('missing WebGL presents an honest, non-interactive error', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.startsWith('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#start')).toBeDisabled();
  await expect(page.locator('#brief')).toContainText('não conseguiu iniciar o 3D');
});

test('checkpoint restores the final sector with independent music control', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'nova-wing-3d-v1',
      JSON.stringify({ version: 1, sector: 9, credits: 500, weapon: 3, armor: 1, pods: 2 }),
    ),
  );
  await page.goto('/');
  await page.locator('#continue').click();
  await expect(page.locator('#stage')).toHaveText('TRONO DE MARVIN');
  await expect(page.locator('#weaponLabel')).toContainText('PLASMA VÓRTICE');
  await page.locator('#music').click();
  await expect(page.locator('#music')).toHaveText('♪ OFF');
  await expect(page.locator('#sound')).toHaveText('SOM ON');
});
test('colossal bosses and sector scenery render in WebGL', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const sector of info.project.name === 'desktop'
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    : [0, 5, 9]) {
    await page.goto('/__visual.html?sector=' + sector);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('canvas')).toBeVisible();
    const shot = await page.screenshot({ path: info.outputPath('boss-' + (sector + 1) + '.png') });
    expect(shot.length).toBeGreaterThan(15000);
  }
  expect(errors).toEqual([]);
});

test('held mobile controls suppress browser gestures and release on pause', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'mobile',
    'Controles de toque são apresentados apenas em dispositivos coarse.',
  );
  await page.goto('/');
  await page.locator('#start').tap();
  const fire = page.locator('#fireTouch');
  await expect(fire).toBeVisible();
  expect(await fire.evaluate((el) => getComputedStyle(el).touchAction)).toBe('none');
  expect(await fire.evaluate((el) => getComputedStyle(el).userSelect)).toBe('none');
  const bounds = await fire.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await expect(fire).toHaveClass(/pressed/);
  await expect
    .poll(async () => page.locator('#chargeBar').evaluate((el) => parseFloat(el.style.width)), {
      timeout: 15000,
    })
    .toBeGreaterThan(65);
  const cancelled = await fire.evaluate(
    (el) => !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  );
  expect(cancelled).toBe(true);
  await page.mouse.up();
  await expect(fire).not.toHaveClass(/pressed/);
  await page.locator('#pause').tap();
  await expect(page.locator('#pause')).toHaveText('▶');
  expect(
    await page.evaluate(() => ({ x: scrollX, y: scrollY, selection: String(getSelection()) })),
  ).toEqual({ x: 0, y: 0, selection: '' });
  const comms = await page.locator('#comms').evaluate((el) => ({
    pointer: getComputedStyle(el).pointerEvents,
    background: getComputedStyle(el).backgroundImage,
  }));
  expect(comms.pointer).toBe('none');
  const alpha = Number(comms.background.match(/rgba\([^)]*,\s*([0-9.]+)\)/)?.[1]);
  expect(alpha).toBeGreaterThan(0);
  expect(alpha).toBeLessThanOrEqual(0.35);
  await page.screenshot({ path: info.outputPath('mobile-controls.png') });
});

test('industrial tunnel and terrestrial enemies render with lateral camera views', async ({
  page,
}, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const mode of ['ground', 'tunnel']) {
    await page.goto('/__visual.html?mode=' + mode + '&lateral=12');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const shot = await page.screenshot({ path: info.outputPath(mode + '.png') });
    expect(shot.length).toBeGreaterThan(15000);
  }
  expect(errors).toEqual([]);
});
