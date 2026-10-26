import { test, expect } from '@playwright/test';

test('physical-device FPS measurement is opt-in, pause-only and localized', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#pauseFrameAudit')).toBeHidden();
  await page.evaluate(() => window.fixture.game.pause());
  await expect(page.locator('#pauseMenu')).toBeVisible();
  const audit = page.locator('#pauseFrameAudit');
  await expect(page.locator('#pauseControlGuide')).toBeVisible();
  await expect(audit).toBeHidden();
  await expect(page.locator('#pauseTabControls')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#pauseTabFps').click();
  await expect(audit).toBeVisible();
  await expect(page.locator('#pauseControlGuide')).toBeHidden();
  await expect(page.locator('#pauseTabFps')).toHaveAttribute('aria-pressed', 'true');
  await expect(audit.locator('summary')).toHaveText('DIAGNÓSTICO DE FPS · DISPOSITIVO');
  await expect(page.locator('#auditStart')).toBeEnabled();
  await expect(page.locator('#auditStop')).toBeDisabled();
  await expect(page.locator('#auditCopy')).toBeDisabled();
  await page.locator('#auditStart').click();
  await expect(page.locator('#auditStart')).toBeDisabled();
  await expect(page.locator('#auditStop')).toBeEnabled();
  await expect(page.locator('#auditReadout')).toContainText('Sem quadros medidos');
  await page.locator('#pauseResume').click();
  await expect(audit).toBeHidden();
  // The deterministic fixture does not run real RAF; it must not invent FPS data.
  await page.evaluate(() => window.fixture.advance(2));
  await page.evaluate(() => window.fixture.game.pause());
  await expect(audit).toBeVisible();
  await expect(page.locator('#auditCopy')).toBeDisabled();
  await page.locator('#auditStop').click();
  await expect(page.locator('#auditStart')).toBeEnabled();
  await expect(page.locator('#auditStop')).toBeDisabled();
  await page.screenshot({ path: info.outputPath('pause-device-fps-pt.png') });

  await page.locator('#pauseOptions').click();
  await page.locator('#settingLanguage').selectOption('en');
  await expect(audit.locator('summary')).toHaveText('FPS DIAGNOSTICS · DEVICE');
  await expect(page.locator('#auditStart')).toHaveText('START MEASURING');
  await page.locator('#settingLanguage').selectOption('es');
  await expect(audit.locator('summary')).toHaveText('DIAGNÓSTICO DE FPS · DISPOSITIVO');
  await expect(page.locator('#auditStop')).toHaveText('FINALIZAR');
  await expect(page.locator('#pauseTabFps')).toHaveText('FPS / RENDIMIENTO');
  await page.locator('#settingsClose').click();
  await page.locator('#pauseTabControls').click();
  await expect(audit).toBeHidden();
  await expect(page.locator('#pauseControlGuide')).toBeVisible();
  await expect(page.locator('#pauseTabControls')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('FPS entry is reachable in compact portrait and landscape without obscuring resume', async ({
  page,
}, info) => {
  test.setTimeout(85000);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.game.pause());
    const controls = page.locator('#pauseControlGuide');
    const fps = page.locator('#pauseFrameAudit');
    await expect(controls).toBeVisible();
    await expect(fps).toBeHidden();
    const card = await page.locator('#pauseMenu .nw-modal-card').boundingBox();
    const actionBoxes = await Promise.all(
      ['pauseResume', 'pauseRestart', 'pauseOptions', 'pauseExit'].map((id) =>
        page.locator('#' + id).boundingBox(),
      ),
    );
    for (const [index, box] of actionBoxes.entries()) {
      expect(box, 'all four pause action buttons must be rendered: ' + index).not.toBeNull();
      expect(box.width, 'pause action must have a usable touch width').toBeGreaterThanOrEqual(90);
      expect(box.x, 'pause action cannot bleed off the left viewport edge').toBeGreaterThanOrEqual(
        0,
      );
      expect(
        box.x + box.width,
        'pause action cannot bleed off the right screen',
      ).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.x + box.width, 'pause action must fit inside pause card').toBeLessThanOrEqual(
        card.x + card.width + 1,
      );
    }
    await page.locator('#pauseTabFps').click();
    await expect(fps).toBeVisible();
    await expect(controls).toBeHidden();
    await expect(page.locator('#auditStart')).toBeVisible();
    const resume = page.locator('#pauseResume');
    await expect(resume).toBeVisible();
    if (viewport.width > 700) {
      const tabs = await page.locator('#pausePanelTabs').boundingBox();
      const actions = await resume.boundingBox();
      expect(card).not.toBeNull();
      expect(tabs.x, 'tabs should be beside resume, not below the fold').toBeGreaterThan(
        actions.x + actions.width - 5,
      );
      expect(tabs.y + tabs.height).toBeLessThanOrEqual(viewport.height - 15);
    }
    await page.screenshot({
      path: info.outputPath('fps-panel-' + viewport.width + 'x' + viewport.height + '.png'),
    });
    await resume.click();
    await expect(page.locator('#pauseMenu')).toBeHidden();
  }
});
