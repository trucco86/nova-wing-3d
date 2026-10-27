import { test, expect } from '@playwright/test';

const withinTopZone = async (locator, page) => {
  const r = await locator.boundingBox();
  const size = page.viewportSize();
  expect(r, 'notice has a bounding rectangle').not.toBeNull();
  expect(r.y, 'notice must remain below the upper HUD').toBeGreaterThanOrEqual(55);
  expect(r.y + r.height, 'notice must not occupy the gameplay center').toBeLessThan(
    size.height * 0.49,
  );
};

test('shields, attacks and ordinary communications stay in the top information rail', async ({
  page,
}, info) => {
  test.setTimeout(125000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // On touch screens the sector intro temporarily owns the radio lane.
  if (info.project.name === 'mobile')
    await page.evaluate(() => {
      window.fixture.advance(3.1);
      // Preserve radio visibility for layout assertions after scripted time.
      document.querySelector('#comms').classList.add('active');
      document.querySelector('#message').textContent = 'BIA: SISTEMAS PRONTOS';
    });

  const rail = page.locator('#hudNotices');
  await expect(rail).toBeVisible();
  await expect(page.locator('#comms')).toBeVisible();
  await withinTopZone(page.locator('#comms'), page);
  await page.evaluate(() => {
    window.fixture.advance(3.1);
    window.fixture.game.damage(58);
    window.fixture.advance(0.1);
  });
  await expect(page.locator('#shieldWarning')).toBeVisible();
  await expect(page.locator('#shieldWarning')).toContainText('ESCUDO BAIXO');
  await expect(page.locator('#shieldWarning')).toHaveCSS(
    'animation-name',
    'nw-top-attention-blink',
  );
  await withinTopZone(page.locator('#shieldWarning'), page);
  await page.screenshot({ path: info.outputPath('top-warning-yellow.png') });

  await page.evaluate(() => {
    window.fixture.advance(1.3);
    window.fixture.game.damage(24);
    window.fixture.advance(0.1);
  });
  await expect(page.locator('#criticalWarning')).toBeVisible();
  await expect(page.locator('#shieldWarning')).toBeHidden();
  await expect(page.locator('#criticalWarning')).toHaveCSS('animation-name', 'nw-top-danger-blink');
  await withinTopZone(page.locator('#criticalWarning'), page);
  await page.screenshot({ path: info.outputPath('top-critical-red.png') });
  // Preview the imminent-attack channel in a deterministic state: the boss code
  // supplies its actual warning text and danger severity during a live encounter.
  await page.evaluate(() => {
    const node = document.querySelector('#attackWarning');
    node.textContent = '⚠ ATAQUE IMINENTE';
    node.dataset.severity = 'danger';
  });
  await expect(page.locator('#attackWarning')).toHaveCSS('animation-name', 'nw-top-danger-blink');
  await withinTopZone(page.locator('#attackWarning'), page);
  expect(errors).toEqual([]);
});

test('the pause menu documents actual PC commands and mobile actions in PT EN ES', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.game.pause());
  await expect(page.locator('#pauseMenu')).toBeVisible();
  const guide = page.locator('#pauseControlGuide');
  await expect(guide).toHaveAttribute('open');
  await expect(guide.locator('.nw-control-row')).toHaveCount(24);
  for (const [key, meaning] of [
    ['T', 'Alternar nave e robô'],
    ['R', 'Reparo tático'],
    ['J / L', 'Orbitar o chefe'],
    ['P / ESC', 'Pausar / retomar'],
  ]) {
    const entry = guide.locator('.nw-help-keyboard .nw-control-row').filter({
      has: page.getByText(key, { exact: true }),
    });
    await expect(entry.locator('span')).toHaveText(meaning);
  }
  await page.screenshot({ path: info.outputPath('pause-controls-pt.png') });
  await page.locator('#pauseOptions').click();
  await page.locator('#settingLanguage').selectOption('en');
  await expect(guide.locator('summary')).toHaveText('CONTROLS · KEYBOARD & MOBILE');
  await expect(guide.locator('.nw-help-keyboard h3')).toHaveText('KEYBOARD / PC');
  await page.locator('#settingLanguage').selectOption('es');
  await expect(guide.locator('summary')).toHaveText('CONTROLES · TECLADO Y MÓVIL');
  await expect(guide.locator('.nw-help-mobile h3')).toHaveText('MÓVIL / TOQUE');
  await page.locator('#settingsClose').click();
  await expect(guide).toBeVisible();
  await page.locator('#pauseResume').click();
  await expect(page.locator('#pauseMenu')).toBeHidden();
  expect(errors).toEqual([]);
});
