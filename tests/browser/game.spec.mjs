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
test('held depleted boost settles at cruise and rearms on keyboard and touch', async ({
  page,
}, info) => {
  // Software WebGL can take over 30 wall-clock seconds for 3.4 simulated seconds.
  // The CI trace still had 50% energy at the old deadline; preserve all state assertions.
  test.setTimeout(150000);
  await page.goto('/');
  await page.locator('#start').click();
  const mobile = info.project.name === 'mobile';
  if (mobile) {
    const bounds = await page.locator('#boostTouch').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
  } else await page.keyboard.down('Shift');
  await expect(page.locator('body')).toHaveClass(/boosting/);
  await expect(page.locator('#speedValue')).toHaveText('890');
  await expect(page.locator('#message')).toContainText('IMPULSO ESGOTADO', { timeout: 90000 });
  await expect
    .poll(() => page.locator('#energy').evaluate((el) => parseFloat(el.style.width)), {
      timeout: 40000,
    })
    .toBeGreaterThan(20);
  await expect(page.locator('body')).not.toHaveClass(/boosting/);
  await expect(page.locator('#speedValue')).toHaveText('480');
  await page.screenshot({ path: info.outputPath('boost-depleted.png') });
  if (mobile) {
    await page.mouse.up();
    await page.mouse.down();
  } else {
    await page.keyboard.up('Shift');
    await page.keyboard.down('Shift');
  }
  await expect(page.locator('body')).toHaveClass(/boosting/);
  await expect(page.locator('#speedValue')).toHaveText('890');
  await page.screenshot({ path: info.outputPath('boost-rearmed.png') });
  if (mobile) await page.mouse.up();
  else await page.keyboard.up('Shift');
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

test('evolving pods, distinct rings, cruiser and reactor collapse render', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const mode of ['equipment', 'subboss', 'collapse']) {
    await page.goto('/__visual.html?mode=' + mode);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const shot = await page.screenshot({ path: info.outputPath(mode + '.png') });
    expect(shot.length).toBeGreaterThan(15000);
  }
  expect(errors).toEqual([]);
});
test('six music states render finite audible audio without clipping', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.goto('/__audio.html');
  await page.getByRole('button', { name: 'Renderizar trilha' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-audio-ready', 'true', {
    timeout: 60000,
  });
  const metrics = JSON.parse(await page.locator('pre').textContent());
  expect(metrics.map((m) => m.mode)).toEqual([
    'sector',
    'subboss',
    'boss',
    'enraged',
    'collapse',
    'victory',
  ]);
  for (const m of metrics) {
    expect(m.finite).toBe(true);
    expect(m.rms).toBeGreaterThan(0.005);
    expect(m.peak).toBeLessThan(0.98);
  }
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Baixar demonstração' }).click();
  await (await download).saveAs(info.outputPath('nova-wing-music.wav'));
  await info.attach('audio-metrics', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
});

test('boost streaks follow keyboard or touch input and disappear on pause', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.locator('#start').click();
  if (info.project.name === 'mobile') {
    const bounds = await page.locator('#boostTouch').boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
  } else await page.keyboard.down('Shift');
  await expect(page.locator('body')).toHaveClass(/boosting/);
  await page.screenshot({ path: info.outputPath('boost.png') });
  await page.locator('#pause').click();
  await expect(page.locator('body')).not.toHaveClass(/boosting/);
});
test('ten distinct subboss silhouettes render', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (let i = 0; i < 10; i++) {
    await page.goto('/__visual.html?mode=subboss&sector=' + i);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.screenshot({ path: info.outputPath('subboss-' + i + '.png') });
  }
  expect(errors).toEqual([]);
});

test('minimal title screen hides combat HUD and fits landscape and portrait', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.locator('#loadout')).toBeHidden();
  await expect(page.locator('.title-help')).not.toHaveAttribute('open', '');
  await expect(page.locator('#start')).toBeInViewport();
  await page.screenshot({ path: info.outputPath('title.png') });
  await page.locator('.title-help summary').click();
  await expect(page.locator('.help-panel')).toBeVisible();
  await page.locator('.title-help summary').click();
  if (info.project.name === 'mobile') {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(390);
    await expect(page.locator('#start')).toHaveCSS('width', '300px');
    await expect(page.locator('#start')).toBeInViewport();
    await page.screenshot({ path: info.outputPath('title-portrait.png') });
  }
});
test('holding Space never activates focused browser-page buttons or selects HUD text', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#start').click();
  await page.locator('#music').focus();
  const label = await page.locator('#music').textContent();
  await page.keyboard.down('Space');
  await expect
    .poll(() => page.locator('#chargeBar').evaluate((el) => parseFloat(el.style.width)), {
      timeout: 15000,
    })
    .toBeGreaterThan(30);
  await page.keyboard.up('Space');
  await expect(page.locator('#music')).toHaveText(label);
  const blocked = await page
    .locator('#loadout')
    .evaluate(
      (el) => !el.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true })),
    );
  expect(blocked).toBe(true);
  expect(await page.locator('#loadout').evaluate((el) => getComputedStyle(el).userSelect)).toBe(
    'none',
  );
});
